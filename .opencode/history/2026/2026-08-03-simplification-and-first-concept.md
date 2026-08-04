# Engineering System Simplification and First Concept

- **Date**: 2026-08-03
- **Author**: Engineering System
- **Summary**: Simplified the engineering system and started the knowledge-concept graph. Removed the proposal-record layer in full: deleted its directory, its command, and its skill, and removed every reference to it across AGENTS.md, OPENCODE.md, the knowledge layer, commands, skills, templates, benchmarks, memory, history (template and 2026 records), and ADR records — including the linkage section in the ADR template/records and its entry in the Source of Truth precedence (now **ADRs > Knowledge > History > Progress**). Deleted the ADR example record. Created the first knowledge concept `.opencode/knowledge/concepts/standard-scaler.md` documenting StandardScaler, the KafeMACHINE preprocessing component (fit/transform contract, z-score theory, usage examples, guards).
- **Reason**: Reduce content and duplication in the engineering system — ADR becomes the single durable decision record. The first concept starts the knowledge graph for KafeMACHINE preprocessing, a current development priority.
- **Impacted Modules**: `.opencode/` (proposal-record layer, commands, skills, templates, benchmarks, memory, history, adr, progress, knowledge, concepts), `AGENTS.md`, `OPENCODE.md`
- **Related ADRs**: ADR-0001 (precedence updated: ADRs > Knowledge > History > Progress), ADR-0002, ADR-0003, ADR-0004
- **Validation Performed**: grep across the repository confirms zero remaining references to the removed layer; the concept record follows the concept template with every section filled; `/init` structure remains consistent (directories, commands, ADR, benchmarks, templates, progress consistency); full test suite green (315 passed).

The concept template was kept (per user decision); AGENTS.md and `/init` continue to reference `.opencode/knowledge/concepts/concept-template.md`.
