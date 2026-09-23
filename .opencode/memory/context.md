# Project Context

Template. Project-wide context, assumptions, and engineering notes. This file is stable; move durable decisions to `.opencode/history/` or ADR records.

## Project Context

KAFE is an educational DSL focused on Machine Learning and Deep Learning, implemented as a tree-walking interpreter in Python + ANTLR 4 (Visitor pattern). `.kf` files are KAFE source. The engineering system lives under `.opencode/`; `OPENCODE.md` is the operating manual and the mirrored `AGENTS.md`/`CLAUDE.md` files define the engineering constitution. Applicable runtime/user instructions govern execution; OpenCode procedures implement the root policies.

## Important Assumptions

- Python >= 3.10; `pyproject.toml` and the committed `uv.lock` own runtime, development, documentation, and optional dependencies. Nix supplies Python, uv, Java, ANTLR, and other system tools; the CI workflows consume the lock. The `huggingface` extra keeps `datasets` out of the default environment.
- Java JDK 11+ is needed to generate the ignored, untracked ANTLR parser on fresh clones and after grammar changes. Execution then uses the generated outputs without Java. Never stage or commit those outputs.
- Fixture tests run the interpreter in child processes from `src/` (`cwd=src/`). Parent pytest-cov/warning configuration alone does not establish child coverage or diagnostic handling; those gates remain pending.
- Dependencies are forbidden by default; external ML/DL algorithm implementations are prohibited.
- English is the repository target. Existing Spanish prose, comments, and product syntax are migration debt; syntax/behavior changes require a separate migration plan.

## Engineering Notes

- KafeMACHINE (ML) and KafeGESHA (DL) are implemented from scratch inside KAFE.
- `self.libraries` uses case-sensitive import keys: `numk`, `math`, `files`, `plot`, `geshaDeep`, `pardos`, `machine`, and `huggingface` (KafeHF). Its external `datasets` dependency remains optional; preserve missing-dependency fixtures.
- ADRs > Knowledge Layer > History > Progress resolves conflicts among project records only; mirrored root policies and applicable runtime/user instructions remain above those records (ADR-0008).
- Test fixtures: `<name>.kf` + `<name>.expec` (expected stdout), optional `<name>.in`, invalid `<name>.error.kf` + `<name>.error.expec`.
