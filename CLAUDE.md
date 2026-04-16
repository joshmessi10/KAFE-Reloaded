# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is KAFE

KAFE is a Domain-Specific Language (DSL) for teaching Deep Learning through functional programming. `.kf` files are KAFE source files. The interpreter is written in Python using ANTLR 4 and the Visitor pattern.

## Setup

Requires **Java JDK 11+** (for ANTLR) and **Python 3.10+**.

```bash
pip install -r requirements.txt
# Download ANTLR JAR (once):
# https://www.antlr.org/download/antlr-4.13.2-complete.jar → place in src/
```

## Critical: Generate Parser Files

**Must run after any grammar change** (`Kafe_Grammar.g4` or `Kafe_Lexer.g4`):

```bash
cd src
java -jar antlr-4.13.2-complete.jar -no-listener -visitor -Dlanguage=Python3 Kafe_Grammar.g4
# Or: make antlr
```

The generated files (`Kafe_GrammarLexer.py`, `Kafe_GrammarParser.py`, `Kafe_GrammarVisitor.py`) are committed to the repo — regenerate them only when the grammar changes.

## Running Programs

```bash
python src/Kafe.py <path-to-file.kf>
# Example:
python src/Kafe.py tests/Algorithms/Fibonacci.kf
```

## Tests

```bash
pytest tests/          # all tests
pytest tests/ -v       # verbose
pytest tests/test_base.py                                 # one category
pytest tests/test_base.py::test_valid_programs            # specific test function
cd src && make test prueba=KafeMACHINE                    # via Makefile
```

**Test structure**: each category in `tests/` has `.kf` programs paired with `.expec` (expected stdout) and optional `.in` (stdin). Invalid-program tests use `.error.kf` + `.error.expec`. The `tests/utils.py` helpers discover and parameterize these files for pytest.

## Architecture

### Execution flow

```
.kf file → Kafe.py (entry) → ANTLR Lexer/Parser → AST
         → EvalVisitorPrimitivo.py (walks AST, manages scope stack)
         → src/componentes_lenguaje/ (language features)
         → src/lib/ (built-in libraries)
```

### Key files

| File | Role |
|------|------|
| `src/Kafe_Grammar.g4` | Grammar (imports `Kafe_Lexer.g4`) — source of truth for syntax |
| `src/EvalVisitorPrimitivo.py` | Main visitor: variable scope, dispatch to components and libraries |
| `src/TypeUtils.py` | Type system definitions and validation |
| `src/global_utils.py` | Shared helpers (variable assignment, type checking) |
| `src/errores.py` | Custom exception classes |
| `src/globals.py` | Global state (program path, working directory) |

### Language components (`src/componentes_lenguaje/`)

Modular implementations called by the visitor:

- `base/` — variables, operators, indexing, literals, type coercion
- `bucles/` — `for` / `while`
- `condicionales/` — `if` / `elif` / `else`
- `funciones/` — `drip` declarations, lambdas, currying, built-ins (`show`, `pour`, `range`, `len`, `append`, `remove`)
- `importar/` — `import` statements
- `librerias/` — routes method calls to the correct `lib/` module
- `method_calling/` — object method resolution

### Built-in libraries (`src/lib/`)

| Library | Purpose |
|---------|---------|
| `KafeNUMK` | NumPy-style arrays/matrices |
| `KafeGESHA` | Neural networks and deep learning primitives |
| `KafeMATH` | Math utilities |
| `KafePLOT` | Matplotlib-style visualization |
| `KafePARDOS` | DataFrames and CSV (Pandas-style) |
| `KafeFILES` | File I/O |
| `KafeMACHINE` | ML models: LinearRegression, LabelEncoder, OneHotEncoder, PCA |

### KAFE language keywords

`drip` (function def) · `show` (print) · `pour` (debug print) · `import` · `if/elif/else` · `while` · `for` · `return`

Types: `INT` `FLOAT` `STR` `BOOL` `VOID` `LIST` `GESHA` `PARDOS` `MACHINE` and function types.

### Adding a new built-in library

1. Create `src/lib/KafeXXX.py` with a class exposing methods.
2. Register it in `src/componentes_lenguaje/librerias/` so the visitor can dispatch to it.
3. Add corresponding tests under `tests/KafeXXX/`.

### Adding grammar features

1. Edit `Kafe_Grammar.g4` (or `Kafe_Lexer.g4` for tokens).
2. Regenerate parser files (`make antlr`).
3. Add visitor methods in `EvalVisitorPrimitivo.py` (or delegate to a new component).
