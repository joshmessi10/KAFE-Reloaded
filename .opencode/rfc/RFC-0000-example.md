# RFC: Example — Support Vector Machines in KafeMACHINE

> **Note**: This file is an example only, not an active proposal. Copy `.opencode/rfc/template.md` for real proposals and number sequentially (`RFC-0001`, `RFC-0002`, ...).

- **Status**: example
- **Date**: YYYY-MM-DD
- **Author**: <your name / handle>

## Problem Statement

KafeMACHINE currently lacks a Support Vector Machine model, so classification use cases beyond linear models and KNN cannot be taught inside KAFE.

## Motivation

SVM is a core classification algorithm in ML curricula. Implementing it from scratch teaches margin, kernels, and the dual formulation consistent with the educational mission.

## Proposed Solution

Add `src/lib/KafeMACHINE/SVM.py` exposing a scikit-learn-style class (`fit()`, `predict()`, `score()`) backed by a simple SMO solver, registered as `machine.svm(kernel, C)`. Import the module in `EvalVisitorPrimitivo.py` and register in `self.libraries`.

## Alternatives Considered

- Wrapping sklearn's SVC: rejected — external algorithm implementations are prohibited (Dependency Policy).
- SGD-based linear SVM only: rejected — does not demonstrate kernels.

## Impact Analysis

Affected modules: `src/lib/KafeMACHINE/` (new `SVM.py`, `funciones.py`), `tests/KafeMACHINE/` (new fixtures), docs. Risk: numerical stability of the solver; mitigated by existing KafeNUMK primitives and fixture tests. See `.opencode/templates/impact-analysis.md`.

## Risks

- Long training times on non-vectorized workloads (mitigation: benchmark and document limits).
- Kernel implementation complexity (mitigation: start with linear and RBF only).

## Migration Strategy

Additive only: no existing KAFE programs or tests change; new fixtures under `tests/KafeMACHINE/` and a new benchmark record.

## Success Criteria

- New fixtures pass (`pytest tests/test_KafeMACHINE.py`).
- Benchmark record added to `.opencode/benchmarks/benchmark-index.md`.
- Documentation updated in `docs/` and `.opencode/knowledge/concepts/`.
