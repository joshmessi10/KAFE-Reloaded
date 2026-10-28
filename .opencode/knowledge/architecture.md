# KAFE Architecture

How KAFE works, end to end. This is the reference for interpreter and VS Code extension ownership, subject to the repository invariants in `AGENTS.md` and `CLAUDE.md` and applicable system/runtime and user instructions.

## Compact Diagram

```
.kf → src/Kafe.py (ANTLR lexer/parser → AST) → InterpreterVisitor.py (walks AST, scope stack)
    → src/language_components/ (variables, loops, conditionals, functions, imports, libraries, method_calling)
    → src/lib/Kafe{NUMK,MATH,FILES,PLOT,GESHA,PARDOS,MACHINE,HF}/functions.py
```

## High-Level Overview

KAFE is a DSL for teaching Deep Learning, implemented as a tree-walking interpreter in Python + ANTLR 4 (Visitor pattern).

Source layout:

- `src/Kafe.py` — entry point: lexing/parsing pipeline, error listener, process exit handling.
- `src/Kafe_Grammar.g4` + `src/Kafe_Lexer.g4` — ANTLR grammar (parser + lexer). The generated `Kafe_GrammarLexer.py`, `Kafe_GrammarParser.py`, `Kafe_GrammarVisitor.py`, `*.tokens`, `*.interp` are **gitignored and untracked**; generate on a fresh checkout and regenerate after grammar edits.
- `src/InterpreterVisitor.py` — the main visitor: walks the AST with a scope stack, dispatches to language components and libraries.
- `src/language_components/` — language features: `base`, `loops`, `conditionals`, `functions`, `imports`, `libraries`, `method_calling`.
- `src/lib/` — built-in libraries: `KafeNUMK`, `KafeMATH`, `KafeFILES`, `KafePLOT`, `KafeGESHA`, `KafePARDOS`, `KafeMACHINE`, `KafeHF`.
- `src/TypeUtils.py` — type system. `src/errors.py` — error raising helpers. `src/global_utils.py` — shared helpers. `src/globals.py` — global interpreter state (`current_dir`, `program_path`, `current_visitor`), imported as `import globals` (module import, never `from ... import`).

## Execution Flow

```
.kf source
  → Kafe.py main()
  → InputStream → Kafe_GrammarLexer (tokens) → CommonTokenStream → Kafe_GrammarParser
  → parser.program() returns the AST tree
  → InterpreterVisitor.visit(tree) walks the tree
  → language components (language_components/) and libraries (lib/) execute statements
```

### ANTLR Flow

- `KafeErrorListener` captures lexer/parser syntax errors. Special cases: unterminated string literals ("token recognition error") and scientific-notation errors.
- The visitor is generated with `-no-listener -visitor -Dlanguage=Python3`.
- Grammar is split into `Kafe_Lexer.g4` (tokens) and `Kafe_Grammar.g4` (rules).

### Interpreter Flow

- `Kafe.py` resolves the input path: absolute/cwd first, then relative to `src/`.
- Global state (`globals.program_path`, `globals.current_dir`, `globals.current_visitor`) is set before visiting.
- Runtime error handling in `main()`: `.error.kf` files print to **stderr** and exit **1**; any other file prints runtime errors to **stdout** and exits **0** (tests depend on this; do not fix).

### Visitor Architecture

- `InterpreterVisitor` extends the generated `Kafe_GrammarVisitor`.
- Scopes: `scope_stack` (list of dicts). `push_scope()` / `pop_scope()` manage loops and conditionals; `pop_scope` removes variables declared in that scope.
- Dispatch:
  - Object method calls → `language_components/method_calling/functions.py`.
  - Library calls → `language_components/libraries/functions.py` (`libraryFunctionCall`, `libraryConstant`); un-imported libraries raise, missing functions/variables raise.
  - Control flow, functions, imports → `language_components/{loops,conditionals,functions,imports}/functions.py`.

