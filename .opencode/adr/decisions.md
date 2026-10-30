# Architecture Decision Records

This file consolidates all ADRs for the KAFE project. Individual ADR files have been merged here to reduce file accumulation.

## ADR-0001: Adopt `.opencode/` as the Authoritative Engineering System

- **Status**: accepted
- **Date**: 2026-08-03

### Context

KAFE is an educational DSL for Machine Learning and Deep Learning (Python + ANTLR 4, Visitor pattern). Before this decision, engineering rules lived in a single AGENTS.md and nothing was persisted: no memory, no session recovery, no ADR/benchmark process, no Definition of Done enforcement.

### Decision

Adopt `.opencode/` as the authoritative engineering system with a three-layer separation:
- `OPENCODE.md` — operating manual
- `AGENTS.md` — engineering constitution
- `.opencode/` — source of operational knowledge

Source of Truth precedence: **ADRs > Knowledge Layer > History > Progress**.

### Rationale

- Separates governance (stable) from operations (procedural) from knowledge (living)
- Makes engineering processes executable via commands
- An educational project benefits from durable, traceable knowledge

### Consequences

- Significant changes must be traceable through ADRs, history, and the session log
- AGENTS.md stays lean; detail lives in `.opencode/knowledge/`
- Session memory files and the session log must be updated when closing a session

---

## ADR-0002: OpenCode Roles as Subagents (SUPERSEDED)

- **Status**: superseded by ADR-0005
- **Date**: 2026-08-03
- **Superseded**: 2026-08-04

### Context (Original)

AGENTS.md defines five engineering roles that were initially deferred as subagents because the workload did not justify the orchestration overhead.

### Decision (Original)

Keep the five roles as documented responsibilities and defer their implementation.

### Decision (Updated — 2026-08-04)

The five roles are now implemented as OpenCode subagents in `.opencode/agents/`. Superseded by ADR-0005.

---

## ADR-0003: Local Verification Gates Instead of CI Hooks

- **Status**: accepted
- **Date**: 2026-08-03

### Context

The engineering system requires that an agent proves work rather than asserting it. The reference subagent-harness used agent-local hooks to enforce verification.

### Decision

Use explicit local gates through commands instead of CI hooks:
- `/init` runs the full test suite and validates progress consistency
- `/close` requires `/init` green before closing
- No `PostToolUse`/`Stop` agent hooks are configured
- Quality framing documented in `.opencode/knowledge/verifications.md`

### Rationale

- Verification is explicit, auditable, and executed at a defined gate
- No dependency on agent-hook mechanisms
- CI continues to verify on push/PR

### Consequences

- No session closes with a red suite
- Agent must run gates consciously
- Anti-patterns are documented as review failures

---

## ADR-0004: Session Lifecycle (Session Log + `/close`)

- **Status**: accepted
- **Date**: 2026-08-03

### Context

Without an end-of-session lifecycle, `current.md` accumulated state across sessions and there was no historical record of sessions.

### Decision

Implement a session lifecycle with two mechanisms:
- Append-only session log at `.opencode/progress/session-log.md`
- `/close` command with hard gates

### Rationale

- Reproducible closure: a red suite never closes a session
- Append-only log preserves session history
- Complements the history layer without duplicating it

### Consequences

- `/resume` and session-recovery template read `session-log.md`
- `/init` validates closure consistency
- `current.md` is reset to template on close

---

## ADR-0005: Agent System Implementation

- **Status**: accepted
- **Date**: 2026-08-04

### Context

AGENTS.md defines five engineering roles that were initially deferred as subagents (ADR-0002). The engineering system has matured, and the workload now justifies implementing them.

### Decision

Implement the five roles as OpenCode subagents in `.opencode/agents/`:

| File | Mode | Responsibility |
|---------|------|-----------------|
| `engineering-lead.md` | primary | Orchestrator |
| `architect.md` | subagent | Design + ADR |
| `builder.md` | subagent | Implementation + tests |
| `reviewer.md` | subagent | Quality gates + Definition of Done |
| `historian.md` | subagent | History/knowledge/memory |
| `tester.md` | subagent | Validation + benchmarks |

Configuration in `opencode.json`:
- `default_agent: "engineering-lead"`
- `subagent_depth: 2`
- Granular permissions per agent

### Rationale

- Separation of responsibilities
- Parallel orchestration
- Granular permissions
- Enforcement of the anti-telephone protocol

### Consequences

- Seven skills updated with agent ownership
- ADR-0002 superseded
- The Lead orchestrates via the Task tool
- Subagents follow the anti-telephone protocol

---

## ADR-0006: Hard Enforcement via Command Log

- **Status**: accepted
- **Date**: 2026-08-04

### Context

The engineering system had soft enforcement (advisory instructions) for command sequence. Only `/close` had hard gates. Commands like `/open-work` and `/impact` could be skipped or run out of order.

### Decision

Implement hard enforcement via session-scoped command log:
- `.opencode/progress/session-commands.md` tracks which commands have run
- `/resume` resets the command log at session start
- `/open-work` verifies `/resume` ran first (aborts if not)
- `/impact` verifies `/open-work` ran first (aborts if not)
- Each command appends its execution to the log

### Rationale

- Enforces the command sequence: `/init` → `/resume` → `/open-work` → `/impact` → ...
- Provides audit trail for command invocations
- Prevents skipping required steps

### Consequences

- Command sequence is enforced, not just documented
- Reviewer can verify command sequence was followed
- Session state is explicitly tracked

---

## ADR-0007: BaseMachine Architectural Review — Unified Contract

- **Status**: accepted
- **Date**: 2026-09-14

### Context

KafeMACHINE's `BaseMachine` serves as the common abstraction for all ML models and preprocessing transformers. An architectural review identified multiple inconsistencies:

1. **`fit()` signature inconsistency**: Supervised models use `fit(X, y)`, unsupervised use `fit(X)`, transformers use `fit(data)`, and OneHotEncoder/OrdinalEncoder use `fit(df, columns)`. No child class calls `super().fit()`.
2. **DataFrame support inconsistency**: Only some transformers use `_unwrap_data()`. Models never use it. Some transformers extract DataFrame data manually in `fit()`.
3. **Dimension validation duplication**: Each class validates matrix shapes independently. KMeans rejects 1D data while all supervised models convert it.
4. **`score()` metric duplication**: LinearRegression.score() reimplements r2_score; LogisticRegression, KNN, and DecisionTreeClassifier all reimplement accuracy_score from `metrics.py`.
5. **`fit_transform()` broken for encoders**: BaseMachine.fit_transform(X) calls self.fit(X), but OneHotEncoder.fit requires two arguments.
6. **`predict_proba()` not in BaseMachine**: Only LogisticRegression and KNN have it.

### Decision

Adopt the following architectural decisions:

#### 1. Flexible `fit()` Contract (Alternative B)
`BaseMachine.fit()` defines no implementation beyond setting `_is_fitted`. Each category defines its own signature:
- Supervised models: `fit(X, y)`
- Unsupervised models: `fit(X)`
- Transformers: `fit(data)` — may accept DataFrame or matrix
- Encoders: `fit(df, columns)` — DataFrame-specific

The contract is **semantic** (documented), not syntactic (enforced by signature).

#### 2. Centralized `_is_fitted` in BaseMachine
`BaseMachine.fit()` sets `self._is_fitted = True` and returns `self`. Child classes call `super().fit()` at the end of their fit logic, or set `_is_fitted` directly if they override fit completely.

#### 3. DataFrame Support Where It Makes Sense
- **Transformers**: Must support DataFrame via `_unwrap_data()`
- **Supervised models**: `fit(X, y)` may accept X as DataFrame (extract via `_unwrap_data`)
- **KMeans**: May accept DataFrame
- **LabelEncoder**: Operates on 1D data; DataFrame does not apply directly
- No forced support where it doesn't make sense.

#### 4. Rename boolean to `is_dataframe`
`_unwrap_data()` already returns `(matrix, columns, is_dataframe)`. The name is explicit. Document the return tuple clearly.

#### 5. Centralized Dimension Validation
Add `_validate_matrix_shape(X, expected_features=None)` to BaseMachine:
- Converts 1D to 2D
- Validates all rows have same length
- Optionally validates number of features
- Each class uses this + its own specific rules

