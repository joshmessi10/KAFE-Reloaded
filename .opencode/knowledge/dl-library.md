# KafeGESHA Library (Deep Learning)

## Overview

Deep learning and neural network components, implemented from scratch inside KAFE.

## Structure

- `src/lib/KafeGESHA/functions_v2.py` — public functions behind the `gesha` import key (see ADR-0016); it uses `models_v2.py`, `core_v2.py`, and the grouped layer, activation, loss, optimizer, initializer, regularizer, and callback packages.
- `src/lib/KafeGESHA/functions.py` — legacy `geshaDeep` implementation. Kept only for reference until its retirement; nothing imports it anymore (the `geshaDeep`/`geshaV2` registry keys resolve to `functions_v2.py`). See ADR-0013 and ADR-0016.
- `models_v2.py`, `core_v2.py` — the redesigned `Model`/`Sequential`/`Functional` classes and the `Parameter`/`Node` graph primitives.
- `layers/` — dense, convolutional, pooling, spatial, recurrent, merge, normalization, and regularization layers.
- `activations/`, `losses/`, `optimizers/` — activation functions, loss functions, and optimizers.
- `initializers/`, `regularizers/`, `callbacks/`, `training/` — weight initializers, regularizers, training callbacks, and the training loop helpers.

## Rules

- New DL components require: documentation, tests, examples, and benchmarks.
- Impact Analysis is mandatory before adding DL components.
- Do not import external DL frameworks (no TensorFlow/PyTorch layer implementations) — implement and teach inside KAFE.
- Benchmark generation is mandatory for DL components (see `.opencode/knowledge/engineering.md` — Benchmark Process).
- KafeGESHA falls under the KafeMACHINE development priorities when not otherwise specified (see `.opencode/knowledge/ml-library.md` — KafeMACHINE Priorities).

## Tests

- Fixtures under `tests/KafeGESHA/`, wired in `tests/test_KafeGESHA.py`.

## Functional graph gradients

Functional.backward accepts one gradient per output for graphs with multiple output heads. The current Model.fit training loop supports a single output and loss.
