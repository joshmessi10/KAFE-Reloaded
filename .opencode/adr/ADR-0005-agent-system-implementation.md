# ADR-0005: Agent System Implementation

- **Status**: accepted

## Context

AGENTS.md define cinco roles de ingeniería — Architect, Builder, Reviewer, Historian, y Tester — que originalmente fueron diferidos como subagentes (ADR-0002). El sistema de ingeniería ha madurado y el volumen de trabajo justifica la implementación como subagentes OpenCode para:

- Separar responsabilidades claras
- Permitir orquestación paralela
- Aplicar permisos granulares por rol
- Enforce el protocolo anti-telephone

## Decision

Implementar los cinco roles como subagentes OpenCode en `.opencode/agents/`:

| Archivo | Modo | Responsabilidad |
|---------|------|-----------------|
| `engineering-lead.md` | primary | Orquestador, aplica response standards, gestiona ciclo de vida |
| `architect.md` | subagent | Diseño de sistema, impact analysis, ADR generation |
| `builder.md` | subagent | Implementación, refactoring, feature development |
| `reviewer.md` | subagent | Quality gates, Definition of Done |
| `historian.md` | subagent | History/knowledge/memory updates |
| `tester.md` | subagent | Validation, tests, benchmarks |

Configuración en `opencode.json`:
- `default_agent: "engineering-lead"` — toda sesión nueva entra por el Lead
- `subagent_depth: 2` — permite Lead → subagentes
- Permisos granulares por agente (Lead no edita código, Architect no ejecuta bash, etc.)

## Rationale

- El sistema de ingeniería tiene 49 archivos sustantivos, 8 comandos, 7 skills
- Los skills necesitan Agent Ownership para funcionar correctamente
- El protocolo anti-telephone requiere subagentes que escriban a archivos
- Los permisos granulares previenen errores (ej: Reviewer no puede editar código)

## Consequences

- Los 7 skills son actualizados con Agent Ownership sections
- ADR-0002 es superseded por este ADR
- `opencode.json` es actualizado con configuración de agentes
- El Lead orquesta via Task tool, lee resultados de disco
- Los subagentes siguen el protocolo anti-telephone

## Alternatives Considered

- Mantener single-agent — rejected: no escala, no aplica permisos granulares
- Usar solo built-in agents (build/plan) — rejected: no tienen los prompts específicos de KAFE
- Implementar como plugins — rejected: complejidad innecesaria, los archivos .md son sufficientes