#### 6. `score()` with Optional Metric Parameter
- `score(X, y, metric=None)` — accepts an optional metric function
- Each model defines a `_default_metric` used when `metric=None`:
  - LinearRegression → `r2_score`
  - LogisticRegression → `accuracy_score`
  - KNN → `accuracy_score`
  - DecisionTreeClassifier → `accuracy_score`
- Users can pass any metric function: `model.score(X, y, metric=f1_score)`
- All metrics come from `metrics.py` — no duplication

#### 7. Remove `fit_transform()` from BaseMachine
Each transformer that needs fit_transform implements it with its own signature. No common default because `fit` has different signatures across categories.

#### 8. `predict_proba()` Not in BaseMachine
Only probabilistic classifiers (LogisticRegression, KNN) implement it. It is not part of the general contract.

### Rationale

- Respects the reality of the domain: models and transformers have different contracts
- Centralizes common logic (fitted state, dimension validation) without forcing uniformity
- Eliminates metric duplication
- Removes broken `fit_transform()` default
- Keeps the codebase clean and educational

### Consequences

- All child classes must be updated to use centralized validation and metrics
- `_unwrap_data()` must be used consistently in transformers' `fit()` methods
- Tests must verify the new validation behavior
- Documentation must reflect the flexible contract
- History and knowledge layers must be updated

#### 9. PCA `n_components` Validation in `fit()`
Validate `n_components <= n_features` in `fit()` when `n_features` is known. Raises a clear error instead of failing later in `transform()` with a cryptic message.

#### 10. OneHotEncoder `handle_unknown` Parameter
- New parameter: `handle_unknown="error"` (default)
- `handle_unknown="error"` → raises exception on unseen categories in `transform()`
- `handle_unknown="ignore"` → returns all-zeros row for unseen categories
- User must explicitly choose to ignore unknown categories

#### 11. OneHotEncoder `inverse_transform` Strict Validation
- Raises exception if no active category found (all zeros)
- Raises exception if multiple active categories found (data corruption)
- No silent fallback to first category — invalid input must fail explicitly

#### 12. SimpleImputer Type Validation for `mean`/`median`
- In `_compute_statistic()`, validate that values are numeric when strategy is `mean` or `median`
- Raises clear error: "strategy 'mean' requires numeric data"
- Prevents confusing `TypeError` from `sum()` on non-numeric data

#### 13. Preprocessing Dimension Validation Decision
- Preprocessors do NOT use `_validate_matrix_shape()` in `fit()` — it is redundant
- Each transformer validates dimensions in `transform()` against learned state (`self.mean_`, `self.data_min_`, etc.)
- This is sufficient: `fit()` learns dimensions from data, `transform()` validates against learned dimensions
- `_validate_matrix_shape()` is primarily for models where fit/predict are separate operations

#### 14. Dimension Validation in predict()
All models validate feature dimensions in `predict()` against the fitted state:
- LinearRegression: validates `len(row) == len(self.coef_)`
- LogisticRegression: validates via `predict_proba()` which checks `len(row) == len(self.coef_)`
- KNN: validates `len(row) == len(self.X_train[0])`
- DecisionTreeClassifier: validates `len(row) == self.n_features_`
- KMeans: validates `len(row) == len(self.cluster_centers_[0])`

Prevents silent truncation from `zip()` and `IndexError` from feature index access.

#### 15. X and y Length Validation in fit()
All supervised models validate `len(X) == len(y)` in `fit()`:
- LinearRegression: already validated
- LogisticRegression: added validation
- KNN: added validation
- DecisionTreeClassifier: added validation

Produces clear error message instead of cryptic IndexError during training.

#### 16. LogisticRegression Hyperparameter Validation
Validate hyperparameters in `__init__()`:
- `learning_rate > 0` — zero or negative values prevent convergence
- `max_iter > 0` — zero or negative values prevent training

Fails fast at construction time instead of silently producing a broken model.

---

## ADR-0008: Mirrored Root Policies Govern Project Procedures

- **Status**: accepted
- **Date**: 2026-09-23
- **Clarifies**: ADR-0001 (its historical text remains unchanged)

### Context

KAFE's root instructions have adopted applicable repository policies for English, Superpowers, dependency management, and quality gates. `AGENTS.md` and `CLAUDE.md` must express the same substantive rules. Some OpenCode knowledge and review instructions still described themselves as the exclusive review authority, which could exclude those root invariants. The repository also retains legacy setup and unimplemented migration gates that must not be presented as passing checks.

### Decision

1. Applicable runtime and user instructions govern execution. The mirrored `AGENTS.md` and `CLAUDE.md` files define repository invariants. Only their file-identifying introductory text may differ.
2. `OPENCODE.md`, `.opencode/` procedures and knowledge, and `.kiro/` steering implement the root invariants and cannot waive them. Reviews and `/dod` must consult both root policies and relevant technical knowledge.
3. ADR-0001's ADR > Knowledge > History > Progress order applies to conflicts among project records only. It does not elevate historical records above current root policies or applicable runtime/user instructions. OpenCode remains the persistent project engineering system with its existing lifecycle, roles, and ML/DL documentation and benchmark duties.
4. Record verification as PASS, FAIL, PENDING, or N/A with evidence or reasons. Distinguish task acceptance from repository migration debt. Missing gates remain PENDING; a task that promises to implement one is incomplete until its enforcement is demonstrated.
5. Keep Superpowers specs, plans, and review reports local in the ignored artifact paths. Never stage, force-add, or commit them; persist durable project decisions in ADR/history/knowledge records instead.

### Rationale

- A mirrored policy body prevents agent-specific rule drift.
- Project knowledge retains its technical role without excluding repository-wide obligations.
- Evidence and explicit pending status prevent existing pytest success from being mistaken for complete quality-policy enforcement.
- The clarification preserves historical decisions and KAFE's educational engineering process.

### Consequences

- Root policy changes must remain synchronized and be reflected in affected procedures and steering.
- English migration, coordinated uv setup, and new quality/CI checks remain separate implementation work. The uv plan must cover runtime, development, docs, Nix's role, and optional integrations while preserving KafeHF's missing-dependency behavior.
- Child interpreter coverage and full diagnostic observation require explicit implementation and execution evidence; parent pytest-cov/filterwarnings alone do not establish them.
- Existing applicable full-suite, session-closure, ML/DL artifact, benchmark, and history obligations remain in force.

### Alternatives Considered

- **Mirror only a new policy section:** rejected because substantive rules elsewhere could still diverge.
- **Keep knowledge as the exclusive review authority:** rejected because it could bypass root invariants.
- **Rewrite ADR-0001:** rejected to preserve the historical decision and make the clarification traceable.

---

## ADR-0009: Retire Repository-level Kiro Configuration and Steering

- **Status**: accepted
- **Date**: 2026-09-23
- **Partially supersedes**: ADR-0008, Decision 2, only its inclusion of `.kiro/` steering

### Context

The preceding policy alignment brought Kiro steering under the mirrored root invariants. A subsequent user-approved retirement removes repository-level Kiro support. The steering's reusable KAFE facts are already represented in the root and OpenCode documentation; its file I/O fixture casing and parser-cleanup details are preserved in canonical verification guidance. The repository-scoped MCP configuration contains no reusable engineering policy.

### Decision

1. Remove `.kiro/settings/mcp.json` and `.kiro/steering/product.md`, `structure.md`, and `tech.md` from this repository. This decision does not authorize changing global/user Kiro configuration or unrelated MCP integrations.
2. Current subordinate repository procedures are `OPENCODE.md` and `.opencode/`. Remove active Kiro authority references from the mirrored root instructions, the operating manual, and engineering/context records.
3. Preserve ADR-0008 unchanged as a historical decision. Its inclusion of Kiro steering in Decision 2 is superseded by this retirement; all remaining authority, review, local-artifact, migration-status, and verification requirements stay in force.
4. Preserve the earlier alignment history and append this retirement event. Keep the reusable `tests/KafeFiles/` casing and `make clean` requirements in `.opencode/knowledge/verifications.md`.

### Rationale

- Retiring a duplicated tool-specific instruction surface reduces maintenance and rule drift.
- Canonical guidance retains the useful operational details without preserving repository-level Kiro integration.
- A scoped superseding decision records the changed support boundary without rewriting historical policy.

