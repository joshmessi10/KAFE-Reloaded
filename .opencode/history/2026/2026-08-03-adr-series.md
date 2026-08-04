# ADR Series 0001-0004 — Engineering Decisions Registered

- **Date**: 2026-08-03
- **Author**: Engineering System
- **Summary**: Created the first real ADR records, formalizing decisions that were previously undocumented: ADR-0001 (adopt `.opencode/` as the authoritative engineering system, three-layer separation OPENCODE.md/AGENTS.md/`.opencode/` with Source of Truth precedence), ADR-0002 (keep the five roles documented and defer their implementation as opencode subagents), ADR-0003 (local verification gates `/init`/`/close` instead of CI hooks, quality framing), ADR-0004 (session lifecycle: bitácora `session-log.md` + `/close`). Updated `current.md` Related ADRs to reference ADR-0001.
- **Reason**: The Source of Truth precedence (ADRs > Knowledge > History > Progress) was half-empty; real decisions existed without durable records. These four ADRs record the birth of the engineering system and the key decisions already taken.
- **Impacted Modules**: `.opencode/adr/ADR-0001..0004`, `.opencode/progress/current.md`
- **Related ADRs**: ADR-0001, ADR-0002, ADR-0003, ADR-0004
- **Validation Performed**: All four records follow the ADR template with every section filled; sequential numbering 0001-0004; grep confirms ADR-0001 is referenced in `current.md` and consistent with the Source of Truth precedence in AGENTS.md.
