# ADR Template

Use this template for ADR records (see AGENTS.md — Automatic Actions and `.opencode/knowledge/engineering.md`).

## Consolidated Format

All ADRs are consolidated in `.opencode/adr/decisions.md`. When creating a new ADR:

1. Determine the next sequential number (ADR-000N)
2. Add a new section to `.opencode/adr/decisions.md` using the format below
3. Do NOT create individual files — use only the consolidated file

### ADR Entry Format

Within `decisions.md`, use this format for each ADR:

```markdown
---

## ADR-NNNN: <Title>

- **Status**: proposed / accepted / superseded
- **Date**: YYYY-MM-DD

### Context

The situation and constraints that led to the decision.

### Decision

The decision that was made.

### Rationale

Why this decision was chosen over alternatives.

### Consequences

What changes as a result, including trade-offs and follow-up work.

### Alternatives Considered

What other options were evaluated and why they were rejected.
```

### Rules

- Use the consolidated `decisions.md` file only — no individual ADR files
- Number ADRs sequentially (ADR-0001, ADR-0002, ...)
- Never edit accepted ADRs — add a new ADR to supersede if needed
- Keep the "Status" field current
