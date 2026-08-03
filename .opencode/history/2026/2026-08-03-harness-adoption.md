# Harness Engineering Adoption

- **Date**: 2026-08-03
- **Author**: Engineering System
- **Summary**: Evaluated the reference subagent-harness repository (`betta-tech/ejemplo-harness-subagentes`) and adopted three of its practices into the KAFE engineering system: (1) reinforced `/init` to validate progress consistency and run the full test suite (`pytest tests/ -q`), (2) documented the anti-telephone rule for subagent coordination in `engineering.md` and OPENCODE.md, and (3) aligned AGENTS.md/OPENCODE.md navigation with progressive disclosure (both are now maps pointing to `.opencode/` detail, with cross-references and a "read this when" table).
- **Reason**: Strengthen verification and orchestration discipline: `/init` becomes a gate that runs real tests (mirroring CI), subagents will write results to files and return only references when the roles become opencode subagents, and both entry-point documents read as navigation maps rather than rule bibles.
- **Impacted Modules**: `.opencode/commands/init.md`, `.opencode/knowledge/engineering.md`, `OPENCODE.md`, `AGENTS.md`, `.opencode/progress/`, `.opencode/memory/`
- **Related RFCs**: none
- **Related ADRs**: none
- **Validation Performed**: Full test suite green (315 tests passed in 52s); `pytest tests/` collection verified from the repository root; both entry-point files re-read to confirm section coherence. Roles as opencode subagents and hook-based verification were explicitly deferred to a later phase per user decision.
