# Active Work

## Current Feature

Interpreter subprocess quality evidence

## Status

The user authorized the existing `test/interpreter-quality-evidence` branch and approved the implementation plan. The implementation and independent review are complete locally: the shared runner covers all 29 fixture launches, 160 invalid fixtures have complete stderr snapshots, warnings are strict in pytest and child interpreters, and the final suite passed 497 tests in 353.72s with 83.78% coverage across all 111 tracked Python source files. The report had no warnings; only generated ANTLR files were omitted. The focused commit, push, and exact-SHA GitHub CI verification are the remaining delivery steps.

## Completed implementation

- 15 test modules contain 29 `subprocess.run` calls and exercise 320 valid plus 160 expected-error fixtures.
- All 15 fixture modules use the shared runner and assert return code and complete streams. Valid programs require exact stdout and empty stderr; invalid programs compare full stderr and any explicitly observed stdout while retaining the semantic `.error.expec` assertion.
- The uv lock already resolves pytest-cov 7.1.0 and coverage 7.16.1.
- The report covers 111 tracked `src/**/*.py` files, including namespace-package directories, and excludes only the three generated ANTLR modules. It reports `src/Kafe.py` and reaches 83.78% overall.
- CI and `.opencode/knowledge/verifications.md` now use/document the same absolute-path coverage gate; the 160 stderr and two stdout sidecars passed the inventory verifier.

## Next Steps

- Create one focused commit, push only `test/interpreter-quality-evidence`, and verify GitHub test CI for that exact SHA. Do not merge or switch branches.

## Authorization and platform notes

- The user explicitly approved creating and switching to `test/interpreter-quality-evidence`; commits and pushes are authorized when needed. Do not create, rename, or switch to another branch without explicit authorization.
- Preserve expected KAFE error outputs, exit codes, and CLI behavior. Commit/push authorization applies to this work; no merge or branch change has been authorized.
- Nix and GNU Make are unavailable on this Windows host; use locked uv commands for Python validation.
