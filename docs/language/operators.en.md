# Operators and expressions

## The idea in one sentence

An **operator** is a symbol that does something with one or two values (add, compare, join…), and an **expression** is any piece of code that turns into a value, such as `5 + 4 * 2`.

## An everyday comparison

On a calculator, the numbers are the ingredients and the `+`, `−`, `×`, `÷` buttons are the actions. An expression is what you type before pressing `=`. KAFE has buttons for arithmetic, for comparing and for combining yes-or-no answers.

!!! note "Before you start"
    This page uses the types `INT`, `FLOAT`, `STR` and `BOOL`. If you don't know them yet, see [Variables and types](../aprende/variables.md) and the [Type system](type-system.md).

---

## Arithmetic operators

**The idea:** they do arithmetic.

| Operator | Operation | Example | Result |
|---|---|---|---|
| `+` | Addition (or joins texts) | `show(5 + 4);` | `9` |
| `-` | Subtraction | `show(10 - 3);` | `7` |
| `*` | Multiplication | `show(3 * 4);` | `12` |
| `/` | Division (always gives `FLOAT`) | `show(10 / 4);` | `2.5` |
| `^` | Exponentiation | `show(5 ^ 2);` | `25` |
| `%` | Modulo: the remainder of a division | `show(5 % 4);` | `1` |

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-arithmetic.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-arithmetic.expec"
```

!!! tip "What is modulo?"
    If you share 5 sweets among 4 people, each one gets 1 and **1 is left over**. That leftover is `5 % 4`. It's useful, for example, to know whether a number is even: `n % 2` is `0` when `n` is even.

### Common error: dividing by zero

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-division-by-zero.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-division-by-zero.error.stderr.expec"
```

Sharing something among zero people makes no sense, not even to KAFE. Check with an `if` first that the divisor isn't `0`.

---

## Comparison operators

**The idea:** they compare two values and answer `True` or `False`.

**Comparison:** it's like a balance scale: it tells you whether both pans weigh the same or which one is heavier.

| Operator | Meaning | Example |
|---|---|---|
| `==` | Equal to | `a == b` |
| `!=` | Not equal to | `a != b` |
| `<` | Less than | `a < b` |
| `<=` | Less than or equal to | `a <= b` |
| `>` | Greater than | `a > b` |
| `>=` | Greater than or equal to | `a >= b` |

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-comparison.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-comparison.expec"
```

!!! tip "What happened here?"
    You can also compare texts (`'asdf' == 'asdf'`) and whole lists (`[12, 1] == [12, 1]`). An `INT` and a `FLOAT` with the same value are equal: `5 == 5.0` is `True`. Careful: `=` (one sign) **stores** a value; `==` (two signs) **compares**.

### Common error: comparing a number with a text

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-compare-types.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-compare-types.error.stderr.expec"
```

"Is 1 less than the letter a?" has no answer. Compare values of the same type, or convert one of them (`str(1) < "a"`).

---

## Logical operators

**The idea:** they combine yes-or-no answers.

**Comparison:** "I'll go out to play **if** I finished my homework **and** it isn't raining." Both conditions must hold. "I'll have dessert **if** there's ice cream **or** there's fruit." One is enough.

| Operator | Meaning | It's `True` when… | Example |
|---|---|---|---|
| `&&` | AND | …both sides are `True` | `a > 0 && b > 0` |
| `\|\|` | OR | …at least one side is `True` | `a > 0 \|\| b > 0` |
| `!` | NOT | …the value is `False` (it flips it) | `!True` |

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-logical.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-logical.expec"
```

!!! note "KAFE doesn't look further than it needs"
    In `a && b`, if `a` is already `False`, KAFE doesn't compute `b`: the result will be `False` anyway. In `a || b`, if `a` is already `True`, it doesn't look at `b` either. This is called **short-circuit evaluation**.

---

## Assignment operator

**The idea:** `=` stores a value in a variable that already exists, or in a position of a list.

| Form | What it does |
|---|---|
| `ID = expression;` | Simple assignment |
| `ID[index] = expression;` | Assignment to a position of a list |

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-assignment.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-assignment.expec"
```

`x = x + 5;` reads "take the value of `x`, add 5 and store it back in `x`". Assignment is a **statement**, not an expression: it doesn't produce a value.

### Common error: `+=` doesn't exist

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-compound-assignment.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-compound-assignment.error.stderr.expec"
```

KAFE has no compound operators such as `+=` or `-=`. Write the full calculation: `x = x + 5;`.

---

## Output statement — show()

`show(expression)` computes the expression and shows the result on the console, on its own line. It works with any type.

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-show.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-show.expec"
```

---

## Operator precedence

**The idea:** when an expression has several operators and no parentheses, **precedence** decides which one is computed first.

**Comparison:** when you get dressed, socks go first and shoes after. It doesn't matter in which order you say them: the order is fixed. Maths is the same: in `5 + 4 * 2` multiplication goes before addition.

