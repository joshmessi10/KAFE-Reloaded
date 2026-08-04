# ADR-0002: Roles como Subagentes OpenCode

- **Status**: superseded by ADR-0005
- **Superseded**: 2026-08-04
- **Replaced by**: ADR-0005-agent-system-implementation

## Context

AGENTS.md define cinco roles de ingeniería — Architect, Builder, Reviewer, Historian, y Tester — como responsabilidades que los agentes deben respetar. Originalmente fueron diferidos como subagentes porque el volumen de trabajo no justificaba la sobrecarga de orquestación.

## Decision (Original — 2026-08-03)

Mantener los cinco roles como responsabilidades documentadas y diferir su implementación como subagentes OpenCode a una fase posterior.

## Decision (Actualizada — 2026-08-04)

Los cinco roles ahora están implementados como subagentes OpenCode en `.opencode/agents/`:

- `architect.md` — diseño de sistema, impact analysis, ADR generation
- `builder.md` — implementación, refactoring, feature development
- `reviewer.md` — quality gates, Definition of Done
- `historian.md` — history/knowledge/memory updates
- `tester.md` — validation, tests, benchmarks

El Engineering Lead (`engineering-lead.md`) orquesta a los subagentes via Task tool.

## Consequences

- El sistema ahora tiene 6 agentes: 1 primary (Lead) + 5 subagents
- Los subagentes siguen el protocolo anti-telephone (`.opencode/knowledge/engineering.md`)
- Cada skill tiene Agent Ownership documentado
- `opencode.json` configura `default_agent: "engineering-lead"` y `subagent_depth: 2`
