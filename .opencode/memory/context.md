# Project Context

Project-wide context, assumptions, and engineering notes. This file is stable; record durable decisions in `.opencode/adr/` or significant events in `.opencode/history/`.

## Project Context

KAFE is an educational DSL focused on machine learning and deep learning, implemented as a Python tree-walking interpreter with ANTLR 4 and the Visitor pattern. `.kf` files are KAFE source programs. The engineering system lives under `.opencode/`; `OPENCODE.md` is the operating manual, and `AGENTS.md`/`CLAUDE.md` are mirrored engineering constitutions. Applicable runtime and user instructions govern execution; OpenCode procedures implement the root policies.

## Important Assumptions

- Python >= 3.10; `pyproject.toml` and the committed `uv.lock` own runtime, development, documentation, and optional dependencies. Nix supplies Python, uv, Java, ANTLR, and other system tools. The `huggingface` extra keeps `datasets` out of the default environment.
- Java JDK 11+ is needed to generate ignored ANTLR parser outputs on fresh clones and after grammar changes. Execution uses generated outputs without Java. Never stage or commit those outputs.
- Fixture tests run the interpreter in child processes using the shared runner in `tests/utils.py`, from `src/` (`cwd=src/`). Child coverage, warning propagation, complete stream checks, and exit-code checks are implemented and covered by the quality-evidence branch.
- Dependencies are forbidden by default; external ML/DL algorithm implementations are prohibited.
- English is mandatory for current repository-owned content. The repository-wide migration and final audit were completed on 2026-09-24; translate any newly discovered owned content and keep future records in English. ADR-0011 permits only a one-time faithful backfill of existing records. Preserve KAFE syntax and public behavior except where the approved coordinated migration explicitly changed them.

## Engineering Notes

- KafeMACHINE (ML) and KafeGESHA (DL) are implemented from scratch inside KAFE.
- `self.libraries` uses case-sensitive import keys: `numk`, `math`, `files`, `plot`, `geshaDeep`, `pardos`, `machine`, and `huggingface` (KafeHF). Its external `datasets` dependency remains optional; preserve missing-dependency fixtures.
- ADRs > Knowledge Layer > History > Progress resolves conflicts among project records only (ADR-0008). ADR-0011 allows only one faithful English backfill of existing Spanish records; future session and history entries remain append-only and English.
- Fixture pairs use `<name>.kf` + `<name>.expec` (expected stdout), optional `<name>.in`, or invalid `<name>.error.kf` + `<name>.error.expec`. Complete invalid stderr and optional stdout are captured by their dedicated sidecars.
