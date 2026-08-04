---
name: release-checklist
description: Use before a KAFE release or tag. Verifies the full test suite, parser regeneration, documentation build, history, benchmarks, and Definition of Done.
---

Purpose: verify KAFE is ready for a release and record the release decision.

## Agent Ownership

| Step | Agent | Action |
|------|-------|--------|
| 1 | Builder | Regenerate parser, verify no generated files staged |
| 2 | Tester | Run full test suite `pytest tests/` |
| 3 | Builder | Verify documentation `mkdocs build` |
| 4-5 | Historian / Architect | Confirm history records and ADRs exist |
| 6 | Tester | Confirm benchmarks are current |
| 7 | Reviewer | Run `/dod` for all completed work |
| 8 | Lead | Create release tag/notes |
| Validation | Historian | Create history record for release |

The Lead orchestrates this checklist, delegating each step to the responsible agent.

## Inputs

- Release version/tag being prepared.

## Workflow

1. Regenerate the parser (`cd src && make antlr`) and confirm no generated files are staged.
2. Run the full suite: `pytest tests/`.
3. Verify documentation: `mkdocs build` (site in `docs/`, Spanish).
4. Confirm `.opencode/history/` has records for all significant changes since the last release.
5. Confirm ADR records exist for all significant decisions.
6. Confirm benchmarks in `.opencode/benchmarks/benchmark-index.md` are current.
7. Run the Definition of Done check (`/dod`) for all completed work.
8. Create the release tag/notes summarizing changes.

## Outputs

- Verified release readiness report.
- Release tag/notes.

## Required Documentation Updates

- History record for the release.
- `.opencode/memory/current-state.md` (milestone status).

## Validation Requirements

- Full test suite passes.
- `mkdocs build` succeeds.
- No generated parser files or `*.svg` staged (except `tests/**/grafico_*.svg`).
- Definition of Done verified for all shipped work.
