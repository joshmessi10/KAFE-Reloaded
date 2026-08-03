---
description: Generate an ADR record from the ADR template for an important engineering decision.
---

Generate an ADR record.

## Process

1. Confirm the trigger: architecture changes, public APIs change, or an important engineering decision is made (AGENTS.md — Automatic Actions).
2. Determine the next sequential number under `.opencode/adr/` (e.g., `ADR-0001-...`).
3. Copy `.opencode/adr/template.md` to `.opencode/adr/ADR-0000-short-title.md`.
4. Fill all sections: Status, Context, Decision, Rationale, Consequences, Alternatives Considered, Related RFCs.
5. Update `.opencode/progress/current.md` (Related ADRs field).

## Output

- A new ADR record under `.opencode/adr/`.
- A summary of the decision in the response.
