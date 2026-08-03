---
description: Generate an RFC record from the RFC template for a major capability or architectural uncertainty.
---

Generate an RFC record.

## Process

1. Confirm the trigger: a major module is introduced, multiple subsystems are modified, a significant capability is added, or uncertainty exists about architecture, public APIs, or long-term maintainability (OPENCODE.md — RFC Escalation Rule).
2. Determine the next sequential number under `.opencode/rfc/` (e.g., `RFC-0001-...`).
3. Copy `.opencode/rfc/template.md` to `.opencode/rfc/RFC-0000-short-title.md`.
4. Fill all sections: Problem Statement, Motivation, Proposed Solution, Alternatives Considered, Impact Analysis, Risks, Migration Strategy, Success Criteria.
5. Update `.opencode/progress/current.md` (Related RFCs field).

## Output

- A new RFC record under `.opencode/rfc/`.
- A summary of the proposal in the response.
