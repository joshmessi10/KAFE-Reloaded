# KAFE Verification and Quality

Project-specific testing, validation, benchmarks, and Definition of Done. Apply these procedures together with the mirrored `AGENTS.md` and `CLAUDE.md` policies; applicable runtime and user instructions govern execution.

## Setup

The Python project uses `pyproject.toml` and the committed `uv.lock`. It requires Python >= 3.10, pins `antlr4-python3-runtime==4.13.2`, and provides pytest in the `dev` group. MkDocs dependencies are in `docs`; Hugging Face `datasets` remains opt-in through the `huggingface` extra.

1. Install uv using the [official instructions](https://docs.astral.sh/uv/getting-started/installation/), then run `uv sync --locked --group dev` from the repository root.
2. On a fresh clone, generate the ignored parser outputs as described below before running any interpreter program or fixture suite.
3. From the repository root, run a program with `uv run --locked python src/Kafe.py tests/Algorithms/Fibonacci.kf` or run the complete quality gate with the command in [Verification Process](#verification-process).

Java JDK 11+ is needed for parser generation, including fresh-clone setup. It is not needed to execute programs once compatible generated outputs exist. Nix provides system tools while uv owns Python dependencies. Use `uv sync --locked --extra huggingface` only when enabling the optional integration.

## Parser Regeneration (CRITICAL)

Generated files `src/Kafe_GrammarLexer.py`, `Kafe_GrammarParser.py`, `Kafe_GrammarVisitor.py`, and `*.tokens`/`*.interp` are **gitignored and untracked**. They may exist locally after generation but are absent on a fresh clone and can be removed by commands that clean ignored files. Never rely on committed copies, stage them, or commit them.

Generate on a fresh clone, whenever outputs are missing, and after editing `src/Kafe_Grammar.g4` or `src/Kafe_Lexer.g4`:

```bash
cd src
java -jar /path/to/antlr-4.13.2-complete.jar -no-listener -visitor -Dlanguage=Python3 Kafe_Grammar.g4
# or: make antlr   (uses the `antlr` command on PATH)
```

The jar is not in the repo; download ANTLR 4.13.2 or use the PATH `antlr` command (see README). If you skip this you'll hit `ModuleNotFoundError: No module named 'Kafe_GrammarLexer'`.

Replace the jar path with its actual location. CI does this automatically: `.github/workflows/tests.yml` downloads the ANTLR jar, regenerates the parser in `src/`, then runs the locked full-suite coverage gate with absolute workspace paths.

To remove the generated ANTLR outputs, run `make clean` from `src/` in the existing POSIX Make environment. The target uses the POSIX `rm` command and requires a compatible shell/toolchain; plain Windows PowerShell does not supply that environment. Regenerate the parser afterward with the commands above before running interpreter programs or fixture tests.

## Testing Strategy

- Suite: `uv run --locked --group dev pytest tests/` from the repo root.
- Running programs: `uv run --locked python src/Kafe.py <file.kf>` from the repo root; `Kafe.py` resolves paths first from cwd, then relative to `src/`.
- Fixture tests spawn the interpreter as a subprocess with `cwd=src/` (paths from `tests/utils.py`). This is the fixture harness's execution context, not a requirement that every CLI caller use `src/`.
- Add new fixtures by dropping files in a directory and a `tests/test_*.py` that parameterizes via `obtener_parametros(get_programs(...))`.
- `tests/test_KafeMACHINE.py` is the authoritative fixture map. Its `SUBDIRS` currently contains 11 paths across 10 immediate directories: `linear`, `neighbors`, `tree`, `preprocessing`, `metrics/classification`, `metrics/regression`, `clustering`, `naive_bayes`, `model_selection`, `svm`, and `ensemble`. Keep new categories wired into that map.
- Other categories mirror the same pattern: `tests/test_KafeXXX.py` + fixtures under `tests/KafeXXX/`.
- File I/O uses the case-sensitive paths `tests/test_KafeFiles.py` and `tests/KafeFiles/`, while its implementation package is `src/lib/KafeFILES/`. Preserve this existing distinction when adding fixtures or updating references.
- From `src/`, `uv run --locked --project .. --group dev make test prueba=KafeMACHINE` runs `tests/test_KafeMACHINE.py` and requires POSIX-compatible Make and shell. On Windows, run `uv run --locked --group dev pytest tests/test_KafeMACHINE.py` from the repository root.
- Keep KafeHF's optional `datasets` integration separate from baseline dependencies and preserve deterministic coverage of its missing-dependency behavior.
- To preview documentation locally, run `uv sync --locked --group docs --no-dev`, then `uv run --locked --group docs --no-dev mkdocs serve`.

## Validation Rules

- Valid programs: `.kf` + `.expec` (expected stdout), optional `.in` (stdin). The interpreter child must exit 0, stdout must match exactly, and stderr must be empty.
- Invalid programs: `.error.kf` + `.error.expec`. The child must exit 1, stdout must match `.error.stdout.expec` when present (otherwise it must be empty), and complete stderr must match the required `.error.stderr.expec`. The final stderr line must also match the existing `.error.expec` semantic diagnostic.
- `tests/base/variable_undefined.error.stdout.expec` intentionally preserves the trailing space in the CLI prompt `> `; do not trim this exact-output snapshot.
- Fixture child processes inherit the parent environment and set `PYTHONWARNINGS=error`; pytest itself uses `filterwarnings = ["error"]`.
- Child stdout and stderr are captured in full. Normalize only the exact absolute checkout root to `<REPO>`; preserve all other output.
- Interpreter quirk (do not fix): non-`.error.kf` files print runtime errors to **stdout** and exit **0**.

## Definition of Done

Use `/dod` and its checklist to assess the current task against both root policy files and these technical criteria. Record evidence for every applicable item; distinguish PASS, FAIL, PENDING, and N/A with reasons. A task is not complete unless its applicable requirements are satisfied:

- Implementation exists.
- Validation passed.
- Tests passed for applicable code changes, including the full suite. For a documentation-only task with no runtime, fixture, dependency, or workflow changes, use the approved documentation validation plan and explicitly record why application tests are N/A.
- Documentation updated.
- History updated.

When applicable:

- Benchmark exists.
- ADR exists.
- Examples exist.

Repository-wide migrations and missing gates must remain visibly PENDING. Their absence cannot be reported as a pass. An approved documentation task may finish while recording that debt; a task that promises to implement one of those gates cannot finish until it is demonstrated. Session closure retains the `/init` and `/close` full-suite obligations in `engineering.md`.

## Benchmark Strategy

- Benchmark generation is mandatory for ML algorithms, DL components, and performance optimizations.
- Benchmarks live in `.opencode/benchmarks/` and accompany the component's docs, tests, and examples.
- See `.opencode/knowledge/engineering.md` (Benchmark Process) and `.opencode/benchmarks/README.md`.

## Verification Process

For code tasks and other changes whose approved validation requires the application suite:

1. Generate the parser if outputs are missing or the grammar changed (see Parser Regeneration above).
2. Run the focused category: `uv run --locked --python 3.10 --group dev pytest tests/test_KafeMACHINE.py` (single case via `uv run --locked --python 3.10 --group dev pytest tests/test_base.py::test_valid_programs -k <name>`).
3. Run the complete local quality gate from the repository root in PowerShell:

   ```powershell
   $repo = (Get-Location).Path
   uv run --locked --python 3.10 --group dev pytest tests/ -v "--cov=$repo/src" "--cov-config=$repo/pyproject.toml" --cov-report=term-missing --cov-fail-under=80
   ```

Coverage measures `src`, collects data from interpreter subprocesses, and includes namespace-package directories so unimported owned source is visible in the report. Only the three generated ANTLR files listed in `pyproject.toml` are omitted.

## Quality Gates

- The test workflow regenerates the parser and runs the locked full-suite coverage gate on push and relevant pull requests via `.github/workflows/tests.yml`.
- Definition of Done verified.
- `.opencode/history/` updated for significant changes.
- `docs/` and `.opencode/knowledge/` reflect the change.

Inspect the checked-in workflow and configuration before claiming a gate exists. The current workflows are `tests.yml` (uv-locked fixture suite and subprocess coverage), `docs.yml` (uv-locked MkDocs deployment), and `main.yml` (Nix lock maintenance). The uv dependency migration, pytest warning enforcement, subprocess stream assertions, and minimum 80% owned-source coverage gate are implemented. Ruff, basedpyright, codespell, dependency audit, and suppression-comment policy checks remain **pending implementation**. Preserve KAFE's workflow structure when implementing them.

### Child Interpreter Coverage and Diagnostics — Implemented

Fixture tests launch new Python processes to run KAFE. Configuring pytest-cov or `filterwarnings = ["error"]` in the parent pytest process alone does not demonstrate coverage or warning handling in those child interpreters. The shared runner in `tests/utils.py` copies the environment, sets `PYTHONWARNINGS=error`, preserves complete stdout/stderr and the return code, and compares each stream against the fixture contract.

The implemented quality gate:

- Uses `[tool.coverage.run] source = ["src"]` and `patch = ["subprocess"]` to measure and combine interpreter-child coverage. `include_namespace_packages = true` ensures files beneath namespace directories such as `src/lib/` are discoverable even when they were not imported. Coverage reporting shows missing lines and enforces at least 80%.
- Omits only `Kafe_GrammarLexer.py`, `Kafe_GrammarParser.py`, and `Kafe_GrammarVisitor.py`, which are generated and ignored by Git. Do not add ordinary source files to the omission list.
- Requires valid fixture exit code 0, exact `.expec` stdout, and empty stderr. Invalid fixtures require exit code 1, exact full stderr from `.error.stderr.expec`, optional exact stdout from `.error.stdout.expec` (empty by default), and a final semantic line matching `.error.expec`.
- Normalizes only the exact absolute checkout root to `<REPO>`. Do not trim streams or suppress additional diagnostics.
- Imports the interpreter entrypoint in a harness smoke test so the central pytest-cov process also records owned source; importing the CLI must not execute a program or print output. This avoids a no-data warning without disabling Coverage.py warnings.
- Runs the PowerShell full-suite command above locally and the equivalent command in `.github/workflows/tests.yml`, using absolute `${GITHUB_WORKSPACE}` source and config paths. Expected KAFE diagnostics are fixture outcomes, not permission to ignore Python warnings or extra output.

## Quality Standards

The Reviewer (`/dod`) evaluates the applicable mirrored root policies and relevant project knowledge, including this document, `conventions.md`, and `architecture.md`. Knowledge provides technical criteria and evidence within those policies; it cannot exclude repository invariants or override runtime/user instructions. Review against documented requirements without inventing additional ones.

- **Verification is demonstration, not assertion.** The agent does not say "it works" — it proves it with an executable test, a run of the suite, or a benchmark. No feature is marked `done` on assertion alone.
- **Anti-patterns (do not do):**
  - ❌ "I added the command, it should work" with no executable test.
  - ❌ A test that only checks "does not raise" — it must assert a concrete result.
  - ❌ `mock` of the filesystem — use real `tempfile.TemporaryDirectory()` fixtures.
  - ❌ Marking a task `done` with a red suite or a failing `/init`.
  - ❌ Staged or committed generated parser files, debug `print()`, or context-less TODOs. Ignored parser outputs may exist locally for execution.
  - ❌ Marking missing migration gates passed, or inferring child-process coverage/warning enforcement from parent pytest configuration alone.
- **Extreme homogeneity:** the repository must look like itself everywhere — naming, quoting, import order, error handling follow `conventions.md`; reviewers reject deviations without documented justification.
