# Known Issues

Each entry records a current bug or limitation, its impact, and a workaround. Keep entries short and remove them once resolved.

## Current Issues

| Issue | Impact | Workaround |
|-------|--------|------------|
| Generated ANTLR parser files (`Kafe_GrammarLexer.py`, `Kafe_GrammarParser.py`, `Kafe_GrammarVisitor.py`, `*.tokens`, `*.interp`) are Git-ignored | A fresh clone may raise `ModuleNotFoundError: No module named 'Kafe_GrammarLexer'` | From `src/`, run `make antlr` in a POSIX Make environment or invoke the ANTLR 4.13.2 jar with the command in `.opencode/knowledge/verifications.md` |
| Runtime errors from non-`.error.kf` files print to **stdout** and exit **0**; `.error.kf` files print to stderr and exit **1** | This behavior is unintuitive but part of the current CLI contract | Preserve it; change only with an approved behavior migration and updated fixtures |
| Root cause of silent stops: the `program` rule in `src/Kafe_Grammar.g4` does not end with `EOF` (found 2026-11-09) | Anything after a token that cannot start a statement is ignored silently: `; elif`, `; else`, an `import` after other statements, a stray `)` | Docs warn about each case. Fixing needs a grammar change with Impact Analysis |
| Every lexer token-recognition error is reported as `unterminated string literal` | Misleading message for `ñ`/accented identifiers (`INT año = 1;`) or a lone `&` | Docs explain identifiers use ASCII letters |
| List `+` mutates its left operand | After `c = a + b`, `a` also changes | Docs warn; copy before concatenating if needed |
| `append` accepts a wrong element type; the homogeneity error appears only on the next use of the list | Error is reported far from the cause | Docs describe the delayed error |
| `remove(list, x)` removes by value, not by index | Surprising for learners used to index-based removal | Docs describe remove-by-value |
| A `FUNC(INT)=>INT` variable accepts any function; exact signatures are only checked for function parameters | Weaker type safety than documented before | Docs describe real behavior |
| A `;` before `elif`/`else` (`if (...): ... ; ; elif ...`) makes the parser stop silently (found 2026-11-09) | The program prints nothing after that point, raises no error and exits 0; beginners get no feedback | Write `elif`/`else` without a preceding `;` (see `tests/conditionals/if_elif_else_chain.kf`); docs warn about it. Fix needs a grammar/parser decision (likely require EOF in `program`) |
| `len()` only accepts lists | `len("Hello")` raises `TypeError: Function len expects argument of type lists, got type STR` | Docs only document `len` for lists |
| KafeMATH `pow` is computed as `exp(y*log(x))` (found 2026-11-09 while writing tested docs examples) | `math.pow(2, 3)` returns `7.999999999999994` and `math.pow(9, 0.5)` returns `2.9999999999999996` | Use the `^` operator for exact integer powers; docs page `libraries/math.md` warns about it |
| KafeMATH `atan` series converges slowly near ±1 | `math.atan(1)` returns `0.7848981638974463` (true value `0.7853981633974483`, error ≈5e-4) | Avoid `atan(±1)`; docs examples use other inputs |
| KafeMATH `sum`/`prod` accept a single `INT` in their signature but fail on it | `math.sum(5)` prints `Exception: math: 'int' object is not iterable` | Pass a list or two integers (`math.sum(1, 10)`) |
| The `make test` target invokes locked uv/pytest and uses a POSIX shell loop | It is unavailable in the default Windows PowerShell environment | Run the equivalent locked pytest command from the repository root: `uv run --locked --group dev pytest tests/test_KafeMACHINE.py` |

## Optional HF CSV resource warning

An isolated, offline Windows compatibility check with datasets 5.0.1 reproduced a pandas CSV-builder `ResourceWarning` for an unclosed buffered reader under both filelock 3.32.7 and patched 4.2.1. The CSV assertions completed, but their nonempty stderr is not counted as a clean validation pass. A separate local Parquet path passed the KAFE loading/splitting/matrix and locking checks with empty stderr. Keep this upstream optional CSV issue separate from dependency audit success; do not suppress warnings or install `datasets` into the baseline environment to hide it.



## Extension and documentation evidence boundaries (2026-10-27)

- Native VS Code 1.96.0 cache is absent locally. Host-policy/acceptance are pending; real-provider review and physical IME/speech are separate. Do not substitute installed newer VS Code or historical hosted results.
- Archive v2 cannot be read by older v1-only readers after successful save. Original v1 is strictly validated and retained until that save; export remains v1. This intentional compatibility boundary is documented, not a corruption workaround.
- The docs workflow admits `integration/Kafe_Gesha_Clustering_v2` and checks out the selected branch, contradicting root main-only deployment policy. Pre-existing drift remains unresolved; this task neither changed nor dispatched the workflow. Remediation needs its own authorized workflow change and evidence.
- Integration cleanup `524dac5` resolves the deferred compact UI/status clarity, fixture output and debounce/observer assertion findings. The `86b78ff` profile remains historical measured-source evidence; a separate `524dac5` confirmation retains its operation counts. Neither establishes native performance.
