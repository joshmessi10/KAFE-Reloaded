# Project Context

Project-wide context, assumptions, and engineering notes. This file is stable; record durable decisions in `.opencode/adr/` or significant events in `.opencode/history/`.

## Project Context

KAFE is an educational DSL focused on machine learning and deep learning, implemented as a Python tree-walking interpreter with ANTLR 4 and the Visitor pattern. `.kf` files are KAFE source programs. The engineering system lives under `.opencode/`; `OPENCODE.md` is the operating manual, and `AGENTS.md`/`CLAUDE.md` are mirrored engineering constitutions. Applicable runtime and user instructions govern execution; OpenCode procedures implement the root policies.

## Important Assumptions

- Python >= 3.11; `pyproject.toml` and the committed `uv.lock` own runtime, development, documentation, and optional dependencies. Nix supplies Python, uv, Java, ANTLR, and other system tools. The `huggingface` extra keeps `datasets` out of the default environment; the VS Code runtime installs the locked `extension` extra with Hugging Face and Kaggle dependencies.
- Java JDK 11+ is needed to generate ignored ANTLR parser outputs on fresh clones and after grammar changes. Execution uses generated outputs without Java. Never stage or commit those outputs.
- Fixture tests run the interpreter in child processes using the shared runner in `tests/utils.py`, from `src/` (`cwd=src/`). Child coverage, warning propagation, complete stream checks, and exit-code checks are implemented in this release line; earlier branch receipts remain historical.
- Dependencies are forbidden by default; external ML/DL algorithm implementations are prohibited.
- English is the default for identifiers, paths, configuration and commits. Educational prose/comments/examples may use English or Spanish under ADR-0014. The 2026-09-24 migration is historical; preserve syntax/public behavior unless a coordinated migration explicitly changes them.

## Engineering Notes

- KafeMACHINE (ML) and KafeGESHA (DL) are implemented from scratch inside KAFE.
- `self.libraries` uses case-sensitive import keys: `numk`, `math`, `files`, `plot`, `gesha`, `pardos`, `machine`, and `huggingface` (KafeHF; `geshaDeep` and `geshaV2` remain deprecated aliases of `gesha`). Its external `datasets` dependency remains optional; preserve missing-dependency fixtures.
- ADRs > Knowledge Layer > History > Progress resolves conflicts among project records only (ADR-0008). Preserve historical records and append significant events; ADR-0014 governs bilingual educational prose.
- Fixture pairs use `<name>.kf` + `<name>.expec` (expected stdout), optional `<name>.in`, or invalid `<name>.error.kf` + `<name>.error.expec`. Complete invalid stderr and optional stdout are captured by their dedicated sidecars.

- The active VS Code host/webview is part of the architecture (ADR-0033). Saved chats are declarative content, never restored authority; style requests have no durable preference field.
