# Known Issues

Template. Each entry: bug/limitation, impact, and workaround. Keep entries short; remove once fixed.

## Current Issues

<!-- Add rows as issues are found; delete rows once fixed. -->

| Issue | Impact | Workaround |
|-------|--------|------------|
| Generated ANTLR parser files (`Kafe_GrammarLexer.py`, `Kafe_GrammarParser.py`, `Kafe_GrammarVisitor.py`, `*.tokens`, `*.interp`) are gitignored | `ModuleNotFoundError: No module named 'Kafe_GrammarLexer'` on fresh clone | Regenerate after grammar edits: `cd src && make antlr` (or `java -jar antlr-4.13.2-complete.jar ...`) |
| Exit-code quirk: non-`.error.kf` runtime errors print to **stdout** and exit **0**; only `.error.kf` files print to stderr and exit 1 | Tests and CI depend on this behavior | Keep the behavior; do not "fix" without an ADR |
| `make test` uses `python3` | Fails on Windows where `python` is the command | Run `pytest` directly instead of `make test` |
