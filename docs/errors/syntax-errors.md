# Syntax errors

Syntax errors occur when code does not conform to the language grammar.

---

## Common errors

### Missing identifier in a declaration

```
-- Error
INT = 5;

-- Message
SyntaxError at line 1:4 -> ...
```

### Missing semicolon

```
-- Error
INT x = 5
show(x);

-- Message
SyntaxError at line 2:0 -> ...
```

### Missing colon in a block

```
-- Error
if (True)
    show("hello");
;

-- Message
SyntaxError at line 1:8 -> ...
```

### Unclosed parenthesis

```
-- Error
show((5 + 3);

-- Message
SyntaxError at line 1:11 -> ...
```

### Invalid operator

```
-- Error
INT x = 5 ++ 3;

-- Message
SyntaxError at line 1:10 -> ...
```

### Invalid type

```
-- Error
UNKNOWN_TYPE x = 5;

-- Message
SyntaxError at line 1:5 -> ...
```

---

## Expression errors

### Indexing a non-list value

```
-- Error (syntactically valid, but fails at runtime)
STR a = "Hello";
a[0] = 'd';

-- Message
TypeError: variable is not of type object
```

### Malformed lambda

```
-- Error
FUNC(INT)=>INT f = (x) => x + 1;

-- Message (the parameter type is missing)
SyntaxError at line 1:22 -> ...
```

---

## Diagnostics

ANTLR4 errors include:

- **Line number**: `at line X`
- **Column**: `:Y`
- **Descriptive message**: Description of the problem

```bash
# Example output
Syntax Error [Line 3, Column 15]: mismatched input ';' expecting '=>'
```
