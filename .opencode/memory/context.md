# Project Context

Template. Project-wide context, assumptions, and engineering notes. This file is stable; move durable decisions to `.opencode/history/` or ADR records.

## Project Context

KAFE is an educational DSL focused on Machine Learning and Deep Learning, implemented as a tree-walking interpreter in Python + ANTLR 4 (Visitor pattern). `.kf` files are KAFE source. The engineering system lives under `.opencode/`; `OPENCODE.md` is the operating manual and `AGENTS.md` is the engineering constitution.

## Important Assumptions

- Python >= 3.10; `antlr4-python3-runtime==4.13.2` is pinned in `requirements.txt`.
- Java JDK 11+ is needed only to regenerate the ANTLR parser, not to run.
- Tests always run the interpreter from `src/` (`cwd=src/`).
- Dependencies are forbidden by default; external ML/DL algorithm implementations are prohibited.
- Docs and code comments are largely in Spanish; recent commit messages are in English.

## Engineering Notes

- KafeMACHINE (ML) and KafeGESHA (DL) are implemented from scratch inside KAFE.
- `self.libraries` uses lowercase import keys: `numk`, `math`, `files`, `plot`, `geshaDeep`, `pardos`, `machine`.
- Source of Truth precedence: ADRs > Knowledge Layer > History > Progress (see AGENTS.md — Source of Truth).
- Test fixtures: `<name>.kf` + `<name>.expec` (expected stdout), optional `<name>.in`, invalid `<name>.error.kf` + `<name>.error.expec`.
