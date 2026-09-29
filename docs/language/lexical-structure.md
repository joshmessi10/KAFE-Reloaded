# Lexical structure

This section describes the basic elements of the language: tokens, comments, identifiers, and literals.

---

## Comments

KAFE supports two types of comments. Comments do not affect program execution.

| Type | Syntax | Description |
|------|----------|-------------|
| Single-line | `--` | All following text on the line is ignored |
| Multiline | `-> ... <-` | Delimited by `->` and `<-`; may span multiple lines |

```kafe
-- Single-line comment
INT x = 10;  -- Trailing comment

->
  This is a multiline
  comment in KAFE.
<-
```

!!! info "Nested comments"
    KAFE supports nested multiline comments:
    ```kafe
    ->
    Level 1
    ->
    Nested level 2
    <-
    Text after level 2
    <-
    ```

---

## Identifiers

Identifiers are names used for variables, functions, and parameters.

**Rules:**

- They must start with a letter (`a`–`z`, `A`–`Z`) or underscore (`_`).
- They may contain letters, digits (`0`–`9`), and underscores.
- The language is **case-sensitive**: `True` ≠ `true`.
- Reserved words cannot be used as identifiers.

```kafe
-- Valid
INT my_variable = 5;
INT _private = 10;
INT var2 = 20;

-- Invalid
-- INT 2variable = 5;   -- Error: starts with a digit
-- INT my-variable = 5; -- Error: hyphens are not underscores
```

---

## Reserved words

| Reserved word | Use |
|-------------------|-----|
| `INT`, `FLOAT`, `BOOL`, `STR`, `VOID` | Primitive type declarations |
| `List` | List declarations |
| `FUNC` | Function variable declarations |
| `GESHA` | Type for deep learning models |
| `PARDOS` | Type for DataFrames |
| `MACHINE` | Type for ML objects |
| `True`, `False` | Boolean literals |
| `if`, `elif`, `else` | Conditional statements |
| `while`, `for`, `in` | Loop control structures |
| `drip` | Function declaration |
| `return` | Return a value |
| `import` | Load libraries |
| `show` | Write output to the console |
| `pour` | Read user input |
| `range`, `len` | Built-in functions |
| `append`, `remove` | List mutation |

---

## Literales

### Numeric literals

```kafe
INT integer = 42;
FLOAT decimal = 3.14;
FLOAT scientific = 2.5e10;    -- Scientific notation
FLOAT scientific2 = 1.2e-3;   -- Negative exponent
```

### String literals

```kafe
STR single = 'Hello';
STR double = "World";
STR empty = "";
```

Strings may use single (`'`) or double (`"`) quotes and support these escape sequences:

| Sequence | Description |
|-----------|-------------|
| `\n` | Newline |
| `\t` | Tab |
| `\r` | Carriage return |
| `\\` | Literal backslash |
| `\"` | Literal double quote |
| `\'` | Literal single quote |

### Boolean literals

```kafe
BOOL truth_value = True;
BOOL false_value = False;
```

!!! warning "Case-sensitive"
    `True` and `False` must start with a capital letter. `true` and `false` are invalid.

### List literals

```kafe
List[INT] empty = [];
List[INT] numbers = [1, 2, 3];
List[List[INT]] matrix = [[1, 2], [3, 4]];
```

---

## Imports

The module system extends the language by loading built-in libraries.

**Syntax:**

```kafe
import library_name;
```

**Rules:**

- Imports must appear at the beginning of the file.
- An import is global to the file.
- Aliases (`as`) are not currently supported.
- Using a library that has not been imported causes an error.

### Module resolution algorithm

When `import M;` is used, the runtime searches for `M.kf` in this order:

1. The current working directory (where the importing file is located).
2. The base directory of the KAFE installation.
3. The parent of the base directory (development environment).

### Cycle and cache handling

KAFE uses a module cache to optimize loading and prevent import cycles. A module is loaded and executed only the first time it is encountered; subsequent imports retrieve its definitions from the cache.
