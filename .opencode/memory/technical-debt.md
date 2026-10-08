# Technical Debt

Template. Each item records the debt, its cost, its risk, and the proposed resolution. Keep items short; remove them once resolved.

## Current Debt

<!-- Add rows as debt is discovered; delete rows once resolved. -->

| Debt Item | Cost | Risk | Proposed Resolution |
|-----------|------|------|---------------------|
| Benchmarks exist (`.opencode/benchmarks/`, index + records) but are not run in CI | Performance regressions go unnoticed | Regression detection depends on manual `/benchmark` runs | Wire benchmark scripts into CI (nightly) as a workflow step |
| Exit-code quirk in `src/Kafe.py` (non-`.error.kf` errors → stdout + exit 0) | Confusing error semantics for users | Silent failures in user programs | Intentional behavior — tests depend on it; only change via an ADR with test migration |
| Quality gates missing from repo: lint (ruff), typing (pyright/mypy), dependency audit, codespell, suppression-comment check, 80% subprocess coverage | Quality regressions caught only by review and the test suite | Defects reach CI undetected | Add configs + CI steps incrementally (flagged by Reviewer DoD 2026-10-08) |
| No `uv.lock` and `uv` not installed on the dev machine → `uv run --locked` gate (verifications.md) not runnable locally; Reviewer subagent also blocked by permissions (bash denies all but `uv run *`) | Reproducibility/DoD test gates depend on the Lead's direct `python -m pytest` runs | Env drift between CI and local; subagents cannot self-verify | Install `uv` + generate lock, or extend permissions to allow `python -m pytest` for reviewer roles |
