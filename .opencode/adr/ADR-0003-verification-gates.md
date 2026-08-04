# ADR-0003: Local Verification Gates Instead of CI Hooks

- **Status**: accepted

## Context

The engineering system requires that an agent proves work rather than asserting it ("the agent does not say *it works*, it demonstrates it"). The reference subagent-harness used agent-local hooks (`PostToolUse` running tests after every edit, `Stop` forcing `init.sh`) to enforce verification. KAFE needed equivalent enforcement without depending on agent tool hooks.

## Decision

Use explicit local gates through commands instead of CI hooks:

- `/init` runs the full test suite (`pytest tests/ -q`) and validates progress consistency (single active work item, valid `current.md`, coherent closure).
- `/close` requires `/init` green before closing; if red, the session aborts the close or is recorded as `blocked`.
- No `PostToolUse`/`Stop` agent hooks are configured; CI real verification stays in `.github/workflows/tests.yml`.
- Quality framing documented in `.opencode/knowledge/verifications.md`: standards are the sole judge for reviews, verification is demonstration not assertion, and anti-patterns are listed.

## Rationale

- Verification is explicit, auditable, and executed at a defined gate (`/close`) rather than silently in the background.
- No dependency on agent-hook mechanisms, which vary by tool.
- CI continues to verify on push/PR without duplicating the local gate semantics.

## Consequences

- No session closes with a red suite.
- The agent must run the gates consciously; anti-patterns (assertion-only tests, filesystem mocks, `done` with red suite) are documented as review failures.
- Follow-up: benchmarks (`/benchmark`) and DoD (`/dod`) remain explicit gates for ML/DL and task completion.

## Alternatives Considered

- Agent hooks (`PostToolUse`/`Stop`) — rejected by decision: couples verification to the agent tool's hook mechanism.
- CI-only verification — rejected: does not cover local session closure or progress consistency.
