# Error reference

Complete table of KAFE system errors, including their type, category, and message.

---

## Type errors

| Error | Type | Message |
|-------|------|---------|
| VOID used as a variable type | `TypeError` | `VOID cannot be used as variable type` |
| VOID used as a parameter | `TypeError` | `VOID cannot be used as parameter type` |
| Incompatible assignment type | `TypeError` | `Expected {expected_type}, obtained {actual_type}` |
| Incorrect argument type | `TypeError` | `Function {function_name} expects argument of type {expected_type}, got type {actual_type}` |
| Non-boolean condition | `TypeError` | `Condition in {location} must be boolean, got {actual_type}` |
| Non-iterable variable | `TypeError` | `Variable in for must be iterable, got {actual_type}` |
| VOID function returns a value | `TypeError` | `Function declared VOID must not return a value` |
| Incompatible signature | `TypeError` | `Expected {expected_signature}, obtained {actual_signature}` |

---

## Name errors

| Error | Type | Message |
|-------|------|---------|
| Function already defined | `NameError` | `Function '{function_name}' already defined` |
| Variable already defined | `NameError` | `Variable '{variable_name}' already defined` |
| Function not defined | `NameError` | `Function '{function_name}' not defined` |
| Variable not defined | `NameError` | `Variable '{variable_name}' not defined` |

---

## Index errors

| Error | Type | Message |
|-------|------|---------|
| Non-integer index | `IndexError` | `Index must be an integer, obtained {actual_type}` |
| Index out of range | `IndexError` | `Index {index} out of bounds for collection of size {size}` |

---

## Runtime errors

| Error | Type | Message |
|-------|------|---------|
| Heterogeneous list | `Exception` | `Expected homogeneous list` |
| Incorrect number of arguments | `Exception` | `'{function_name}' expects {expected_count} args, got {actual_count}` |
| Infinite loop | `RuntimeError` | `Maximum number of iterations exceeded in while loop` |
| Module not found | `FileNotFoundError` | `Module file for '{module_name}' not found. Tried: {paths}` |
| Error in block | `RuntimeError` | `Error in {location} block: {exception}` |
| All-NaN column | `Exception` | `SimpleImputer: Cannot compute '{strategy}' on column with all missing values` |

---

## File errors

| Error | Type | Message |
|-------|------|---------|
| File not found | `FileNotFoundError` | `File '{file_name}' not found at {path}` |
| File already exists | `FileExistsError` | `File '{file_name}' already exists at {path}` |

---

## Signature errors

| Error | Type | Message |
|-------|------|---------|
| Incompatible signature | `TypeError` | `Expected {expected_signature}, obtained {actual_signature}` |
| Incorrect parameter count | `TypeError` | `Function parameter '{parameter_name}' must accept {expected_count} parameter(s), but got {actual_count}` |

---

## String errors

| Error | Type | Message |
|-------|------|---------|
| Invalid escape | `Exception` | `Invalid escape sequence: \{character}` |
| Incomplete escape | `Exception` | `Incomplete escape sequence at end of string` |
| Unclosed string | `Exception` | `SyntaxError: unterminated string literal at line {line}:{column}` |

---

## Scientific notation errors

| Error | Type | Message |
|-------|------|---------|
| Invalid scientific notation | `Exception` | `Scientific Notation Error [Line {line}, Column {column}]: {message}` |

---

## Syntax errors (ANTLR)

| Error | Type | Message |
|-------|------|---------|
| General syntax error | `Exception` | `SyntaxError at line {line}:{column} -> {message}` |
| Variable is not an object | `Exception` | `variable is not of type object` |
| Library not imported | `Exception` | `library not imported` |
