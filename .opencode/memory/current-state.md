# Current State

## Architecture Status

KAFE is an educational Python 3.11+ DSL with an ANTLR 4 parser and Visitor-based interpreter. Its command-line interpreter, Python libraries, tests, and MkDocs documentation are active; it has no active JavaScript/TypeScript frontend, web backend, or application database.

The repository engineering system under `.opencode/` is established. KafeMACHINE's model-selection and preprocessing components and KafeGESHA's dense layer, activations, optimizers, and soft-clustering support are implemented. Conv2D, LSTM, Transformer, and performance work remain on the product roadmap.

## Earlier Repository Alignment

The English migration was tracked on `refactor/english-repository`. Tasks 1–7 are complete; Task 5's documentation/routes commit is `13ca2bf1b84a692780fff0c83106c46fdf6d15d1`. That milestone's language audit, strict docs build, tracked-file codespell check, and full regression suite passed.

The separate `test/interpreter-quality-evidence` milestone is complete but remains unmerged. Its exact-SHA GitHub test run passed at `6e8edd5565c6c1341697426a2bd0dff4187dc5cc`; its final local run passed 497 tests at 83.78% coverage across 111 tracked Python source files with no warnings. Documentation deployment remains restricted to `main`.

## Earlier Migration Priorities

1. Commit the reviewed English repository alignment changes on the existing branch.
2. Check whether a matching remote branch already exists before pushing; do not create, rename, or switch branches without explicit authorization.
3. After repository alignment, resume KafeGESHA layer development, legacy reviews, and performance work according to the roadmap or user reprioritization.

## Current Release Line

The active `feature/vsc-extension` release line has an extension 2.3.0 candidate over unchanged published runtime 0.3.0. Tutor conversations, drafts and learning preferences remain saved per workspace, with New/Switch/Rename/Delete and selected JSON export (ADR-0030); transitions clear transient authority. Reviewed bundled MACHINE/GESHA contracts and eight conceptual topics cover the intended surface and study objectives before runtime setup, including message-only Restricted Mode (ADR-0031). Bounded complete-unit lookup takes precedence over older managed library narratives. Run output stays in the terminal UI; authorized private Run observations can inform the Tutor with current/historical source labels. Hosted native/extension verification passed at `30ed05c`. The current dependency repair (ADR-0032) clears local Python/npm audits through targeted patches and supported developer Node; final-revision CI remains to be observed. Future managed runtime publication, real-provider quality and learning efficacy remain separate release/research gates.

## Current Blockers and Pending Gates

- Independent review of the dependency repair found no open material finding; final exact-revision workflow verification remains root-owned.
- The current tracked tree passed the Task 7 English audit. Historical identifier/path literals are retained only where they are explicitly documented as migration history or mappings.
- Ruff, basedpyright, codespell, dependency audit and authored-suppression checks are implemented in the current Python workflow. Verify their actual results at the exact pushed commit.
- Nix validation is unavailable on this Windows host. GNU Make is unavailable, so POSIX Make targets cannot be exercised here; use the documented locked `uv` commands.
- The test branch remains unmerged. Docs deployment and external publication remain pending until main integration.
