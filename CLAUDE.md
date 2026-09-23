# CLAUDE.md

Engineering constitution and technical guide for KAFE. This file and its mirrored counterpart define repository-wide invariants. `OPENCODE.md` is the operating manual; the persistent engineering system lives under `.opencode/`.

# How to Use This Document

`AGENTS.md` and `CLAUDE.md` are mirrored copies of the **constitution** (repository invariants) and **navigation map**. `OPENCODE.md` is the operating manual. Use progressive disclosure: read the relevant sections when needed. Process detail lives in `.opencode/knowledge/engineering.md`; reusable workflows live in `.opencode/skills/`.

Read before deciding, in this order: `.opencode/knowledge/` → `.opencode/memory/` → `.opencode/history/` → `.opencode/progress/`.

| If you are… | Read |
|---|---|
| Starting a session | `/init` (validate the system) + Session Recovery → `/resume` |
| Resuming a session | Session Recovery → `/resume` |
| Opening a new work item | `/open-work` (+ `/impact` if the item is significant) |
| Closing a session | Session Closure Process → `/close` |
| Adding an ML algorithm or DL component | Impact Analysis + `.opencode/knowledge/ml-library.md` / `dl-library.md` → `/impact` |
| Changing public APIs or refactoring the core interpreter | Impact Analysis → `/impact` |
| Adding a new library | Impact Analysis → `/impact` + `.opencode/skills/create-library/` |
| Changing grammar or tokens | Impact Analysis + `.opencode/skills/modify-grammar/` |
| Completing a task | Definition of Done → `/dod` |
| Releasing or tagging | Definition of Done → `/dod` + `.opencode/skills/release-checklist/` |

# Mission

KAFE is a DSL focused on education, machine learning, and deep learning.

The objective of this engineering system is to evolve KAFE while preserving:

- Simplicity
- Consistency
- Documentation
- Performance
- Long-term project knowledge

Every important change must be understandable, traceable, and documented.

# Engineering Workflow

Before implementing any significant change:

1. Understand the current implementation.
2. Read relevant documentation.
3. Perform Impact Analysis.
4. Follow the Superpowers workflow below: approved design, local implementation plan, implementation, and verification.

After implementation:

1. Run applicable tests and checks; explain when a check is not relevant to the change.
2. Validate behavior or document integrity, as appropriate.
3. Update documentation.
4. Update project history.
5. Verify Definition of Done.

# Repository Knowledge Map

Project knowledge is stored in the knowledge layer. Consult it before making decisions.

| Path | Purpose |
|------|---------|
| `.opencode/knowledge/` | How KAFE works: `architecture.md`, `conventions.md`, `verifications.md`, `language-spec.md`, `ml-library.md`, `dl-library.md`, `libraries.md`, `engineering.md` |
| `.opencode/knowledge/concepts/` | Concept records (template: `.opencode/knowledge/concepts/concept-template.md`) |
| `.opencode/memory/` | Session-to-session context: `current-state.md`, `active-work.md`, `technical-debt.md`, `known-issues.md`, `context.md` |
| `.opencode/history/` | Significant project events by year (consolidated monthly: `YYYY/YYYY-MM.md`) |
| `.opencode/progress/` | Planning: `roadmap.md`, `backlog.md`, `milestones.md`, `current.md`, `session-log.md`, `session-commands.md` |
| `.opencode/adr/` | Engineering decisions (consolidated: `decisions.md`, template: `.opencode/adr/template.md`) |
| `.opencode/benchmarks/` | Performance benchmarks (consolidated: `records.md`, template: `.opencode/benchmarks/template.md`) |
| `.opencode/skills/` | Reusable engineering workflows (`impact-analysis`, `add-ml-algorithm`, `add-dl-layer`, `modify-grammar`, `create-library`, `create-adr`, `release-checklist`) |
| `.opencode/commands/` | Custom project commands (`/init`, `/resume`, `/open-work`, `/impact`, `/adr`, `/benchmark`, `/dod`, `/close`) |
| `.opencode/templates/` | Reusable project templates: `impact-analysis.md`, `dod-checklist.md`, `benchmark-template.md`, `session-recovery.md` |

