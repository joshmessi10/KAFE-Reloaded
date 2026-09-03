# Architecture Decision Records

This file consolidates all ADRs for the KAFE project. Individual ADR files have been merged here to reduce file accumulation.

## ADR-0001: Adopt `.opencode/` as the Authoritative Engineering System

- **Status**: accepted
- **Date**: 2026-08-03

### Context

KAFE is an educational DSL for Machine Learning and Deep Learning (Python + ANTLR 4, Visitor pattern). Before this decision, engineering rules lived in a single AGENTS.md and nothing was persisted: no memory, no session recovery, no ADR/benchmark process, no Definition of Done enforcement.

### Decision

Adopt `.opencode/` as the authoritative engineering system with a three-layer separation:
- `OPENCODE.md` — operating manual
- `AGENTS.md` — engineering constitution
- `.opencode/` — source of operational knowledge

Source of Truth precedence: **ADRs > Knowledge Layer > History > Progress**.

### Rationale

- Separates governance (stable) from operations (procedural) from knowledge (living)
- Makes engineering processes executable via commands
- An educational project benefits from durable, traceable knowledge

### Consequences

- Significant changes must be traceable through ADRs, history, and the session log
- AGENTS.md stays lean; detail lives in `.opencode/knowledge/`
- Session memory files and bitácora must be updated on close

---

## ADR-0002: Roles como Subagentes OpenCode (SUPERSEDED)

- **Status**: superseded by ADR-0005
- **Date**: 2026-08-03
- **Superseded**: 2026-08-04

### Context (Original)

AGENTS.md define cinco roles de ingeniería que originalmente fueron diferidos como subagentes porque el volumen de trabajo no justificaba la sobrecarga de orquestación.

### Decision (Original)

Mantener los cinco roles como responsabilidades documentadas y diferir su implementación.

### Decision (Actualizada — 2026-08-04)

Los cinco roles ahora están implementados como subagentes OpenCode en `.opencode/agents/`. Reemplazado por ADR-0005.

---

## ADR-0003: Local Verification Gates Instead of CI Hooks

- **Status**: accepted
- **Date**: 2026-08-03

### Context

The engineering system requires that an agent proves work rather than asserting it. The reference subagent-harness used agent-local hooks to enforce verification.

### Decision

Use explicit local gates through commands instead of CI hooks:
- `/init` runs the full test suite and validates progress consistency
- `/close` requires `/init` green before closing
- No `PostToolUse`/`Stop` agent hooks are configured
- Quality framing documented in `.opencode/knowledge/verifications.md`

### Rationale

- Verification is explicit, auditable, and executed at a defined gate
- No dependency on agent-hook mechanisms
- CI continues to verify on push/PR

### Consequences

- No session closes with a red suite
- Agent must run gates consciously
- Anti-patterns are documented as review failures

---

## ADR-0004: Session Lifecycle (Bitácora + `/close`)

- **Status**: accepted
- **Date**: 2026-08-03

### Context

Without an end-of-session lifecycle, `current.md` accumulated state across sessions and there was no historical record of sessions.

### Decision

Implement a session lifecycle with two mechanisms:
- Append-only bitácora `.opencode/progress/session-log.md`
- `/close` command with hard gates

### Rationale

- Reproducible closure: a red suite never closes a session
- Append-only log preserves session history
- Complements the history layer without duplicating it

### Consequences

- `/resume` and session-recovery template read `session-log.md`
- `/init` validates closure consistency
- `current.md` is reset to template on close

---

## ADR-0005: Agent System Implementation

- **Status**: accepted
- **Date**: 2026-08-04

### Context

AGENTS.md define cinco roles de ingeniería que originalmente fueron diferidos como subagentes (ADR-0002). El sistema de ingeniería ha madurado y el volumen de trabajo justifica la implementación.

### Decision

Implementar los cinco roles como subagentes OpenCode en `.opencode/agents/`:

| Archivo | Modo | Responsabilidad |
|---------|------|-----------------|
| `engineering-lead.md` | primary | Orquestador |
| `architect.md` | subagent | Diseño + ADR |
| `builder.md` | subagent | Implementación + tests |
| `reviewer.md` | subagent | Quality gates + DoD |
| `historian.md` | subagent | History/knowledge/memory |
| `tester.md` | subagent | Validation + benchmarks |

Configuración en `opencode.json`:
- `default_agent: "engineering-lead"`
- `subagent_depth: 2`
- Permisos granulares por agente

### Rationale

- Separación de responsabilidades
- Orquestación paralela
- Permisos granulares
- Enforcement del protocolo anti-telephone

### Consequences

- 7 skills actualizados con Agent Ownership
- ADR-0002 superseded
- Lead orquesta via Task tool
- Subagentes siguen protocolo anti-telephone

---

## ADR-0006: Hard Enforcement via Command Log

- **Status**: accepted
- **Date**: 2026-08-04

### Context

The engineering system had soft enforcement (advisory instructions) for command sequence. Only `/close` had hard gates. Commands like `/open-work` and `/impact` could be skipped or run out of order.

### Decision

Implement hard enforcement via session-scoped command log:
- `.opencode/progress/session-commands.md` tracks which commands have run
- `/resume` resets the command log at session start
- `/open-work` verifies `/resume` ran first (aborts if not)
- `/impact` verifies `/open-work` ran first (aborts if not)
- Each command appends its execution to the log

### Rationale

- Enforces the command sequence: `/init` → `/resume` → `/open-work` → `/impact` → ...
- Provides audit trail for command invocations
- Prevents skipping required steps

### Consequences

- Command sequence is enforced, not just documented
- Reviewer can verify command sequence was followed
- Session state is explicitly tracked
