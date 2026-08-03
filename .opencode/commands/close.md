---
description: Close the current KAFE session. Requires /init to pass green first, then updates memory, progress, and history, appends a session entry to .opencode/progress/session-log.md, resets .opencode/progress/current.md to its template, and verifies repository hygiene.
---

Close the current session. This is the end-of-session lifecycle (see `.opencode/knowledge/engineering.md` — Session Closure Process). Do the steps below in order, and **abort the close** if any hard gate fails.

## Hard gate

1. Run `/init` (full checks, including `pytest tests/ -q`).
   - If it does not end green, **do not close**: either fix the failure or record the session as `blocked` in `current.md` (Status: `blocked`) and stop. Never close a session with a red suite.

## Close steps

2. Update `.opencode/memory/`:
   - `current-state.md` — architecture status, milestone, priorities, blockers.
   - `active-work.md` — what was active this session.
   - `technical-debt.md` — add items discovered, remove resolved ones.
   - `known-issues.md` — add issues found, remove resolved ones.
   - `context.md` — only if durable assumptions changed.
3. Update `.opencode/progress/`:
   - `roadmap.md`, `backlog.md`, `milestones.md` — only if priorities or plans changed.
   - Never store roadmap changes in AGENTS.md.
4. Append a session entry to `.opencode/progress/session-log.md` using its format (date, feature, status, summary, tests, validation, significant history records, next step). Append at the end; never edit earlier entries.
5. If the session produced a **significant** change (major module, public API, grammar, ML/DL component, architecture, or engineering system change), write a structured record in `.opencode/history/YYYY/` using `.opencode/history/template.md`.
6. Reset `.opencode/progress/current.md` to its template: keep the header and table structure, empty the field values, clear the `## Notes` scratchpad.
7. Verify repository hygiene:
   - No stray temporary files (`*.tmp`, debug output, `test_output.txt`-style artifacts).
   - No debug `print()` left in `src/` or `tests/`.
   - No TODOs left without context.

## Output

Report the close summary: what was updated in memory/progress/history, the session-log entry written, the `pytest` result, and confirmation that `current.md` is back to template. If any step could not be completed, say so explicitly instead of declaring the session closed.
