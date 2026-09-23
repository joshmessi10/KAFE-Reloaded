# Repository Alignment — Continuity Plan

**Last checked:** 2026-09-23
**Status:** The user-approved `build/uv-environment` branch has passed local validation (full suite: 485 tests; docs build clean). The scoped feature commit, push, and test-workflow CI remain pending.

## Purpose and source of truth

This file tracks the work required to align KAFE-Reloaded with the adopted repository rules. Use it together with `.opencode/progress/current.md`, `.opencode/progress/backlog.md`, and the mirrored `AGENTS.md`/`CLAUDE.md` policies.

When resuming, verify the live branch, `HEAD`, index, and working tree first. The Git facts below are a dated observation, not an assumption that remains true indefinitely.

## Current checkout observation

- Current branch: `build/uv-environment`, created from `d27df87` after the user's explicit approval. `HEAD` is `d27df87`; policy baseline commit `845bcb3` and the follow-up state-record commit remain separate. The local `docs/english-migration` branch still points to the baseline state. Verify the live branch, index, and worktree before any staging or publication.
- The feature branch has no upstream and has not been pushed. Tasks 2–7 are present as uncommitted changes; local validation passed, but no feature commit exists yet. Commits and pushes are authorized when needed after the approved validation; do not merge this branch.
- The branch-creation/switch authorization applies to `build/uv-environment`. Do not create, rename, or switch to another branch without explicit authorization. The former proposal to rename `docs/english-migration` was not carried out.
- The committed policy baseline is reflected in `AGENTS.md`, `CLAUDE.md`, `OPENCODE.md`, `.opencode/`, ADR-0008/0009, history, and progress. `AGENTS.md` and `CLAUDE.md` remain substantively mirrored.
- Repository-level Kiro files have been removed. Useful file-I/O fixture and parser-cleanup details are retained in `.opencode/knowledge/verifications.md`.
- Local evidence: fresh Python 3.10 locked dev sync and default `datasets` absence; opt-in extra import; ANTLR 4.13.2 parser regeneration; full suite (485 passed); KafeHF focused suite (2 passed); clean locked docs build; workflow/configuration and role front-matter YAML parsed; uv lock integrity, whitespace, and root-file mirror checks passed. Nix and GNU Make are unavailable on this Windows host; the Windows guide uses direct uv/pytest commands. Test CI awaits push; the docs workflow deploys only from `main`.

## Proposed branch sequence

Integrate the policy baseline first. Then implement the following branches in order; names are proposals, not created branches.

| Order | Proposed branch | Status | Scope and exit criteria |
|---|---|---|---|
| Base | `docs/english-migration` | Policy baseline committed locally as `845bcb3` plus state record `d27df87`; not pushed | Preserve the policy/OpenCode changes and Kiro retirement. Root-file mirroring and documentation diff were verified. The branch was not renamed. |
| 1 | `build/uv-environment` | Local implementation and validation complete; commit, push, and test CI pending | Add `pyproject.toml` and `uv.lock`; assign runtime, dev, docs, and optional `datasets` dependencies; migrate setup, Make/OpenCode commands, Nix Python ownership, workflows, and KafeHF's optional diagnostic together. Preserve the baseline without `datasets` and ANTLR generation requirements. Review and commit the complete local diff, push the authorized branch, and verify test-workflow CI before declaring it complete. |
| 2 | `test/interpreter-quality-evidence` | Planned; depends on branch 1 | Prove coverage and complete diagnostics from fixture-launched child interpreters, propagate warning policy, preserve CLI/error-fixture behavior, and reach at least 80% coverage of owned source with generated ANTLR excluded. The current audit counted 15 subprocess runner modules; that is inventory, not a passing result. |
| 3 | `refactor/english-repository` | Planned; follows the runner-evidence branch | Migrate owned runtime, internal names, grammar labels, comments, fixtures/data/outputs, documentation, paths, and OpenCode records as one coordinated line with reviewable batches. Preserve the already-English public lexer vocabulary; do not redesign KAFE keywords without a separate approved need. Keep imports, dynamic dispatch, examples, fixture pairs, MkDocs routes, and tracked assets consistent. |
| 4 | `chore/python-quality-gates` | Planned; after English names and paths settle | Fix and enforce explicit Ruff and basedpyright checks, codespell, `# pyright:`/`# noqa:` policy checks, `uv audit`, tests, coverage, warning/diagnostic policy, and documentation build in existing workflows. Finish with zero unexpected errors/warnings and actual CI evidence when publication is authorized. |

Do not create a branch per tool or a content-free CI-only branch. Each branch owns the workflow changes needed for its deliverable; the quality branch integrates and verifies the full set. English documentation/runtime may split into two sequential branches only if review size requires it. A split does not count as complete until both are integrated.

## Decisions required before the English migration design is approved

1. **Historical Spanish records:** session logs are described as append-only, and ADR-0008/0009 preserve historical text. Choose a faithful one-time translation that retains IDs, dates, decisions, facts, and Git history, or explicitly approve a narrow archival exception. Do not silently omit tracked history while claiming universal English compliance.
2. **Tracked PDF and stale logs:** decide the disposition of the Spanish text in `KAFE LANGUAGE Deep Learning for Dummies .pdf` and the old machine-specific `test_results.txt`/`test_output.txt`. Do not translate old output logs into fabricated execution evidence.
3. **Names and public compatibility:** inventory dynamic `getattr` dispatch, imports, module fallback paths, fixture discovery, and generated-output names before renaming. Public lexer words are already English; grammar labels and some internal names still need review.
4. **Published paths:** produce an old-to-new route/anchor map and update all internal links and MkDocs navigation. A route change needs an explicit transition/release note; compatibility aliases require separate justification.

The current policy does not require an automatic language detector. Codespell remains a spelling check, not evidence that the full English inventory is complete.

## Resume from a new chat

Open the same `KAFE-Reloaded` project/checkout and start with this prompt:

> Continue the KAFE uv migration on the existing checkout and verify the actual Git branch, HEAD, index, and working tree first. Preserve all existing edits. The user approved `build/uv-environment` and authorized commits/pushes when needed; do not merge or create, rename, or switch to another branch without explicit authorization.

Update this tracker and the current-work pointers whenever a branch is approved, started, merged, paused, or its blockers change. Keep local Superpowers specs/plans ignored; durable status belongs in the tracked progress files.
