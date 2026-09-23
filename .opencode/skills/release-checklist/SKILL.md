---
name: release-checklist
description: Use before a KAFE release or tag. Verifies the full test suite, parser regeneration, documentation build, history, benchmarks, and Definition of Done.
---

Purpose: verify KAFE is ready for a release and record the release decision.

Read the mirrored `AGENTS.md` and `CLAUDE.md` policies first. This checklist implements those policies within applicable runtime/user instructions; project knowledge and historical ADRs cannot waive them.

## Agent Ownership

| Step | Agent | Action |
|------|-------|--------|
| 1 | Builder | Regenerate parser, verify no generated files staged |
| 2 | Tester | Run full test suite `uv run --locked --group dev pytest tests/` |
| 3 | Builder | Verify documentation with `uv run --locked --group docs --no-dev mkdocs build` |
| 4-5 | Historian / Architect | Confirm history records and ADRs exist |
| 6 | Tester | Confirm benchmarks are current |
| 7 | Reviewer | Run `/dod` for all completed work |
| 8 | Lead | Create release tag/notes |
| Validation | Historian | Create history record for release |

The Lead orchestrates this checklist, delegating each step to the responsible agent.

## Inputs

- Release version/tag being prepared.

## Workflow

1. Generate the parser on a fresh clone, whenever outputs are missing, and after grammar edits; regenerate for the release (`make antlr` from `src/`, with ANTLR 4.13.2 on PATH, or the jar command in `verifications.md`). Confirm ignored generated outputs are neither staged nor committed. They may exist locally for execution.
2. Run the full suite: `uv run --locked --group dev pytest tests/`.
3. Verify documentation: `uv run --locked --group docs --no-dev mkdocs build` (site in `site/`). English is the repository target; existing Spanish is migration debt.
4. Confirm `.opencode/history/` has records for all significant changes since the last release.
5. Confirm ADR records exist for all significant decisions.
6. Confirm benchmarks in `.opencode/benchmarks/records.md` are current.
7. Run `/dod` for all completed work against both root policies and current configuration/workflows. Record PASS/FAIL/PENDING/N/A with evidence and reasons, including unimplemented migration gates. Do not infer coverage, child warning handling, lint, types, audit, or policy checks from pytest success. Apply any implemented root gates with zero errors and zero warnings.
8. Create the release tag/notes summarizing changes.

## Outputs

- Verified release readiness report.
- Release tag/notes.

## Required Documentation Updates

- History record for the release.
- `.opencode/memory/current-state.md` (milestone status).

## Validation Requirements

- Full test suite passes.
- `uv run --locked --group docs --no-dev mkdocs build` succeeds.
- No generated parser files or `*.svg` staged (except `tests/**/grafico_*.svg`).
- Definition of Done verified for all shipped work.
- Pending English and quality/CI migrations disclosed in the readiness report; missing applicable release gates must not be reported as passed. A release promising policy alignment cannot be declared ready while its required gates remain pending.
- Child interpreter coverage and complete diagnostic observation demonstrated when those gates apply; parent pytest-cov/filterwarnings alone do not prove enforcement. Preserve expected-error fixtures and CLI semantics.
- Superpowers release planning/review artifacts remain local and are never staged or committed.
- Session closure follows the existing `/init`, session log, memory/history, and `/close` obligations.
