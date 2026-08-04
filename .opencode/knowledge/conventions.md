# KAFE Conventions

Repository-wide conventions agents must follow.

## Quality Principles

- **Homogeneity:** the repository should look like itself everywhere. Predictable naming, quoting, imports, and error handling reduce agent error; deviations require documented justification.
- **Documented requirements only:** conventions here and in `verifications.md`/`architecture.md` are the sole judge for reviews. If it is not documented, it is not a requirement — reviewers must not invent criteria.
- **Demonstrate, do not assert:** verification is proof by executable test or run, never by assertion (see `.opencode/knowledge/verifications.md` — Quality Standards).

## Repository Conventions

- Docs and code comments are largely in Spanish.
- Fixture-driven testing: `.kf` + `.expec` pairs under `tests/` (see `.opencode/knowledge/verifications.md`).
- Dependency policy: see Dependency Policy below.

## Coding Conventions

- Python, snake_case for modules and functions; PEP 8 as the baseline.
- Import `globals` as a module (`import globals`, never `from globals import ...`).
- Public interpreter APIs dispatch through `EvalVisitorPrimitivo` and the component/library modules (see `.opencode/knowledge/architecture.md`); do not add parallel dispatch mechanisms.
- Code comments and docstrings are largely in Spanish.
- Do not add code comments unless they explain non-obvious intent (see AGENTS.md — Code style).

## Dependency Policy

- Dependencies are forbidden by default.
- Before introducing a new dependency, verify the functionality cannot be implemented using:
  1. Existing KAFE libraries.
  2. Existing KAFE modules.
  3. Python built-in functionality.
- External dependencies require explicit justification.
- Importing external algorithm implementations for ML/DL features implemented inside KAFE is prohibited (no sklearn, TensorFlow, PyTorch) — implement and teach inside KAFE.

## Git Conventions

- Do not commit generated ANTLR parser files (`src/Kafe_GrammarLexer.py`, `Kafe_GrammarParser.py`, `Kafe_GrammarVisitor.py`, `*.tokens`, `*.interp`) or `*.svg` (exception: `tests/**/grafico_*.svg` reference files).
- Commit grammar changes and add matching tests.
- Recent commit messages are in English.

## Naming Conventions

- Python: snake_case modules/functions; import `globals` as a module (`import globals`, never `from globals import ...`).
- KAFE built-in library keys are lowercase in `self.libraries`: `numk`, `math`, `files`, `plot`, `geshaDeep`, `pardos`, `machine`.
- Test files: `tests/test_KafeXXX.py`. Fixtures: `<name>.kf`, `<name>.expec` (expected stdout), optional `<name>.in` (stdin), invalid `<name>.error.kf` + `<name>.error.expec`.
- KAFE keywords/types are fixed by the grammar (see `.opencode/knowledge/language-spec.md`).

## Library Design Conventions

- Public API in `funciones.py` as plain functions; stateful models as Python classes with a scikit-learn-style API (`fit()`, `predict()`, `score()`).
- Factories: `machine.linear_regression()`, `machine.knn(k)`, `machine.standard_scaler()`, etc.
- Reuse existing KAFE libraries before Python stdlib: use KafeMATH for math, KafeNUMK for linear algebra.
- Never import external algorithm implementations (sklearn, TensorFlow, PyTorch) for algorithms implemented inside KAFE.

## Documentation Conventions

- MkDocs Material site in `docs/` (Spanish); `pip install mkdocs mkdocs-material pymdown-extensions && mkdocs serve`.
- Docs deploy to GitHub Pages via `.github/workflows/docs.yml` on push to `main` (`mkdocs gh-deploy --force`).
- Keep `docs/especificacion/` (grammar EBNF, operational semantics, operator precedence) in sync with grammar changes.
- Project knowledge lives in `.opencode/knowledge/` (see AGENTS.md — Repository Knowledge Map).

## Engineering Conventions

- Follow the Engineering Workflow and Definition of Done (AGENTS.md).
- `.opencode/knowledge/engineering.md` is the source of truth for engineering procedures (Impact Analysis, ADR, Session Recovery, benchmarks, educational responses, documentation updates).
