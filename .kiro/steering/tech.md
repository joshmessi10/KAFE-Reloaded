# Technology Stack

## Core Technologies

- **Python**: 3.10+ (implementation language)
- **ANTLR 4.13.2**: Parser generator for language grammar
- **Java JDK**: 11+ (required for ANTLR)

## Key Dependencies

- `antlr4-python3-runtime==4.13.2`: ANTLR runtime for Python
- `pytest==9.0.2`: Testing framework
- `hypothesis==6.151.9`: Property-based testing
- `colorama==0.4.6`: Terminal color output

## Build System

### Grammar Compilation (CRITICAL)

ANTLR must be run to generate parser files before the interpreter works:

```bash
cd src
antlr -no-listener -visitor -Dlanguage=Python3 Kafe_Grammar.g4
```

Or using Make:

```bash
cd src
make antlr
```

**Without this step, you'll get**: `ModuleNotFoundError: No module named 'Kafe_GrammarLexer'`

### Common Commands

**Run a KAFE program**:

```bash
python src/Kafe.py <path-to-file.kf>
# Example: python src/Kafe.py tests/Algorithms/Fibonacci.kf
```

**Run tests**:

```bash
pytest tests/
```

**Clean generated files**:

```bash
cd src
make clean
```

**Run specific test**:

```bash
cd src
make test prueba=<test_name>
```

## Development Environment

### Virtual Environment Setup

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
```

### Alternative: Nix Flake

Reproducible environment with all dependencies pre-configured:

```bash
nix develop
```

## Architecture Pattern

- **Visitor Pattern**: ANTLR-generated visitor for AST traversal
- **Modular Components**: Language features separated into `componentes_lenguaje/` modules
- **Library System**: Built-in libraries in `src/lib/` with dynamic import mechanism
