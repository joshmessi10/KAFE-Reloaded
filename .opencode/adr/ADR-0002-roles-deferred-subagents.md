# ADR-0002: Roles Documented, Deferred as OpenCode Subagents

- **Status**: accepted

## Context

AGENTS.md defines five engineering roles — Architect, Builder, Reviewer, Historian, and Tester — as responsibilities agents must respect. None of them is implemented as an opencode agent or subagent: `opencode.json` has no `agent` key, `.opencode/agent/` does not exist, and no global agent config defines them. A single agent (the Engineering Lead) currently performs every role, guided by commands and skills that represent each responsibility.

## Decision

Keep the five roles as documented responsibilities now, and defer their implementation as opencode subagents to a later phase. When they are implemented:

- Use the anti-telephone rule (`.opencode/knowledge/engineering.md` — Subagent Coordination Process): subagents write results to files and reply only with file references.
- Apply the complexity escalation table (trivial → 1 implementer; medium → +1 reviewer; complex → 2-3 explorers → implementer → reviewer).

## Rationale

- Avoids premature engineering: the current single-agent volume of work does not justify the orchestration overhead yet.
- Documents the intended end state without blocking current work.
- Keeps the responsibilities stable so that the future agent implementation does not change the process, only the executor.

## Consequences

- Responsibilities do not change: `/impact` (Architect), skills `add-ml-algorithm`/`add-dl-layer`/`modify-grammar`/`create-library` (Builder), `/dod` (Reviewer), memory/history/bitácora (Historian), `/benchmark` (Tester).
- Follow-up: the subagent implementation must be proposed via impact analysis and recorded as an ADR before implementation.
- Follow-up: the anti-telephone rule and escalation table are already documented and ready to apply.

## Alternatives Considered

- Implement the agents now — rejected: premature complexity, no workflow volume yet to justify orchestration.
- Remove the roles — rejected: loses the responsibility model that guides `/dod`, `/benchmark`, and the skills.
