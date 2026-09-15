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
- Session memory files and bitácora must be updated on close

---

## ADR-0002: Roles como Subagentes OpenCode (SUPERSEDED)

- **Status**: superseded by ADR-0005
- **Date**: 2026-08-03
- **Superseded**: 2026-08-04

### Context (Original)

AGENTS.md define cinco roles de ingeniería que originalmente fueron diferidos como subagentes porque el volumen de trabajo no justificaba la sobrecarga de orquestación.

### Decision (Original)

Mantener los cinco roles como responsabilidades documentadas y diferir su implementación.

### Decision (Actualizada — 2026-08-04)

Los cinco roles ahora están implementados como subagentes OpenCode en `.opencode/agents/`. Reemplazado por ADR-0005.

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

## ADR-0004: Session Lifecycle (Bitácora + `/close`)

- **Status**: accepted
- **Date**: 2026-08-03

### Context

Without an end-of-session lifecycle, `current.md` accumulated state across sessions and there was no historical record of sessions.

### Decision

Implement a session lifecycle with two mechanisms:
- Append-only bitácora `.opencode/progress/session-log.md`
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

AGENTS.md define cinco roles de ingeniería que originalmente fueron diferidos como subagentes (ADR-0002). El sistema de ingeniería ha madurado y el volumen de trabajo justifica la implementación.

### Decision

Implementar los cinco roles como subagentes OpenCode en `.opencode/agents/`:

| Archivo | Modo | Responsabilidad |
|---------|------|-----------------|
| `engineering-lead.md` | primary | Orquestador |
| `architect.md` | subagent | Diseño + ADR |
| `builder.md` | subagent | Implementación + tests |
| `reviewer.md` | subagent | Quality gates + DoD |
| `historian.md` | subagent | History/knowledge/memory |
| `tester.md` | subagent | Validation + benchmarks |

Configuración en `opencode.json`:
- `default_agent: "engineering-lead"`
- `subagent_depth: 2`
- Permisos granulares por agente

### Rationale

- Separación de responsabilidades
- Orquestación paralela
- Permisos granulares
- Enforcement del protocolo anti-telephone

### Consequences

- 7 skills actualizados con Agent Ownership
- ADR-0002 superseded
- Lead orquesta via Task tool
- Subagentes siguen protocolo anti-telephone

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