### Consequences

- The repository no longer supplies Kiro MCP settings or steering; historical Kiro references describe the earlier state and this retirement only.
- `AGENTS.md` and `CLAUDE.md` remain mirrored. OpenCode retains its operating-manual and persistent-engineering-system roles under the root policies.
- Runtime behavior, dependency declarations, fixtures, workflows, and pending English/uv/quality migrations are unaffected by the retirement.

### Alternatives Considered

- **Keep duplicate Kiro steering:** rejected because the user approved retiring repository-level support and canonical guidance already covers the project.
- **Delete historical decisions and events:** rejected because it would erase the reason for the changed authority boundary.
- **Remove global tools or migrate MCP settings automatically:** outside the authorized repository scope.

---

## ADR-0010: uv Owns Python Dependency Management

- **Status**: accepted
- **Date**: 2026-09-23

### Context

KAFE's Python runtime, development tools, MkDocs dependencies, optional Hugging Face integration, Nix shell, and CI previously used separate or implicit dependency sources. This made fresh setup and optional-dependency behavior difficult to reproduce. The repository policy requires a committed uv lock while keeping `datasets` absent from the default environment.

### Decision

1. Use the root `pyproject.toml` and committed `uv.lock` as the sole Python dependency definition. Keep this as a non-package project with `requires-python = ">=3.10"` and the uv-required non-release metadata version.
2. Declare ANTLR runtime in the base project, developer tools and pytest in `dev`, MkDocs dependencies in `docs`, and Hugging Face `datasets` only in the optional `huggingface` extra. Set `tool.uv.exclude-newer = "7 days"`.
3. Use locked uv sync/run commands for local development, docs, Make targets, OpenCode procedures, and GitHub Actions. Install uv using Astral's official instructions when it is unavailable.
4. Keep Nix responsible for Python, uv, Java, ANTLR, and system utilities; do not maintain Python library dependencies in Nix. Preserve ANTLR 4.13.2 generation and runtime compatibility.
5. Remove the legacy `requirements.txt` manifest and point KafeHF's missing-dependency diagnostic to `uv sync --locked --extra huggingface`. Keep the default environment free of `datasets`.

### Rationale

- A single committed lock makes local setup, CI, and docs dependency resolution reproducible.
- Separate groups keep docs tooling out of the normal project install and preserve KafeHF's deterministic missing-dependency behavior.
- Nix remains useful for system tools without duplicating Python dependency ownership.

### Consequences

- Developer setup, Make, OpenCode guidance, and both existing Python workflows use the locked uv project.
- `datasets` is installed only when the Hugging Face extra is selected; the missing-dependency fixture remains part of the default suite.
- The required quality tools are declared in `dev`, but their lint, typing, spelling, audit, coverage, warning, and suppression-policy gates remain pending for the separate quality-gates work.
- Nix validation requires a Nix-capable host. Test CI is verified after the authorized feature push; the docs workflow deploys only from `main`.

### Alternatives Considered

- **Keep pip/requirements alongside uv:** rejected because it would retain two dependency authorities.
- **Keep Python libraries in Nix:** rejected because it would duplicate the uv project and lock.
- **Make `datasets` a base or development dependency:** rejected because it would invalidate the deterministic missing-dependency environment.

---

## ADR-0011: One-Time English Backfill of Project Records

- **Status**: accepted
- **Date**: 2026-09-23

### Context

The user requires the current repository content to be in English and approved Task 6 to translate existing project records. The records include append-only session history and accepted ADRs whose Spanish prose predates this requirement. Translating those entries in place is necessary for the current-tree language requirement, but would ordinarily conflict with the record-preservation rules. Their original versions remain in Git history.

### Decision

1. Authorize one faithful English translation pass over existing tracked Spanish prose in repository guidance and `.opencode/` records, including historical session entries and accepted ADR prose. Preserve chronology, dates, identifiers, statuses, measured results, decisions, and substantive meaning; do not rewrite Git history.
2. For this one backfill only, this ADR supersedes prior append-only or accepted-record immutability rules to the extent they would prevent translating existing prose. It does not authorize deleting or altering historical facts, changing the outcome of a recorded decision, or editing captured contents of retired artifacts.
3. Keep future session and history entries append-only, write them in English, and do not use this exception for later editorial rewrites.
4. Remove the PDF and machine-specific logs listed in the approved Task 6 brief from the current tree without modifying their captured contents. Their Git history remains available.

### Rationale

- A faithful current-tree translation satisfies the user's English requirement while preserving the original record meaning and chronology.
- An explicit, narrowly scoped exception prevents this backfill from weakening future append-only protection.
- Keeping Git history unchanged preserves the original Spanish wording and the approved retired artifacts for recovery.

### Consequences

- Existing tracked records may receive language-only edits in Task 6; substantive decisions, dates, identifiers, and measured results remain unchanged.
- Future project records remain append-only and English.
- The approved retired PDF and logs are absent from the current tree but remain recoverable from Git history.

### Alternatives Considered

- **Leave historical Spanish untouched:** rejected because the user requires English current-tree content and approved the one-time backfill.
- **Rewrite or filter Git history:** rejected because it is unnecessary for the current-tree requirement and would remove the original record snapshots.
- **Make all future records freely editable:** rejected because the user authorized only this one-time backfill.

---

## ADR-0012: Python Quality Gates and CI Enforcement

- **Status**: accepted
- **Date**: 2026-09-24

### Context

The repository now uses a committed uv lock for Python runtime, development, documentation, and optional dependencies. The interpreter fixture suite also verifies child-process diagnostics, warnings, and subprocess coverage. Consistent local and hosted quality gates are needed to check the owned Python code and preserve that evidence without analyzing generated ANTLR outputs or masking authored issues.

### Decision

1. Use the locked `dev` group and existing tools. Ruff targets Python 3.10, enables `E4`, `E7`, `E9`, `F`, `B`, and `I`, and sets `force-exclude = true`. basedpyright analyzes `src/` and `tests/` using Python 3.10, `basic` mode, and `failOnWarnings = true`.
2. Exclude only `src/Kafe_GrammarLexer.py`, `src/Kafe_GrammarParser.py`, and `src/Kafe_GrammarVisitor.py` from Ruff, basedpyright, and coverage. Keep generated parser outputs ignored and untracked. Regenerate with ANTLR 4.13.2 before interpreter tests or checks when the files are absent or the grammar changes.
3. Configure codespell to scan hidden files with the exact case-sensitive ignore list `expec,mape,MAPE,FPR,Hart,le`. Skip only justified local/build outputs, root-local `docs/superpowers/`, and generated ANTLR artifacts; keep source, tests, `.opencode/`, and ordinary documentation in scope.
4. Prohibit authored `# noqa` and `# pyright:` comment tokens. The repository policy checker enumerates tracked `*.py` files with `git ls-files -z`, tokenizes comments, and reports findings with file and line. It must fail on unreadable or invalid tracked Python files; ignored generated parsers need not be tracked.
5. Enforce locked dependency auditing, Ruff, basedpyright, codespell, the suppression policy checker, and the full pytest/coverage gate through the existing `.github/workflows/tests.yml`, after Java 11 setup and ANTLR generation. Keep `filterwarnings = ["error"]` and `PYTHONWARNINGS=error` for interpreter child processes. Preserve exact stdout/stderr/exit expectations and the 80% minimum coverage for `src/`.
6. Run `.github/workflows/docs.yml` validation on all pushes, pull requests, and manual dispatches. Deploy only from `main` for documentation-changing pushes or manual dispatches. Serialize eligible deploy jobs by workflow/ref with a non-cancelling queue, explicitly check out `main`, strictly rebuild that snapshot, then run `mkdocs gh-deploy --force`. Keep `NO_MKDOCS_2_WARNING=1` scoped to the strict build that needs the Material for MkDocs upstream MkDocs 2.0 warning exception.
7. Keep `.github/workflows/main.yml` for weekly/manual Nix lock maintenance; do not add Python quality duties or a generic CI workflow there. Require zero errors and zero warnings for applicable quality gates. Distinguish local verification from hosted CI, and record remote status only after observing the run at the exact pushed commit.

### Rationale

