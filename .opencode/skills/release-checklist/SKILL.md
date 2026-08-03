---
name: release-checklist
description: Use before a KAFE release or tag. Verifies the full test suite, parser regeneration, documentation build, history, benchmarks, and Definition of Done.
---

Purpose: verify KAFE is ready for a release and record the release decision.

## Inputs

- Release version/tag being prepared.

## Workflow

1. Regenerate the parser (`cd src && make antlr`) and confirm no generated files are staged.
2. Run the full suite: `pytest tests/`.
3. Verify documentation: `mkdocs build` (site in `docs/`, Spanish).
4. Confirm `.opencode/history/` has records for all significant changes since the last release.
5. Confirm RFC/ADR records exist for all significant decisions.
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
