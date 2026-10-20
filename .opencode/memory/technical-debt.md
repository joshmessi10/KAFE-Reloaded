# Technical Debt

Template. Each item records the debt, its cost, its risk, and the proposed resolution. Keep items short; remove them once resolved.

## Current Debt

<!-- Add rows as debt is discovered; delete rows once resolved. -->

| Debt Item | Cost | Risk | Proposed Resolution |
|-----------|------|------|---------------------|
| No automated ML/DL benchmarks or performance tracking yet | Cannot measure runtime/memory regressions | Performance regressions go unnoticed | Establish `.opencode/benchmarks/` (this milestone) and wire benchmarks into CI |
| Exit-code quirk in `src/Kafe.py` (non-`.error.kf` errors → stdout + exit 0) | Confusing error semantics for users | Silent failures in user programs | Intentional behavior — tests depend on it; only change via an ADR with test migration |
