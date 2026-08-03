---
name: create-rfc
description: Use when a major module is introduced, multiple subsystems are modified, or a significant capability is added, or when uncertainty exists about architecture, public APIs, or long-term maintainability. Creates an RFC record before implementation.
---

Purpose: create an RFC record to document and approve a major capability before implementation.

## Inputs

- The proposed capability and why it is needed.
- Affected subsystems and expected impact.

## Workflow

1. Run `/impact` first if not already done (impact analysis informs the RFC).
2. Copy `.opencode/rfc/template.md` → `.opencode/rfc/RFC-0000-short-title.md` (next sequential number).
3. Fill in all sections: Problem Statement, Motivation, Proposed Solution, Alternatives Considered, Impact Analysis, Risks, Migration Strategy, Success Criteria.
4. Link related work in `.opencode/progress/` and any draft ADRs.
5. Reviewer runs `/dod` to verify the record is complete before it is considered approved.

## Outputs

- A completed RFC record under `.opencode/rfc/`.

## Required Documentation Updates

- `.opencode/progress/current.md` (Related RFCs field).
- `.opencode/rfc/` record list.

## Validation Requirements

- All template sections are filled with concrete content (no empty stubs).
- Numbering is sequential; the record follows the template structure.
