# KafeGESHA Library (Deep Learning)

## Overview

Deep learning and neural network components, implemented from scratch inside KAFE.

## Structure

- `src/lib/KafeGESHA/functions.py` — public functions (the `geshaDeep` API).
- `src/lib/KafeGESHA/functions_v2.py` — tensor-based public functions (the `geshaV2` API); it uses `models_v2.py`, `core_v2.py`, and the grouped layer, activation, loss, and optimizer packages. Existing `geshaDeep` programs retain their original implementation. See ADR-0013.
- `GeshaDeep.py`, `Gesha.py` — model composition and the deep-learning model object.
- `Dense.py` — dense layer.
- `ActivationFunction.py` + `ActivationFunctionLoader.py` — activation functions.
- `LossFunction.py` — loss functions.
- `Optimizer.py` — optimizers.
- `utils.py` — shared helpers.

## Rules

- New DL components require: documentation, tests, examples, and benchmarks.
- Impact Analysis is mandatory before adding DL components.
- Do not import external DL frameworks (no TensorFlow/PyTorch layer implementations) — implement and teach inside KAFE.
- Benchmark generation is mandatory for DL components (see `.opencode/knowledge/engineering.md` — Benchmark Process).
- KafeGESHA falls under the KafeMACHINE development priorities when not otherwise specified (see `.opencode/knowledge/ml-library.md` — KafeMACHINE Priorities).

## Tests

- Fixtures under `tests/KafeGESHA/`, wired in `tests/test_KafeGESHA.py`.
