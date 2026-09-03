---
description: Generate an ADR record from the ADR template for an important engineering decision.
---

Generate an ADR record.

## Process

1. Confirm the trigger: architecture changes, public APIs change, or an important engineering decision is made (AGENTS.md — Automatic Actions).
2. Read `.opencode/adr/decisions.md` to find the next sequential ADR number.
3. Add a new section to `.opencode/adr/decisions.md` using the ADR template format.
4. Fill all sections: Status, Context, Decision, Rationale, Consequences, Alternatives Considered.
5. Update `.opencode/progress/current.md` (Related ADRs field).

## Output

- A new ADR section in `.opencode/adr/decisions.md`.
- A summary of the decision in the response.
