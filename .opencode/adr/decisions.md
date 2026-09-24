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
