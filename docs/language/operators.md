# Operators and expressions

---

## Arithmetic operators

| Operator | Operation | Example | Result |
|----------|-----------|---------|-----------|
| `+` | Addition / concatenation | `show(5 + 4);` | `9` |
| `-` | Subtraction | `show(10 - 3);` | `7` |
| `*` | Multiplication | `show(3 * 4);` | `12` |
| `/` | Division | `show(10 / 4);` | `2.5` |
| `^` | Exponentiation | `show(5 ^ 2);` | `25` |
| `%` | Modulo (remainder) | `show(5 % 4);` | `1` |

```kafe
show(5 + 4 * 2);     -- 13 (multiplication first)
show((5 + 4) * 2);   -- 18 (parentheses change precedence)
show(5 ^ 2 * 2);     -- 50 (exponentiation first)
show(-3 - -3);       -- 0
show('asdf' * 5);    -- asdfasdfasdfasdfasdf
```

---

## Comparison operators

| Operator | Meaning | Example |
|----------|-------------|---------|
| `==` | Equal to | `a == b` |
| `!=` | Not equal to | `a != b` |
| `<` | Less than | `a < b` |
| `<=` | Less than or equal to | `a <= b` |
| `>` | Greater than | `a > b` |
| `>=` | Greater than or equal to | `a >= b` |

```kafe
show(4 == 5);   -- False
show(5 == 5);   -- True
show(4 != 5);   -- True
show(4 < 5);    -- True
show(6 <= 6);   -- True
show('asdf' == 'asdf');  -- True
show([12, 1] == [12, 1]); -- True
```

---

## Logical operators

| Operator | Meaning | Example |
|----------|-------------|---------|
| `&&` | Logical AND | `a > 0 && b > 0` |
| `\|\|` | Logical OR | `a > 0 \|\| b > 0` |
| `!` | Unary NOT | `!True` |

```kafe
show(True && False);  -- False
show(True || False);  -- True
show(!False);         -- True
show(!True);          -- False
```

---

## Assignment operator

| Syntax | Description |
|----------|-------------|
| `ID = expression;` | Simple assignment |
| `ID[idx] = expression;` | Indexed assignment (for List) |

```kafe
INT x = 10;
x = x + 5;           -- Reassignment

List[INT] L = [1, 2];
L[0] = 99;           -- Indexed assignment
```

---

## Output statement — show()

```kafe
show(5 + 4 * 2);    -- 13
show((5 + 4) * 2);  -- 18
show(5 ^ 2 * 2);    -- 50
show("Hello KAFE"); -- Hello KAFE
show([1, 2, 3]);    -- [1, 2, 3]
show(True);         -- True
```

---

## Operator precedence

Precedence determines evaluation order when parentheses are absent (highest to lowest):

| Level | Operators | Associativity | Description |
|-------|-----------|---------------|-------------|
| 1 | `()`, `[]`, `.` | Left | Grouping, indexing, member access |
| 2 | `f(args)` | Left | Function call |
| 3 | `!`, `-` | Right | Unary NOT and negation |
| 4 | `^` | Right | Exponentiation |
| 5 | `*`, `/`, `%` | Left | Multiplication, division, modulo |
| 6 | `+`, `-` | Left | Addition/concatenation and subtraction |
| 7 | `<`, `<=`, `>`, `>=` | Left | Relational comparison |
| 8 | `==`, `!=` | Left | Equality |
| 9 | `&&`, `\|\|` | Left | Logical conjunction and disjunction (same precedence) |

Assignment is a statement rather than an expression. Compound assignment operators such as `+=` and `-=` are not supported.

---

## Lambda expressions

Lambdas provide a concise way to define anonymous functions:

```kafe
-- Syntax
(parameters) => expression

-- Example
FUNC(INT)=>INT square = (y: INT) => y * y;
show(square(4));  -- 16

-- As a higher-order function argument
drip apply(f: FUNC(INT) => INT, n: INT) => INT:
    return f(n);
;

show(apply((y: INT) => y * y, 4));  -- 16
```

**Features:**

- **Implicit return**: The lambda returns the value of its expression.
- **Typing**: Parameters must be typed as they are in regular functions.
- **Use**: Lambdas are useful with higher-order functions.

---

## Type conversions

```kafe
INT a = int("5");           -- 5
FLOAT b = float("3.14");    -- 3.14
STR c = str(42);            -- "42"
BOOL d = bool(1);           -- True
BOOL e = bool(0);           -- False
```

---

## Resolving ambiguities

KAFE uses the **LL(*)** parser provided by ANTLR4:

- **Static precedence**: Defined by the order of rules in the grammar.
- **Maximal munch (greedy)**: The lexer always builds the longest possible token.