- Locked commands, narrowly selected rule sets, and a fixed Python target make local and CI results reproducible.
- Explicit generated-file exclusions keep tool output focused on owned code while ensuring no ordinary Python files are silently ignored.
- Token-based suppression checking catches authored directives without matching the same text inside string literals.
- The existing workflow boundaries preserve interpreter/ANTLR setup, docs publication, and Nix ownership while making quality checks mandatory.
- Warning-as-error gates expose regressions; the one upstream documentation advisory exception remains narrow and explained.

### Consequences

- Local commands and exclusions are documented in `.opencode/knowledge/verifications.md`; root guidance remains mirrored in `AGENTS.md` and `CLAUDE.md`.
- Hosted success is not implied by committed workflow configuration. The quality migration remains open until the authorized branch is pushed and all required remote checks are observed at the resulting exact SHA.
- Future changes must preserve optional `datasets` behavior, fixture contracts, generated parser exclusions, and the docs/Nix workflow boundaries.

### Alternatives Considered

- **Use broad ignores or blanket suppressions:** rejected because they could hide owned-source defects.
- **Analyze generated ANTLR modules:** rejected because their output is generated and not project-authored.
- **Replace existing workflows with a generic Python CI job:** rejected because it would risk dropping Java/ANTLR setup, docs deployment, or Nix ownership.
- **Mark migration complete after local checks alone:** rejected because hosted CI and deployment behavior must be observed at the exact pushed commit.

---

## ADR-0013: Preserve the Existing Gesha API During Branch Integration

- **Status**: accepted
- **Date**: 2026-10-19

### Context

`feature/Kafe_Gesha_Clustering` and `main` diverged from identical trees but have unrelated commit histories. The feature redesigns Gesha models, layers, activation classes, and optimizers. Replacing the current `geshaDeep` implementation with those files broke existing interpreter fixtures in the previous integration branch.

### Decision

Keep `geshaDeep` and its existing model, core, activation, and optimizer modules as the compatibility API. Register the redesigned backend under `geshaV2`, backed by `KafeGESHA/functions_v2.py`. Keep the redesigned model and core in `models_v2.py` and `core_v2.py`; export its public classes from the package. New examples and fixtures import `geshaV2`. Preserve the established `KafeNUMK` and other `main` APIs while adding the new tensor operations and libraries.

### Consequences

Both Gesha APIs remain available during migration. Existing programs retain their behavior, and the new backend can be tested independently. Shared utility changes require regression tests for both APIs. A future replacement of `geshaDeep` requires a separate compatibility decision and migration plan.

---

## ADR-0014: Admit Spanish Educational Content

- **Status**: accepted
- **Date**: 2026-10-19

### Context

The Gesha feature adds educational documentation, source comments, examples, fixture text, and project records in Spanish. The user explicitly chose to admit Spanish rather than translate this material during integration. The prior English-only rule in ADR-0011 and the fixed codespell vocabulary in ADR-0012 would reject that choice.

### Decision

1. Keep English as the default for source identifiers, paths, configuration, and commit messages. Educational prose, comments, docstrings, examples, records, and user-facing text may use English or Spanish. Preserve existing text when editing unless translation is part of the task.
2. Continue running codespell over source, tests, ordinary documentation, and hidden project records. Keep the original `ignore-words-list`; add the reviewed `.codespell-es.txt` file for Spanish words that codespell mistakes for English typos. Do not add broad skips or disable the spelling check.
3. Mirror the language policy in `AGENTS.md` and `CLAUDE.md` and update the knowledge and verification references. This decision supersedes only the English-only authoring requirement of ADR-0011 and the fixed-vocabulary part of ADR-0012. The historical English migration and all other quality gates remain in force.

### Consequences

Spanish educational material can be merged without distorting its wording to satisfy an English spelling dictionary. New Spanish words that trigger codespell require review before adding them to the vocabulary file. True typos, including those in English content, remain errors.

---

## ADR-0015: Use the KAFE GESHA Type for Mixed Layer Lists

- **Status**: accepted
- **Date**: 2026-10-19

### Context

The redesigned Sequential API accepts lists containing different layer classes. The interpreter previously compared concrete Python classes when checking list homogeneity, so it rejected valid `GESHA` lists before library dispatch. Initializer objects were also identified as callable `FUNC` values.

### Decision

Classify Gesha layers, models, initializers, regularizers, optimizers, losses, and callbacks as KAFE `GESHA`. During list homogeneity validation, allow different concrete Python classes only when every flattened element has KAFE type `GESHA`. Keep concrete-class validation for all other types.

### Consequences

Mixed-layer Sequential programs can execute through the interpreter. Mixed primitive lists remain invalid. The scope of `GESHA` now includes configuration objects that belong to its model-building API. The change is verified by interpreter fixtures and focused list typing checks.

---

## ADR-0016: Unify Gesha into a Single Public API

- **Status**: accepted
- **Date**: 2026-10-19

### Context

ADR-0013 kept geshaDeep as a compatibility API and registered the redesigned backend as geshaV2 because replacing geshaDeep broke existing interpreter fixtures. Two near-identical Gesha APIs now coexist: 18 test fixtures use geshaDeep and 7 use geshaV2, and documentation and examples are split. Shared utility changes require regression tests for both APIs, and the duplicated naming confuses learners.

### Decision

1. Adopt a single canonical KAFE import key, gesha, backed by the redesigned implementation (functions_v2.py, models_v2.py, core_v2.py).
2. Keep geshaDeep and geshaV2 registered as deprecated aliases to the same module during a migration window. Deprecation is documented only; no runtime warning is emitted, because the fixture harness treats Python warnings as errors.
3. Migrate fixtures, examples, and documentation to gesha.
4. Retire the legacy implementation modules once no importer references them.
5. Preserve the established KafeNUMK and other public APIs.

### Consequences

- One Gesha implementation behind one canonical name; geshaDeep and geshaV2 remain functional during the transition.
- The legacy single-sample predict shape and scalar predict_proba must be reconciled with the redesigned batch shape while migrating fixtures.
- Removing geshaDeep and geshaV2 later requires a follow-up compatibility decision.

### Alternatives Considered

- **Keep two APIs:** rejected; it duplicates maintenance and hurts the educational goal.
- **Name the single API geshaDeep:** rejected; the redesign is a new API and a clean name matches KafeGESHA.
- **Emit runtime deprecation warnings:** rejected; the harness treats warnings as errors.

---

## ADR-0017: Unify the Gesha Class Hierarchy Behind One Runtime Type

- **Status**: accepted
- **Date**: 2026-10-19

### Context

ADR-0016 unified the Gesha *import key* behind gesha, but the class hierarchy stayed split. TypeUtils.get_data_type() classifies the KAFE GESHA type with one isinstance tuple that must list classes from BOTH backends, because models_v2.Model does not inherit from the legacy core.model.Gesha:

- legacy Gesha = core.model.Model, MRO [Model, ABC, object]
- models_v2.Model, MRO [Model, ABC, object], unrelated tree
- isinstance(models_v2.Sequential(), legacy Gesha) is False

Three concrete problems follow:

1. TypeUtils.py and language_components/base/functions.py import from lib.KafeGESHA.core.model, so the legacy module cannot be retired.
2. language_components/base/functions.py line 53 does al = cast(Any, Gesha)() to build a default value for GESHA x;. Both candidate classes are abstract, so that statement raises TypeError: Can't instantiate abstract class. A live interpreter bug, currently uncovered by any fixture.
3. src/lib/KafeGESHA/__init__.py re-exports Gesha, Model from core.model and Sequential/Functional/Add from models.sequential/models.functional, while models/__init__.py already re-exports from models_v2. The package is half-migrated.

### Decision

1. Make the KAFE runtime type GESHA map to a single class in the redesigned module graph.
2. Re-point KafeGESHA/__init__.py, models/__init__.py, TypeUtils.py, and language_components/base/functions.py at that single graph.
3. Retire the legacy modules once no importer remains: unctions.py (already zero importers), and the legacy models/sequential.py / models/functional.py / core/model.py where the unified graph replaces them.
4. Keep the public KAFE type name GESHA and all user-facing type-error messages unchanged.

### Consequences

