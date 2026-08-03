# KAFE Verification and Quality

Testing, validation, benchmarks, and Definition of Done.

## Setup

```bash
pip install -r requirements.txt   # pins antlr4-python3-runtime==4.13.2, pytest 9
python src/Kafe.py tests/Algorithms/Fibonacci.kf
pytest tests/
```

Requires Python >= 3.10. Java JDK 11+ is needed ONLY for regenerating the parser, not for running.

## Parser Regeneration (CRITICAL)

Generated files `src/Kafe_GrammarLexer.py`, `Kafe_GrammarParser.py`, `Kafe_GrammarVisitor.py`, and `*.tokens`/`*.interp` are **gitignored**: they exist in a working checkout but vanish on a fresh clone or `git clean`. Never rely on committed copies.

After editing `src/Kafe_Grammar.g4` or `src/Kafe_Lexer.g4`, regenerate:

```bash
cd src
java -jar antlr-4.13.2-complete.jar -no-listener -visitor -Dlanguage=Python3 Kafe_Grammar.g4
# or: make antlr   (uses the `antlr` command on PATH)
```

The jar is not in the repo; download ANTLR 4.13.2 or use the PATH `antlr` command (see README). If you skip this you'll hit `ModuleNotFoundError: No module named 'Kafe_GrammarLexer'`.

CI does this automatically: `.github/workflows/tests.yml` downloads the ANTLR jar, regenerates the parser in `src/`, then runs `pytest tests/`.

## Testing Strategy

- Suite: `pytest tests/` from the repo root.
- Running programs: `python src/Kafe.py <file.kf>` from the repo root; `Kafe.py` resolves paths first from cwd, then relative to `src/`.
- Tests spawn the interpreter as a subprocess with `cwd=src/` (`tests/utils.py`); assume the interpreter always runs from `src/`.
- Add new fixtures by dropping files in a directory and a `tests/test_*.py` that parameterizes via `obtener_parametros(get_programs(...))`.
- `tests/KafeMACHINE/` is split into 5 subdirs, all wired in `tests/test_KafeMACHINE.py`: `linear_models`, `neighbors`, `preprocessing`, `metrics_classification`, `metrics_regression`.
- Other categories mirror the same pattern: `tests/test_KafeXXX.py` + fixtures under `tests/KafeXXX/`.
- `cd src && make test prueba=KafeMACHINE` runs a single `tests/test_KafeMACHINE.py` (Makefile uses `python3`; on Windows use `pytest` directly).

## Validation Rules

- Valid programs: `.kf` + `.expec` (expected stdout), optional `.in` (stdin). Exit code must be 0.
- Invalid programs: `.error.kf` + `.error.expec`. Expected output = **last line of stderr plus trailing newline** (`stderr.splitlines()[-1] + "\n"`); exit code 1.
- Interpreter quirk (do not fix): non-`.error.kf` files print runtime errors to **stdout** and exit **0**.

## Definition of Done

A task is not complete unless:

- Implementation exists.
- Validation passed.
- Tests passed.
- Documentation updated.
- History updated.

When applicable:

- Benchmark exists.
- RFC exists.
- ADR exists.
- Examples exist.

## Benchmark Strategy

- Benchmark generation is mandatory for ML algorithms, DL components, and performance optimizations.
- Benchmarks live in `.opencode/benchmarks/` and accompany the component's docs, tests, and examples.
- See `.opencode/knowledge/engineering.md` (Benchmark Process) and `.opencode/benchmarks/README.md`.

## Verification Process

1. Regenerate the parser if the grammar changed (see Parser Regeneration above).
2. Run the focused category: `pytest tests/test_KafeMACHINE.py` (single case via `pytest tests/test_base.py::test_valid_programs -k <name>`).
3. Run the full suite: `pytest tests/`.

## Quality Gates

- Full test suite passes (CI regenerates the parser and runs `pytest tests/` on every push via `.github/workflows/tests.yml`).
- Definition of Done verified.
- `.opencode/history/` updated for significant changes.
- `docs/` and `.opencode/knowledge/` reflect the change.

## Quality Standards

The standards in this document, `conventions.md`, and `architecture.md` are the **sole judge** for reviews: if a requirement is not documented here, it is not a requirement. The Reviewer (`/dod`) evaluates against these files only.

- **Verification is demonstration, not assertion.** The agent does not say "it works" — it proves it with an executable test, a run of the suite, or a benchmark. No feature is marked `done` on assertion alone.
- **Anti-patterns (do not do):**
  - ❌ "I added the command, it should work" with no executable test.
  - ❌ A test that only checks "does not raise" — it must assert a concrete result.
  - ❌ `mock` of the filesystem — use real `tempfile.TemporaryDirectory()` fixtures.
  - ❌ Marking a task `done` with a red suite or a failing `/init`.
  - ❌ Uncommitted generated files, debug `print()`, or context-less TODOs.
- **Extreme homogeneity:** the repository must look like itself everywhere — naming, quoting, import order, error handling follow `conventions.md`; reviewers reject deviations without documented justification.
