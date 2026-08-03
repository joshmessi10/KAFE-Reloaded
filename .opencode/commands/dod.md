---
description: Verify the Definition of Done for the current task: checks implementation, validation, tests, documentation, history, and applicable RFC/ADR/benchmarks/examples, then reports a ✓/✗ checklist. The Reviewer role runs this command.
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
3. Check the applicable items:
   - **RFC exists** — if the change is a major capability.
   - **ADR exists** — if architecture or public APIs changed.
   - **Benchmarks exist** — for ML/DL components or performance work.
   - **Examples exist** — when applicable.

## Output

Print the checklist from `.opencode/templates/dod-checklist.md`, marking each item ✓ or ✗ with evidence.

- List every ✗ item with the reason.
- If any required item fails, the task is **not** complete; propose the fix as the next step.
- If everything passes, state that the Definition of Done is satisfied.
