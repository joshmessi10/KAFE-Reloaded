---
name: impact-analysis
description: Use when adding ML algorithms, adding DL components, modifying public APIs, refactoring core interpreter components, or modifying grammar rules in KAFE. Run impact analysis before implementing: identify affected modules and risks and produce an implementation plan.
---

Run a KAFE Impact Analysis before implementing a significant change. Impact Analysis is mandatory for: ML algorithms, DL components, public API changes, core interpreter refactors, and grammar rule changes (AGENTS.md — Impact Analysis).

## Steps

1. **Understand the current implementation** — read the relevant `src/` modules and the matching `.opencode/knowledge/` document (`architecture.md`, `ml-library.md`, `dl-library.md`, `libraries.md`, `language-spec.md`).
2. **Read relevant documentation** — check `docs/`, `.opencode/progress/roadmap.md`, and recent `.opencode/history/` records.
3. **Identify affected modules** — trace callers: `src/EvalVisitorPrimitivo.py` dispatch, `src/componentes_lenguaje/`, and dependent libraries.
4. **Assess risks** — type-system impact (`src/TypeUtils.py`), error handling (`src/errores.py`), test fixtures, generated parser files if grammar changes.
5. **Check dependencies** — the Dependency Policy forbids new dependencies by default; verify against `.opencode/knowledge/engineering.md`.
6. **Produce a plan** — implementation steps, validation strategy (`pytest tests/`), documentation and history updates.

## Output

Report in the standard response format: Theory, Analysis, Impact, Plan, Implementation, Validation, Documentation, Next Steps. The Impact section must list affected modules and risks; the Plan section must include the verification steps.
