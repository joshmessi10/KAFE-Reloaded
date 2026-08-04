# KAFE Engineering Procedures

Source of truth for the engineering processes referenced by AGENTS.md.

## Impact Analysis Process

Perform Impact Analysis before significant changes. It is **mandatory** before:

- Adding ML algorithms.
- Adding DL components.
- Modifying public APIs.
- Refactoring core interpreter components.
- Modifying grammar rules.

Output of an impact analysis: affected modules, risks, and an implementation plan. Use the template at `.opencode/templates/impact-analysis.md`; run via `/impact`.

## ADR Process

- Create an ADR automatically when: architecture changes, public APIs change, or important engineering decisions are made.
- Template: `.opencode/adr/template.md` (Status, Context, Decision, Rationale, Consequences, Alternatives Considered). Records live in `.opencode/adr/decisions.md` (consolidated file — no individual ADR files). Run via `/adr`.

## Session Recovery Process

When resuming work, reconstruct project state in this order:

1. Read `.opencode/knowledge/` — how KAFE works and how engineering processes run.
2. Read `.opencode/memory/` — session-to-session context (`current-state`, `active-work`, `technical-debt`, `known-issues`, `context`).
3. Read recent `.opencode/history/` — significant project events.
4. Read active `.opencode/progress/` — `roadmap.md`, `backlog.md`, `milestones.md`, `current.md`.
5. Reconstruct project state before proposing changes.

Session recovery should produce:

- Current project status.
- Active work.
- Pending work.
- Relevant historical context.
- Blockers.
- Recommended next steps.

Use the `.opencode/templates/session-recovery.md` format; run via `/resume`.

Opening work is the start-of-work counterpart of the closure process: run `/open-work` (`.opencode/commands/open-work.md`) after `/resume` when a new work item begins. It selects the item from the backlog/roadmap and initializes `current.md` and `active-work.md`; if the item is significant (ML/DL, public API, grammar, core refactor, new library), `/impact` must run before implementation.

## Session Closure Process

End-of-session lifecycle (run via `/close`). Closing a session means:

1. **Hard gate**: run `/init` — it must end green (full suite `pytest tests/ -q` + progress consistency). If red, do not close: fix or record the session as `blocked` in `current.md`.
2. **Definition of Done gate**: run `/dod` for the session's active work item if it is complete. If `/dod` fails, do not close; if no work item has `/dod` scope this session, record `/dod` as not applicable in the close summary.
3. Update `.opencode/memory/` (`current-state`, `active-work`, `technical-debt`, `known-issues`, `context` as needed).
4. Update `.opencode/progress/` (`roadmap`, `backlog`, `milestones`) only if priorities changed.
5. Append a session entry to `.opencode/progress/session-log.md` (append-only bitácora).
6. Write a `.opencode/history/YYYY/YYYY-MM.md` record if the session produced a significant change (append to monthly file).
7. Reset `.opencode/progress/current.md` to its template (empty values, clean scratchpad).
8. Verify repository hygiene: no temp files, no debug `print()`, no context-less TODOs.

The session log is the lightweight per-session record; `.opencode/history/` holds structured records for significant events.

## Benchmark Process

- Benchmark generation is mandatory for ML algorithms, DL components, and performance optimizations.
- Each benchmark MUST include **at least 5 test scenarios** that are reliable and sensible:
  1. **Small Dataset** (10-50 samples, 2-3 features) — Verifies basic functionality
  2. **Medium Dataset** (100-500 samples, 5-10 features) — Verifies performance characteristics
  3. **Edge Cases** (empty input, single sample, single feature, all-same values) — Verifies robustness
  4. **Multi-class/Multi-feature** (3+ classes, 10+ features) — Verifies scalability
  5. **Stress Test** (1000+ samples or extreme parameters) — Verifies performance limits
- Use the template at `.opencode/benchmarks/template.md`; register each record in `.opencode/benchmarks/records.md` (consolidated file).
- The **Tester** role runs `/benchmark`, which measures real runtime/memory and fills the record. No CI hook is required.
- New ML/DL components also require documentation, tests, and examples.
- **Documentation must be updated** for every implementation (see Documentation Update Process).

## Subagent Coordination Process (Anti-Telephone Rule)

When work is delegated to subagents (the Architect, Builder, Reviewer, Historian, and Tester roles implemented as opencode subagents), coordinate to prevent interpretation drift ("broken telephone"):

- Subagents must write their results to files (e.g., `progress/impl-<feature>.md`, `progress/review-<feature>.md`) and return **only a file reference** in chat, never the content.
- Instruction template for a delegated task:

  > "Investigate <topic>. Write your findings to <file>. Your reply must be only: `done -> <file>` or `blocked -> <reason>`."

- The orchestrating agent (Engineering Lead) reads the report from disk when needed and never bases decisions on a chat summary.
- Reviewers write verdicts to a file and reply with a single line (`APPROVED -> <file>` / `CHANGES_REQUESTED -> <file>`).
- In single-agent sessions the rule does not apply; the agent uses skills (`.opencode/skills/`) and commands (`.opencode/commands/`) directly.

## Educational Response Standards

For significant tasks, respond with this enriched structure:

1. **Theory** — Concepto matemático: qué es, por qué existe, fundamento matemático (fórmulas en LaTeX cuando aplique), complejidad computacional, ventajas, limitaciones, relación con la implementación KAFE.
2. **Analysis** — Estado actual del código, qué existe, qué falta.
3. **Impact** — Módulos afectados, riesgos, compatibilidad.
4. **Plan** — Plan paso a paso con pasos de verificación.
5. **Implementation** — Cambios realizados, estructura de código, decisiones de diseño.
6. **Validation** — Tests ejecutados, resultados, edge cases cubiertos.
7. **Documentation** — Archivos actualizados, concept records creados, ejemplos agregados.
8. **Next Steps** — Trabajo pendiente, mejoras futuras.

### Concept Record Requirements

Every ML/DL concept record MUST include:

- **Mathematical Foundation**: Fórmulas, análisis de complejidad, sketch de prueba cuando aplique.
- **Step-by-Step Algorithm**: Cómo funciona el algoritmo paso a paso, no solo qué hace.
- **Advantages & Limitations**: Cuándo usar, cuándo no usar.
- **Relationship with KAFE**: Cómo la teoría se mapea a la implementación.
- **References**: Papers, libros, fuentes autoritativas.

Never respond with only "Done", "Fixed", "Completed".

## Documentation Update Process

After implementing ANY ML/DL component, these updates are **mandatory** (not optional):

1. Update `docs/bibliotecas/machine.md` (or `gesha.md`) with the new component section.
2. Create/enrich concept record in `.opencode/knowledge/concepts/<name>.md`.
3. Update `.opencode/knowledge/ml-library.md` (Structure, Public API, Tests).
4. Update `.opencode/history/YYYY/YYYY-MM.md` with the addition.
5. Verify that all documentation reflects the current state of the code.

### Context Saving Verification

After each implementation, verify ALL of these exist:

- [ ] `.opencode/knowledge/concepts/<name>.md` — concept record enriquecido
- [ ] `.opencode/history/YYYY/YYYY-MM.md` — history record
- [ ] `tests/KafeMACHINE/<category>/` — 7+ fixtures (5 valid + 2 error)
- [ ] `.opencode/benchmarks/records.md` — benchmark con 5 escenarios
- [ ] `docs/bibliotecas/` — documentación actualizada
- [ ] `.opencode/progress/roadmap.md` — refleja completado

If any of these is missing, the task is NOT complete.
