# KafeGESHA Library (Deep Learning)

## Overview

Deep learning and neural network components, implemented from scratch inside KAFE.

## Structure

- `src/lib/KafeGESHA/funciones.py` — public functions (the `geshaDeep` API).
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
