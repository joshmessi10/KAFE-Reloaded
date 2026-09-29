# Known Issues

Template. Each entry: bug/limitation, impact, and workaround. Keep entries short; remove once fixed.

## Current Issues

<!-- Add rows as issues are found; delete rows once fixed. -->

| Issue | Impact | Workaround |
|-------|--------|------------|
| Generated ANTLR parser files (`Kafe_GrammarLexer.py`, `Kafe_GrammarParser.py`, `Kafe_GrammarVisitor.py`, `*.tokens`, `*.interp`) are gitignored | `ModuleNotFoundError: No module named 'Kafe_GrammarLexer'` on fresh clone | Regenerate after grammar edits: `cd src && make antlr` (or `java -jar antlr-4.13.2-complete.jar ...`) |
| Exit-code quirk: non-`.error.kf` runtime errors print to **stdout** and exit **0**; only `.error.kf` files print to stderr and exit 1 | Tests and CI depend on this behavior | Keep the behavior; do not "fix" without an ADR |
| `make test` uses `python3` | Fails on Windows where `python` is the command | Run `pytest` directly instead of `make test` |
| Legacy binary-ish artifacts `test_output.txt` and `test_results.txt` in the repo root are UTF-16 encoded (Windows, dated 2026-05-03) | A bare `pytest` at the root aborts collection: `UnicodeDecodeError: 'utf-8' codec can't decode byte 0xff` on both files → "Interrupted: 2 errors during collection" (465 tests still collected) | Run `pytest tests/` (clean, 464 passed, 1 skipped). Fix: move or delete both files from the root (tracked in git, low risk) |
| `and_gate.expec` loss curve is not strictly monotonic (e.g. Epoch 437: 39.39% → 438: 39.48% → 439: 39.44%) | Cosmetic: fixtures could be mistaken for fabricated or buggy output | Expected behavior of stochastic per-sample SGD; output is real, deterministic (byte-identical across runs) and globally decreasing |
