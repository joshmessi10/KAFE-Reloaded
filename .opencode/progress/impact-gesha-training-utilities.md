# Impact Analysis — GESHA training utilities

## Scope

Add ten initializers, L1/L2/L1L2 regularizers, EarlyStopping and ModelCheckpoint while preserving the existing `Gesha`, layer and `fit` APIs.

## Affected modules

- `KafeNUMK`: Gaussian N-dimensional creation.
- `KafeGESHA`: parameter metadata, Dense/Conv2D construction, model training lifecycle and weight persistence.
- `TypeUtils` and `KafeGESHA.funciones`: expose utility objects as the existing `GESHA` language type.

## Risks and controls

- Initialization compatibility: Dense and Conv2D retain their historical default ranges; fan-based strategies require explicit selection.
- Callback termination: callbacks execute only at epoch boundaries.
- Serialization mismatch: parameter count and shapes are validated before loading.
- Regularization duplication: object regularizers are independent from the legacy scalar argument, which remains compatible.

## Plan and verification

Implement isolated category packages, integrate through optional arguments, add unit/KAFE validation, run focused and full suites, record five benchmark scenarios, and update knowledge, ADR, history and public docs.