Consult information in this order before deciding: `.opencode/knowledge/` → `.opencode/memory/` → `.opencode/history/` → `.opencode/progress/`. Do not invent architecture, APIs, or conventions if they are already documented.

### Operational Files

Session state (`.opencode/memory/`):

- `current-state.md` — architecture status, current milestone, priorities, blockers.
- `active-work.md` — active feature, current step, next step, expected outcome.
- `technical-debt.md` — debt items, cost, risk, proposed resolution.
- `known-issues.md` — known bugs, limitations, workarounds.
- `context.md` — project context, assumptions, engineering notes.

Progress (`.opencode/progress/`):

- `roadmap.md` — long-term roadmap.
- `backlog.md` — prioritized task list.
- `milestones.md` — major project milestones.
- `current.md` — current work tracking (feature, status, current/next step, blockers, related ADRs).
- `session-log.md` — append-only record of closed sessions (written by `/close`).

# Impact Analysis

Impact Analysis is mandatory before:

- Adding ML algorithms.
- Adding DL components.
- Modifying public APIs.
- Refactoring core interpreter components.
- Modifying grammar rules.

Process: `.opencode/knowledge/engineering.md` (Impact Analysis Process).

# Agent Roles

## Architect

Responsible for:

- System design
- Impact analysis
- ADR generation

## Builder

Responsible for:

- Implementation
- Refactoring
- Feature development

## Reviewer

Responsible for:

- Quality
- Consistency
- Maintainability

Runs `/dod` before a task is declared complete.

## Historian

Responsible for:

- History updates
- Knowledge updates
- Project memory

## Tester

Responsible for:

- Validation
- Tests
- Benchmarks

Runs `/benchmark` for ML/DL components and performance changes.

# Automatic Actions

Automatically create an ADR when:

- Architecture changes.
- Public APIs change.
- Important engineering decisions are made.

Automatically create benchmarks when:

- ML algorithms are added.
- DL components are added.
- Performance optimizations are implemented.

Automatically update project history after significant changes.

ADR generation should be automatic and should not require explicit user requests.

The engineering system is responsible for determining when these artifacts are necessary.

Template: `.opencode/adr/template.md`. Processes: `.opencode/knowledge/engineering.md`.

# Project Memory Responsibilities

When a significant feature is implemented:

- Update `.opencode/history/`.
- Update `.opencode/knowledge/`.
- Update `.opencode/progress/` if roadmap or milestones change.

When a new concept is introduced:

- Create or update the corresponding file in `.opencode/knowledge/concepts/`.

When a significant engineering decision is made:

- Create or update ADR records.

# Definition of Done

Before declaring a task complete, verify all applicable items:

- The requested implementation or documentation change exists and follows its approved design.
- Required local Superpowers specs and plans exist and no Superpowers artifacts were staged or committed.
- `AGENTS.md` and `CLAUDE.md` have identical substantive content.
- Only necessary dependencies were introduced, using the applicable package-management policy.
- New and edited prose follows the English policy; any remaining language migration debt is recorded.
- Applicable validation, tests, coverage, lint, type checks, spelling, dependency audits, and CI passed with zero errors and zero warnings, subject only to documented unavoidable upstream warning exceptions.
- Documentation, project knowledge, history, and planning records were updated as required.
- Any unavailable or pending migration gate is explicitly reported as pending, not passed. A bounded documentation task does not complete the deferred English, uv, or CI migrations.

For a documentation-only task, validate the changed documents and references; do not describe an unrun application test suite as passed. Do not declare completion of a migration while a known in-scope violation remains unresolved.

When applicable (ML/DL components):

- Benchmark exists with **5 test scenarios** and real measurements.
- Enriched concept record exists (mathematical foundation, step-by-step algorithm, advantages/limitations, references).
- ADR exists (if architecture/API changed).
- Examples exist.
- **Context saving verified** — all required files exist.
- Roadmap updated.

