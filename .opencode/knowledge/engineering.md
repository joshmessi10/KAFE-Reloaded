# KAFE Engineering Procedures

Source of truth for the engineering processes referenced by AGENTS.md.

## Impact Analysis Process

Perform Impact Analysis before significant changes. It is **mandatory** before:

- Adding ML algorithms.
- Adding DL components.
- Modifying public APIs.
- Refactoring core interpreter components.
- Modifying grammar rules.

Output of an impact analysis: affected modules, risks, and an implementation plan. Use the template at `.opencode/templates/impact-analysis.md`; run via `/impact`.

## RFC Process

- Create an RFC automatically when: a major module is introduced, multiple subsystems are modified, or a significant capability is added.
- Also create an RFC if uncertainty exists about architecture, public APIs, or long-term maintainability (OPENCODE.md — RFC Escalation Rule).
- RFC generation should be automatic and must not require explicit user requests; the engineering system decides when an RFC is necessary.
- Template: `.opencode/rfc/template.md` (Problem Statement, Motivation, Proposed Solution, Alternatives Considered, Impact Analysis, Risks, Migration Strategy, Success Criteria). Records live in `.opencode/rfc/`. Run via `/rfc`.

## ADR Process

- Create an ADR automatically when: architecture changes, public APIs change, or important engineering decisions are made.
- Template: `.opencode/adr/template.md` (Status, Context, Decision, Rationale, Consequences, Alternatives Considered, Related RFCs). Records live in `.opencode/adr/`. Run via `/adr`.

## Session Recovery Process

When resuming work, reconstruct project state in this order:

1. Read `.opencode/knowledge/` — how KAFE works and how engineering processes run.
2. Read `.opencode/memory/` — session-to-session context (`current-state`, `active-work`, `technical-debt`, `known-issues`, `context`).
3. Read recent `.opencode/history/` — significant project events.
4. Read active `.opencode/progress/` — `roadmap.md`, `backlog.md`, `milestones.md`, `current.md`.
5. Reconstruct project state before proposing changes.

Session recovery should produce:

- Current project status.
- Active work.
- Pending work.
- Relevant historical context.
- Blockers.
- Recommended next steps.

Use the `.opencode/templates/session-recovery.md` format; run via `/resume`.

## Benchmark Process

- Benchmark generation is mandatory for ML algorithms, DL components, and performance optimizations.
- Use the template at `.opencode/benchmarks/template.md`; register each record in `.opencode/benchmarks/benchmark-index.md`. Run via `/benchmark`.
- New ML/DL components also require documentation, tests, and examples.

## Educational Response Standards

- For significant tasks, always respond with: Theory, Analysis, Impact, Plan, Implementation, Validation, Documentation, Next Steps.
- Never respond with only "Done", "Fixed", "Completed".
- For algorithms, models, optimizers, metrics, layers, and other ML/DL components, include **both** an engineering explanation and a theoretical explanation.
- Theoretical explanations should cover: what the concept is, why it exists, how it works, advantages and limitations, and its relationship with the KAFE implementation.

## Documentation Update Process

- Update `docs/` (MkDocs site) when language or library behavior changes; keep `docs/especificacion/` grammar documents in sync with grammar changes.
- Update `.opencode/knowledge/` when architecture, conventions, specs, or procedures change.
- Update `.opencode/memory/` at the end of each session: `current-state.md`, `active-work.md`, `technical-debt.md`, `known-issues.md`.
- Update `.opencode/history/` with a record after significant changes (template: `.opencode/history/template.md`).
- Update `.opencode/progress/` when the roadmap, backlog, milestones, or current work change (never in AGENTS.md).
- Create/update `.opencode/knowledge/concepts/` records when a new concept is introduced (template: `.opencode/knowledge/concepts/concept-template.md`).
- Verify the Definition of Done before declaring a task complete (checklist: `.opencode/templates/dod-checklist.md`).
