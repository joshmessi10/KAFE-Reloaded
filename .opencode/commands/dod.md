---
description: Verify the Definition of Done for the current task: checks implementation, validation, tests, documentation, history, enriched concept records, 5 benchmark scenarios, and context saving. The Reviewer role runs this command.
---

Verify the Definition of Done for the current task. The **Reviewer** role runs this command before a task is declared complete (see AGENTS.md — Definition of Done).

## Process

1. Identify the completed task and its scope.
2. Check each required item against the actual repository state (not intent):
   - **Implementation exists** — the code/change is present.
   - **Validation passed** — behavior verified against expected results.
   - **Tests passed** — the relevant suite passes (`pytest tests/`).
   - **Documentation updated** — `docs/` and `.opencode/knowledge/` reflect the change.
   - **History updated** — a record exists under `.opencode/history/`.
3. Check the applicable items (ML/DL components):
   - **ADR exists** — if architecture or public APIs changed.
   - **Benchmarks exist with 5 scenarios** — verify `.opencode/benchmarks/records.md` has 5 test scenarios for this component.
   - **Enriched concept record** — verify `.opencode/knowledge/concepts/<name>.md` has: mathematical foundation, step-by-step algorithm, advantages (3+), limitations (2+), when to use/NOT to use, references.
   - **Examples exist** — `.kf` files under `docs/ejemplos/`.
4. **Context saving verification** (ML/DL components):
   - [ ] `.opencode/knowledge/concepts/<name>.md` exists and is enriched
   - [ ] `.opencode/history/YYYY/YYYY-MM.md` has record
   - [ ] `tests/KafeMACHINE/<category>/` has 7+ fixtures (5 valid + 2 error)
   - [ ] `.opencode/benchmarks/records.md` has 5 scenarios
   - [ ] `docs/bibliotecas/machine.md` is updated
   - [ ] `.opencode/progress/roadmap.md` is updated

## Output

Print the checklist from `.opencode/templates/dod-checklist.md`, marking each item ✓ or ✗ with evidence.

- List every ✗ item with the reason.
- If any required item fails, the task is **not** complete; propose the fix as the next step.
- If everything passes, state that the Definition of Done is satisfied.
