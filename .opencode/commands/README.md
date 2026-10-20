# Commands

Reusable engineering commands for KAFE. Commands are invoked by opencode from `.opencode/commands/<name>.md` as `/name`.

## Convention

Each command is a Markdown file with frontmatter:

```markdown
---
description: One sentence: what it does AND when to trigger it.
---
```

## Available Commands

| Command | Purpose |
|---------|---------|
| `/init` | Validate the KAFE engineering system (required layers, progress consistency, full test suite) and print the readiness report |
| `/resume` | Reconstruct the complete project state at the start of a session |
| `/open-work` | Begin tracking a new work item (initialize `current.md` and `active-work.md`) |
| `/impact` | Run impact analysis before adding ML/DL components, changing public APIs, refactoring the core, or modifying grammar |
| `/adr` | Create an ADR record for an important engineering decision |
| `/benchmark` | Benchmark an ML algorithm, DL component, or performance optimization |
| `/dod` | Verify the Definition of Done for the current task |
| `/close` | Close the current session (requires `/init` green and the active work item through `/dod`) |

## Mandatory Invocation

These commands are **not optional** in the contexts below. When the trigger occurs, the command must run — it is not a suggestion. The "Enforced at" column lists the files that already reference the trigger so the invocation can be audited.

| Command | Must run when | Enforced at |
|---------|---------------|-------------|
| `/init` | Starting a session; as the hard gate of `/close`; after engineering-system changes | `OPENCODE.md` — Initialization Checks; `.opencode/commands/close.md` |
| `/resume` | Starting a session | `AGENTS.md` — Session Recovery; `OPENCODE.md` — Startup Procedure |
| `/open-work` | Opening a new work item after `/resume` | `AGENTS.md` — "If you are…" table |
| `/impact` | Before adding an ML algorithm or DL component, adding a new library, changing public APIs, refactoring the core interpreter, or modifying grammar rules | `ml-library.md` / `dl-library.md`; skills `add-ml-algorithm`, `add-dl-layer`, `modify-grammar`, `create-library`; `AGENTS.md` — Impact Analysis |
| `/adr` | Architecture changes, public API changes, or important engineering decisions (automatic) | `AGENTS.md` — Automatic Actions; skill `create-adr` |
| `/benchmark` | Adding an ML algorithm, DL component, or performance optimization | skills `add-ml-algorithm`, `add-dl-layer`; `AGENTS.md` — Tester role; `engineering.md` — Benchmark Process |
| `/dod` | Before any task is declared complete; before a release; for the active work item before `/close` | All skills (final step); skill `release-checklist`; `.opencode/commands/close.md` |
| `/close` | End of every session | `engineering.md` — Session Closure Process; `AGENTS.md` — "If you are…" table |

## Lifecycle

`/init` → `/resume` → `/open-work` → (`/impact` → `/adr` → `/benchmark`) → `/dod` → `/close`

## Adding a Command

1. Create `.opencode/commands/<name>.md` with frontmatter.
2. Keep the `description` as one sentence: what it does AND when to trigger it.
3. Register it in this README, in `AGENTS.md` (Knowledge Map command row and "If you are…" table if it has a mandatory trigger), and in `/init` (check 9).
