# Known Issues

Each entry records a current bug or limitation, its impact, and a workaround. Keep entries short and remove them once resolved.

## Current Issues

| Issue | Impact | Workaround |
|-------|--------|------------|
| Generated ANTLR parser files (`Kafe_GrammarLexer.py`, `Kafe_GrammarParser.py`, `Kafe_GrammarVisitor.py`, `*.tokens`, `*.interp`) are Git-ignored | A fresh clone may raise `ModuleNotFoundError: No module named 'Kafe_GrammarLexer'` | From `src/`, run `make antlr` in a POSIX Make environment or invoke the ANTLR 4.13.2 jar with the command in `.opencode/knowledge/verifications.md` |
| Runtime errors from non-`.error.kf` files print to **stdout** and exit **0**; `.error.kf` files print to stderr and exit **1** | This behavior is unintuitive but part of the current CLI contract | Preserve it; change only with an approved behavior migration and updated fixtures |
| The `make test` target uses `python3` and a POSIX shell loop | It is unavailable in the default Windows PowerShell environment | Run the equivalent locked pytest command from the repository root: `uv run --locked --group dev pytest tests/test_KafeMACHINE.py` |

## Optional HF CSV resource warning

An isolated, offline Windows compatibility check with datasets 5.0.1 reproduced a pandas CSV-builder `ResourceWarning` for an unclosed buffered reader under both filelock 3.32.7 and patched 4.2.1. The CSV assertions completed, but their nonempty stderr is not counted as a clean validation pass. A separate local Parquet path passed the KAFE loading/splitting/matrix and locking checks with empty stderr. Keep this upstream optional CSV issue separate from dependency audit success; do not suppress warnings or install `datasets` into the baseline environment to hide it.


