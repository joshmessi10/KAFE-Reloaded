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

## Current Release Line (2026-10-28)

Active branch `feature/vsc-extension`: extension 2.3.0 over immutable published runtime 0.3.0. ADR-0033 records one guided Tutor, independent Pause, response preservation and mode-only archive payload v2 at the historical v1 key; older readers are unsupported after successful v2 save, while export stays schema 1. Ordinary style requests use bounded eligible history without durable memory. Eight conceptual topics and reviewed MACHINE/GESHA contracts remain available before runtime setup. Native credentials/diffs/terminals and separate preparation/Review/Apply/Run authorities remain.

Integration cleanup `524dac5`, qs patch `d074ff9` and ownership correction `c944d88` are historical completed source milestones. Their 1,032-pass/one-skip extension aggregate, 42 browser cases and inspected VSIX predate activity tuning. Fresh comparison confirms Python runtime/tests/configuration and verifier inputs unchanged, retaining the earlier 787 passes, four documented skips and 86.89% strict child-inclusive coverage; no new full Python run is claimed. Task11 zero-finding audits remain retained with unchanged locks/configuration. Profiles at `86b78ff` and `524dac5` remain historical; no new performance claim is made.

## Current Blockers and Pending Gates

On 2026-10-28 the user chose **Keep the current checkpoint**. The Tutor guidance checkpoint remains at `9c25d04` / `kafe-guided-7`, `deepseek-v4-pro`, thinking disabled and streaming enabled. No further model calls, reasoning-mode experiment or protocol implementation is approved by that choice. The full answer-quality goal remains **incomplete**; retaining this checkpoint is not a model-winner, novice-readiness or classroom-efficacy verdict.

Task 9 Stage A at `9c25d04` passed 1,087 extension tests with one existing Windows symlink skip and zero failures, plus 134 focused composition/reference/evaluation checks, 211 native-fixture/host unit checks and 47 fresh affected Python reference/policy checks. All three reference freshness builders, syntax, spelling, authored policy and whitespace checks passed. Canonical prompts/oracles and assessment boundaries remain unchanged. Retained local full Python evidence remains 787 passes, four documented skips and 86.89% strict child-inclusive coverage with unchanged input proof; it is not a fresh full local run.

The final rehearsal on `9c25d04` completed the six canonical messages and one additional constructor request H3: seven requests/completions/completed settlements, 3,114 contiguous sanitized diagnostic records, zero tools and zero transport failures. Independent actual-answer review did not accept the sample. F1/F2 fraud interpretation and comparison were supported. X3 recalled the earlier 75% XOR baseline as about 50% and invented training membership and absent validation; X1 gave an unsupported cause for near-threshold scores, X2 overstated experimental isolation and F3 manufactured a conditional draft gap. H3 supplied valid `machine.logistic_regression(0.1, 1000)` and `machine.gaussian_nb()` creation fragments, with a minor inaccurate introductory claim about two forms for each model. Earlier H1/H2 remain round4-only evidence. Across five tuning rounds, 33 requests were made (6+6+6+8+7); the earlier four-request pilot is separate. Tokens and cost were not measured. These are real model answers to synthetic learner reports, not observed classifier results or novice outcomes.

Read-only reasoning feasibility identified that a production-equivalent thinking-enabled comparison would need a new private reasoning/history, snapshot and parser contract. It remains an unapproved option. The user's checkpoint decision closes the proposed next step: no reasoning-enabled call, spike or protocol change is scheduled or authorized.

The independently reviewed seven-file classroom ZIP is prepared (490,107 bytes; SHA256 `96819195821a0dbf829a85138349badf3a962f980619daaedb3a85893ff03e9d`), with a new shallow-tree baseline, fixed enriched temporal split and one-neuron XOR starter. Actual teacher CLI feasibility is separate from synthetic dialogue numbers and unobserved novice outcomes. The proposal's original starter/data remain absent; no public ZIP URL, installed classroom runtime or study result is claimed.

- Source `9c25d04` was pushed and its remote SHA independently verified. Its automatic Python workflow `40634874604` passed; extension workflow `40634874680` passed all three-platform units, layout and pinned-reference gates. Real Windows VS Code 1.96 job `122639811898` completed 12/12 trusted and 12/12 genuinely untrusted cases, including denied Run/Setup and the final no-KAFE-terminal assertion, then passed VSIX packaging and verification. Docs workflow `40634874746` validated successfully; deployment was skipped. Known DialogService headless trust-prompt stderr was retained without suppression or trust changes, so this is a completed native gate rather than a claim of pristine startup logs. These exact-revision CI receipts apply to source `9c25d04`; later documentation-only commits require their own delivery receipts. The local 1.143.1 provider rehearsal remains separate from pinned 1.96 CI. The correction review and original `dcf1de2` package inspection are complete. Earlier `edbedc7` and `507865d` native failures remain historical; completed `9c25d04` acceptance does not rewrite them.

The final delivery also preserves the concurrently pushed Run-output work from `039fcea`: unbuffered Python output, retained native terminal results and no Run entries in the rendered Tutor conversation. The Tutor policy, provider configuration and canonical rehearsal prompts remain unchanged. A fresh combined-tree aggregate passed 1,091 tests with one existing Windows skip and zero failures (1,092 total, 40.328 s); all 42 rendered browser cases passed (24.706 s). The earlier `9c25d04` native CI remains an exact-revision historical receipt; merged-source packaging and CI require their own receipts.

- Actual `docs.yml` permits the historical integration branch and checks out the selected branch, contrary to root main-only policy. This pre-existing drift remains unresolved, unchanged and undispatched.
