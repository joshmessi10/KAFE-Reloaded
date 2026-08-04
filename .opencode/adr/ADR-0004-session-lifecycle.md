# ADR-0004: Session Lifecycle (Bitácora + `/close`)

- **Status**: accepted

## Context

Without an end-of-session lifecycle, `current.md` accumulated state across sessions and there was no historical record of sessions. Session recovery relied entirely on manual memory-file updates.

## Decision

Implement a session lifecycle with two mechanisms:

- Append-only bitácora `.opencode/progress/session-log.md` — one block per closed session, written by `/close`, never edited after writing.
- `/close` command (`.opencode/commands/close.md`) — gate: `/init` must pass green (otherwise abort or record `blocked`) → update `.opencode/memory/` → update `.opencode/progress/` if priorities changed → append a session entry to `session-log.md` → write a `.opencode/history/YYYY/` record for significant changes → reset `current.md` to its template → verify repository hygiene.

`.opencode/history/` remains reserved for structured records of significant events; the bitácora holds the lightweight per-session record.

## Rationale

- Reproducible closure: a red suite never closes a session.
- Append-only log preserves session history without editing past entries.
- Complements the history layer without duplicating it: one lightweight per-session block plus structured records for significant events.

## Consequences

- `/resume` and the session-recovery template read `session-log.md` for recent closed sessions.
- `/init` validates closure consistency (a `current.md` with `Status: done` must be backed by a trailing session-log entry).
- `current.md` is live session state and is reset to template on close.
- Follow-up: enforce the lifecycle in the Reviewer (`/dod`) when applicable.

## Alternatives Considered

- Structured per-event records only — rejected: loses the per-session bitácora view.
- Delete `current.md` content without a log — rejected: leaves no session history.
