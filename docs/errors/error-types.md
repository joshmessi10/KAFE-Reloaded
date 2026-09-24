# Error types

KAFE handles errors at different stages of execution. When possible, each error includes a type, a descriptive message, and a location.

---

## Error categories

| Category | Phase | Example |
|-----------|------|---------|
| **SyntaxError** | Lexical/syntactic analysis | Unrecognized token or invalid structure |
| **TypeError** | Execution (semantic) | Incorrect data type |
| **NameError** | Execution (semantic) | Undefined variable or function |
| **IndexError** | Execution (runtime) | Index out of range |
| **RuntimeError** | Execution (runtime) | Infinite loop or general runtime error |
| **FileNotFoundError** | Execution (runtime) | File or module not found |
| **FileExistsError** | Execution (runtime) | File already exists |

---

## Error format

```
ErrorType: descriptive message
```

Examples:

```
TypeError: Expected INT, obtained FLOAT
NameError: Variable 'x' not defined
IndexError: Index 5 out of bounds for collection of size 3
RuntimeError: Maximum number of iterations exceeded in while loop
```

---

## Errors by phase

### Lexical phase

| Error | Description |
|-------|-------------|
| Unrecognized token | Invalid character in the code |
| Unclosed string | Missing closing quote |
| Invalid escape sequence | `\q`, `\u`, etc. |

### Syntactic phase

| Error | Description |
|-------|-------------|
| Invalid structure | `INT = 5;` (identifier is missing) |
| Missing `:` or `;` | Block without a delimiter |
| Unclosed parenthesis | `show((5 + 3;` |

### Execution phase

| Error | Description |
|-------|-------------|
| Incorrect type | Assigning FLOAT to INT |
| Undefined variable | Using `x` without declaring it |
| Undefined function | Calling a function that does not exist |
| Invalid arguments | Incorrect number or type of arguments |
| Index out of range | Accessing a nonexistent position |
| Infinite loop | More than 10,000 iterations in a `while` loop |

---

## Handling strategy

KAFE distinguishes between:

- **`.error.kf` files**: Expected test errors → exit code 1, stderr
- **Regular programs**: Unexpected errors → stdout, exit code 0

```python
# In Kafe.py
try:
    main()
except Exception as e:
    if sys.argv[1].endswith(".error.kf"):
        print(error_msg, file=sys.stderr)
        sys.exit(1)
    else:
        print(error_msg)
        sys.exit(0)
```
