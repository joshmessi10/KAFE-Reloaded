# ADR: Example — Layered Engineering System Under `.opencode/`

> **Note**: This file is an example only. Copy `.opencode/adr/template.md` for real decisions and number sequentially (`ADR-0001`, `ADR-0002`, ...).

- **Status**: accepted

## Context

Engineering rules lived in a single AGENTS.md; knowledge, planning, and decisions were not persisted, making session recovery and long-term maintenance difficult.

## Decision

Adopt a layered engineering system: `OPENCODE.md` = operating manual, `AGENTS.md` = engineering constitution, and all persistent artifacts under `.opencode/` (knowledge, memory, history, progress, RFC/ADR, benchmarks, skills, commands, templates).

## Rationale

Separates governance (stable) from operations (procedural) from knowledge (living), giving each layer a single source of truth and enabling autonomous project continuation.

## Consequences

- Detailed knowledge moves from AGENTS.md into `.opencode/knowledge/`.
- Session recovery and RFC/ADR/benchmark workflows become executable via `/init`, `/resume`, `/impact`, `/rfc`, `/adr`, `/benchmark`.
- Follow-up: keep cross-references and templates in sync; update memory files at the end of each session.

## Alternatives Considered

- Keep everything in AGENTS.md — rejected: the file grows unbounded and no persistent knowledge is preserved.
- Store the engineering system at the repo root — rejected: pollutes the repo root and mixes project docs with the engineering system.

## Related RFCs

- none
