# KAFE Architecture

How KAFE works, end to end. This is the reference for the interpreter internals, subject to the repository invariants in `AGENTS.md` and `CLAUDE.md` and applicable system/runtime and user instructions.

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
- Import each library's `functions` module in `src/InterpreterVisitor.py`, then register it in `InterpreterVisitor.__init__` under `self.libraries`: `{"numk": [module, imported_flag], ...}`. KAFE `import <name>;` flips the flag; calls dispatch through `libraryFunctionCall`. Registry keys are case-sensitive, including the existing `geshaDeep` key.
- KafeMACHINE uses `import lib.KafeMACHINE.functions as machine_funcs_module` and the `machine` registry key. KafeHF uses `import lib.KafeHF.functions as hf_funcs_module` and the `huggingface` key. Its wrapper is registered by default, but Hugging Face `datasets` is an optional external dependency: importing `huggingface` is allowed without it, while dataset-loading calls report a missing-dependency error.
- KafeHF's `load_dataset` and `load_dataset_split` functions convert loaded data to KafePARDOS `DataFrame` objects. Preserve the default environment without `datasets` and the missing-dependency fixture under `tests/KafeHF/`; the future uv migration must express this optional integration without making it a default dependency.
- Library functions receive evaluated KAFE arguments (lists as Python lists; GESHA/PARDOS/MACHINE objects as their Python classes).
- KAFE values map to Python types via `TypeUtils.py`.

## Extension Points

- New language component: create `src/language_components/<feature>/functions.py`, wire dispatch in `InterpreterVisitor.py`.
- New built-in library: see `.opencode/knowledge/libraries.md`.
- New grammar rule: edit `src/Kafe_Grammar.g4` or `src/Kafe_Lexer.g4`, regenerate the parser, keep the EBNF in `docs/specification/` in sync, and add fixture tests.
- New ML/DL functionality: see `.opencode/knowledge/ml-library.md`, `.opencode/knowledge/dl-library.md`, and `.opencode/knowledge/engineering.md`.