# Response Standards

Never respond with only: "Done", "Fixed", "Completed".

For significant tasks always provide:

1. **Theory** — What the concept is, why it exists, its mathematical foundation (with LaTeX formulas when useful), computational complexity, advantages, limitations, and relationship to the KAFE implementation.
2. **Analysis** — Current code state, what exists, and what is missing.
3. **Impact** — Affected modules, risks, and compatibility.
4. **Plan** — Ordered steps, including verification.
5. **Implementation** — Changes made, code structure, and design decisions.
6. **Validation** — Tests run, results, and covered edge cases.
7. **Documentation** — Updated files, created concept records, and added examples.
8. **Next Steps** — Remaining work and possible improvements.

Standards: `.opencode/knowledge/engineering.md` (Educational Response Standards).

# Session Recovery

When resuming work, use the Repository Knowledge Map to reconstruct project state:

1. Read `.opencode/knowledge/` — how KAFE works and how engineering processes run.
2. Read `.opencode/memory/` — session-to-session context.
3. Read recent `.opencode/history/` — significant project events.
4. Read active `.opencode/progress/` — roadmap, backlog, milestones, and current work.
5. Reconstruct project state before proposing changes.

Session recovery should produce:

- Current project status.
- Active work.
- Pending work.
- Relevant historical context.
- Blockers.
- Recommended next steps.

Process: `.opencode/knowledge/engineering.md` (Session Recovery Process). Run `/resume` to reconstruct state on demand.

# Progress Sources

Project planning is maintained in:

- `.opencode/progress/roadmap.md`
- `.opencode/progress/backlog.md`

Do not store active roadmap information inside `AGENTS.md` or `CLAUDE.md`.

# Repository Policies

## Mirrored constitution and instruction authority

`AGENTS.md` and `CLAUDE.md` define the same repository-wide invariants. Their complete substantive content must match; only the file-identifying title and introductory description may differ. Whenever either file changes, apply the same substantive change to the other and compare both bodies before completing the task.

Applicable system/runtime instructions and the user's instructions govern execution. Within that boundary, these mirrored root policies define the repository invariants. `OPENCODE.md` and `.opencode/` procedures implement those invariants and cannot waive or replace them. The ADR > Knowledge > History > Progress hierarchy resolves conflicts among project records only; it does not override the root policies. Identify conflicts and include their remediation in the relevant design, plan, or direct-task action plan.

## Project scope and language policy

KAFE is a Python 3.10+ educational DSL for functional programming, machine learning, and deep learning. `.kf` files are KAFE source programs. Its interpreter uses ANTLR 4 and the Visitor pattern. The repository contains the command-line interpreter, Python libraries and tests, and MkDocs documentation. It has no active JavaScript/TypeScript frontend, web backend, or application database. React, FastAPI, frontend routing, and database-normalization requirements do not apply to this architecture.

All repository content must be in English, including source code, identifiers, comments, documentation, configuration, tests, file and directory names, commit messages, and user-facing text. Legacy Spanish remains in syntax, APIs, paths, fixtures, and prose; full compliance is pending the coordinated English migration. Write new prose in English and translate prose you edit. Changes to executable syntax, public identifiers, paths, and expected output require coordinated compatibility, documentation, and fixture updates in that migration; do not silently change runtime behavior during an instruction-only edit. Keep this debt explicit until resolved.

Add another language only for intentional internationalization. Use a well-known i18n/gettext-style library when needed, keep translations separate from application logic, and follow established internationalization practices. `codespell` checks spelling; it does not prove that content is English. These rules do not require a separate automatic language detector.

## Python package management and migration status

Use `uv`, `pyproject.toml`, and a committed `uv.lock` as the target Python dependency-management standard. Add only packages the project actually needs. Do not add dependencies through `pip`, `requirements.txt`, Poetry, Pipenv, Conda, or another competing Python dependency manager.

