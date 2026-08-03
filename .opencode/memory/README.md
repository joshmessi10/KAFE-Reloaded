# Memory

Session-to-session project memory: current state, active work, debt, known issues, and context.

Consult `.opencode/memory/` second when resuming work (after `.opencode/knowledge/`, before `.opencode/history/` and `.opencode/progress/` — see AGENTS.md — Repository Knowledge Map).

## Files

| File | Purpose |
|------|---------|
| `current-state.md` | Current architecture status, milestone, priorities, blockers |
| `active-work.md` | Active feature, current step, next step, expected outcome |
| `technical-debt.md` | Debt items, cost, risk, proposed resolution |
| `known-issues.md` | Known bugs, limitations, workarounds |
| `context.md` | Project context, assumptions, engineering notes |

## Rules

- Files here are short-lived context; update them when work moves.
- Durable decisions belong in `.opencode/history/` records, RFC/ADR records, and `.opencode/knowledge/`.
- Each file is a template: keep the section structure, replace the placeholder values.
