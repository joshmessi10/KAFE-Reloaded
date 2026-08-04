# ADR-0001: Adopt `.opencode/` as the Authoritative Engineering System

- **Status**: accepted

## Context

KAFE is an educational DSL for Machine Learning and Deep Learning (Python + ANTLR 4, Visitor pattern). Before this decision, engineering rules lived in a single AGENTS.md and nothing was persisted: no memory, no session recovery, no ADR/benchmark process, no Definition of Done enforcement. Decisions and project knowledge were lost between sessions, and long-term maintenance relied on the model's context window.

Requirements that motivated the system:

- Persistent memory and session-to-session context.
- Session recovery and reproducible closure.
- ADR process for decisions.
- Benchmark layer for ML/DL and performance work.
- Knowledge layer for architecture, conventions, and specs.
- Autonomous project continuation by any agent.

## Decision

Adopt `.opencode/` as the authoritative engineering system with a three-layer separation:

- `OPENCODE.md` — operating manual (Engineering Lead duties, decision principles, rules, escalation).
- `AGENTS.md` — engineering constitution (mission, workflow, roles, Definition of Done, Source of Truth precedence).
- `.opencode/` — source of operational knowledge: `knowledge/`, `memory/`, `history/`, `progress/`, `adr/`, `benchmarks/`, `skills/`, `commands/`, `templates/`.

Source of Truth precedence: **ADRs > Knowledge Layer > History > Progress**. Both entry documents load automatically via `opencode.json` (`"instructions": ["OPENCODE.md", "AGENTS.md"]`).

## Rationale

- Separates governance (stable) from operations (procedural) from knowledge (living), giving each artifact a single home and avoiding conflicting sources.
- Makes the engineering processes executable: `/init` (gates), `/resume` (recovery), `/open-work` (work item opening), `/close` (closure), `/impact`, `/adr`, `/benchmark`, `/dod`.
- An educational project benefits from durable, traceable knowledge: each significant change is recorded and can be taught and audited.

## Consequences

- Significant changes must be traceable through ADRs, history, and the session log.
- AGENTS.md stays lean (constitution + navigation map); detail lives in `.opencode/knowledge/` (progressive disclosure).
- Session memory files and the bitácora (`session-log.md`) must be updated on close (`/close`).
- Trade-off: the engineering system itself must be maintained (templates, indexes, cross-references).
- Follow-up: implement the documented roles as opencode agents (decision pending); fill the ADR/benchmark/concept records; keep cross-references and templates in sync.

## Alternatives Considered

- Keep everything in AGENTS.md — rejected: the file grows unbounded and no persistent knowledge is preserved.
- Engineering system at the repo root — rejected: pollutes the repo root and mixes project docs with the engineering system.
- Rely only on tool-specific configs (CLAUDE.md, `.kiro/`) — rejected: no unified persistence, no ADR/benchmark layer, and vendor lock-in.
