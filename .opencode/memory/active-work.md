# Active Work

## Current Feature

Fix: Tipo GESHA + contrato público KafeGESHA tras refactor (ADR-0008)

## Status

completed — Implementation, Validation, Documentation, History, Review (APPROVED) and DoD all done. Session closure (`/close`, `current.md` reset) is handled by the engineering lead.

## Current Step

Historian: persistido el veredicto del Reviewer, actualizado `knowledge/dl-library.md`, `history/2026/2026-09.md`, `current-state.md`, `known-issues.md`.

## Next Step

Engineering Lead: cerrar la sesión (`/close`) y fijar el siguiente work item del roadmap — KafeGESHA Conv2D (usar `/open-work` + `/impact` + la skill `add-dl-layer`).

## Summary

Regresión `TypeError: Expected GESHA, obtained FUNC` causada por `Layer.__call__ = connect` combinado con `callable(dato)` chequeado antes del `isinstance` GESHA en `TypeUtils.obtener_tipo_dato()`. Se restauró el contrato público pre-refactor de KafeGESHA (`predict` sample único, `predict_proba`, `predict_label`, `fit` con em-dash) y los fixtures de compuertas quedaron deterministas con seed 42. Resultado: `pytest tests/ -q` — 464 passed, 1 skipped.