### Library Architecture

- Each library exposes plain Python functions in `src/lib/KafeXXX/functions.py`; stateful models are Python classes in sibling modules (e.g., `KafeMACHINE/linear/LinearRegression.py`).
- Import each library's `functions` module in `src/InterpreterVisitor.py`, then register it in `InterpreterVisitor.__init__` under `self.libraries`: `{"numk": [module, imported_flag], ...}`. KAFE `import <name>;` flips the flag; calls dispatch through `libraryFunctionCall`. Registry keys are case-sensitive; the KafeGESHA public key is `gesha`, with `geshaDeep` and `geshaV2` kept as deprecated aliases resolving to the same module (ADR-0016).
- KafeMACHINE uses `import lib.KafeMACHINE.functions as machine_funcs_module` and the `machine` registry key. KafeHF uses `import lib.KafeHF.functions as hf_funcs_module` and the `huggingface` key. Its wrapper is registered by default, but Hugging Face `datasets` is an optional external dependency: importing `huggingface` is allowed without it, while dataset-loading calls report a missing-dependency error.
- KafeHF's `load_dataset` and `load_dataset_split` functions convert loaded data to KafePARDOS `DataFrame` objects. Preserve the default developer environment without `datasets` and the missing-dependency fixture under `tests/KafeHF/`. The VS Code managed runtime installs the locked `extension` extra so learners receive Hugging Face and Kaggle integrations without changing the baseline test environment.
- Library functions receive evaluated KAFE arguments (lists as Python lists; GESHA/PARDOS/MACHINE objects as their Python classes).
- KAFE values map to Python types via `TypeUtils.py`.

## VS Code Tutor conversations

Extension 2.3.0 retains persistent conversations (ADR-0030), reviewed bundled MACHINE/GESHA library guidance (ADR-0031), and one guided Tutor with compatible mode-only persistence (ADR-0033). The JavaScript host and existing sidebar webview retain one active conversation/composer. `ConversationManager` owns the workspace archive; `SessionCoordinator` and its stable `ConversationSession` object own the active transcript, provider turn and current native authorization.

`ConversationStore` validates versioned records under `kafeTutor.conversations.v1` in VS Code `workspaceState`. Each record contains a stable ID, title, timestamps and declarative content: full display entries, draft, completed learner/assistant pairs and learning `{mode}`. Local history preserves file URI and knowledge-lineage dependencies so restored context can be checked against current authorization. It does not restore optional-source inclusion or grant permission to read an old source. Existing legacy progress and SecretStorage remain separate.

The manager uses private owner mutation signatures to detect persistence-relevant changes without stopping a response. This bookkeeping never authorizes an action. It captures/normalizes at debounced save (250 ms) and explicit list/export/switch/disposal boundaries, serializes writes and flushes before transitions. Metadata-only notifications preserve an already pending content-save deadline; new content restarts the debounce. Complete store validation remains at boundaries. Event listeners share a detached deeply frozen projection; explicit snapshots and captures remain independently detached. Mutation-time dates and safe automatic titles remain current. New preserves the departing record. Switch restores the selected record and its draft/preferences; Rename edits its title; Delete requires native confirmation and creates an empty conversation when removing the last one. Native commands and the picker live in `ConversationCommands`; the view description shows the active title.

Only one provider response can be active. Transitions stop it before saving partial text as cancelled, then advance the stable session's generation. A native Apply/reset in progress blocks the transition. Restoration clears live learning decisions/observations, included source grants, pending proposals, request snapshots and private action/Run evidence. Historical checkpoint/proposal summaries are inert, and old action envelopes fail the generation/registry checks. Native processes continue independently; ownership fences reject their late results in another chat.

The archive is bounded to 200 conversations, 4 MiB per content record and 16 MiB total, with at most 10,000 entries and 5,000 history pairs per conversation. Limits reject saves without silently evicting records. A malformed existing archive is left untouched and reported while the current chat remains temporary. A failed save preserves the live chat so the learner can retry or export before closing. The full archived transcript is independent of `ConversationHistory`'s provider-selection limit of eight eligible completed pairs / 32 KiB.