- One class graph; TypeUtils gets one isinstance tree instead of two.
- The legacy Gesha backend becomes fully removable, closing ADR-0013.
- GESHA x; must be fixed: a declared-but-unassigned GESHA value needs a valid sentinel that is not an abstract class.

### Alternatives Considered

- **Keep two trees and leave the tuple:** rejected; keeps the legacy backend unremovable and duplicates every type-mapping change.
- **Make models_v2.Model inherit from legacy Gesha:** rejected; it is the reverse of the intended direction (legacy is being retired) and would drag legacy internals into the new graph.
- **Only delete unctions.py (the zero-importer file):** rejected as insufficient; it does not address the Gesha() bug nor unblock the rest.

---

## ADR-0023: Widen KafeMACHINE Metric Signatures to Accept Single-Column Gesha Predictions

- **Status**: accepted
- **Date**: 2026-10-20

### Context

Gesha models return batch predictions as a nested `List[List[FLOAT]]` with one value per row (`models_v2.Model.predict` maps each sample through `forward`, and a single-unit Dense returns `[value]`), while the KafeMACHINE regression metrics and `roc_auc_score` required a flat `List[INT]` / `List[FLOAT]` for their prediction argument. The `check_sig` decorator rejects the matrix before the metric body runs, so `machine.mean_squared_error(y_true, modelo.predict(X))` fails for gesha output even though the values are semantically one prediction per sample. This blocks uniform evaluation of machine and gesha learners with the same metric library.

### Decision

Additively widen the second parameter of the eight regression metrics (`mean_squared_error`, `mean_absolute_error`, `root_mean_squared_error`, `r2_score`, `max_error`, `median_absolute_error`, `mean_absolute_percentage_error`, `explained_variance_score`) plus `roc_auc_score` to also accept `numeric_matrix_types`, keeping the ground-truth parameter as a numeric vector. Normalize the incoming predictions with a module-private `_flatten_predictions` helper called before input validation, which accepts only single-column rows (inner length 1) and converts them to a flat vector.

### Consequences

- Both backends feed the same KafeMACHINE metrics: flat machine predictions and nested gesha batch predictions produce identical results.
- The change is backward compatible; existing flat-vector fixtures and internal `r2_score` callers are unaffected.
- Genuinely multi-output predictions are still rejected, with a clear error requiring one value per sample, instead of a silent length mismatch.
- Classification metrics and `silhouette_score` are unchanged, because gesha `predict_label` already returns a flat label vector.

### Alternatives Considered

- **Wrap gesha predict to flatten at the call site:** rejected; it pushes the shape problem onto every learner and every program instead of the shared library.
- **Add separate gesha-specific metrics:** rejected; it duplicates the library and breaks the uniform metric API across backends.
- **Flatten inside every metric body without widening:** rejected; `check_sig` would reject the matrix argument before the body runs, so the behavior would never be reachable.

---

## ADR-0024: Report Classification Accuracy and Raw Loss in Every Gesha Epoch

- **Status**: accepted
- **Date**: 2026-10-20

### Context

Gesha computed classification accuracy for training history but printed it only when `metrics` explicitly contained `accuracy`. Most example programs passed `[]`, so users saw only loss. The previous output also multiplied the loss by 100 and labeled it as a percentage, although MSE and cross-entropy are not percentages.

### Decision

Print mean loss as a raw decimal on every epoch. For supervised training with binary, categorical, or sparse categorical cross-entropy, print training accuracy as a percentage on the same line regardless of the `metrics` argument. Keep the stored `history` values as fractions/raw losses and leave model predictions unchanged.

### Consequences

- Classification networks now have consistent epoch output across Dense, CNN, RNN, and Functional architectures.
- Regression, reconstruction, and unsupervised training continue to show loss without a class accuracy.
- Exact-output fixture snapshots change; downstream consumers parsing the old text format must update.

### Alternatives Considered

- Update only examples to pass `["accuracy"]`: rejected because other classification programs using `[]` would still appear inconsistent.
- Keep loss with a percent suffix: rejected because it misrepresents the loss scale.

---

## ADR-0025: Align Published ML Metrics and Training Losses with Their Mathematical Definitions

- **Status**: accepted
- **Date**: 2026-10-20

### Context

The public `f1_score` returned the harmonic mean of macro precision and macro recall rather than macro F1. Silhouette assigned a singleton a score of one. Gesha displayed a clustering sum while optimizing a mean, and omitted scalar L2 penalties from training loss. These values can mislead evaluation even when predictions are unchanged.

### Decision

Define macro F1 as the mean of classwise F1 scores, weighted F1 as the support-weighted mean, and singleton silhouette as zero. Reject all-singleton partitions. Report the same mean soft-clustering objective whose gradient is used, and include the already applied scalar L2 penalty in Gesha's training loss. Preserve public function names and call signatures.

### Consequences

Numerical outputs and exact-output fixtures change. Users comparing historical runs must account for the corrected definitions. Prediction APIs and dataset formats remain unchanged.

### Alternatives Considered

Retaining the old numbers for snapshot compatibility was rejected because they do not represent the named metrics or optimized objective.

---

## ADR-0026: Isolate Evaluation Folds and Preserve Metric Meaning

- **Status**: accepted
- **Date**: 2026-10-20

### Context

Cross-validation reused the same estimator across folds and parameter combinations. A fitted input estimator could also carry learned data into every fold. Both searches maximized MSE, selecting worse regression models. SVM sigmoid columns contradicted `predict` class order and overflowed for large negative margins. Functional graphs with several outputs sent the entire gradient collection to every head.

### Decision

Require an unfitted model at the start of KafeMACHINE cross-validation and parameter search, and deep-copy it for each fold. Preserve positive MSE values but select their minimum; continue maximizing accuracy and R². Return SVM sigmoid scores in `classes_` order using a stable formula for either margin sign. Distribute Functional backward gradients by output position while retaining the single-output form.

### Consequences

- Fold scores no longer depend on training in earlier folds, and the caller's model is not trained by evaluation. Passing an already fitted estimator now raises a clear error.
- MSE searches may select different parameters; SVM probabilities change column order and remain uncalibrated sigmoid scores.
- Functional backward handles separate output heads. The current `fit` loop still supports one output and one loss.

### Alternatives Considered

- Reuse the caller's estimator and reset it between folds: rejected because KAFE estimators have no uniform reset contract.
- Negate MSE values: rejected because a reported `best_score_` named MSE should remain a positive error.
- Accept fitted estimators by copying their trained state: rejected because this can leak information from data outside each fold.

---

## ADR-0027: Compute Gaussian Model Likelihoods in Log Space

- **Status**: accepted
- **Date**: 2026-10-20

### Context

Gaussian Mixture multiplied feature density factors before taking a logarithm. With 800 features, all component densities underflowed to zero, EM assigned uniform memberships, and the model reported a zero negative log-likelihood. GaussianNB computed per-feature densities before taking their logarithms, so sufficiently distant observations made every class posterior negative infinity. Gaussian Mixture BIC also used a base-2 logarithm instead of the natural logarithm in its published formula.

### Decision

Evaluate Gaussian feature and diagonal component densities directly in log space. Use log-sum-exp to normalize GMM responsibilities and GaussianNB class posteriors. Preserve zero-variance GaussianNB behavior and public prediction shapes. Use the natural logarithm for BIC and reset GMM convergence state on each fit.

### Consequences

- High-dimensional and distant observations retain informative likelihood ordering without density underflow.
- Tiny probability and score decimals, and BIC values, change to their mathematically correct values; affected exact-output fixtures are updated.
- Time complexity remains O(iterations × samples × components × features) for GMM and O(samples × classes × features) for GaussianNB.

### Alternatives Considered

- Clamp densities to a tiny positive constant: rejected because distinct extremely unlikely observations would receive identical scores.
- Ignore samples with zero density: rejected because this makes impossible observations appear artificially favorable.

---

## ADR-0028: Require Python 3.11 for the Stable VS Code Runtime

- **Status**: accepted
- **Date**: 2026-10-20

### Context

The stable VS Code extension installs a checksum-pinned KAFE runtime from the
repository lock. The dependency audit reports nine memory-safety and denial-of-
service advisories for Pillow 12.3.0. Pillow 13.0.0 fixes them but no longer
supports Python 3.10. Keeping Python 3.10 would prevent the required clean
release audit.

### Decision

