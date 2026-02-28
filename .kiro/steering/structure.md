# Project Structure

## Root Directory

```
KAFE-Reloaded/
├── src/                    # Source code
├── tests/                  # Test files and examples
├── .venv/                  # Python virtual environment
├── requirements.txt        # Python dependencies
├── flake.nix              # Nix development environment
└── README.md              # Documentation
```

## Source Directory (`src/`)

### Core Interpreter Files

- `Kafe.py`: Main entry point - handles file loading and interpreter initialization
- `EvalVisitorPrimitivo.py`: Main visitor implementation that orchestrates language execution
- `Kafe_Grammar.g4`: ANTLR grammar definition (source of truth for syntax)
- `Kafe_Lexer.g4`: Lexer rules imported by main grammar
- `Kafe_GrammarParser.py`: Generated parser (do not edit manually)
- `Kafe_GrammarLexer.py`: Generated lexer (do not edit manually)
- `Kafe_GrammarVisitor.py`: Generated visitor base class (do not edit manually)

### Support Modules

- `globals.py`: Global state management (program path, current directory)
- `global_utils.py`: Shared utility functions
- `errores.py`: Error handling and custom exceptions
- `TypeUtils.py`: Type checking and validation utilities

### Language Components (`src/componentes_lenguaje/`)

Modular implementation of language features:

- `base/`: Variable declarations, assignments, operators, indexing, literals
- `bucles/`: Loop constructs (for, while)
- `condicionales/`: Conditional expressions (if-else)
- `funciones/`: Function declarations, lambda expressions, built-in functions (show, pour, range, len, append, remove)
- `importar/`: Import statement handling
- `librerias/`: Library loading and function dispatch
- `method_calling/`: Object method call resolution

Each module contains:

- `funciones.py`: Implementation of the feature
- `utils.py`: Helper functions (when needed)

### Built-in Libraries (`src/lib/`)

Each library follows the pattern: `src/lib/Kafe<NAME>/`

- `KafeNUMK/`: NumPy-like array operations
- `KafeGESHA/`: Neural network and deep learning
- `KafeMATH/`: Mathematical functions
- `KafePLOT/`: Plotting and visualization
- `KafePARDOS/`: DataFrame/CSV operations
- `KafeFILES/`: File I/O

Library structure:

- `funciones.py`: Exported functions for KAFE programs
- `utils.py`: Internal helper functions
- `errores.py`: Library-specific error handling
- Additional modules for complex features (e.g., `Dense.py`, `Gesha.py` in KafeGESHA)

## Test Directory (`tests/`)

Organized by feature category:

- `Algorithms/`: Algorithm implementations (sorting, searching, recursion)
- `base/`: Basic language features (variables, operators, lists)
- `bucles/`: Loop tests
- `condicionales/`: Conditional tests
- `funciones/`: Function and lambda tests
- `lib/`: Library-specific tests (subdirectories for each library)

Test file conventions:

- `.kf` files: KAFE source code
- `.expec` files: Expected output for validation
- `.in` files: Input data (when needed)

## Key Conventions

### File Naming

- KAFE programs: `.kf` extension
- Python modules: lowercase with underscores
- Generated ANTLR files: `Kafe_Grammar*` prefix

### Import Resolution

- Libraries imported via `IMPORT <library_name>` in KAFE code
- Library registry in `EvalVisitorPrimitivo.__init__()` maps names to modules
- File paths resolved relative to program location (stored in `globals.current_dir`)

### Visitor Pattern Flow

1. `Kafe.py` creates `EvalVisitorPrimitivo` instance
2. Parser generates AST from `.kf` file
3. Visitor methods dispatch to `componentes_lenguaje/` functions
4. Functions modify visitor state (`self.variables`, `self.libraries`)
5. Library calls route through `librerias/funciones.py` to `src/lib/`
