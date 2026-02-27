---
inclusion: auto
---

# Project Structure

## Root Directory

```
KAFE/
├── src/                    # Source code
├── tests/                  # Test files
├── .venv/                  # Virtual environment
├── requirements.txt        # Python dependencies
├── flake.nix              # Nix flake configuration
└── README.md              # Documentation
```

## Source Directory (`src/`)

### Core Interpreter Files

- `Kafe.py`: Main entry point, handles file loading and interpreter initialization
- `EvalVisitorPrimitivo.py`: Main visitor implementation, orchestrates AST traversal
- `globals.py`: Global state management
- `global_utils.py`: Shared utility functions
- `errores.py`: Error handling and custom exceptions
- `TypeUtils.py`: Type system utilities

### Grammar Files

- `Kafe_Grammar.g4`: Main grammar definition
- `Kafe_Lexer.g4`: Lexer rules (imported by main grammar)
- `Kafe_Grammar*.py`: Generated parser/lexer files (do not edit manually)
- `*.tokens`, `*.interp`: Generated ANTLR artifacts

### Language Components (`src/componentes_lenguaje/`)

Modular implementation of language features:

- `base/`: Variable declarations, assignments, operators, indexing
- `bucles/`: Loop constructs (for, while)
- `condicionales/`: Conditional expressions (if-else)
- `funciones/`: Function declarations, lambdas, built-in functions
- `importar/`: Import statement handling
- `librerias/`: Library loading and management
- `method_calling/`: Object method call resolution

Each module contains:

- `funciones.py`: Implementation logic
- `utils.py`: Helper functions (when needed)

### Built-in Libraries (`src/lib/`)

- `KafeNUMK/`: NumPy-like array operations
- `KafeGESHA/`: Deep learning framework (layers, optimizers, activation functions)
- `KafeMATH/`: Mathematical utilities
- `KafePLOT/`: Plotting and visualization
- `KafePARDOS/`: DataFrame and CSV handling
- `KafeFILES/`: File I/O operations

Each library contains:

- `funciones.py`: Exported functions
- `utils.py`: Internal utilities
- `errores.py`: Library-specific errors (when needed)
- Additional modules for complex libraries (e.g., GESHA has `Dense.py`, `Optimizer.py`, etc.)

## Test Directory (`tests/`)

### Test Organization

Tests are organized by feature category:

- `base/`: Core language features (variables, operators, lists, indexing)
- `bucles/`: Loop constructs
- `condicionales/`: Conditional expressions
- `funciones/`: Function-related features
- `Algorithms/`: Complete algorithm implementations
- Additional feature-specific directories

### Test File Pattern

Each test consists of two files:

- `<test_name>.kf`: KAFE source code
- `<test_name>.expec`: Expected output

Example:

```
tests/base/operators_arithmetic.kf
tests/base/operators_arithmetic.expec
```

### Test Naming Conventions

- Descriptive names: `list_indexing_basic.kf`
- Error tests: `*_error.kf` (e.g., `assignment_type_mismatch_error.kf`)
- Feature tests: `<feature>_<scenario>.kf`

## Code Organization Principles

1. **Separation of Concerns**: Language features are isolated in `componentes_lenguaje/` modules
2. **Visitor Delegation**: `EvalVisitorPrimitivo` delegates to feature-specific functions
3. **Library Isolation**: Each library is self-contained in `src/lib/`
4. **Test Mirroring**: Test structure mirrors language feature organization
5. **Generated Code**: ANTLR-generated files stay in `src/`, never manually edited

## Import Patterns

```python
# Feature imports in EvalVisitorPrimitivo.py
from componentes_lenguaje.<category>.funciones import <functions>

# Library imports
import lib.Kafe<LibName>.funciones as <libname>_funcs_module
```

## File Paths

- All file paths in code should handle both absolute and relative paths
- `globals.ruta_programa`: Absolute path to currently executing .kf file
- `globals.current_dir`: Directory containing the .kf file
