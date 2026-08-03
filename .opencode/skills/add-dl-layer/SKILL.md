---
name: add-dl-layer
description: Use when adding a new deep learning layer or component to KafeGESHA in KAFE. Runs impact analysis, implements the layer from scratch, and adds tests, documentation, and benchmarks.
---

Purpose: add a new DL layer or component to KafeGESHA, implemented from scratch inside KAFE, fully validated and documented.

## Inputs

- Layer/component name and reference (paper/notes).
- Expected KAFE API (factory function name and parameters).
- Forward/backward behavior to implement.

## Workflow

1. Run Impact Analysis first (`/impact`) — mandatory before adding DL components.
2. Read `.opencode/knowledge/dl-library.md` and `.opencode/knowledge/architecture.md` for conventions.
3. Implement the layer/component (forward and backward if training is involved) in `src/lib/KafeGESHA/`.
4. Add the factory/function to `src/lib/KafeGESHA/funciones.py`.
5. Add fixtures under `tests/KafeGESHA/` and wire a parameterized test in `tests/test_KafeGESHA.py`.
6. Add an example `.kf` program under `docs/` if applicable.
7. Tester runs `/benchmark` and registers the record in `.opencode/benchmarks/benchmark-index.md`.
8. Reviewer runs `/dod` before the task is declared complete.

## Outputs

- New layer/component module and factory function.
- Passing fixture tests.
- Benchmark record.

## Required Documentation Updates

- `docs/` (bibliotecas).
- `.opencode/knowledge/dl-library.md` (public API).
- Concept record in `.opencode/knowledge/concepts/`.

## Validation Requirements

- `pytest tests/test_KafeGESHA.py` passes.
- Full suite `pytest tests/` passes.
- Benchmark registered in `.opencode/benchmarks/benchmark-index.md`.
- History record for the addition.
