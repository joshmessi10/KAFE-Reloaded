# Lexical errors

Lexical errors occur during tokenization when the lexer cannot recognize a character or sequence.

---

## Common errors

### Unclosed string

```
-- Error
show("Hello world);

-- Message
SyntaxError: unterminated string literal at line 1:11
```

### Unclosed string (single quote)

```
-- Error
STR s = 'Hello;

-- Message
SyntaxError: unterminated string literal at line 1:9
```

### Newline in a string

```
-- Error
show("Hello
world");

-- Message
SyntaxError: unterminated string literal at line 1:5
```

### Invalid escape sequence

```
-- Error
show("Hello\qWorld");

-- Message
Invalid escape sequence: \q
```

### Invalid escape sequence (another example)

```
-- Error
show("Hello\uWorld");

-- Message
Invalid escape sequence: \u
```

### Backslash at the end of a string

```
-- Error
show("Hello\");

-- Message
Incomplete escape sequence at end of string
```

---

## Valid escape sequences

| Sequence | Description |
|-----------|-------------|
| `\n` | Newline |
| `\t` | Tab |
| `\r` | Carriage return |
| `\\` | Literal backslash |
| `\"` | Literal double quote |
| `\'` | Literal single quote |

Any other sequence (such as `\q`, `\u`, or `\x`) causes an error.

---

## Scientific notation errors

```
-- Error
show(1.23e);

-- Message
Scientific Notation Error [Line 1, Column 8]: <msg>
```

!!! note "Note"
    Scientific notation such as `2.5e10` and `1.2e-3` is valid. An incomplete literal causes an error.
