---
inclusion: auto
---

# Technology Stack

## Core Technologies

- **Language**: Python 3.10+
- **Parser Generator**: ANTLR 4 (v4.13.2)
- **Testing**: pytest (v9.0.2)
- **Property Testing**: hypothesis (v6.151.9)

## Key Dependencies

```
antlr4-python3-runtime==4.13.2
colorama==0.4.6
hypothesis==6.151.9
pytest==9.0.2
```

## Build System

### Grammar Compilation

The project uses ANTLR to generate lexer and parser from grammar files:

```bash
# From src/ directory
make antlr
```

This generates:

- `Kafe_GrammarLexer.py`
- `Kafe_GrammarParser.py`
- `Kafe_GrammarVisitor.py`
- Token files (`.tokens`, `.interp`)

### Clean Generated Files

```bash
# From src/ directory
make clean
```

## Common Commands

### Running KAFE Programs

```bash
# From project root
python src/Kafe.py <path-to-file.kf>

# Example
python src/Kafe.py tests/Algorithms/Fibonacci.kf
```

### Running Tests

```bash
# All tests
pytest tests/

# Specific test (from src/)
make test prueba=<test_name>
```

### Virtual Environment Setup

```bash
# Create venv
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Linux/macOS)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Alternative: Nix Flake Environment

For reproducible development environment:

```bash
nix develop
```

Includes Python 3.10+, ANTLR 4, OpenJDK, Git, and pytest pre-configured.

## Architecture Pattern

**Visitor Pattern**: The interpreter uses ANTLR's visitor pattern (`EvalVisitorPrimitivo` extends `Kafe_GrammarVisitor`) to traverse and evaluate the AST.

## File Extensions

- `.kf`: KAFE source files
- `.expec`: Expected output files for tests
- `.g4`: ANTLR grammar files
