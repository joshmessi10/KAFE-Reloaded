# Definition of Done Checklist

Verify each item before declaring a task complete (see AGENTS.md — Definition of Done and `.opencode/knowledge/engineering.md`). The **Reviewer** role runs the `/dod` command against this checklist.

## Required (All Tasks)

- [ ] Implementation exists
- [ ] Validation passed
- [ ] Tests passed (pytest tests/)
- [ ] Documentation updated (`docs/` + `.opencode/knowledge/`)
- [ ] History updated (`.opencode/history/`)

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
- [ ] Examples exist (`.kf` files under `docs/ejemplos/`)
- [ ] **Context saving verified** — ALL of these must exist:
  - [ ] `.opencode/knowledge/concepts/<name>.md`
  - [ ] `.opencode/history/YYYY/YYYY-MM.md`
  - [ ] `tests/KafeMACHINE/<category>/` (7+ fixtures: 5 valid + 2 error)
  - [ ] `.opencode/benchmarks/records.md` (5 scenarios)
  - [ ] `docs/bibliotecas/machine.md` updated
  - [ ] `.opencode/progress/roadmap.md` updated
