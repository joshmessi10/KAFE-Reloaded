---
name: modify-grammar
description: Use when changing KAFE grammar rules or tokens in Kafe_Grammar.g4 / Kafe_Lexer.g4. Covers parser regeneration, spec sync, and fixture updates. Also triggers when adding keywords, types, or syntax.
---

Purpose: modify KAFE grammar safely: regenerate the parser, keep the spec in sync, and add validation.

## Inputs

- Grammar change description (new rule, token, keyword, or type).
- Affected behavior (syntax, semantics, precedence).

## Workflow

1. Run Impact Analysis first (`/impact`) — mandatory before modifying grammar rules.
2. Read `.opencode/knowledge/language-spec.md` and `src/Kafe_Grammar.g4` / `src/Kafe_Lexer.g4`.
3. Edit the grammar. Keep `docs/especificacion/` (EBNF, operational semantics, operator precedence) in sync.
4. Regenerate the parser (required — generated files are gitignored):
   ```bash
   cd src && make antlr
   # or: java -jar antlr-4.13.2-complete.jar -no-listener -visitor -Dlanguage=Python3 Kafe_Grammar.g4
   ```
5. Add fixture pairs under `tests/` covering the new syntax (valid `.kf` + `.expec`, invalid `.error.kf` + `.error.expec`).
6. Reviewer runs `/dod` before the task is declared complete.

## Outputs

- Updated grammar + regenerated parser (generated files are NOT committed).
- New fixture tests.
- Updated language spec.

## Required Documentation Updates

- `docs/especificacion/` (EBNF and semantics).
- `.opencode/knowledge/language-spec.md` (keywords/types).
- History record.

## Validation Requirements

- Parser regenerates cleanly.
- `pytest tests/` full suite passes.
- No generated parser files staged for commit.
