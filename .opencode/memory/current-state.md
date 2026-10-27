# Current State

## Architecture Status

KAFE is an educational Python 3.11+ DSL with an ANTLR 4 parser and Visitor-based interpreter. Its interpreter, Python libraries/tests, MkDocs documentation and JavaScript VS Code extension with plain HTML/CSS/JavaScript Tutor webview are active. No web backend or application database is present.

The repository engineering system under `.opencode/` is established. KafeMACHINE's model-selection and preprocessing components and KafeGESHA's dense layer, activations, optimizers, and soft-clustering support are implemented. Conv2D, LSTM, Transformer, and performance work remain on the product roadmap.

## Earlier Repository Alignment (historical branch receipts)

The English migration was tracked on `refactor/english-repository`. Tasks 1–7 are complete; Task 5's documentation/routes commit is `13ca2bf1b84a692780fff0c83106c46fdf6d15d1`. That milestone's language audit, strict docs build, tracked-file codespell check, and full regression suite passed.

The separate `test/interpreter-quality-evidence` milestone is complete but remains unmerged. Its exact-SHA GitHub test run passed at `6e8edd5565c6c1341697426a2bd0dff4187dc5cc`; its final local run passed 497 tests at 83.78% coverage across 111 tracked Python source files with no warnings. Root policy restricts documentation deployment to `main`; actual workflow drift is listed below.

## Earlier Migration Priorities

1. Commit the reviewed English repository alignment changes on the existing branch.
2. Check whether a matching remote branch already exists before pushing; do not create, rename, or switch branches without explicit authorization.
3. After repository alignment, resume KafeGESHA layer development, legacy reviews, and performance work according to the roadmap or user reprioritization.

## Current Release Line (2026-10-27)

Active branch `feature/vsc-extension`: extension 2.3.0 over immutable published runtime 0.3.0. ADR-0033 records one guided Tutor, independent Pause, response preservation and mode-only archive payload v2 at the historical v1 key; older readers are unsupported after successful v2 save, while export stays schema 1. Ordinary style requests use bounded eligible history without durable memory. Eight conceptual topics and reviewed MACHINE/GESHA contracts remain available before runtime setup. Native credentials/diffs/terminals and separate preparation/Review/Apply/Run authorities remain.

Integration cleanup `524dac5` and qs patch `d074ff9` remain complete. Final review correction `c944d88` preserves new conversation ownership through nested revocation publications and guarantees original-request cleanup; README documentation links survive packaging. Updated aggregate: 1,032 passes and one existing Windows symlink skip; browser layout: 42/42; syntax, freshness and revised VSIX inspection pass. All nine Python gate inputs remain unchanged, retaining 787 passes, four documented skips and 86.89% strict child-inclusive coverage. Task11 zero-finding audits are retained with unchanged locks/configuration. Profiles at `86b78ff` and `524dac5` remain historical; no new performance claim is made. Initial whole-plan review requested the final corrections; scoped re-review, exact-revision hosted evidence and absent-cache native acceptance remain pending.

## Current Blockers and Pending Gates

- Exact local native VS Code 1.96.0 cache is absent. Native host-policy/acceptance, physical IME and screen-reader speech require separate evidence; installed newer VS Code is not a substitute.
- Real-provider answer review, managed-install/publication and learner efficacy/ICAP/SUS outcomes remain separate release/research gates. No provider request, form submission or research upload was performed.
- Ruff, basedpyright, spelling, audits and authored-policy checks exist; Python requires 3.11. Preserve unchanged-input evidence only after verifying relevant input hashes; final prose needs spelling/strict docs checks.
- Actual `docs.yml` permits the historical integration branch and checks out the selected branch, contrary to root main-only policy. This pre-existing drift is unresolved, unchanged and undispatched.
- Nix and POSIX Make are unavailable on this Windows host; use documented locked uv paths. Unrelated Gesha follow-ups retain their own historical/pending records, not current extension status.
