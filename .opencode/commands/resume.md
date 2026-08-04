---
description: Reconstruct the complete KAFE project state: reads knowledge, memory, history and progress, then reports architecture state, active/pending work, roadmap status, current milestone, blockers, technical debt, ML/DL priorities, ADRs, and recommended next steps.
---

Reconstruct the current KAFE project state. Read the engineering system in this order:

1. `.opencode/knowledge/` — how KAFE works and how engineering processes run (skim `architecture.md`, `conventions.md`, `verifications.md`, `engineering.md`, `libraries.md`, `ml-library.md`, `dl-library.md`).
2. `.opencode/memory/` — session-to-session context (`current-state.md`, `active-work.md`, `technical-debt.md`, `known-issues.md`, `context.md`).
3. `.opencode/history/` — recent significant project events (most recent records first).
4. `.opencode/progress/` — `roadmap.md`, `backlog.md`, `milestones.md`, `current.md`, and `session-log.md` (recent closed sessions) for active priorities.

Do not propose changes yet; first report state.

## Output

Produce the complete project status report:

- **Current project status** — what KAFE is, latest milestones, overall system health.
- **Architecture state** — how the interpreter, libraries, and grammar are structured (from `.opencode/knowledge/architecture.md` and `.opencode/memory/current-state.md`).
- **Active work** — items being worked on (from memory/progress).
- **Pending work** — backlog items and open roadmap items.
- **Roadmap status** — where the project is relative to `.opencode/progress/roadmap.md`.
- **Current milestone** — the active milestone (from `.opencode/progress/milestones.md` and `current.md`).
- **Blockers** — anything blocking active or pending work.
- **Technical debt** — known debt and its cost (from `.opencode/memory/technical-debt.md`).
- **ML/DL priorities** — current development focus (from `.opencode/knowledge/ml-library.md` — KafeMACHINE Priorities).
- **Recent history** — the most relevant history records with dates.
- **Relevant ADRs** — decisions that constrain the active work (list `.opencode/adr/`).
- **Recommended next steps** — a prioritized proposal for continuing work, consistent with `.opencode/progress/roadmap.md` priorities.

If a layer is empty or missing content, say so explicitly rather than guessing. Keep the report concise and actionable.