`Export Conversation` snapshots the selected conversation before the native Save dialog and writes versioned UTF-8 JSON, bounded separately to 16 MiB. It includes visible entries/statuses and safe summaries plus record identity/title/dates. It omits draft, preferences, provider-history dependencies, source metadata and executable handles; cancellation writes nothing. Learner-entered text/code is transcript content and is preserved. Attached source snapshots, SecretStorage values, raw requests, private Run evidence and raw transport errors are excluded from both archive and export. Tutor diagnostics continue to contain fixed metadata rather than transcript/private content.

Archive payload v2 remains at the single historical `kafeTutor.conversations.v1` key. The store applies original strict v1 validation before mapping every valid old level to the same guided baseline while preserving mode/content/draft/identity/dates/selection, then validates complete v2 content. Loading does not overwrite original bytes. Only successful serialized v2 save replaces them; v1-only readers are unsupported afterward. Export remains schema 1, with no dual-write/backup keys or claimed extra crash atomicity.

`TeachingPolicy.js` uses the common `kafe-guided-7` contract. Pause is independent, with no hidden levels or durable style preferences. Plain style requests remain ordinary bounded history. Bounded calculations and organization of supplied evidence are permitted; complete assessed submissions and final individual conclusions remain learner-owned. Draft feedback affirms supported reasoning and makes any actual gap conditional. Streaming, completion and structured follow-ups preserve provider text into display/history/export; semantic phrase matching no longer replaces whole answers. Unsupported provider claims can remain visible but never become assessment or authority.

`SessionCoordinator` centralizes domain source/authorization invalidation and dependency metadata enumeration. Native event observation, real URI/filesystem authorization, key epochs and freshness revisions remain adapter-owned. A pure relevance query and source-change fan-out use the same native-active URI observation, with revision advancement before reentrant callbacks. The broad retained dependency union does not authorize history, read files or broaden ordinary edit relevance. Focus cancellation and settled proposal lifetime remain distinct. `ConversationSession.runTargetUris()` returns detached current-generation targets from the existing private registry, including retained contextual anchors. Revocation captures the original owner and generation; scope, checkpoint, proposal and Stop continuations recheck ownership after synchronous publications and callbacks. Registry invalidation visits a captured set of records, excluding new records inserted by callbacks. Reset detaches old ownership before cleanup, and Stop settles and aborts its original request in guaranteed cleanup even when display publication becomes stale or fails. Native Apply and explicit Run remain separate authorities.

## VS Code Tutor library references

`reference/learning-topics.json` defines eight reviewed conceptual references aligned to the evaluation proposal. `LearningTopics` selects bounded current-question guidance, and the library generator requires all eight objectives and valid related API identities. Concepts lead ordinary teaching questions without incidental API catalogues or lexical fixture fallback; explicit code requests retain related contracts and complete relevant examples, and exact API requests retain their contract precedence. The topic text is part of the generated contract/content identity and includes no assessment items or answer key. Teaching policy 7 explains concepts before source mechanics, supports progressive help and targeted feedback, preserves learner-owned experiments, distinguishes positive sensitivity from macro recall and uses authorized Run output with historical/source labels. Reported scores do not establish training trajectory, convergence, validation membership or causal improvement; affine capacity bounds are not promised training scores. Unknown qualified API composition keeps fundamentals and the unsupported descriptor while limiting fixtures to selected supported contracts. Study and model-answer evaluations remain development-only; no automatic research collection or learning scores are introduced.