Raise KAFE's minimum supported Python version, Ruff target, basedpyright target,
CI runtime and managed-extension runtime declaration from 3.10 to 3.11. Resolve
the lock with Pillow 13.0.0 and retain the package-age quarantine, with narrowly
documented security-update exceptions for Pillow and certifi.

### Consequences

- Python 3.10 users must upgrade Python before installing the managed KAFE 0.2.0
  runtime.
- The extension can install the fixed Pillow release and pass the dependency
  audit.
- KAFE language syntax and program behavior do not change.

### Alternatives Considered

- Keep Python 3.10 and publish with known vulnerabilities: rejected because it
  violates the release quality gate.
- Remove image ingestion dependencies from verification: rejected because it
  would hide a supported KafeKaggle capability from the stable release.

---

## ADR-0029: Separate Terminal Execution from Guided Tutor Evidence

- **Status**: accepted
- **Date**: 2026-10-21

### Context

Learner-started executions were streamed to a VS Code terminal and also projected as Run entries in the Tutor timeline. This duplicated output, filled the conversation with lifecycle records, and blurred the boundary between program execution and pedagogical assistance. The managed runtime also omitted the external dependencies needed by the registered Kaggle and Hugging Face libraries.

### Decision

Keep all visible execution output in the local KAFE terminal. Store the latest matching Run result only as bounded, in-memory evidence that the Tutor may use after a learner asks for help; do not create Tutor transcript entries for Run preparation, completion, failure, or cancellation. Ground the Tutor in reviewed MACHINE and GESHA fixtures while prohibiting final exercise answers, complete ready-to-submit solutions, and verbatim fixture copies.

Add a locked `extension` optional dependency extra containing `datasets`, `kagglehub`, Pillow, and `py7zr`. Managed runtime setup installs that extra; the default developer environment continues to omit `datasets` so the missing-dependency fixture remains deterministic.

### Consequences

- Run output and interactive input have one visible owner: the local terminal.
- The Tutor can diagnose the learner's actual result without automatically exposing raw output in chat.
- Managed-extension users receive Kaggle and Hugging Face support during runtime setup.
- Runtime 0.3.0 and a new checksum-pinned GitHub release are required because runtime 0.2.0 is immutable.

### Alternatives Considered

- Remove Run evidence from the Tutor entirely: rejected because it prevents grounded diagnostic guidance.
- Continue showing collapsible Run cards: rejected because execution output belongs to the terminal and overwhelms the learning conversation.
- Install integrations dynamically with pip: rejected because it bypasses the committed uv lock and makes learner environments non-reproducible.

---

## ADR-0030: Save Workspace Tutor Conversations and Export Inert Transcripts

- **Status**: accepted
- **Date**: 2026-10-25

### Context

The Tutor previously owned one memory-only conversation. New Conversation reset that transcript and learning state, and restarting the extension host discarded it. Learners need independent conversations they can revisit within a project and export for use outside VS Code. Retaining live action registries with archived conversations would also retain stale preparation, file and execution authority. The provider's eight-pair / 32 KiB context window cannot serve as a full transcript archive.

### Decision

Save multiple conversations locally in VS Code `workspaceState` under the versioned `kafeTutor.conversations.v1` key. Keep one active `SessionCoordinator` and the same live `ConversationSession` object. Archive stable identity/title/timestamps, full safe display entries, draft, completed history with source/knowledge dependency references, and learning level plus guided/paused mode. Debounce autosave for 250 ms, serialize writes and flush before transitions. New, Switch, Rename and confirmed Delete use native title/Command Palette actions; the view description identifies the active conversation.

Stop an active provider turn before changing conversations and preserve partial text as cancelled. Advance generation when restoring declarative state, clear optional-source grants and transient learning/evidence/request/proposal state, and never restore executable action handles or live decisions. Block transitions while native Apply/reset is in progress. Continue independent native processes under their original ownership fences. Restored history must pass current source and knowledge eligibility before entering a request.

Bound the local archive to 200 conversations, 4 MiB per conversation and 16 MiB total, with no silent eviction. A malformed existing archive is preserved and reported while the current chat is temporary; failed writes keep the live chat available for retry or export. The archive allows up to 10,000 entries and 5,000 completed pairs per conversation. These archive limits remain distinct from the provider context window.

Export only the selected conversation as one versioned UTF-8 JSON document through a native Save dialog. Capture the selection and transcript before opening that dialog. Include record metadata, complete visible entries/statuses and safe display summaries; omit draft, learning preferences, provider history/dependencies, source metadata and all executable handles. Use a separate 16 MiB export bound so archive-save limits do not prevent a bounded recovery export. Preserve message text, code and Unicode, including learner-entered content. Exclude SecretStorage values, attached-file snapshots, raw requests, private Run evidence and raw transport errors from archive/export and keep existing diagnostic exclusions.

### Rationale

Workspace storage gives each project independent local history using the extension's existing VS Code infrastructure. One active coordinator reuses generation, source and native-action ownership checks without retaining multiple live providers or action registries. Separate archive/provider/export projections preserve a complete readable record while exposing only the data needed by each operation. Native pickers, confirmation and Save controls fit the existing sidebar and explicit action model.

### Consequences

- Messages, drafts and learning preferences now persist across restarts in their workspace; saved checkpoint/proposal summaries remain historical display data. This replaces the previous memory-only transcript contract.
- A new chat starts at guided Beginner defaults; switching back restores that chat's level/mode and draft. Current source grants, live learning decisions and execution evidence must be obtained again.
- Local history retains dependency references for current eligibility checks. Public JSON omits those references and internal continuation state, while preserving text/code already entered in the conversation.
- Save failures and capacity limits are visible instead of silently removing data. Existing malformed storage is not overwritten, and a live transcript can be exported within the separate export limit.
- JSON export is a transcript format for this release. Import, Markdown, all-chat export, cloud sync and simultaneous background responses remain outside the approved scope.
- Extension 2.2.0 is a local candidate. Publication and broader integration/release verification require their own evidence.

### Alternatives Considered

- Keep transcripts only in memory: rejected because conversations must survive workspace restarts.
- Retain a live coordinator/provider for every archived conversation: rejected because this multiplies lifecycle owners and risks preserving stale execution authority.
- Use a global cross-workspace archive: rejected because the approved scope isolates conversations by workspace.
- Persist raw session/request objects or restore old actions: rejected because transcript restoration cannot grant file, Apply or Run authority.
- Save/export only the bounded provider history: rejected because it would omit older visible messages.
- Silently evict old conversations at capacity: rejected because learners must control deletion and retain a recovery option.

---

## ADR-0031: Bundle Complete Reviewed MACHINE/GESHA Contracts with Shared Bounded Retrieval

- **Status**: accepted
- **Date**: 2026-10-25

### Context

The Tutor had representative MACHINE/GESHA fixtures and a separately installed knowledge pack, but those did not establish complete public API guidance before runtime installation. The tutorial tree `docs/ejemplos` was absent from pack selection, source-doc drift was not fully covered by extension CI, and lexical paragraph retrieval could lose signatures or clip code. Existing documentation also included Python/backend assumptions that differ from accepted KAFE positional calls. Runtime 0.3.0 is already published with immutable asset checksums; local documentation work must not imply that those assets changed.

### Decision

Ship generated library contracts and relevant documentation/tutorial units with extension 2.3.0. Curated MACHINE/GESHA records cover the intended public functions, aliases, returned-object methods/properties, parameters, returns, constraints, status and reviewed evidence. Source-derived inventories and source-symbol mappings detect missing coverage. Distinguish supported, limited, experimental, deprecated and unsupported behavior; record the unavailable GESHA L1L2 binding with negative evidence rather than changing runtime behavior.

Bind curated review attestation to the actual pinned interpreter revision/fingerprint. Require current/pinned source equality and hash corpus, contracts, evidence and generated contents. Ordinary generation cannot renew manual source review. Full parsing through EOF and exact stdout/stderr/exit checks verify reviewed DSL fixtures against disposable copies of the pinned runtime, with warnings treated as errors. Declare filesystem fixtures and local assets separately; keep long training, downloads and credentials in separately labelled integration work.

