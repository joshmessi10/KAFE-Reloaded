# History Record Template

Use this template for significant project events (see AGENTS.md — Automatic Actions and `.opencode/knowledge/engineering.md`).

## Monthly Consolidated Format

Save as `.opencode/history/YYYY/YYYY-MM.md`. Each monthly file consolidates all events for that month, organized chronologically with section headers.

### Entry Format

Within the monthly file, use this format for each event:

```markdown
## YYYY-MM-DD: <Event Title>

### <Sub-title if needed>

- **Author**: <name / handle>
- **Summary**: <what changed>
- **Reason**: <why>
- **Impacted Modules**: <src/, docs/, tests/, .opencode/ paths>
- **Related ADRs**: <adr/... or none>
- **Validation Performed**: <tests run, benchmarks, review, verification>
```

### Rules

- One file per month (e.g., `2026-08.md` for August 2026)
- Append new events to the existing monthly file
- Organize chronologically within the file
- Group related events under section headers
- Keep the "Events by Category" section at the bottom updated
