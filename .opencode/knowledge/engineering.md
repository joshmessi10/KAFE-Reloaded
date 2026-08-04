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

## ADR Process

- Create an ADR automatically when: architecture changes, public APIs change, or important engineering decisions are made.
- Template: `.opencode/adr/template.md` (Status, Context, Decision, Rationale, Consequences, Alternatives Considered). Records live in `.opencode/adr/`. Run via `/adr`.

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

Opening work is the start-of-work counterpart of the closure process: run `/open-work` (`.opencode/commands/open-work.md`) after `/resume` when a new work item begins. It selects the item from the backlog/roadmap and initializes `current.md` and `active-work.md`; if the item is significant (ML/DL, public API, grammar, core refactor, new library), `/impact` must run before implementation.

## Session Closure Process

End-of-session lifecycle (run via `/close`). Closing a session means:

1. **Hard gate**: run `/init` — it must end green (full suite `pytest tests/ -q` + progress consistency). If red, do not close: fix or record the session as `blocked` in `current.md`.
2. **Definition of Done gate**: run `/dod` for the session's active work item if it is complete. If `/dod` fails, do not close; if no work item has `/dod` scope this session, record `/dod` as not applicable in the close summary.
3. Update `.opencode/memory/` (`current-state`, `active-work`, `technical-debt`, `known-issues`, `context` as needed).
4. Update `.opencode/progress/` (`roadmap`, `backlog`, `milestones`) only if priorities changed.
5. Append a session entry to `.opencode/progress/session-log.md` (append-only bitácora).
6. Write a `.opencode/history/YYYY/` record if the session produced a significant change.
7. Reset `.opencode/progress/current.md` to its template (empty values, clean scratchpad).
8. Verify repository hygiene: no temp files, no debug `print()`, no context-less TODOs.

The session log is the lightweight per-session record; `.opencode/history/` holds structured records for significant events.

## Benchmark Process

- Benchmark generation is mandatory for ML algorithms, DL components, and performance optimizations.
- Use the template at `.opencode/benchmarks/template.md`; register each record in `.opencode/benchmarks/benchmark-index.md`.
- The **Tester** role runs `/benchmark`, which measures real runtime/memory and fills the record. No CI hook is required.
- New ML/DL components also require documentation, tests, and examples.

## Subagent Coordination Process (Anti-Telephone Rule)

When work is delegated to subagents (the Architect, Builder, Reviewer, Historian, and Tester roles implemented as opencode subagents), coordinate to prevent interpretation drift ("broken telephone"):

- Subagents must write their results to files (e.g., `progress/impl-<feature>.md`, `progress/review-<feature>.md`) and return **only a file reference** in chat, never the content.
- Instruction template for a delegated task:

  > "Investigate <topic>. Write your findings to <file>. Your reply must be only: `done -> <file>` or `blocked -> <reason>`."

- The orchestrating agent (Engineering Lead) reads the report from disk when needed and never bases decisions on a chat summary.
- Reviewers write verdicts to a file and reply with a single line (`APPROVED -> <file>` / `CHANGES_REQUESTED -> <file>`).
- In single-agent sessions the rule does not apply; the agent uses skills (`.opencode/skills/`) and commands (`.opencode/commands/`) directly.

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
- Append `.opencode/progress/session-log.md` at the end of each session (see Session Closure Process; run via `/close`).
- Create/update `.opencode/knowledge/concepts/` records when a new concept is introduced (template: `.opencode/knowledge/concepts/concept-template.md`).
- Verify the Definition of Done before declaring a task complete: the **Reviewer** role runs `/dod` against the checklist at `.opencode/templates/dod-checklist.md`.
