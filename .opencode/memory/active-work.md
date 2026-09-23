# Active Work

## Current Feature

Locked uv dependency environment and repository setup alignment

## Status

In progress on the user-approved branch `build/uv-environment`. Policy baseline commits `845bcb3` and `d27df87` remain separate. Tasks 2–7 local validation are complete, and implementation commit `f4e544a` is local. The branch has no upstream or remote ref yet; push and test-workflow CI remain pending.

## Completed in this work line

- Integrated the policy baseline in its own local commits and created the approved feature branch from `d27df87`.
- Added and locked the uv project, optional Hugging Face extra, Nix support, and uv-based GitHub workflows.
- Migrated README, installation, Make, mirrored root, and OpenCode setup/testing guidance to locked uv commands.
- Updated KafeHF's missing-dependency diagnostic and fixture; the focused Python 3.10 suite passes with `datasets` absent by default.
- Removed the legacy `requirements.txt` manifest and updated the ADR, history, roadmap, backlog, and current-work records.
- Fresh Python 3.10 locked dev sync, ANTLR 4.13.2 regeneration, full test suite (485 passed), locked docs build, YAML/front-matter parsing, lock integrity, whitespace, and root-file mirror checks passed.
- Committed the scoped implementation as `f4e544a` after reviewing the complete staged change set; generated and local Superpowers artifacts were excluded.

## Next Steps

- Push `build/uv-environment` (no upstream or remote branch ref existed at the last check), then verify test CI at the pushed commit. Do not merge; the docs deployment workflow only runs on `main`.

## Authorization and platform notes

- The user explicitly approved creating and switching to `build/uv-environment`; commits and pushes are authorized when needed. Do not create, rename, or switch to another branch without explicit authorization.
- Nix is unavailable on this Windows host. GNU Make is also unavailable; use the documented direct `uv run --locked --group dev pytest ...` commands on Windows.
- The pre-existing ignored repository `.venv` was last written on 2026-09-13 and was left untouched. Current validation uses `UV_PROJECT_ENVIRONMENT` under the user temp directory.
- The full English migration and quality-gate implementation remain separate pending work.
