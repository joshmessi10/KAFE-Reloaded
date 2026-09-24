# Repository Alignment — Continuity Plan

**Last checked:** 2026-09-24
**Status:** The active branch is `refactor/english-repository`. Tasks 1–7 of the English repository migration are complete. The final audit passed: 498 tests, 83.78% coverage, no test warnings, strict documentation build, tracked-file spelling check, and repository-wide language scan. Commits and pushes are authorized when needed; do not create, rename, or switch branches without explicit authorization.

## Purpose and Source of Truth

This file tracks the work needed to align KAFE-Reloaded with adopted repository policies. Use it with `.opencode/progress/current.md`, `.opencode/progress/backlog.md`, and the mirrored `AGENTS.md`/`CLAUDE.md` policies.

On resume, verify the live branch, `HEAD`, index, and working tree before acting. Observations below are dated and do not replace a fresh Git check.

## Current Checkout Observation

- **Branch:** `refactor/english-repository`.
- **Task 6 starting state:** the index was empty and the worktree was clean at Task 5 commit `13ca2bf1b84a692780fff0c83106c46fdf6d15d1` before appending ADR-0011. ADR-0011 authorized the one-time faithful backfill; Tasks 6 and 7 are now complete.
- **Final audit:** the tracked-tree lexicon audit found no remaining Spanish prose after review of its candidates; `AGENTS.md` and `CLAUDE.md` have matching substantive bodies. The full locked suite passed 498 tests in 349.42s at 83.78% coverage, with no test warnings. The shared subprocess harness passed 13 focused tests. Strict MkDocs build and tracked-file codespell both passed; the Material for MkDocs MkDocs 2.0 advisory was printed before the successful build.
- **Branch policy:** continue on this branch. The user authorized commits and pushes when needed but no branch operations beyond the current branch. The last successful `git ls-remote` returned no `origin/refactor/english-repository` ref; a later refresh could not connect to GitHub on port 443. No push was made because it would create a remote branch; do not create or switch branches without explicit authorization.
- **Task 5 evidence:** 36 old-to-new documentation routes were checked; local Markdown links resolved; `uv run --locked --python 3.10 --group docs --no-dev mkdocs build --strict` succeeded. Material for MkDocs printed an upstream MkDocs 2.0 advisory before the successful build; there were no page, navigation, or link errors.

## Completed and Remaining Sequence

| Order | Branch or workstream | Status | Scope and evidence |
|---|---|---|---|
| Base | `docs/english-migration` | Policy baseline committed locally as `845bcb3` plus progress commit `d27df87`; not pushed | Preserved the policy/OpenCode baseline and retired repository Kiro configuration. This branch was not renamed. |
| 1 | `build/uv-environment` | Complete: implementation `f4e544a` and progress commit `b40965f` pushed; GitHub test CI passed with 485 tests | Uses `pyproject.toml` and `uv.lock`; keeps runtime, dev, docs, and optional `datasets` dependencies distinct; preserves Nix system-tool ownership and ANTLR requirements. |
| 2 | `test/interpreter-quality-evidence` | Complete, pushed, and intentionally unmerged at `6e8edd5565c6c1341697426a2bd0dff4187dc5cc`; GitHub `Run Tests` run 127 passed at that exact SHA | 497 tests passed locally in 353.72s with 83.78% coverage across all 111 tracked Python source files and no warnings. All 29 fixture launches use the shared runner; 160 invalid fixtures have full stderr snapshots and two have stdout snapshots. |
| 3 | `refactor/english-repository` | Complete locally; Tasks 1–7 audited | Migrates owned runtime names, internal APIs, grammar labels, fixtures, outputs, docs, paths, and project records. Preserves English KAFE syntax and built-in import keys; no Spanish compatibility aliases or old-route redirects are retained. The final test gate passed 498 tests at 83.78% coverage; the tracked-tree language scan, strict docs build, and scoped tracked-file codespell check passed. |
| 4 | `chore/python-quality-gates` | Planned; not started | Adds and enforces explicit Ruff, basedpyright, codespell, `uv audit`, suppression-policy, test, coverage, warning, and documentation gates using existing workflows. |

Do not create a branch per tool or a content-free CI-only branch. Each coherent workstream owns the workflow changes needed for its deliverable. A migration split does not count as complete until every part has been integrated and audited.

## Resolved English-Migration Decisions

1. **Historical records:** The user approved a one-time faithful translation of existing Spanish prose while preserving dates, IDs, chronology, decisions, facts, and Git history. Accepted ADR-0011 authorizes this narrow exception; future session and history records remain append-only and English.
2. **Retired artifacts:** The user approved removing only `KAFE LANGUAGE Deep Learning for Dummies .pdf`, `test_results.txt`, and `test_output.txt` from the current tree. Their original Git objects remain recovery points. Do not translate their contents or fabricate current test evidence from old logs.
3. **Names and compatibility:** Tasks 1–4 inventoried dispatch, imports, fixtures, and generated outputs. The migration intentionally removes old Spanish internal/API aliases; KAFE's existing English executable vocabulary and built-in import keys remain unchanged.
4. **Published documentation:** Task 1's route/anchor map and Task 5's link/build evidence govern the new English docs paths. Old routes have no redirects; release notes must point users to the migration map.

## Task 7 Exit Criteria

- Audit every tracked current-tree text surface, including source, tests, docs, project records, workflows, configuration, and text-bearing assets.
- Search for Spanish prose, old operational paths and identifiers, compatibility aliases, unapproved artifact deletions, and stale branch/test-status claims. Preserve literal historical old paths only when they are clearly presented as migration history or old-to-new mapping.
- Verify `AGENTS.md` and `CLAUDE.md` have identical substantive bodies; validate source/test/docs path references and the strict MkDocs build.
- Run the regression gates required by the approved migration plan at the actual final change set. Report only checks that were actually run, with exact results; record unavailable or unimplemented gates as pending.
- **Result:** the repository-wide lexicon audit and manual candidate review found zero confirmed Spanish prose; strict MkDocs build succeeded; tracked-file codespell passed with documented domain-token ignores; `AGENTS.md`/`CLAUDE.md` substantive bodies match; all 498 tests passed in 349.42s at 83.78% coverage with no warnings; 13 focused process-harness tests passed. ANTLR generation succeeded earlier in this migration and generated files remain ignored. No independent reviewer could be allocated because the host thread limit was reached; the final diff received an inline read-only self-review with no remaining blocking findings.
- All in-scope findings are resolved. The local remote-ref check found no existing `origin/refactor/english-repository`; a push to that name would create a remote branch. Do not create, rename, or switch branches without explicit authorization.

## Resume Instructions

Use the same `KAFE-Reloaded` checkout and existing branch. Start by reading `AGENTS.md`, `CLAUDE.md`, `.opencode/progress/current.md`, `.opencode/memory/active-work.md`, `.opencode/progress/roadmap.md`, `.opencode/progress/backlog.md`, and this tracker; then verify the live Git branch, `HEAD`, index, and worktree. Keep local Superpowers specs, plans, briefs, and reports ignored; durable project state belongs in tracked progress files.
