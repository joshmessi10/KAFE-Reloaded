# KafeGESHA Library (Deep Learning)

## Overview

Deep learning and neural network components, implemented from scratch inside KAFE.

## Structure

Flat layout (post "Clean Gesha Architecture" refactor, ADR-0008). There is no
`GeshaDeep.py` / `Gesha.py` / `Dense.py` / `LossFunction.py` / `Optimizer.py` /
`ActivationFunction.py` anymore:

- `src/lib/KafeGESHA/__init__.py` — public exports (`Model as Gesha`, `Model`, `Sequential`, `Functional`, `Dense`, `Dropout`, `Flatten`, `Input`, `Add`, `ActivationLayer` + `ReLULayer`/`SigmoidLayer`/`TanhLayer`/`SoftmaxLayer`/`LinearLayer` aliases).
- `src/lib/KafeGESHA/funciones.py` — public functions (the `geshaDeep` API).
- `src/lib/KafeGESHA/core.py` — `Tensor` (shape validation over KafeMATH tensors), `Node`.
- `src/lib/KafeGESHA/layers.py` — `Layer` (base), `Input`, `Dense`, `Dropout`, `Flatten`, `Add`, `ActivationLayer`.
- `src/lib/KafeGESHA/models.py` — `Model` (base contract), `Sequential` (linear graph), `Functional` (DAG graph).
- `src/lib/KafeGESHA/activations.py` — `ReLU`, `Sigmoide`, `Tanh`, `Softmax`, `Identidad`, `Escalonada`, `ActivationFunctionLoader`.
- `src/lib/KafeGESHA/losses.py` — loss functions.
- `src/lib/KafeGESHA/optimizers.py` — optimizers.

## Type GESHA

`GESHA` is a first-class type of the language. It is resolved in
`src/TypeUtils.py` → `obtener_tipo_dato()`:

1. `type(dato) is list` → `List[...]`
2. `isinstance(dato, (Gesha, Layer, Node, Input))` → **GESHA** (checked FIRST)
3. `callable(dato)` → `FUNC`
4. DataFrame / GroupBy → PARDOS
5. `BaseMachine` → MACHINE
6. `None` → VOID

Step 2 must stay **before** step 3: `Layer.__call__ = connect` (Functional API,
`layers.py`) makes every layer callable, so a `callable` check first would
classify any GESHA layer/model as `FUNC` and raise
`TypeError: Expected GESHA, obtained FUNC` on declarations like
`GESHA layer = geshaDeep.create_dense(1, "sigmoid", [2]);`. Plain KAFE functions
are not `Layer`/`Model` instances, so they still resolve to `FUNC`
(48 tests in `test_bucles.py` + `test_funciones.py` cover this). See ADR-0008.

## Functional API

`Layer.__call__ = connect` — calling a layer with inbound nodes wires the graph
(Functional/DAG model). This is what makes layers callable in Python terms; it
must not leak into the type classifier.

## Public Model contract (ADR-0008)

- `predict(X)` — single sample semantics: if `X[0]` is scalar (a vector = one
  sample) returns `forward(X)` (the output vector); if `X[0]` is a list (matrix
  = batch) returns `[forward(x) for x in X]`.
- `predict_proba(X)` — alias of `predict(X)`.
- `predict_label(X)` — `0/1` by threshold `0.5` for single-unit output, `argmax`
  for multi-unit; returns `INT` for a single sample and `List[INT]` for a batch
  (both pass KAFE type-checking).
- `fit(X, Y, epochs, batch_size, val_data, regularization_lambda)` — prints
  `Epoch {n}/{epochs} — Loss {pct:.2f}%` (em-dash U+2014, capital "Loss",
  percentage) with `pct = avg_loss * 100.0`. Loss gradients are per unit (scalar
  wrapped in a list) and loss shapes are flat per sample (`y=[0]`, `y_pred=[σ]`),
  not nested.

## Deterministic fixtures

Gate fixtures (`tests/KafeGESHA/PerceptronSimple/and_gate.kf`, `or_gate.kf`) pin
the RNG with `seed = 42` in `geshaDeep.create_dense(...)` so `.expec` files are
byte-reproducible. `.expec` files are regenerated from real interpreter stdout
(1000 epochs + results, ~1016 lines).

## Rules

- New DL components require: documentation, tests, examples, and benchmarks.
- Impact Analysis is mandatory before adding DL components.
- Do not import external DL frameworks (no TensorFlow/PyTorch layer implementations) — implement and teach inside KAFE.
- Benchmark generation is mandatory for DL components (see `.opencode/knowledge/engineering.md` — Benchmark Process).
- KafeGESHA falls under the KafeMACHINE development priorities when not otherwise specified (see `.opencode/knowledge/ml-library.md` — KafeMACHINE Priorities).

## Tests

- Fixtures under `tests/KafeGESHA/`, wired in `tests/test_KafeGESHA.py`.
- Run the suite as `pytest tests/ -q` (from the repo root). A bare `pytest` at the
  root aborts collection on the legacy `test_output.txt` / `test_results.txt`
  files (UTF-16), see `.opencode/memory/known-issues.md`.