**Current setup:** this checkout uses `pyproject.toml` and the committed `uv.lock`. Runtime and developer dependencies are in the project and `dev` group, MkDocs tools are in the `docs` group, and Hugging Face `datasets` is in the optional `huggingface` extra. The default developer environment does not install `datasets`.

The coordinated setup uses uv for runtime and development dependencies, developer setup, MkDocs dependencies, CI, and optional integrations. Nix supplies Python, uv, Java, ANTLR, and other system tools without maintaining a competing Python dependency source. Keep their setup instructions consistent.

Keep Hugging Face `datasets` optional for KafeHF. The baseline environment must continue to work without it, and the missing-dependency fixture must remain deterministic. An optional integration environment must not accidentally invalidate the baseline test by installing `datasets` globally or as a required development dependency.

Use uv for installation, dependency changes, scripts, documentation commands, and CI. If uv is absent, install it using the official instructions at https://docs.astral.sh/uv/getting-started/installation/. Report an installation blocker instead of falling back to another dependency manager.

The `dev` dependency group must contain `basedpyright`, `codespell`, `ruff`, `pytest`, and `pytest-cov`. Add `pytest-asyncio` and its appropriate loop settings only when asynchronous tests exist. Set `tool.uv.exclude-newer` to `"7 days"`. Avoid broad extras and convenience bundles unless every included capability is required.

## Superpowers workflow

Superpowers is mandatory for non-trivial implementation, including new features, components, behavior changes, non-trivial fixes, and architecture changes. If it is not installed in the active agent environment, install it using the official instructions at https://github.com/obra/superpowers before starting implementation. If installation cannot be completed, report the blocker and pause implementation.

The required sequence is `superpowers:brainstorming` → approved design spec → `superpowers:writing-plans` → implementation → verification with `superpowers:verification-before-completion`. Prefer `superpowers:subagent-driven-development` when delegation is permitted and appropriate; use `superpowers:executing-plans` when it is not. Integrate this sequence with KAFE's Impact Analysis, ADR, knowledge, and Definition of Done processes. Do not implement a non-trivial feature or fix directly from the initial request.

During brainstorming:

1. Explore the relevant repository context and current implementation.
2. Identify constraints and existing architecture.
3. Ask clarifying questions one at a time when a decision genuinely belongs to the user.
4. Present two or three viable approaches when meaningful alternatives exist.
5. Explain their trade-offs and recommend an approach based on KAFE's constraints.
6. Present the design in logical sections and obtain approval before implementation.

Maintain one local design spec per implementation line or branch at `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`. After approval, use `superpowers:writing-plans` to create one plan per spec and implementation line at `docs/superpowers/plans/YYYY-MM-DD-<topic>.md`.

Plans describe intention, structure, approach, and execution order. Override any skill instruction to reproduce complete implementations in the plan. Use only the minimum code signal needed to remove ambiguity: a function signature, interface, schema shape, key expression, small configuration excerpt, migration outline, or list of cases. Do not paste complete files, functions, components, or tests. For tests, describe the asserted behavior, inputs, expected outputs, edge cases, and a table of cases when useful.

## Local-only Superpowers artifacts

Specs, plans, delegated task briefs, and review reports are local working artifacts. Store them under `docs/superpowers/specs/`, `docs/superpowers/plans/`, or `.superpowers/`. Preserve the specific `.gitignore` exclusions for `docs/superpowers/` and `.superpowers/`; never ignore the published `docs/` tree.

Never stage these artifacts, force-add them, commit them, propose committing them, or remove their ignore exclusions. This overrides skill instructions to commit design documents or plans. An ignored artifact's absence from `git status` is not proof that it does not exist; verify required local artifacts directly.

## Direct tasks and execution conventions

A full design spec and plan are unnecessary only for genuinely simple, mechanical tasks with no substantive design decision. Before editing, acknowledge the requested change, identify unresolved user decisions and repository conflicts, and give the exact action and verification plan. Obtain a go-ahead if the task is not already authorized; existing clear user authorization remains valid and must not be requested again. Do not use this exception to bypass Superpowers for non-trivial work.