You can picture the expression as a **tree**: KAFE computes the lower branches first and climbs up with the results to the root.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/tutorial-lang1-precedence.svg"
<figcaption>In 5 + 4 * 2, the multiplication branch is lower down: it's computed first (8) and then the addition (13).</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-precedence.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-precedence.expec"
```

!!! tip "What happened here?"
    1. `5 + 4 * 2`: first `4 * 2 = 8`, then `5 + 8 = 13`.
    2. `(5 + 4) * 2`: parentheses rule, so first `9` and then `18`.
    3. `5 ^ 2 * 2`: exponentiation goes first: `25 * 2 = 50`.
    4. `2 ^ 3 ^ 2`: exponentiation groups **right to left**: `2 ^ 9 = 512`.
    5. `-3 - -3`: the `-` stuck to the number makes it negative; the result is `0`.
    6. `'asdf' * 5` repeats the text five times.

Full table, from **highest** to **lowest** precedence:

| Level | Operators | Associativity | Description |
|---|---|---|---|
| 1 | `()`, `[]`, `.` | Left | Parentheses, list indexing, library member access |
| 2 | `f(args)` | Left | Function call |
| 3 | `!`, `-` (unary) | Right | Logical NOT and negation |
| 4 | `^` | Right | Exponentiation |
| 5 | `*`, `/`, `%` | Left | Multiplication, division, modulo |
| 6 | `+`, `-` | Left | Addition (or text joining) and subtraction |
| 7 | `<`, `<=`, `>`, `>=` | Left | Ordering comparison |
| 8 | `==`, `!=` | Left | Equality |
| 9 | `&&`, `\|\|` | Left | AND, OR (**same level**) |

"Left associativity" means that, with operators of the same level, KAFE computes left to right: `10 - 3 - 2` is `(10 - 3) - 2 = 5`.

### Three precedence surprises

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-surprises.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-surprises.expec"
```

!!! warning "What happened here?"
    1. **`&&` and `||` share the same level** and read left to right. `True || False && False` is `(True || False) && False`, which gives `False`. In maths and in many other languages, AND goes before OR and the result would be `True`. Use parentheses to say what you mean.
    2. **Comparisons don't chain.** `3 > 2 > 1` reads `(3 > 2) > 1`, that is `True > 1`, and `True` counts as `1`: the result is `False`. Write `3 > 2 && 2 > 1`.
    3. **Unary minus goes before exponentiation.** `-2 ^ 2` is `(-2) ^ 2 = 4`, not `-4` as in maths. If you want `-4`, write `-(2 ^ 2)`.

---

## Lambda expressions

**The idea:** a **lambda** is a small function without a name, written as a single expression.

**Comparison:** it's like a sticky note with a short instruction ("multiply it by itself") instead of a full recipe on a card.

```kafe
(parameters) => expression
```

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-lambda.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-lambda.expec"
```

**Features:**

- **Implicit return:** the lambda returns the value of its expression; there's no `return`.
- **Typed parameters:** just like regular functions (`y: INT`).
- **Use:** they are very handy to pass to higher-order functions, such as `apply`.

More in [Functions](functions.md).

---

## Type conversions

**The idea:** `int`, `float`, `str` and `bool` create a new value of another type from one you already have.

**Comparison:** it's like a currency exchange: you hand over pesos and get the same amount in another currency.

| Conversion | What it does | Example |
|---|---|---|
| `int(x)` | To integer. With decimals, it **cuts off** the decimal part | `int("5")` → `5`, `int(3.9)` → `3` |
| `float(x)` | To decimal | `float("3.14")` → `3.14`, `float(2)` → `2.0` |
| `str(x)` | To text | `str(42)` → `"42"` |
| `bool(x)` | To boolean: `0`, `0.0`, `""` and `[]` give `False`; everything else `True` | `bool(1)` → `True`, `bool(0)` → `False` |

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-conversions.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-conversions.expec"
```

!!! warning "Careful with `bool` and texts"
    `bool` only checks whether the text is empty. That's why `bool("False")` is `True`: the text `"False"` isn't empty.

### Common error: converting a text that isn't a number

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-bad-conversion.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-bad-conversion.error.stderr.expec"
```

`int` only understands digits: `"five"` isn't one. It doesn't accept a text with decimals like `"3.5"` either; use `float("3.5")` for that.

---

## What did you learn?

- There are arithmetic operators (`+ - * / ^ %`), comparison operators (`== != < <= > >=`) and logical operators (`&& || !`).
- Precedence decides what is computed first; with parentheses you're always in charge.
- `&&` and `||` share the same level, and `-2 ^ 2` is `4`: use parentheses to avoid surprises.
- `int`, `float`, `str` and `bool` convert values from one type to another.

??? info "For the curious 🤓: how KAFE resolves ambiguities"
    KAFE uses the **LL(\*)** parser that ANTLR4 generates from `src/Kafe_Grammar.g4`:

    - **Static precedence:** set by the order of the grammar rules. Each level of the table is a rule (`logicExpr`, `equalityExpr`, `relationalExpr`, `additiveExpr`, `multiplicativeExpr`, `powerExpr`, `unaryExpr`), and each one contains the next. The deeper "inside" a rule is, the earlier it's computed.
    - **Maximal munch (greedy):** the lexer always builds the longest possible token. That's why `<=` is a single operator and `--` starts a comment.

    One more detail: `&&` and `||` don't turn the result into a `BOOL`; they return one of the two values. With booleans you won't notice, but `5 && 3` gives `3`.

[Next: Control structures :material-arrow-right:](control-structures.md){ .md-button .md-button--primary }
