# Repository Alignment — Continuity Plan

**Last checked:** 2026-09-23
**Status:** Policy baseline is committed locally as `845bcb3` on `docs/english-migration`; four follow-on branches are planned. No follow-on branch has been created or pushed.

## Purpose and source of truth

This file tracks the work required to align KAFE-Reloaded with the adopted repository rules. Use it together with `.opencode/progress/current.md`, `.opencode/progress/backlog.md`, and the mirrored `AGENTS.md`/`CLAUDE.md` policies.

When resuming, verify the live branch, `HEAD`, index, and working tree first. The Git facts below are a dated observation, not an assumption that remains true indefinitely.

## Current checkout observation

- Baseline commit: `845bcb3` (`docs: align repository policies and retire Kiro steering`), parent `a460d5b` (`KafeMACHINE Implemented`), which matched `origin/main` when checked. The current local branch `docs/english-migration` has no upstream.
- The baseline commit contains the 26 pre-existing tracked changes/deletions and the new alignment tracker (27 paths total). The index and worktree were clean immediately after that commit. No push or branch operation has been performed.
- The current branch name overstates the payload: full English migration remains pending. The suggested rename to `docs/agent-policy-alignment` was not performed; renaming requires explicit user authorization.
- The committed policy baseline is reflected in `AGENTS.md`, `CLAUDE.md`, `OPENCODE.md`, `.opencode/`, ADR-0008/0009, the history, and backlog. `AGENTS.md` and `CLAUDE.md` match except for identifying text.
- Repository-level Kiro files have been removed. Useful file-I/O fixture and parser-cleanup details are retained in `.opencode/knowledge/verifications.md`.
- No application tests, coverage, lint, type check, or dependency audit were run for this planning work. Future branches must report their own evidence.

## Proposed branch sequence

Integrate the policy baseline first. Then implement the following branches in order; names are proposals, not created branches.

| Order | Proposed branch | Status | Scope and exit criteria |
|---|---|---|---|
| Base | `docs/agent-policy-alignment` | Policy baseline committed locally as `845bcb3` on `docs/english-migration`; not pushed | Preserve the policy/OpenCode changes and Kiro retirement. Root-file mirroring and documentation diff were verified. No branch rename or push was done. |
| 1 | `build/uv-environment` | Planned | Add `pyproject.toml` and `uv.lock`; assign runtime, dev, docs, and optional `datasets` dependencies; migrate setup, Make/OpenCode commands, Nix Python ownership, and existing workflow invocations together. Preserve the baseline without `datasets` and ANTLR generation requirements. Complete a fresh locked setup and tests on the supported local/CI platforms. |
| 2 | `test/interpreter-quality-evidence` | Planned; depends on branch 1 | Prove coverage and complete diagnostics from fixture-launched child interpreters, propagate warning policy, preserve CLI/error-fixture behavior, and reach at least 80% coverage of owned source with generated ANTLR excluded. The current audit counted 15 subprocess runner modules; that is inventory, not a passing result. |
| 3 | `refactor/english-repository` | Planned; follows the runner-evidence branch | Migrate owned runtime, internal names, grammar labels, comments, fixtures/data/outputs, documentation, paths, and OpenCode records as one coordinated line with reviewable batches. Preserve the already-English public lexer vocabulary; do not redesign KAFE keywords without a separate approved need. Keep imports, dynamic dispatch, examples, fixture pairs, MkDocs routes, and tracked assets consistent. |
| 4 | `chore/python-quality-gates` | Planned; after English names and paths settle | Fix and enforce explicit Ruff and basedpyright checks, codespell, `# pyright:`/`# noqa:` policy checks, `uv audit`, tests, coverage, warning/diagnostic policy, and documentation build in existing workflows. Finish with zero unexpected errors/warnings and actual CI evidence when publication is authorized. |

Do not create a branch per tool or a content-free CI-only branch. Each branch owns the workflow changes needed for its deliverable; the last branch integrates and verifies the full set. English documentation/runtime may split into two sequential branches only if review size requires it. A split does not count as complete until both are integrated.

## Decisions required before the English migration design is approved

1. **Historical Spanish records:** session logs are described as append-only, and ADR-0008/0009 preserve historical text. Choose a faithful one-time translation that retains IDs, dates, decisions, facts, and Git history, or explicitly approve a narrow archival exception. Do not silently omit tracked history while claiming universal English compliance.
2. **Tracked PDF and stale logs:** decide the disposition of the Spanish text in `KAFE LANGUAGE Deep Learning for Dummies .pdf` and the old machine-specific `test_results.txt`/`test_output.txt`. Do not translate old output logs into fabricated execution evidence.
3. **Names and public compatibility:** inventory dynamic `getattr` dispatch, imports, module fallback paths, fixture discovery, and generated-output names before renaming. Public lexer words are already English; grammar labels and some internal names still need review.
4. **Published paths:** produce an old-to-new route/anchor map and update all internal links and MkDocs navigation. A route change needs an explicit transition/release note; compatibility aliases require separate justification.

The current policy does not require an automatic language detector. Codespell remains a spelling check, not evidence that the full English inventory is complete.

## Resume from a new chat

Open the same `KAFE-Reloaded` project/checkout and start with this prompt:

> Continue the KAFE repository-alignment work. Read `AGENTS.md`, `CLAUDE.md`, `.opencode/progress/current.md`, `.opencode/memory/active-work.md`, `.opencode/progress/roadmap.md`, `.opencode/progress/backlog.md`, and `.opencode/progress/repository-alignment.md`. First verify the actual Git branch, HEAD, staged changes, and working tree; preserve all existing edits. Resume from the recorded next step. Commits and pushes are authorized when needed; do not create, rename, or switch branches unless I explicitly authorize it.

Update this tracker and the current-work pointers whenever a branch is approved, started, merged, paused, or its blockers change. Keep local Superpowers specs/plans ignored; durable status belongs in the tracked progress files.