Stay on the current branch when continuing the same implementation line. Otherwise use a clearly named branch for a coherent deliverable. Do not use Git worktrees or create one branch per individual rule. Commits must be logically scoped, meaningful, well described, and free of unrelated changes. Do not create low-quality checkpoint commits merely to record progress.

## Python quality and CI

The following quality gates are required outcomes of the pending quality-gate migration; their tools are available in the uv `dev` group, but the gates are not yet implemented. Configure Ruff with explicit rules, run `basedpyright` on project-owned Python, use `codespell` for spelling, and run pytest with `pytest-cov`. Exclude generated ANTLR outputs from static analysis and coverage. Measure project-owned KAFE source and enforce at least 80% coverage; do not copy a coverage target for an unrelated `app` package. Configure pytest with `filterwarnings = ["error"]`.

The fixture suite launches the KAFE interpreter in child Python processes. Parent-process pytest-cov and pytest warning filters alone do not prove interpreter coverage or warning enforcement. Future gates must collect and combine coverage from those children, propagate warning policy, and inspect their complete stdout, stderr, and diagnostics. Validate those mechanisms with evidence. Preserve expected KAFE errors, error fixtures, exit codes, and current CLI semantics; an expected invalid-program result is not itself a quality-gate failure. Do not discard earlier child diagnostics merely because the final expected error line matches.

Python CI must include `uv audit` over the locked dependencies including development dependencies, codespell, Ruff, basedpyright, tests, coverage, and an explicit repository-policy check rejecting any project-authored `# pyright:` or `# noqa:` comments in Python source. Those comments are prohibited even when narrowly targeted. Fix the underlying issue rather than suppressing it.

Extend the existing KAFE workflows: `.github/workflows/tests.yml` for interpreter and policy checks, `.github/workflows/docs.yml` for the MkDocs build and deployment, and `.github/workflows/main.yml` for Nix lockfile maintenance. Preserve ANTLR generation/runtime prerequisites and the documentation site's deployment. Do not require a generic `ci.yml` or unrelated frontend jobs. The quality migration must run mandatory checks on branch pushes and pull requests and use suitable concurrency, permissions, and job time limits.

**0 errors and 0 warnings** is a hard local and CI completion gate for the applicable checks. Do not remove or weaken gates to obtain a passing result. An unavoidable upstream warning exception must be narrowly scoped to that warning, documented with its reason, and accompanied by an explanatory comment; never globally downgrade warnings. Record unavailable or not-yet-implemented gates as pending, never passing. Do not claim full repository alignment while known migration gaps remain.

## Dependencies and simplicity

Before adding a dependency, determine whether Python built-ins or the existing KAFE stack already provide the capability, whether the dependency is necessary, and whether its installed functionality will actually be used. Justify external dependencies and add only the minimum package required. Do not import external implementations of ML/DL algorithms or layers that KAFE is implementing itself.

Prefer fewer concepts and moving parts, explicit data flow, obvious ownership, predictable behavior, and minimal incidental complexity. Continuously remove unnecessary abstractions, dependencies, indirection, state, duplication, configuration, and custom infrastructure. Simplicity means understandable software, not merely fewer lines. Solve the actual requirement with the smallest robust design and avoid infrastructure for hypothetical future needs.

# Educational Response Requirement

KAFE is an educational project.

When implementing algorithms, models, optimizers, metrics, layers, or other ML/DL components, responses must include both:

1. Engineering explanation
2. Theoretical explanation

Theoretical explanations should help understand:

- What the concept is.
- Why it exists.
- How it works.
- Advantages and limitations.
- Relationship with the KAFE implementation.

Do not only describe code changes. Explain the underlying theory behind the implemented concept.

# Source of Truth

For conflicts among project records only, use this order:

1. **ADRs** — `.opencode/adr/` (architectural decisions and public API changes).
2. **Knowledge Layer** — `.opencode/knowledge/` (architecture, conventions, language spec, libraries).
3. **History** — `.opencode/history/` (significant project events).
4. **Progress** — `.opencode/progress/` (roadmap, backlog, milestones, and current work).

Within those project records, the higher-precedence source wins. This order does not override applicable system/runtime and user instructions or the mirrored root policies. OpenCode procedures remain subordinate implementations of those policies.

# Technical Setup and Repository Map

## Setup

Requires **Java JDK 11+** (for ANTLR) and **Python 3.10+**.

Install uv using the [official instructions](https://docs.astral.sh/uv/getting-started/installation/), then install the locked developer dependencies from the repository root:

```bash
uv sync --locked --group dev
```

Run project commands with `uv run --locked`. Install the optional KafeHF integration only when needed:

```bash
uv sync --locked --extra huggingface
```

Install and serve the documentation environment with:

```bash
uv sync --locked --group docs --no-dev
uv run --locked --group docs --no-dev mkdocs serve
```

Download the ANTLR JAR once from https://www.antlr.org/download/antlr-4.13.2-complete.jar and place it in `src/`.

## Critical: Generate Parser Files

**Generate on a fresh clone and after any grammar change** (`Kafe_Grammar.g4` or `Kafe_Lexer.g4`). From the repository root:

```bash
cd src
java -jar antlr-4.13.2-complete.jar -no-listener -visitor -Dlanguage=Python3 Kafe_Grammar.g4
# Alternative from src/: make antlr (requires the antlr command on PATH)
```

The generated files (`Kafe_GrammarLexer.py`, `Kafe_GrammarParser.py`, `Kafe_GrammarVisitor.py`, and token/interpreter metadata) are ignored and untracked. Do not commit them or assume a fresh clone contains them. Keep the generator compatible with the currently pinned ANTLR runtime version, 4.13.2.

## Running Programs

Run these commands from the repository root after generating the parser:

```bash
uv run --locked python src/Kafe.py <path-to-file.kf>
# Example:
uv run --locked python src/Kafe.py tests/Algorithms/Fibonacci.kf
```

## Tests

Run pytest from the repository root; the Makefile from `src/` requires a POSIX-compatible shell and Make:

```bash
uv run --locked --group dev pytest tests/          # all tests
uv run --locked --group dev pytest tests/ -v       # verbose
uv run --locked --group dev pytest tests/test_base.py
uv run --locked --group dev pytest tests/test_base.py::test_valid_programs
# From src/ in a POSIX shell with Make:
uv run --locked --project .. --group dev make test prueba=KafeMACHINE
# On Windows, run pytest directly from the repository root.
uv run --locked --group dev pytest tests/test_KafeMACHINE.py
```

**Test structure**: each category in `tests/` has `.kf` programs paired with `.expec` (expected stdout) and optional `.in` (stdin). Invalid-program tests use `.error.kf` + `.error.expec`. The `tests/utils.py` helpers discover and parameterize these files for pytest.

The Makefile invokes pytest through the locked uv project environment. Its shell loop is POSIX-specific. The fixture runners start child interpreters with `sys.executable`, so the quality migration must account for those processes as described above.

**KafeMACHINE tests** have ten immediate fixture directories and eleven configured paths in `tests/test_KafeMACHINE.py`; `metrics/` contributes two paths. Consult that module when the test layout changes.

| Configured fixture path under `tests/KafeMACHINE/` | Area |
|---|---|
| `linear/` | Linear models |
| `neighbors/` | Neighbor models |
| `tree/` | Tree models |
| `preprocessing/` | Preprocessing and transformations |
| `metrics/classification/` | Classification metrics |
| `metrics/regression/` | Regression metrics |
| `clustering/` | Clustering |
| `naive_bayes/` | Naive Bayes |
| `model_selection/` | Model selection |
| `svm/` | Support vector models |
| `ensemble/` | Ensemble models |

KafeHF fixtures live in `tests/KafeHF/` and are collected by `tests/test_KafeHF.py`. `hf_load_dataset_no_dep.error.kf` expects the optional `datasets` package to be absent; preserve that baseline when planning integration tests.

## Architecture

### Execution flow

```
.kf file → Kafe.py (entry) → ANTLR Lexer/Parser → parse tree
         → EvalVisitorPrimitivo.py (walks the tree, manages scope stack)
         → src/componentes_lenguaje/ (language features)
         → src/lib/ (built-in libraries)
```

### Key files

| File | Role |
|------|------|
| `src/Kafe_Grammar.g4` | Grammar (imports `Kafe_Lexer.g4`) — source of truth for syntax |
| `src/InterpreterVisitor.py` | Main visitor: variable scope, dispatch to components and libraries |
| `src/TypeUtils.py` | Type system definitions and validation |
| `src/global_utils.py` | Shared helpers (variable assignment, type checking) |
| `src/errors.py` | Custom exception classes |
| `src/globals.py` | Global state (program path, working directory) |

### Language components (`src/componentes_lenguaje/`)

Modular implementations called by the visitor:

- `base/` — variables, operators, indexing, literals, type coercion
- `bucles/` — `for` / `while`
- `condicionales/` — `if` / `elif` / `else`
- `funciones/` — `drip` declarations, lambdas, currying, built-ins (`show`, `pour`, `range`, `len`, `append`, `remove`)
- `importar/` — `import` statements
- `librerias/` — routes method calls to the correct `lib/` module
- `method_calling/` — object method resolution

### Built-in libraries (`src/lib/`)

| Library | Import key | Purpose |
|---|---|---|
| `KafeNUMK` | `numk` | NumPy-style arrays and matrices |
| `KafeGESHA` | `geshaDeep` | Neural networks and deep learning primitives |
| `KafeMATH` | `math` | Math utilities |
| `KafePLOT` | `plot` | Plotting and visualization |
| `KafePARDOS` | `pardos` | DataFrames and CSV |
| `KafeFILES` | `files` | File I/O |
| `KafeMACHINE` | `machine` | ML models, preprocessing, model selection, and metrics |
| `KafeHF` | `huggingface` | Optional Hugging Face dataset loading through `datasets` |

Import keys are case-sensitive and come from `EvalVisitorPrimitivo.libraries`. Preserve their spelling unless a coordinated language/API migration changes them.

### KAFE language keywords

`drip` (function def) · `show` (print) · `pour` (debug print) · `import` · `if/elif/else` · `while` · `for` · `return`

Types include `INT`, `FLOAT`, `STR`, `BOOL`, `VOID`, `List[...]`, `GESHA`, `PARDOS`, `MACHINE`, and `FUNC` function types. `List` is case-sensitive; `LIST` is the lexer token name, not its source spelling.

### Adding a new built-in library

1. Perform Impact Analysis and follow `.opencode/skills/create-library/` under the root policies.
2. Create the package `src/lib/KafeXXX/` with `__init__.py` and `functions.py`, exposing the required library functions and any supporting classes.
3. Import `lib.KafeXXX.functions` in `src/InterpreterVisitor.py` and register its case-sensitive import key in `self.libraries`, following the existing `[module, False]` pattern.
4. Reuse the generic dispatch in `src/language_components/libraries/functions.py`; change it only when the library requires new dispatch behavior.
5. Add paired fixtures under `tests/KafeXXX/`, a collecting `tests/test_KafeXXX.py` module, and applicable library documentation, examples, and project records.

### Adding grammar features

1. Edit `Kafe_Grammar.g4` (or `Kafe_Lexer.g4` for tokens).
2. Regenerate the ignored parser files from `src/` with the configured ANTLR generator (`make antlr` when available).
3. Add visitor methods in `EvalVisitorPrimitivo.py` (or delegate to a new component).
4. Add relevant valid/invalid fixtures and update language documentation; preserve generated-file exclusions.
