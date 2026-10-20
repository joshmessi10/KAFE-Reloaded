# Definition of Done Checklist

Verify each item before declaring a task complete (see `AGENTS.md`, `CLAUDE.md`, and `.opencode/knowledge/engineering.md`). The **Reviewer** role runs `/dod` against this checklist. Root policies govern these project criteria within applicable runtime/user instructions.

For every item, add **PASS**, **FAIL**, **PENDING**, or **N/A** and evidence or a reason. A checked box means PASS only. Unimplemented migration gates remain PENDING repository debt, even when outside the current task; never silently pass them or use N/A to hide a missing gate. Missing evidence for an applicable task acceptance criterion prevents completion.

## Required (All Tasks)

- [ ] Implementation exists
- [ ] Validation passed
- [ ] Tests passed for applicable code changes (focused checks and full `uv run --locked --group dev pytest tests/` suite); approved documentation-only scope records application tests N/A with its reason and document-check evidence
- [ ] Documentation updated (`docs/` + `.opencode/knowledge/`)
- [ ] History updated (`.opencode/history/`)

## Repository Policy and Gate Evidence

- [ ] `AGENTS.md` and `CLAUDE.md` substantive rules match; applicable root policies were reviewed
- [ ] Approved scope, Superpowers lifecycle, and local-only artifact rules followed; no local specs/plans/reviews staged or committed
- [ ] English and dependency rules checked, with remaining repository migration debt disclosed
- [ ] No project-authored `# pyright:` or `# noqa:` suppression comments introduced
- [ ] Ignored generated ANTLR outputs are not staged or committed; fresh-clone/grammar generation guidance is accurate
- [ ] Actual configuration and `.github/workflows/tests.yml`, `docs.yml`, and `main.yml` inspected for relevant gate definitions
- [ ] Applicable implemented gates executed with zero errors and zero warnings, with results recorded

## Pending Migration Gates

Record status and evidence for each; these gates are pending until the coordinated migration implements them. If the current task promises one of them, its completion requires demonstrated enforcement.

- [ ] uv/pyproject/lock migration covers runtime, development, docs, Nix's role, optional integrations, and CI
- [ ] Ruff, basedpyright, codespell, and dependency audit gates implemented and passed
- [ ] Explicit CI suppression-comment policy check implemented and passed
- [ ] Minimum 80% owned-source coverage, including child interpreter coverage, demonstrated; generated ANTLR exclusions documented
- [ ] Parent and child warning/diagnostic handling demonstrated; complete child stdout/stderr observed while preserving expected-error fixtures and CLI semantics
- [ ] CI evidence matches the applicable changed revision when CI execution is part of the task

## When Applicable (ML/DL Components)

- [ ] ADR exists (if architecture/API changed)
- [ ] Benchmark exists with **5 test scenarios** and real measurements
- [ ] Concept record exists and is **enriched**:
  - [ ] Mathematical foundation (formulas, complexity)
  - [ ] Step-by-step algorithm
  - [ ] Advantages (3+) and limitations (2+)
  - [ ] When to use / when NOT to use
  - [ ] Relationship with KAFE
  - [ ] References (papers, books)
- [ ] Examples exist (`.kf` files under `docs/examples/`)
- [ ] **Context saving verified** — ALL of these must exist:
  - [ ] `.opencode/knowledge/concepts/<name>.md`
  - [ ] `.opencode/history/YYYY/YYYY-MM.md`
  - [ ] `tests/KafeMACHINE/<category>/` (7+ fixtures: 5 valid + 2 error)
  - [ ] `.opencode/benchmarks/records.md` (5 scenarios)
  - [ ] `docs/libraries/machine.md` updated
  - [ ] `.opencode/progress/roadmap.md` updated

## When Applicable (Session Closure)

- [ ] `/init` green, including the full suite and progress consistency
- [ ] `/dod` completed for finished work, or its non-applicability recorded
- [ ] Memory updated, session-log entry appended, and significant history recorded
- [ ] `/close` procedure completed, including resetting the current-work scratchpad and repository hygiene checks
