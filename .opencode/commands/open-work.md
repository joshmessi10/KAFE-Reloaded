---
description: Begin tracking a new work item: confirm no other item is in progress, select the item from the backlog/roadmap, and initialize .opencode/progress/current.md and .opencode/memory/active-work.md. Run after /resume when a new feature or task starts.
---

Open a new work item. This is the start-of-work lifecycle step (the counterpart of `/close`, which resets `current.md`). Run it when a new feature or task begins, right after `/resume`.

## Hard Gate

**Verify `/resume` was executed in this session.** Read `.opencode/progress/session-commands.md`. If `/resume` is not listed as `passed` or `completed`, **abort** with: "Cannot open work: `/resume` has not been run in this session. Run `/resume` first."

## Process

1. Confirm the trigger: a new work item is starting.
2. Verify `.opencode/progress/current.md` is not `Status: in_progress` (single active work item rule). If a work item is still active, finish or abort it (via `/close`) before opening a new one.
3. Read `.opencode/progress/backlog.md` and `roadmap.md` to confirm priorities. Select the item to open, or accept a directly requested one and add it to the backlog if missing.
4. Update `.opencode/progress/current.md`:
   - `Feature` — the new work item.
   - `Status` — `planned` or `in_progress`.
   - `Current step` — the first step to execute.
   - `Next step` — the following step.
   - `Blockers` — known blockers (or "None").
   - `Related ADRs` — ADRs relevant to the item (or "None").
5. Update `.opencode/memory/active-work.md` with the active feature, current step, next step, and expected outcome.
6. If the item was pulled from `.opencode/progress/backlog.md`, mark it in progress there.
7. If the item is significant (ML algorithm, DL component, public API, grammar, core interpreter refactor, new library), **require** `/impact` before implementation (not advisory).
8. Update `.opencode/progress/session-commands.md`: append a row with `/open-work`, current timestamp, `completed`, and the feature name.

## Output

Report the opened work item: feature, status, current step, next step, and any mandatory pre-implementation commands (`/impact`, `/adr`, `/benchmark`).
