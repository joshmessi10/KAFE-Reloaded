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

Integration cleanup `524dac5`, qs patch `d074ff9` and ownership correction `c944d88` are historical completed source milestones. Their 1,032-pass/one-skip extension aggregate, 42 browser cases and inspected VSIX predate activity tuning. Fresh comparison confirms Python runtime/tests/configuration and verifier inputs unchanged, retaining the earlier 787 passes, four documented skips and 86.89% strict child-inclusive coverage; no new full Python run is claimed. Task11 zero-finding audits remain retained with unchanged locks/configuration. Profiles at `86b78ff` and `524dac5` remain historical; no new performance claim is made.

## Current Blockers and Pending Gates

Activity-tuning source is independently approved through `e0794c1` / `kafe-guided-7`. Current-question retrieval favors conceptual guidance without incidental API/fixture spill and preserves explicit code contracts/examples. Bounded evidence help is permitted; feedback affirms a sound draft and identifies an actual gap only if present. `deepseek-v4-pro` remains an experimental comparison default, thinking disabled and streaming enabled. Task 7 passed 113 focused checks and three reference freshness builders. Final extension aggregate on that product/test source passed 1,073 tests, with one existing Windows symlink skip and zero failures. These are attributed transport/reference/source checks; documentation receives scoped validation while root owns subsequent package and whole-branch integration.

The user authorized actual Tutor testing and separately attributed public-source classroom materials. Three six-turn samples were rejected: guided-5 Flash, guided-6 Flash and guided-6 Pro. Guided-7 completed six canonical and two held-out replies, with eight requests/completions/settlements, 3,009 contiguous diagnostic records and zero tools/failures. Independent review was mixed: corrected fraud/XOR arithmetic and supported transfer/code help, but material unsupported training/settings claims and misleading overfitting guidance remain. The full answer-quality goal is not complete; no model winner or student readiness is claimed. Tuning used 26 provider calls, with the earlier four-call pilot separate; token/cost usage is unmeasured. A thinking-enabled production-equivalent comparison requires a separately approved private-history/snapshot/parser design; no such call or implementation occurred. The independently reviewed seven-file classroom ZIP is prepared (490,107 bytes; SHA256 `96819195821a0dbf829a85138349badf3a962f980619daaedb3a85893ff03e9d`), with a new shallow-tree baseline, fixed enriched temporal split and one-neuron XOR starter. Actual teacher CLI feasibility is separate from synthetic dialogue numbers and unobserved novice outcomes. The proposal's original starter/data remain absent; no public ZIP URL, installed classroom runtime or study result is claimed.

- Last verified remote revision is `edbedc7`: Python, docs validation, three-platform extension units, browser layout and pinned references passed, while docs deployment was skipped. The provisioned native 1.96.0 host launched and failed a stale setup-result assertion; untrusted execution and packaging were not reached. Reviewed correction `507865d` passed 211 focused units locally. Its authorized literal-revision push awaits human Git account selection; newer local commits cannot alter that target. Native trusted/untrusted execution plus packaging remain pending. The absent local pinned cache and installed newer VS Code provider rehearsal are separate facts.
- Physical IME/screen-reader speech, novice comprehension, 30-minute completion, learning/ICAP/SUS outcomes, managed installation and publication remain separate gates. No form submission or participant-data upload occurred. Source-only tests make no provider requests; the actual rehearsals have their own receipts.
- Ruff, basedpyright, spelling, audits and authored-policy checks exist; Python requires 3.11. Preserve unchanged-input evidence only after verifying relevant input hashes; final prose needs spelling/strict docs checks.
- Actual `docs.yml` permits the historical integration branch and checks out the selected branch, contrary to root main-only policy. This pre-existing drift is unresolved, unchanged and undispatched.
- Nix and POSIX Make are unavailable on this Windows host; use documented locked uv paths. Unrelated Gesha follow-ups retain their own historical/pending records, not current extension status.
