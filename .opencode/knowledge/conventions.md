# KAFE Conventions

Project-specific conventions implementing the mirrored `AGENTS.md` and `CLAUDE.md` repository policies. Applicable runtime and user instructions remain higher priority.

## Quality Principles

- **Homogeneity:** the repository should look like itself everywhere. Predictable naming, quoting, imports, and error handling reduce agent error; deviations require documented justification.
- **Documented requirements:** reviews apply both root policy files and the relevant project knowledge (`verifications.md`, `architecture.md`, and this file). Knowledge supplies technical criteria and evidence; it cannot waive root policies. Reviewers must not invent undocumented requirements.
- **Demonstrate, do not assert:** verification is proof by executable test or run, never by assertion (see `.opencode/knowledge/verifications.md` — Quality Standards).

## Repository Conventions

- English is mandatory for repository prose, code comments, identifiers, and documentation. Tasks 1–5 migrated runtime code, tests, fixtures, and the published site; Task 6 translates project records, and Task 7 performs the final audit. Follow the root language policy for untouched surfaces. Changes to KAFE syntax, identifiers, or user-visible behavior require an explicitly approved migration.
- Fixture-driven testing: `.kf` + `.expec` pairs under `tests/` (see `.opencode/knowledge/verifications.md`).
- Dependency policy: see Dependency Policy below.

## Coding Conventions

- Python, snake_case for modules and functions; PEP 8 as the baseline.
- Import `globals` as a module (`import globals`, never `from globals import ...`).
- Public interpreter APIs dispatch through `InterpreterVisitor` and the component/library modules (see `.opencode/knowledge/architecture.md`); do not add parallel dispatch mechanisms.
- Write new or updated code comments and docstrings in English.
- Do not add code comments unless they explain non-obvious intent.
- Do not author `# pyright:` or `# noqa:` suppression comments. Apply the root exception process for upstream issues instead of suppressing owned-code diagnostics. The explicit CI policy check remains pending until the quality-gate migration implements it.

## Dependency Policy

- Dependencies are forbidden by default.
- Before introducing a new dependency, verify the functionality cannot be implemented using:
  1. Existing KAFE libraries.
  2. Existing KAFE modules.
  3. Python built-in functionality.
- External dependencies require explicit justification.
- Importing external algorithm implementations for ML/DL features implemented inside KAFE is prohibited (no sklearn, TensorFlow, PyTorch) — implement and teach inside KAFE.
- Use `uv`, `pyproject.toml`, and the committed `uv.lock` for Python dependencies. The `dev` group contains developer tools and tests, the `docs` group contains MkDocs dependencies, and `datasets` is available only through the optional `huggingface` extra. Do not add dependencies through ad hoc pip workflows.
- KafeHF's Hugging Face `datasets` integration remains optional. Preserve baseline operation and deterministic fixtures for an environment where `datasets` is absent.

## Git Conventions

- Do not commit generated ANTLR parser files (`src/Kafe_GrammarLexer.py`, `Kafe_GrammarParser.py`, `Kafe_GrammarVisitor.py`, `*.tokens`, `*.interp`) or `*.svg` (exception: `tests/**/grafico_*.svg` reference files).
- Generate the ignored ANTLR outputs on a fresh clone and after grammar edits. Their presence in the local checkout is expected; staging or committing them is prohibited.
- Keep Superpowers specs, plans, and review reports local in the ignored artifact directories. Never stage, force-add, or commit them.
- Commit grammar changes and add matching tests.
- Write focused commit messages in English.

## Naming Conventions

- Python: snake_case modules/functions; import `globals` as a module (`import globals`, never `from globals import ...`).
- KAFE built-in library keys in `self.libraries` are case-sensitive: `numk`, `math`, `files`, `plot`, `geshaDeep`, `pardos`, `machine`, and `huggingface`.
- Test files: `tests/test_KafeXXX.py`. Fixtures: `<name>.kf`, `<name>.expec` (expected stdout), optional `<name>.in` (stdin), invalid `<name>.error.kf` + `<name>.error.expec`.
- KAFE keywords/types are fixed by the grammar (see `.opencode/knowledge/language-spec.md`).

## Library Design Conventions

- Public API in `functions.py` as plain functions; stateful models as Python classes with a scikit-learn-style API (`fit()`, `predict()`, `score()`).
- Factories: `machine.linear_regression()`, `machine.knn(k)`, `machine.standard_scaler()`, etc.
- Reuse existing KAFE libraries before Python stdlib: use KafeMATH for math, KafeNUMK for linear algebra.
- Never import external algorithm implementations (sklearn, TensorFlow, PyTorch) for algorithms implemented inside KAFE.

## Documentation Conventions

- The English MkDocs Material site lives in `docs/`. Install its locked dependencies with `uv sync --locked --group docs --no-dev`, then preview it with `uv run --locked --group docs --no-dev mkdocs serve`.
- Docs deploy to GitHub Pages via `.github/workflows/docs.yml` on push to `main` (`uv run --locked --python 3.10 --group docs --no-dev mkdocs gh-deploy --force`).
- Keep `docs/specification/` (grammar EBNF, operational semantics, operator precedence) in sync with grammar changes.
- Project knowledge lives in `.opencode/knowledge/` (see AGENTS.md — Repository Knowledge Map).

## Engineering Conventions

- Follow the Engineering Workflow and Definition of Done in both mirrored root policy files.
- `.opencode/knowledge/engineering.md` defines the project procedures for Impact Analysis, ADRs, Session Recovery, benchmarks, educational responses, and documentation updates within those policies.
- ADR > Knowledge > History > Progress is precedence among project records only; it does not override runtime/user instructions or mirrored root policies.
