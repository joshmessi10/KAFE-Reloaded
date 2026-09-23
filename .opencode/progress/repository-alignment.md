# Repository Alignment — Continuity Plan

**Last checked:** 2026-09-23
**Status:** `build/uv-environment` passed local validation and GitHub test CI. The user-approved `test/interpreter-quality-evidence` branch is complete and published: 497 tests passed in 353.72s at 83.78% coverage across 111 tracked Python source files with no warnings; independent review passed; GitHub Actions `Run Tests` passed at implementation SHA `6e8edd5565c6c1341697426a2bd0dff4187dc5cc` (run 127, ID `35901709547`). Do not merge or switch branches without explicit authorization.

## Purpose and source of truth

This file tracks the work required to align KAFE-Reloaded with the adopted repository rules. Use it together with `.opencode/progress/current.md`, `.opencode/progress/backlog.md`, and the mirrored `AGENTS.md`/`CLAUDE.md` policies.

When resuming, verify the live branch, `HEAD`, index, and working tree first. The Git facts below are a dated observation, not an assumption that remains true indefinitely.

## Current checkout observation

- Current branch: `test/interpreter-quality-evidence`, created with user approval from `2500945` after confirming `build/uv-environment` was clean and matched its upstream. No local or remote target branch ref existed before creation. The local `docs/english-migration` branch still points to the baseline state. Reverify branch, HEAD, index, and worktree before further work.
- Final review began from `HEAD` `2500945` with a clean index; the implementation and continuity edits were preserved. The independent review identified and cleared the path-boundary, nonzero-exit test, and history-record findings. The resulting commit was pushed; at verification the working tree was clean and the local and remote refs matched `6e8edd5565c6c1341697426a2bd0dff4187dc5cc`.
- Prior local checks passed (full suite: 485; clean locked docs build). GitHub `Run Tests` passed at pushed commit `b40965f`; the log reports 485 passed in 56.07s. The run added non-blocking deprecation advisories for the Node 20 transition affecting checkout/setup actions, `setup-java@v4`, and the upcoming `ubuntu-latest` migration. On the current branch, the final full gate passed 497 tests in 353.72s at 83.78%, measured all 111 tracked source files, omitted only the three generated parser files, and produced no warning lines. GitHub `Run Tests` passed at exact implementation SHA `6e8edd5565c6c1341697426a2bd0dff4187dc5cc` (run 127). The docs deployment workflow remains main-only; do not merge this branch.
- The user explicitly authorized creating and switching to `test/interpreter-quality-evidence`; commits and pushes are authorized when needed. Do not create, rename, or switch to another branch without explicit authorization. The former proposal to rename `docs/english-migration` was not carried out.
- The committed policy baseline is reflected in `AGENTS.md`, `CLAUDE.md`, `OPENCODE.md`, `.opencode/`, ADR-0008/0009, history, and progress. `AGENTS.md` and `CLAUDE.md` remain substantively mirrored.
- Repository-level Kiro files have been removed. Useful file-I/O fixture and parser-cleanup details are retained in `.opencode/knowledge/verifications.md`.
- Local evidence for the prior branch: fresh Python 3.10 locked dev sync and default `datasets` absence; opt-in extra import; ANTLR 4.13.2 parser regeneration; full suite (485 passed); KafeHF focused suite (2 passed); clean locked docs build; workflow/configuration and role front-matter YAML parsed; uv lock integrity, whitespace, and root-file mirror checks passed. Nix and GNU Make are unavailable on this Windows host; the Windows guide uses direct uv/pytest commands. GitHub test CI passed for the prior branch at `b40965f`; the docs workflow deploys only from `main`.

## Proposed branch sequence

Integrate the policy baseline first. Then implement the following branches in order; names are proposals, not created branches.

| Order | Proposed branch | Status | Scope and exit criteria |
|---|---|---|---|
| Base | `docs/english-migration` | Policy baseline committed locally as `845bcb3` plus state record `d27df87`; not pushed | Preserve the policy/OpenCode changes and Kiro retirement. Root-file mirroring and documentation diff were verified. The branch was not renamed. |
| 1 | `build/uv-environment` | Complete: implementation `f4e544a` and progress commit `b40965f` pushed; GitHub test CI passed (485 tests) | Add `pyproject.toml` and `uv.lock`; assign runtime, dev, docs, and optional `datasets` dependencies; migrate setup, Make/OpenCode commands, Nix Python ownership, workflows, and KafeHF's optional diagnostic together. Preserve the baseline without `datasets` and ANTLR generation requirements. Hosted docs deployment remains main-only. |
| 2 | `test/interpreter-quality-evidence` | Complete: `6e8edd5` pushed; GitHub `Run Tests` run 127 passed at that SHA; 497 local tests and 83.78% coverage across 111 source files, no warnings | All 29 fixture launches use the shared runner; 160 invalid fixtures have complete stderr snapshots and two explicit stdout snapshots. Pytest and child warnings are errors; the existing CI workflow enforces absolute-path subprocess coverage at 80%. Preserve CLI behavior and omit only the three generated ANTLR modules. Do not merge this branch. |
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

> The approved interpreter subprocess quality evidence work is complete on `test/interpreter-quality-evidence`; local validation and independent review passed, commit `6e8edd5` is pushed, and GitHub `Run Tests` run 127 passed at its exact SHA. Keep it unmerged. Get explicit approval before creating or switching to the next repository-alignment branch.

Update this tracker and the current-work pointers whenever a branch is approved, started, merged, paused, or its blockers change. Keep local Superpowers specs/plans ignored; durable status belongs in the tracked progress files.
