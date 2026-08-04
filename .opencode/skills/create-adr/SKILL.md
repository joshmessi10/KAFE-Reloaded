---
name: create-adr
description: Use when architecture changes, public APIs change, or important engineering decisions are made. Creates an ADR record capturing the decision, rationale, and consequences.
---

Purpose: create an ADR record to capture an important engineering decision durably.

## Agent Ownership

| Step | Agent | Action |
|------|-------|--------|
| 1-3 | Architect | Create ADR record |
| 4 | Reviewer | Run `/dod` to verify completeness |
| Validation | Historian | Update history and knowledge records |

The Lead orchestrates this workflow, delegating to the Architect for creation and the Reviewer for validation.

## Inputs

- The decision made and the context that led to it.
- Alternatives considered and rationale.

## Workflow

1. Confirm the decision is significant (architecture, public API, or important engineering decision).
2. Copy `.opencode/adr/template.md` → `.opencode/adr/ADR-0000-short-title.md` (next sequential number).
3. Fill in all sections: Status, Context, Decision, Rationale, Consequences, Alternatives Considered.
4. Reviewer runs `/dod` to verify the record is complete before it is considered final.

## Outputs

- A completed ADR record under `.opencode/adr/`.

## Required Documentation Updates

- `.opencode/progress/current.md` (Related ADRs field).
- `.opencode/knowledge/` if the decision changes documented architecture, conventions, or specs.

## Validation Requirements

- All template sections are filled with concrete content (no empty stubs).
- Numbering is sequential; the record follows the template structure.
