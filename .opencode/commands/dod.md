---
description: Verify applicable mirrored root policies and KAFE task evidence, including current and pending quality gates, documentation, history, enriched concept records, 5 benchmark scenarios, and context saving. The Reviewer role runs this command.
---

Verify the Definition of Done for the current task. The **Reviewer** role runs this command before a task is declared complete (see `AGENTS.md` and `CLAUDE.md` — Definition of Done). Applicable runtime/user instructions govern execution; project knowledge supplies technical evidence within the mirrored root policies.

## Process

1. Read both root policy files and the relevant project knowledge. Identify the completed task, approved scope, and validation plan. Check the actual workflows/configuration to establish which gates exist; do not infer implementation from policy prose.
2. Check each required item against the actual repository state (not intent):
   - **Implementation exists** — the code/change is present.
   - **Validation passed** — behavior verified against expected results.
   - **Tests passed** — applicable code tasks have focused validation and the full suite (`uv run --locked --group dev pytest tests/`). For an approved documentation-only task with no runtime, fixture, dependency, or workflow change, record application tests as N/A with the reason and verify the approved document checks.
   - **Documentation updated** — `docs/` and `.opencode/knowledge/` reflect the change.
   - **History updated** — a record exists under `.opencode/history/`.
3. Check applicable root policies: substantive AGENTS/CLAUDE synchronization; authorized scope and local Superpowers artifacts; English and dependency rules; absence of authored suppression comments; and all implemented quality gates. Verify uv lock/setup independently; record lint, typing, spelling, audit, coverage, warnings, and the explicit CI suppression-comment check as PENDING until their migration delivers executable checks. Inspect the current `tests.yml`, `docs.yml`, and `main.yml` rather than assuming a generic `ci.yml` exists. For a gate being implemented by the task, missing evidence is an unmet acceptance criterion.
4. For work on coverage/warning gates, require evidence from the fixture-launched child interpreters, including combined owned-source coverage and complete stdout/stderr diagnostics. Parent pytest-cov/filterwarnings alone are insufficient. Preserve expected-error fixtures and existing CLI semantics. Record these repository gates as PENDING until implemented.
5. Check the applicable items (ML/DL components):
   - **ADR exists** — if architecture or public APIs changed.
   - **Benchmarks exist with 5 scenarios** — verify `.opencode/benchmarks/records.md` has 5 test scenarios for this component.
   - **Enriched concept record** — verify `.opencode/knowledge/concepts/<name>.md` has: mathematical foundation, step-by-step algorithm, advantages (3+), limitations (2+), when to use/NOT to use, references.
   - **Examples exist** — `.kf` files under `docs/ejemplos/`.
6. **Context saving verification** (ML/DL components):
   - [ ] `.opencode/knowledge/concepts/<name>.md` exists and is enriched
   - [ ] `.opencode/history/YYYY/YYYY-MM.md` has record
   - [ ] `tests/KafeMACHINE/<category>/` has 7+ fixtures (5 valid + 2 error)
   - [ ] `.opencode/benchmarks/records.md` has 5 scenarios
   - [ ] `docs/bibliotecas/machine.md` is updated
   - [ ] `.opencode/progress/roadmap.md` is updated
7. If this is session closure, preserve the existing `/init` full-suite and progress-consistency gate, session log, memory/history updates, and `/close` procedure in `engineering.md`. Completing a documentation-only task is not evidence that session-closure gates ran.

## Output

Use `.opencode/templates/dod-checklist.md` and record every item as **PASS**, **FAIL**, **PENDING**, or **N/A**, with evidence or a reason. Follow the assigned local report path for delegated reviews.

- PASS requires observed evidence; FAIL means an observed violation; PENDING means a required implementation or verification is missing; N/A means the item does not apply to the approved scope, with the reason stated.
- List every failed or pending item. Do not mark an absent future gate N/A merely because it is unimplemented; keep it PENDING as repository debt.
- If a required task item fails or remains pending, the task is **not** complete; identify the correction or missing verification.
- If all applicable task items pass, state that the task's Definition of Done is satisfied and separately disclose pending repository migrations. Do not claim full repository compliance while those remain pending.
