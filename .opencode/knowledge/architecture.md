# KAFE Architecture

How KAFE works, end to end. This is the reference for the interpreter internals.

## Compact Diagram

```
.kf → src/Kafe.py (ANTLR lexer/parser → AST) → EvalVisitorPrimitivo.py (walks AST, scope stack)
    → src/componentes_lenguaje/ (variables, bucles, condicionales, funciones, importar, librerias, method_calling)
    → src/lib/Kafe{NUMK,MATH,FILES,PLOT,GESHA,PARDOS,MACHINE}/funciones.py
```

## High-Level Overview

KAFE is a DSL for teaching Deep Learning, implemented as a tree-walking interpreter in Python + ANTLR 4 (Visitor pattern).

Source layout:

- `src/Kafe.py` — entry point: lexing/parsing pipeline, error listener, process exit handling.
- `src/Kafe_Grammar.g4` + `src/Kafe_Lexer.g4` — ANTLR grammar (parser + lexer). The generated `Kafe_GrammarLexer.py`, `Kafe_GrammarParser.py`, `Kafe_GrammarVisitor.py`, `*.tokens`, `*.interp` are **gitignored**; regenerate after grammar edits.
- `src/EvalVisitorPrimitivo.py` — the main visitor: walks the AST with a scope stack, dispatches to language components and libraries.
- `src/componentes_lenguaje/` — language features: `base`, `bucles`, `condicionales`, `funciones`, `importar`, `librerias`, `method_calling`.
- `src/lib/` — built-in libraries: `KafeNUMK`, `KafeMATH`, `KafeFILES`, `KafePLOT`, `KafeGESHA`, `KafePARDOS`, `KafeMACHINE`.
- `src/TypeUtils.py` — type system. `src/errores.py` — error raising helpers. `src/global_utils.py` — shared helpers. `src/globals.py` — global interpreter state (`current_dir`, `ruta_programa`, `current_visitor`), imported as `import globals` (module import, never `from ... import`).

## Execution Flow

```
.kf source
  → Kafe.py main()
  → InputStream → Kafe_GrammarLexer (tokens) → CommonTokenStream → Kafe_GrammarParser
  → parser.program() returns the AST tree
  → EvalVisitorPrimitivo.visit(tree) walks the tree
  → language components (componentes_lenguaje/) and libraries (lib/) execute statements
```

### ANTLR Flow

- `KafeErrorListener` captures lexer/parser syntax errors. Special cases: unterminated string literals ("token recognition error") and scientific-notation errors.
- The visitor is generated with `-no-listener -visitor -Dlanguage=Python3`.
- Grammar is split into `Kafe_Lexer.g4` (tokens) and `Kafe_Grammar.g4` (rules).

### Interpreter Flow

- `Kafe.py` resolves the input path: absolute/cwd first, then relative to `src/`.
- Global state (`globals.ruta_programa`, `globals.current_dir`, `globals.current_visitor`) is set before visiting.
- Runtime error handling in `main()`: `.error.kf` files print to **stderr** and exit **1**; any other file prints runtime errors to **stdout** and exits **0** (tests depend on this; do not fix).

### Visitor Architecture

- `EvalVisitorPrimitivo` extends the generated `Kafe_GrammarVisitor`.
- Scopes: `scope_stack` (list of dicts). `push_scope()` / `pop_scope()` manage loops and conditionals; `pop_scope` removes variables declared in that scope.
- Dispatch:
  - Object method calls → `componentes_lenguaje/method_calling/funciones.py`.
  - Library calls → `componentes_lenguaje/librerias/funciones.py` (`libraryFunctionCall`, `libraryConstant`); un-imported libraries raise, missing functions/variables raise.
  - Control flow, functions, imports → `componentes_lenguaje/{bucles,condicionales,funciones,importar}/funciones.py`.

### Library Architecture

- Each library exposes plain Python functions in `src/lib/KafeXXX/funciones.py`; stateful models are Python classes in sibling modules (e.g., `KafeMACHINE/LinearRegression.py`).
- Registered in `EvalVisitorPrimitivo.__init__` under `self.libraries`: `{"numk": [module, imported_flag], ...}`. KAFE `import <name>` flips the flag; calls dispatch through `libraryFunctionCall`.
- Library functions receive evaluated KAFE arguments (lists as Python lists; GESHA/PARDOS/MACHINE objects as their Python classes).
- KAFE values map to Python types via `TypeUtils.py`.

## Extension Points

- New language component: create `src/componentes_lenguaje/<feature>/funciones.py`, wire dispatch in `EvalVisitorPrimitivo.py`.
- New built-in library: see `.opencode/knowledge/libraries.md`.
- New grammar rule: edit `Kafe_Grammar.g4`/`Kafe_Lexer.g4`, regenerate the parser, keep `docs/especificacion/` EBNF in sync, add fixture tests.
- New ML/DL functionality: see `.opencode/knowledge/ml-library.md`, `.opencode/knowledge/dl-library.md`, and `.opencode/knowledge/engineering.md`.
