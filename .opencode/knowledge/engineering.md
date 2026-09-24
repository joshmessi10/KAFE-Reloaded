# KAFE Engineering Procedures

Project-specific engineering procedures implementing the mirrored `AGENTS.md` and `CLAUDE.md` policies.

## Instruction Authority

Applicable runtime and user instructions govern execution. `AGENTS.md` and `CLAUDE.md` define the same repository invariants; this file, `OPENCODE.md`, and other `.opencode/` procedures implement those invariants and cannot waive them. Read both root policy files before applying the procedures below.

The ADR > Knowledge > History > Progress order resolves conflicts among project records only. It does not place historical records above current root policies or applicable runtime/user instructions (see ADR-0008).

For non-trivial implementation, follow the root Superpowers lifecycle and integrate its approved design and plan with Impact Analysis and these project procedures. Superpowers specs, plans, reviews, and coordination reports stay in the ignored local artifact paths; never stage, force-add, or commit them.

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
- Template: `.opencode/adr/template.md` (Status, Context, Decision, Rationale, Consequences, Alternatives Considered). Records live in `.opencode/adr/decisions.md` (consolidated file — no individual ADR files). Run via `/adr`.

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

1. **Hard gate**: run `/init` — it must end green (full suite `uv run --locked --group dev pytest tests/ -q` + progress consistency). If red, do not close: fix or record the session as `blocked` in `current.md`.
2. **Definition of Done gate**: run `/dod` for the session's active work item if it is complete. If `/dod` fails, do not close; if no work item has `/dod` scope this session, record `/dod` as not applicable in the close summary.
3. Update `.opencode/memory/` (`current-state`, `active-work`, `technical-debt`, `known-issues`, `context` as needed).
4. Update `.opencode/progress/` (`roadmap`, `backlog`, `milestones`) only if priorities changed.
5. Append a session entry to `.opencode/progress/session-log.md` (append-only log).
6. Write a `.opencode/history/YYYY/YYYY-MM.md` record if the session produced a significant change (append to monthly file).
7. Reset `.opencode/progress/current.md` to its template (empty values, clean scratchpad).
8. Verify repository hygiene: no temp files, no debug `print()`, no context-less TODOs.

The session log is the lightweight per-session record; `.opencode/history/` holds structured records for significant events.

## Benchmark Process

- Benchmark generation is mandatory for ML algorithms, DL components, and performance optimizations.
- Each benchmark MUST include **at least 5 test scenarios** that are reliable and sensible:
  1. **Small Dataset** (10-50 samples, 2-3 features) — Verifies basic functionality
  2. **Medium Dataset** (100-500 samples, 5-10 features) — Verifies performance characteristics
  3. **Edge Cases** (empty input, single sample, single feature, all-same values) — Verifies robustness
  4. **Multi-class/Multi-feature** (3+ classes, 10+ features) — Verifies scalability
  5. **Stress Test** (1000+ samples or extreme parameters) — Verifies performance limits
- Use the template at `.opencode/benchmarks/template.md`; register each record in `.opencode/benchmarks/records.md` (consolidated file).
- The **Tester** role runs `/benchmark`, which measures real runtime/memory and fills the record. No CI hook is required.
- New ML/DL components also require documentation, tests, and examples.
- **Documentation must be updated** for every implementation (see Documentation Update Process).

## Subagent Coordination Process (Anti-Telephone Rule)

When work is delegated to subagents (the Architect, Builder, Reviewer, Historian, and Tester roles implemented as opencode subagents), coordinate to prevent interpretation drift ("broken telephone"):

- Subagents must write their results to files and return **only a file reference** in chat, never the content. Superpowers coordination reports belong under the ignored `.superpowers/` workspace for the active plan; persist durable decisions separately in the appropriate project records.
- Instruction template for a delegated task:

  > "Investigate <topic>. Write your findings to <file>. Your reply must be only: `done -> <file>` or `blocked -> <reason>`."

- The orchestrating agent (Engineering Lead) reads the report from disk when needed and never bases decisions on a chat summary.
- Reviewers write verdicts to a file and reply with a single line (`APPROVED -> <file>` / `CHANGES_REQUESTED -> <file>`).
- In single-agent sessions the rule does not apply; the agent uses skills (`.opencode/skills/`) and commands (`.opencode/commands/`) directly.

## Educational Response Standards

For significant tasks, respond with this enriched structure:

1. **Theory** — The mathematical concept, its purpose and foundation (LaTeX formulas when appropriate), computational complexity, advantages, limitations, and relationship with KAFE's implementation.
2. **Analysis** — Current code, what exists, and what is missing.
3. **Impact** — Affected modules, risks, and compatibility.
4. **Plan** — Ordered steps with verification steps.
5. **Implementation** — Changes, code structure, and design decisions.
6. **Validation** — Tests executed, results, and edge cases covered.
7. **Documentation** — Files updated, concept records created, and examples added.
8. **Next Steps** — Pending work and future improvements.

### Concept Record Requirements

Every ML/DL concept record MUST include:

- **Mathematical Foundation**: Formulas, complexity analysis, and a proof sketch when applicable.
- **Step-by-Step Algorithm**: How the algorithm works at each step, beyond describing its result.
- **Advantages & Limitations**: When to use it and when to avoid it.
- **Relationship with KAFE**: How the theory maps to the implementation.
- **References**: Papers, books, and authoritative sources.

Never respond with only "Done", "Fixed", "Completed".

## Documentation Update Process

After implementing ANY ML/DL component, these updates are **mandatory** (not optional):

1. Update `docs/libraries/machine.md` (or `gesha.md`) with the new component section.
2. Create/enrich concept record in `.opencode/knowledge/concepts/<name>.md`.
3. Update `.opencode/knowledge/ml-library.md` (Structure, Public API, Tests).
4. Update `.opencode/history/YYYY/YYYY-MM.md` with the addition.
5. Verify that all documentation reflects the current state of the code.

### Context Saving Verification

After each implementation, verify ALL of these exist:

- [ ] `.opencode/knowledge/concepts/<name>.md` — enriched concept record
- [ ] `.opencode/history/YYYY/YYYY-MM.md` — history record
- [ ] `tests/KafeMACHINE/<category>/` — 7+ fixtures (5 valid + 2 error)
- [ ] `.opencode/benchmarks/records.md` — benchmark with 5 scenarios
- [ ] `docs/libraries/` — updated documentation
- [ ] `.opencode/progress/roadmap.md` — reflects completion

If any of these is missing, the task is NOT complete.