`test/evals/activity-dialogues.json` defines two Spanish synthetic three-turn activity rehearsals. Only literal learner text enters real coordinator/composer integration; internal TP/FN and XOR-threshold oracles and response-review criteria stay offline. Deterministic provider captures establish complete eligible-pair transport and existing bounds/reset/revocation fences, not teaching efficacy. Retrieval remains based on the current question; no history hint or restored source authority is added. Three actual six-turn Flash/Pro samples were rejected. Independently approved guided-7 source at `e0794c1` completed six canonical and two held-out replies with a mixed actual-answer review; unsupported training claims and misleading overfitting guidance remain. The full quality goal is not complete. `deepseek-v4-pro` remains an experimental comparison default, thinking disabled and streaming enabled, without a universal ranking or student-readiness claim. Thinking-enabled production-equivalent history requires a new private reasoning/snapshot/parser contract and separate design approval; no such change or call was performed. A separately attributed, independently reviewed facilitator ZIP supplies executable starting materials without final solutions. First-semester completion and learning evidence remain unobserved. The proposal's XOR alternatives are epochs, rate and added layers; seed is an additional controlled condition, and its original fraud starter/data were not supplied. See `docs/extension/tutor-reliability.md` and `evaluation-alignment.md` for evidence and delivery limits.

`reference/machine-api.json` and `reference/gesha-api.json` are reviewed contracts for the intended pinned DSL surface, including returned-object methods/properties, compatibility aliases and explicit limited/experimental/unsupported behavior. `build-library-references.cjs` derives public wrapper/member inventories from source and joins them to contracts and evidence. It rejects missing records, source-version mismatch and unreviewed drift. Manual source attestation is separate from ordinary regeneration. The generated `libraryReferences.json` records runtime identity and source/corpus/contract/evidence/content hashes; it is bundled reference material, not a ready managed-pack receipt.

`KnowledgeCorpus` uses `reference/knowledge-corpus.json` to collect safe canonical documentation/grammar and optional `docs/ejemplos` Markdown/KAFE tutorials under `examples/tutorials`. SVGs are excluded explicitly. Bundled generation, development packs and future managed builds share this policy with exact content identities and existing file/byte/path bounds. A release builder uses the policy committed at its requested source revision; historical revisions without it retain the original six-section pack. Published runtime 0.3.0 and its checksum pins remain unchanged.

`ReferenceSearch` shares bilingual normalization and atomic Markdown/code units. `LibraryReferences` resolves exact qualified symbols and reviewed English/Spanish aliases before bounded documentation fallback; unknown names and unavailable bindings retain explicit uncertainty/status. `ContextComposer` admits at most three library units / 8 KiB and shares 12 KiB with complete fixture examples, with a 6 KiB admission bound per unit. Fundamentals remain separate. The library guidance is immediately available without executable runtime or managed knowledge, including message-only Restricted Mode. Old managed MACHINE/GESHA library narratives and tutorial copies are excluded in favor of reviewed bundled material.

`ToolRouter.searchKafeKnowledge` first returns bundled lookup results within five units / 12 KiB, even without managed knowledge lineage; other managed searches retain lineage verification. Managed/development retrieval keeps five passages, two per file and 2,000 characters per intact passage. Oversized/unclosed code units are omitted whole. Bundled sources do not create workspace file authority or execution evidence. Full source parsing, exact output/exit checks and direct-call evidence run only reviewed fixtures in disposable pinned-runtime copies; filesystem cases declare isolated assets/writes. These checks establish reference coverage, not general model-answer or learner-program correctness.

## Extension Points

- New language component: create `src/language_components/<feature>/functions.py`, wire dispatch in `InterpreterVisitor.py`.
- New built-in library: see `.opencode/knowledge/libraries.md`.
- New grammar rule: edit `src/Kafe_Grammar.g4` or `src/Kafe_Lexer.g4`, regenerate the parser, keep the EBNF in `docs/specification/` in sync, and add fixture tests.
- New ML/DL functionality: see `.opencode/knowledge/ml-library.md`, `.opencode/knowledge/dl-library.md`, and `.opencode/knowledge/engineering.md`.
