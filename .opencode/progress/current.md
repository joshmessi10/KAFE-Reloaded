# Current Work

## Unify Gesha into a Single Public API (2026-10-19)

Feature: Gesha convergence and class-hierarchy unification. Canonical import key gesha, backed by functions_v2.py / models_v2.py / core_v2.py. geshaDeep and geshaV2 stay registered as documentation-only deprecated aliases (no runtime warnings: the fixture harness treats warnings as errors).

Status: complete. Implementation, hierarchy unification, full fixture migration, docs and knowledge migration, and the performance fix are all landed and verified.

Current step: none (feature closed for this session).

Next step: follow-ups recorded in the backlog: (a) a Functional-API fixture, (b) metrics usable on both machine and gesha outputs, (c) confirm the deprecation-window removal date for the geshaDeep/geshaV2 aliases.

Blockers: none.

Related ADRs: ADR-0013 (superseded), ADR-0015 (GESHA type for mixed layer lists), ADR-0016 (single public API), ADR-0017 (single runtime class graph).

## Session evidence

- Interpreter registers gesha, geshaDeep and geshaV2 to the unified module (src/InterpreterVisitor.py).
- models_v2 ports parity: unsupervised Soft K-Means fit branch, compile()/set_lr() validation; GeshaPlaceholder sentinel fixes the GESHA x; abstract-instantiation bug.
- Performance fix: short-circuit type checks in global_utils.py plus unwrapped NUMK fast path -> XOR 84.5s to 2.54s; full suite 721 passed, 4 skipped in 209.88s.
- Tests: pytest tests/ -> 721 passed, 4 skipped. ruff, basedpyright (0 errors, 0 warnings) and codespell green.
- optimized fixture tests/KafeGESHA/optimizers/optimizer_comparison.kf rewritten into a real SGD/Adam/RMSprop comparison; stale test_fit_rejects_invalid_batches_* reconciled with ADR-0016.
