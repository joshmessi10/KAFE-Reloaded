---
description: Validate the KAFE engineering system: checks required directories, knowledge, memory, history, progress, RFC/ADR/benchmark structure, skills, commands, and templates, then prints a readiness report with missing files, invalid files, and recommendations.
---

Validate the KAFE Engineering System. Do the checks below, then report the status.

## Checks

1. Required directories exist:
   - `.opencode/knowledge/` (+ `concepts/`)
   - `.opencode/memory/`
   - `.opencode/history/`
   - `.opencode/progress/`
   - `.opencode/rfc/`
   - `.opencode/adr/`
   - `.opencode/benchmarks/`
   - `.opencode/skills/`
   - `.opencode/commands/`
   - `.opencode/templates/`
2. Knowledge layer:
   - `.opencode/knowledge/architecture.md`
   - `.opencode/knowledge/conventions.md`
   - `.opencode/knowledge/verifications.md`
   - `.opencode/knowledge/engineering.md`
   - `.opencode/knowledge/language-spec.md`
   - `.opencode/knowledge/ml-library.md`
   - `.opencode/knowledge/dl-library.md`
   - `.opencode/knowledge/libraries.md`
   - `.opencode/knowledge/concepts/concept-template.md`
3. Memory layer:
   - `.opencode/memory/current-state.md`
   - `.opencode/memory/active-work.md`
   - `.opencode/memory/technical-debt.md`
   - `.opencode/memory/known-issues.md`
   - `.opencode/memory/context.md`
4. History layer:
   - `.opencode/history/template.md`
   - At least one year directory (`.opencode/history/YYYY/`)
5. Progress layer:
   - `.opencode/progress/roadmap.md`
   - `.opencode/progress/backlog.md`
   - `.opencode/progress/milestones.md`
   - `.opencode/progress/current.md`
   - `.opencode/progress/session-log.md`
6. RFC system: `.opencode/rfc/template.md`
7. ADR system: `.opencode/adr/template.md`
8. Benchmark system:
   - `.opencode/benchmarks/template.md`
   - `.opencode/benchmarks/benchmark-index.md`
9. Skills: `.opencode/skills/` with at least the documented skills (each a directory with `SKILL.md`)
10. Commands: `.opencode/commands/{init,resume,impact,rfc,adr,benchmark,dod,close}.md`
11. Templates:
    - `.opencode/templates/impact-analysis.md`
    - `.opencode/templates/dod-checklist.md`
    - `.opencode/templates/benchmark-template.md`
    - `.opencode/templates/session-recovery.md`
12. Progress consistency:
    - `.opencode/progress/current.md` contains all required fields: `Feature`, `Status`, `Current step`, `Next step`, `Blockers`, `Related RFCs`, `Related ADRs`.
    - `Status` in `current.md` is one of: `planned`, `in_progress`, `done`, `blocked`.
    - At most one active work item is in progress: the single `current.md` must not claim `in_progress` while `.opencode/memory/active-work.md` describes a different or completed feature.
    - `roadmap.md`, `backlog.md`, and `milestones.md` contain their documented sections (not empty templates).
    - `.opencode/progress/session-log.md` exists, is append-only (contains the `## ` session entries), and if `current.md` has `Status: done` it ends with a session entry (the session was properly closed).
13. Test suite: run `pytest tests/ -q` from the repository root (mirrors CI in `.github/workflows/tests.yml`). Report the test count and any failures.

## Output

Print the readiness report in exactly this shape, marking each row with a check (✓) or cross (✗):

```
KAFE Engineering System

Knowledge Layer      ✓
Memory Layer         ✓
History Layer        ✓
Progress Layer       ✓
Progress Consistency ✓

RFC Status           ✓
ADR Status           ✓
Benchmarks           ✓
Templates            ✓

Test Suite           ✓

System Ready
```

Below the report, list:

- **Missing files**: every required path that does not exist, one per line.
- **Invalid files**: files that exist but are empty or structurally invalid (e.g., a template without its required sections), with the reason.
- **Progress issues**: any consistency problem found in check 12 (missing `current.md` fields, invalid `Status`, conflicting active work, empty roadmap/backlog/milestones sections).
- **Test results**: the `pytest tests/ -q` summary — number of tests passed/failed, and the first few failure names if any.
- **Recommendations**: concrete next actions to close the gaps.

If any check fails, mark it ✗ and do not create the missing files during `/init`; only report. If everything passes, end with `System Ready`.
