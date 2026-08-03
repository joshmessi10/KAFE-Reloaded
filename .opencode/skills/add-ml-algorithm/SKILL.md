---
name: add-ml-algorithm
description: Use when adding a new machine learning algorithm to KafeMACHINE in KAFE. Runs impact analysis, implements the model from scratch, and adds fixtures, documentation, and benchmarks.
---

Purpose: add a new ML algorithm to KafeMACHINE, implemented from scratch inside KAFE, fully validated and documented.

## Inputs

- Algorithm name and reference (paper/notes).
- Expected KAFE API (factory function name and parameters).
- Roadmap/backlog item it addresses.

## Workflow

1. Run Impact Analysis first (`/impact`) — mandatory before adding ML algorithms.
2. Read `.opencode/knowledge/ml-library.md` and `.opencode/knowledge/architecture.md` for conventions.
3. Implement the model as a Python class with a scikit-learn-style API (`fit()`, `predict()`, `score()`) in `src/lib/KafeMACHINE/`.
4. Add the factory function to `src/lib/KafeMACHINE/funciones.py`.
5. Add fixtures under `tests/KafeMACHINE/<category>/` and wire a parameterized test in `tests/test_KafeMACHINE.py`.
6. Add an example `.kf` program under `docs/` if applicable.
7. Tester runs `/benchmark` and registers the record in `.opencode/benchmarks/benchmark-index.md`.
8. Reviewer runs `/dod` before the task is declared complete.

## Outputs

- New model module and factory function.
- Passing fixture tests.
- Benchmark record.

## Required Documentation Updates

- `docs/` (bibliotecas).
- `.opencode/knowledge/ml-library.md` (public API).
- Concept record in `.opencode/knowledge/concepts/`.

## Validation Requirements

- `pytest tests/test_KafeMACHINE.py` passes.
- Full suite `pytest tests/` passes.
- Benchmark registered in `.opencode/benchmarks/benchmark-index.md`.
- History record for the addition.