Use one explicit safe corpus definition for canonical docs/grammar and Markdown/KAFE tutorials from `docs/ejemplos`, mapped to `examples/tutorials`. Exclude SVGs/presentation assets and preserve existing path, identity and file/byte bounds. The JavaScript bundle/development selectors and future Python release selector share the same policy. A builder consumes the policy committed at its requested source revision; historical revisions without it retain the six required legacy sections.

Use shared case/accent/camelCase/underscore normalization, reviewed English/Spanish aliases and exact symbol lookup. Preserve complete signatures, headings, tables, fenced examples and source units; omit oversized/incomplete units rather than truncate code. At request composition, library material has at most three units / 8 KiB and shares 12 KiB with complete fixture examples; individual admissions are at most 6 KiB. Bundled tool lookup uses five units / 12 KiB. Managed/development search retains five passages, two per file and 2,000 characters per intact passage.

Keep bundled guidance and tool lookup available in message-only Restricted Mode without executable runtime or managed lineage. Prefer current reviewed MACHINE/GESHA references to older managed library narratives. Retain explicit source/trust, preparation, Review, Apply and Run boundaries, workspace conversation isolation, SecretStorage and honest execution evidence. Extend freshness/coverage/CI checks to documentation and dependency-lock inputs.

### Rationale

Bundling removes runtime-install dependence from educational API guidance while reusing the existing dependency-free reference stack. Curated positional contracts explain actual DSL behavior and expose backend-only limits that signatures alone miss. A source-derived completeness gate prevents silent omissions, while independent manual attestation prevents regeneration from automatically blessing changed semantics. Shared corpus selection and atomic bounded retrieval keep provenance consistent without transmitting the entire library on every request.

### Consequences

- Reference completeness covers the intended shipped surface and its explicit limits. It does not establish arbitrary architecture correctness, real-provider answer quality, learner mastery or correctness of a proposed program.
- Intended top-level coverage comprises 58 MACHINE functions, 56 GESHA wrappers and five activation aliases. Successful direct KAFE evidence covers all 58 MACHINE functions, 55 usable GESHA wrappers and five aliases; the remaining GESHA wrapper stays explicitly unavailable. Receiver records additionally describe callable and limited/backend-only surfaces.
- Published runtime 0.3.0 source/assets/checksums remain unchanged. Immediate guidance ships in the extension; an expanded managed pack needs a future committed source/versioned release and its own publication/acceptance evidence.
- Documentation changes can invalidate freshness checks. Corpus parity, bilingual retrieval, negative APIs, intact-unit budgets and packaged assets require deterministic gates.
- Existing dependency-audit advisories, unavailable native VS Code 1.96.0 validation, real-provider review and broader release checks remain separate pending gates until actual evidence resolves them.

### Alternatives Considered

- Add every fixture without an API inventory: rejected because fixture counts do not prove complete signatures, receiver methods, positional constraints or truthful limitations.
- Depend exclusively on a managed knowledge pack: rejected because the approved guidance must work before runtime installation.
- Send every library document on each request: rejected because bounded relevant contracts/examples provide clearer context and preserve request limits.
- Add a vector database, external indexing service or runtime dependency: rejected because reviewed aliases, exact symbols and atomic lexical retrieval fit the existing stack.
- Repoint runtime 0.3.0 to rebuilt assets: rejected because published checksums and source identity must remain immutable.

### Study alignment extension 2026-10-26

The user subsequently supplied the evaluation proposal and response regressions and authorized all alignment fixes. Add eight reviewed conceptual topics to the same bundled, hashed reference model. `LearningTopics` selects current-question guidance; conceptual questions lead with an explanation, while exact/API-form requests retain contract precedence. The generator requires all eight objective identities and valid related APIs. Assessment items and answer keys are excluded from production content.

Teaching policy 3 preserves the Tutor role after tools, uses grounding quietly and leaves practical comparisons/experiments with the learner. It distinguishes positive-class sensitivity from the runtime's macro recall, uses available authorized Run values and asks only for indispensable missing values. Source-change labels and conversation isolation remain authoritative. Explicit closed-book assessments and research sharing have separate conditions; no automatic scoring, collection or claim of learning efficacy is introduced. Deterministic context/instruction tests and synthetic bilingual evaluations support review, while actual model answers and research instruments require separate empirical validation.

---

## ADR-0032: Repair Dependency Audits with Targeted Patches and Supported Developer Tooling

### Status

Accepted 2026-10-26. The user explicitly requested correcting failed GitHub CI and authorized autonomous completion while away; earlier commit/push authorization remains applicable.

### Context

The general Python workflow stopped at seven findings in three transitive packages, before its tests. The extension development graph separately reported five findings. The existing pinned developer tools require Node 22 or newer, while CI selected Node 20. Disabling audits or broadly updating unrelated dependencies would weaken or obscure the verification goal.

### Decision

- Lock Brotli 1.2.1, brotlicffi 1.2.1.0 and filelock 4.2.1. Preserve the global seven-day uv cooldown; extend the existing security fast lane only to the two recent Brotli fixes. No new direct Python dependency is added.
- Keep direct extension/runtime tool versions unchanged. Scope MSAL 7.1.0 to Azure Identity and update the existing serializer override to 7.1.3. Review retained parent APIs and exercise actual offline credential/serialization flows because the MSAL override crosses a major boundary.
- Use Node 24 LTS in developer CI while retaining the actual VS Code 1.96.0 host and product engine constraint. Audit the complete npm graph once in the Ubuntu unit job, with low severity as the failure threshold.
- Explicitly deny the unused signing-helper install script. Verify ordinary unsigned VSIX packaging without that binary; do not grant additional install-script execution permissions to remove a warning.
- Retain all Python warnings, exact stream, coverage, audit and native gates. Document the upstream Mocha/glob installer deprecation narrowly, without log filters, audit exclusions or an unrelated major override.
- Run the macOS unit matrix entry on the standard `macos-26-intel` host after two repair runs failed to acquire ARM runners with explicit capacity annotations. Log the OS and assert actual Darwin/x64 execution. Preserve all three operating systems, every test and the full-matrix prerequisite for native Windows checks. This changes actual Mac host coverage from ARM64 to x64; Apple Silicon host acceptance remains deferred, rather than inferred from Intel success.

### Compatibility and consequences

Filelock's changed read/write-lock protocol is distinct from the classic FileLock/SoftFileLock APIs used by the locked datasets and Hugging Face hub consumers. A private optional environment exercises those consumers and actual KAFE local-file wrappers; the baseline still excludes datasets. Brotli and a Brotli-compressed 7z archive receive explicit round-trip checks. The optional CSV builder's resource warning is reproduced with old and new filelock and remains a separately recorded upstream limitation, not a clean-pass claim.

These changes repair current repository locks and CI tooling. They do not change interpreter source, language behavior or published runtime 0.3.0 assets/source/checksums. A patched managed-runtime archive requires a separately versioned release. Local checks do not establish hosted CI success; observe every workflow at the final pushed revision.

### References

