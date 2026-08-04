---
name: add-dl-layer
description: Use when adding a new deep learning layer or component to KafeGESHA in KAFE. Runs impact analysis, implements the layer from scratch, and adds fixtures, documentation, benchmarks with 5 scenarios, and enriched concept records.
---

Purpose: add a new DL layer or component to KafeGESHA, implemented from scratch inside KAFE, fully validated and documented.

## Agent Ownership

| Step | Agent | Action |
|------|-------|--------|
| 1 | Architect | Run `/impact` — Impact Analysis |
| 2-6 | Builder | Implement layer, factory, fixtures, docs |
| 7 | Tester | Run `/benchmark` with 5 scenarios, register record |
| 8 | Reviewer | Run `/dod` — Definition of Done (verifies context saving) |
| Validation | Historian | Create history record, update knowledge |

The Lead orchestrates this workflow, delegating each step to the responsible agent.

## Inputs

- Layer/component name and reference (paper/notes).
- Expected KAFE API (factory function name and parameters).
- Forward/backward behavior to implement.

## Workflow

1. Run Impact Analysis first (`/impact`) — mandatory before adding DL components.
2. Read `.opencode/knowledge/dl-library.md` and `.opencode/knowledge/architecture.md` for conventions.
3. Implement the layer/component (forward and backward if training is involved) in `src/lib/KafeGESHA/`.
4. Add the factory/function to `src/lib/KafeGESHA/funciones.py`.
5. Add **at least 7 fixtures** (5 valid + 2 error cases) under `tests/KafeGESHA/` and wire a parameterized test in `tests/test_KafeGESHA.py`.
6. Create **enriched concept record** in `.opencode/knowledge/concepts/<name>.md` with:
   - Mathematical foundation (formulas, complexity analysis)
   - Step-by-step algorithm description
   - Advantages and limitations (at least 3 advantages, 2 limitations)
   - When to use / when NOT to use
   - Relationship with KAFE implementation
   - References to original papers/books
7. Add an example `.kf` program under `docs/ejemplos/`.
8. **Update `docs/bibliotecas/gesha.md`** with the new component section (methods, properties, example, algorithm description).
9. Update `.opencode/knowledge/dl-library.md` (Structure, Public API, Tests).
10. Tester runs `/benchmark` with **5 test scenarios** and registers in `.opencode/benchmarks/records.md`.
11. Reviewer runs `/dod` — must verify context saving (all 6 files exist).
12. Historian creates history record in `.opencode/history/YYYY/YYYY-MM.md`.
13. Update `.opencode/progress/roadmap.md` to mark completion.

## Outputs

- New layer/component module and factory function.
- At least 7 fixture tests (5 valid + 2 error).
- Enriched concept record with math, algorithm, advantages, references.
- Benchmark with 5 test scenarios.
- Updated documentation in `docs/bibliotecas/`.
- History record.
- Updated roadmap.

## Validation Requirements (All Must Pass)

- [ ] `pytest tests/test_KafeGESHA.py` passes
- [ ] Full suite `pytest tests/` passes
- [ ] Concept record exists and is **enriched** (math, algorithm, advantages, references)
- [ ] Benchmark has **5 test scenarios** with real measurements
- [ ] Documentation updated in `docs/bibliotecas/`
- [ ] History record created in `.opencode/history/`
- [ ] Context saving verified — all of these exist:
  - [ ] `.opencode/knowledge/concepts/<name>.md`
  - [ ] `.opencode/history/YYYY/YYYY-MM.md`
  - [ ] `tests/KafeGESHA/` (7+ fixtures)
  - [ ] `.opencode/benchmarks/records.md` (5 scenarios)
  - [ ] `docs/bibliotecas/gesha.md` updated
  - [ ] `.opencode/progress/roadmap.md` updated
