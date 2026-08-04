# Active Work

Template for tracking the active feature. Update whenever the current step changes.

## Active Feature

<!-- The feature or task currently being worked on. -->

Command set completion: `/open-work` command created, `.opencode/commands/README.md` documents the 8 commands with a Mandatory Invocation matrix, and the enforcement gaps are closed (`/impact` in `create-library`, `/dod` gate in `/close`, `/init` + `/resume` in startup).

## Current Step

<!-- The step being executed right now. -->

Implementation complete (commands README + `/open-work` + enforcement in AGENTS.md, create-library, close, engineering.md, OPENCODE.md, benchmarks README, init check 9). Remaining: final validation (grep consistency + full test suite), history record, and closing the work item.

## Next Step

<!-- The next step to execute after the current one. -->

Validate: grep consistency of the 8 commands across README ↔ AGENTS.md ↔ init.md ↔ skills ↔ close.md; run `pytest tests/ -q`; write the history record; mark `current.md` done.

## Expected Outcome

<!-- What success looks like. -->

A complete command set with every mandatory invocation documented and enforced, so commands are actually called where required.