- [Brotli security release](https://github.com/google/brotli/releases/tag/v1.2.1), [Filelock 4.2.1](https://github.com/tox-dev/filelock/releases/tag/4.2.1).
- [MSAL advisory](https://github.com/advisories/GHSA-xcx6-jx8p-x3h5), [serializer advisory](https://github.com/yahoo/serialize-javascript/security/advisories/GHSA-m5mm-p8h7-m29v).
- [uv package-specific cooldowns](https://docs.astral.sh/uv/concepts/resolution/#reproducible-resolutions), [Node release support](https://nodejs.org/en/about/previous-releases), [npm install-script policy](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts/).
- [Supported standard macOS runner labels](https://docs.github.com/en/actions/reference/runners/github-hosted-runners), [macOS 26 Intel image](https://github.com/actions/runner-images/blob/main/images/macos/macos-26-Readme.md), [Node 24 platform support](https://github.com/nodejs/node/blob/v24.x/BUILDING.md).


---

## ADR-0033: Unify Tutor Guidance, Preserve Responses and Bound Conversation Ownership

- **Status**: accepted
- **Date**: 2026-10-27
- **Supersedes**: only ADR-0030's stored level/default-level details, and ADR-0031's study-extension teaching-policy-3 detail. All other archive, source-authority, reference and runtime decisions remain in force.

### Context

Learners faced three teaching presets, repeated context routes and complex checkpoint/recovery copy. Semantic response replacement could discard useful model explanations. Persisting full content on every draft/token notification duplicated work, while native source handlers repeated domain invalidation lists. The approved incremental design preserves learner decisions, saved chats and distinct native authorities while reducing those concepts and repeated work.

### Decision

Use one guided baseline (`kafe-guided-4`) with independent Pause/Resume Teaching. Explain concepts directly; invite one focused hypothesis at meaningful choices, accept existing reasoning and provide bounded scaffolding. Brevity/detail requests affect presentation within eligible history only. Retire level UI/commands/messages and hidden presets; add no Remember action, profile, classifier, durable style field or permanent selector.

Preserve actual response text through streaming, completion and structured follow-ups into completed display/history/export. Keep Markdown/protocol/bounds/source validation. A provider's unsupported certification may remain visible; prose never registers host assessment, source permission, action authority or execution proof. Do not replace whole answers with phrase heuristics or add repair-model calls.

Use archive payload v2 with mode-only preferences at the single existing `kafeTutor.conversations.v1` key. Strict original v1 validation precedes transformation of every valid former level to the common baseline, preserving paused state, all record/content/draft/date/selection/history dependencies and bounds. Validate complete v2 before saving. Original storage survives load and failed writes until a normal successful serialized v2 save. V1-only older readers are unsupported afterward. No dual-write, competing backup key or extra crash-atomicity guarantee. Public export stays schema 1; migration cannot recover text absent from old storage.

Keep first chat and saved `.kf` Run guidance short; native masked key input/SecretStorage, native diffs and terminals remain. A configured key is not verified credentials. Confirm choice records adoption only; Prepare change authorizes one proposal for a visible exact target/scope, followed by separate Review, Apply and Run. Failure/cancellation consumes preparation permission. Context omissions reflect immutable submitted-history metadata, not a prediction or automatic resend. Restored content never restores file/action grants. Keep one file disclosure, reachable composer controls and deliberate Stop focus recovery.

Automatic trusted preparation of a missing published runtime remains noncancellable. Report actual ready/unavailable/failure outcomes with explicit retry/details. Runtime retry neither sends the draft nor executes code. Bundled references and otherwise eligible configured chat are independent of Run readiness. Runtime 0.3.0 assets/pins, provider model/endpoints and library behavior remain unchanged.

Use private mutation signatures only for persistence bookkeeping. Share detached deeply frozen event projections and retain independently detached explicit snapshots. Capture/normalize at debounce and explicit flush/list/export/switch/disposal boundaries; keep full store validation, mutation-time recency and safe titles. The measured optimization is recorded at `86b78ff`, not as final-candidate native latency.

Centralize domain source/authorization revocation and dependency enumeration in `SessionCoordinator`; native observation/authorization/revisions remain in the adapter. Use the same native-active observation for pure ordinary relevance and source-change fan-out. Broad retained metadata does not admit historical sources or broaden ordinary edit invalidation. Enumerate retained current-generation Run targets from the existing session registry. Preserve focus/settled-proposal distinctions, generation/disposal guards around reentrant callbacks, and post-await rechecks.

Align the study record to six independent pre/post short-answer items, 0–2 each, maximum 12, while retaining eight conceptual teaching topics. Adapted ICAP observation and SUS administration are human descriptive/exploratory procedures, not product scoring. No assessment items/answers, proctoring, automatic scoring or research upload is introduced; consent and independent administration remain facilitator responsibilities.

### Rationale

One teaching contract reduces unnecessary configuration without inferring expertise. Text preservation favors useful explanations over destructive semantic guesses, with host authority maintained independently. Compatible strict archive reading avoids losing legitimate saved chats. Measured boundary work reduces repeated normalization while preserving immutable ownership and fresh authorization.

### Consequences

- Provider compliance and educational effectiveness still require real-provider and human research evidence. No click, successful Run, deterministic test or source identity establishes mastery.
- Preserve provider history eight whole eligible pairs / 32 KiB; snapshots 64 KiB each; Run output 1 MiB; archive 200 chats / 10,000 entries / 5,000 pairs per chat / 4 MiB content / 16 MiB total, and separate 16 MiB export.
- Full aggregate at `7169368`: 1,007 pass, one existing Windows symlink skip. Reentrant Run fix `781b46f`: 348 covering passes. Final aggregate/layout/package remain integration-owned; native 1.96.0 cache absence, physical IME/speech, publication, provider review and study outcomes are separate pending gates.
- Existing docs deployment permits an integration branch contrary to root main-only policy. This pre-existing drift is separately recorded, unchanged and undispatched; documentation validation does not resolve it.

### Alternatives Considered

- Keep hidden presets after removing the picker: rejected because the unified contract includes behavior.
- Durable style memory or automatic intent classification: explicitly rejected by the user.
- Heuristic whole-answer replacement or extra repair request: rejected in favor of retained text and separate authority.
- Fork/dual-write archives or relax legacy validation: rejected because this risks ambiguity, corruption or lost conversations.
- Generic event bus, duplicate Run registry or cached authorization: rejected because existing owners and fresh checks suffice.

## ADR-0034: Install a Light Managed Runtime with Optional Data Packs

- **Status**: accepted
- **Date**: 2026-10-30
- **Supersedes**: the `extension` extra and "auto-install on first use" details of the managed runtime and KafeKaggle. ADR-0031 contracts and all other runtime decisions remain in force.

### Context

The managed runtime installed the `extension` extra (`datasets`, `kagglehub`, Pillow, `py7zr`, `multiprocess`) during first setup: about 250 MB across 50 packages on darwin-arm64, with `pyarrow` alone at 129 MB. The KAFE core needs only `antlr4-python3-runtime`, and only programs importing `huggingface` or `kaggle` use those packages. KafeKaggle also imported `kagglehub` at module level, adding about 0.44 s to every program (0.65 s total for Fibonacci), and it fell back to `pip install`, which uv environments lack and project policy forbids. Separately, 2.3.2 refused setup whenever the GitHub release was unpublished, despite bundling the runtime, and rejected uv's `bin/python` symlink on macOS/Linux.

### Decision

First setup installs only the core with `uv sync --locked --no-dev --inexact`. Split the extras into `huggingface` (`datasets`, `multiprocess<0.70.18`) and `kaggle` (`kagglehub`, Pillow, `py7zr`). Learners install packs only through explicit commands, **KAFE: Install Hugging Face Pack** and **KAFE: Install Kaggle Pack**: no prompt before Run and no automatic install (user decision). The commands run `uv sync --locked --no-dev --inexact --extra <pack>` against the ready runtime. They require a trusted workspace and a ready runtime, refuse while setup is running, and share one in-flight install per pack.

`--inexact` is mandatory: plain `uv sync` removes other extras, while `uv run --locked` keeps them. A failed pack leaves the ready core intact. A full runtime reinstall recreates the environment, so packs are reinstalled from the uv cache.

KafeKaggle and KafeHF import their packages lazily and never install anything. A missing pack raises a deterministic message naming both the VS Code command and the uv command. Runtime 0.5.0 (`8de7388b`) carries these extras; extension 2.4.0 pins it. Host setup is available when either the bundled archive or the published release exists. The managed `bin/python` symlink is accepted only when it resolves to a regular file inside the runtime storage root.

### Rationale

Most learner programs never use Hugging Face or Kaggle, so their dependencies should not delay first setup or every Run. Explicit commands keep large downloads visible and consented without adding a pre-Run prompt. Lazy imports are the smallest change that removes the startup cost. Removing pip restores the uv-only dependency policy.

### Consequences

- First setup downloads only Python, uv and the core; Hugging Face and Kaggle programs need one extra command.
- Run startup drops from about 0.65 s to about 0.15 s on darwin-arm64.
- Baseline fixtures cover both missing packs; `kagglehub` and `datasets` stay out of the dev group.
- Windows/Linux real installs, extension-host tests, a published GitHub runtime release and Marketplace publication remain pending gates.

### Alternatives Considered

- Prompt or install automatically before Run: rejected by the user in favor of manual commands.
- Fully offline platform-specific VSIX with bundled Python and wheels: deferred; compatible with this design.
- Replace `datasets` with direct Hub HTTP calls: rejected; it loses formats and adds a client to maintain.
