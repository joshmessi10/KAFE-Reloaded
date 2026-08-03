# KAFE Language Specification

## Sources of Truth

- Grammar: `src/Kafe_Grammar.g4` (parser rules) and `src/Kafe_Lexer.g4` (tokens).
- Formal EBNF and operational semantics: `docs/especificacion/` — keep in sync with grammar changes.
- Language reference and error docs: `docs/lenguaje/`, `docs/errores/`.

## Keywords

`drip` (define function), `show` (print), `pour` (debug print), `import`, `if`/`elif`/`else`, `while`, `for`, `return`.

## Types

`INT FLOAT STR BOOL VOID LIST GESHA PARDOS MACHINE` + function types.

- `GESHA` — neural network / deep learning objects (KafeGESHA).
- `PARDOS` — DataFrames (KafePARDOS).
- `MACHINE` — ML model objects (KafeMACHINE).

## Execution Notes

- `python src/Kafe.py <file.kf>`; paths resolve from cwd first, then relative to `src/`.
- `.error.kf` programs: errors to **stderr**, exit **1**. All other programs: runtime errors to **stdout**, exit **0**.
- `import` of user `.kf` modules resolves relative to `globals.current_dir` first, then the `importar` component directory.
- Built-in libraries are imported by name and must be registered in `self.libraries` (see `.opencode/knowledge/libraries.md`).
