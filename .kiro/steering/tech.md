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

### CRITICAL: First-Time Setup

**Before running any KAFE programs, you MUST generate the parser files.** The repository does not include the ANTLR-generated files, so you'll get `ModuleNotFoundError: No module named 'Kafe_GrammarLexer'` if you skip this step.

#### Prerequisites

ANTLR requires Java to run. You have two options:

**Option 1: Use Nix (Recommended)**

```bash
nix develop
# Everything is pre-configured, grammar files available or auto-generated
```

**Option 2: Manual Installation**

1. Install Java JDK (11 or higher):
   - Download from [Adoptium](https://adoptium.net/) or [Oracle](https://www.oracle.com/java/technologies/downloads/)
   - Verify: `java -version`

2. Install ANTLR 4.13.2:

   ```bash
   # Download ANTLR jar
   curl -O https://www.antlr.org/download/antlr-4.13.2-complete.jar

   # Windows PowerShell: Add to profile
   function antlr { java -jar C:\path\to\antlr-4.13.2-complete.jar $args }

   # Linux/macOS: Add to ~/.bashrc or ~/.zshrc
   alias antlr='java -jar /path/to/antlr-4.13.2-complete.jar'
   ```

### Grammar Compilation

Generate the parser files from grammar:

```bash
# From src/ directory
make antlr

# Or manually:
cd src
antlr -no-listener -visitor -Dlanguage=Python3 Kafe_Grammar.g4
```

This generates:

- `Kafe_GrammarLexer.py`
- `Kafe_GrammarParser.py`
- `Kafe_GrammarVisitor.py`
- Token files (`.tokens`, `.interp`)

**You must run this after:**

- Fresh clone of the repository
- Any changes to `Kafe_Grammar.g4` or `Kafe_Lexer.g4`

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
