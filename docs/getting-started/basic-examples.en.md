# Basic examples

## The idea in one sentence

This page is a **toolbox**: small, complete programs that show, one by one, the most used pieces of KAFE.

## An everyday comparison

When you learn to cook, you first practice the basics: chopping, boiling, mixing. Later you combine those techniques into big recipes. Here you practice the basics of KAFE. You can copy each example into a `.kf` file and run it as you learned in [Your first program](first-program.md).

## Variables and types

A **variable** is a box with a name that stores a value. In KAFE you write **the type** of each box: `INT` (whole number), `FLOAT` (with decimals), `BOOL` (true or false), `STR` (text) and `List[...]` (list). This is called **explicit static typing**.

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-variables.en.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-variables.en.expec"
```

!!! tip "What happened here?"
    1. We created boxes of each basic type. Lines with `--` are **comments**: notes that KAFE ignores.
    2. `List[List[INT]]` is a list of lists, like a table with rows and columns.
    3. `INT x;` and `List[INT] empty;` have no initial value. KAFE gives them a default one: `0` for `INT` and `[]` (empty list) for lists.

## Operations

KAFE does math, compares values and combines conditions:

| Kind | Operators |
|---|---|
| Arithmetic | `+` add, `-` subtract, `*` multiply, `/` divide, `^` power, `%` remainder |
| Comparison | `==` equal, `!=` not equal, `<`, `<=`, `>`, `>=` |
| Logical | `&&` and, `||` or, `!` not |

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-operaciones.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-operaciones.expec"
```

!!! tip "What happened here?"
    1. `10 / 4` gives `2.5`: division can give decimals. `17 % 5` gives `2`, what is **left over** when you divide 17 by 5.
    2. `5 + 4 * 2` gives `13` because multiplication comes first. With parentheses, `(5 + 4) * 2` gives `18`.
    3. Comparisons and logical operators answer `True` or `False`.
    4. `+` also **joins** texts and lists: `[1, 2] + [3, 4]` gives `[1, 2, 3, 4]`.

## Texts and escape sequences

A text (`STR`) goes between double quotes `"…"` or single quotes `'…'`. Some special characters are written with a backslash `\`; this is called an **escape sequence**.

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-textos.en.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-textos.en.expec"
```

!!! tip "What happened here?"
    1. `\n` jumped to a new line and `\t` added an indent (a tab) before `World`.
    2. `\"` put quotes inside the text without closing it.
    3. Single quotes work the same as double quotes.

| Sequence | What it produces |
|---|---|
| `\n` | New line |
| `\t` | Tab |
| `\r` | Carriage return |
| `\\` | A backslash |
| `\"` | A double quote |
| `\'` | A single quote |

### Common error: a sequence that does not exist

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-escape.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-escape.error.stderr.expec"
```

`\q` is not in the table, so KAFE rejects it. The same happens with `\u`. Leaving a lone `\` at the end of a text, or not closing the quotes, is also an error.

## Decisions: `if`, `elif` and `else`

A **conditional** chooses what to do based on a condition, like when you decide: "if it rains, I take an umbrella; otherwise, I take a cap".

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-condicional.en.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-condicional.en.expec"
```

!!! tip "What happened here?"
    1. `age >= 18` is false (15 is not greater than or equal to 18), so KAFE skipped that block.
    2. `elif` (*else, if…*) checked `age >= 12`. It is true, so it showed `Teenager`.
    3. Since it already found a path, KAFE ignored the `else`. The `;` on the last line closes the whole conditional.

!!! warning "Do not put `;` before `elif` or `else`"
    The words `elif` and `else` come right after the previous block, with no `;` in front. The only extra `;` goes at the end of the whole conditional. If you write `; elif`, KAFE stops reading the program at that point **without showing any error**, and the lines that follow do not run.

## Loops: repeating

A **loop** repeats instructions. `for` repeats once for each element of a list. `while` repeats **while** a condition is true, like "while there are dirty dishes, wash one".

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-bucles.en.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-bucles.en.expec"
```

!!! tip "What happened here?"
    1. `range(3)` creates the list `[0, 1, 2]`. The `for` put each number in `i` and showed it.
    2. The `while` started with `counter` at 3. On each turn it showed it and subtracted 1.
    3. When `counter` reached 0, the condition `counter > 0` was false and the loop ended. Then `Liftoff!` was shown.

## Functions

A **function** is a recipe with a name: you give it ingredients (the **parameters**) and it gives you back a result. In KAFE you create them with `drip`. You write the type of each parameter and, after `=>`, the type of the result.

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-funcion.en.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-funcion.en.expec"
```

!!! tip "What happened here?"
    1. `add(3, 4)` put `3` in `a` and `4` in `b`; `return` gave back `7`.
    2. `subtract(5)` received **only the first** value. Instead of failing, it created a new function that waits for the missing value. This is called **currying**.
    3. That new function has type `FUNC(INT)=>INT`: it takes an `INT` and returns an `INT`. `subtractFrom5(3)` computed `5 - 3 = 2`.

## Lists

A **list** stores many values in order. Each position has a number called an **index**, which starts at 0.

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-listas.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-listas.expec"
```

!!! tip "What happened here?"
    1. `nums[0]` is the first element (`10`) and `nums[-1]` the last one (`30`): negative indexes count from the end.
    2. `nums[0] = 99;` changed the first element. `append` added `40` at the end and `remove` took out the value `20`.
    3. `len(nums)` counted the elements: `3`.
    4. `range(4)` goes from 0 to 3; `range(1, 5)` goes from 1 to 4; `range(0, 10, 2)` moves in steps of 2.
    5. In a list of lists, `matrix[1][0]` picks row 1 and then column 0: `3`.

## Converting between types

Sometimes you have a value of one type and need it as another, like the text that `pour` returns. That is what `int`, `float`, `str` and `bool` are for.

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-conversiones.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-conversiones.expec"
```

!!! tip "What happened here?"
    1. `int("5")` turned the text `"5"` into the number `5`, so `a + 1` gave `6`.
    2. `float("3.14")` gave the decimal number `3.14`.
    3. `str(42)` turned the number into text, which is why `c + "!"` joined the texts: `42!`.
    4. `bool(1)` gave `True`.

## Comments

A **comment** is a note for people. KAFE ignores it. `--` comments until the end of the line, and `->` … `<-` comments several lines.

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-comentarios.en.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-comentarios.en.expec"
```

!!! tip "What happened here?"
    KAFE skipped every comment and only ran the instructions: it stored `10` and `20` and showed the sum, `30`.

## What did you learn?

- Every variable has a type, and KAFE can do math, compare, and join texts and lists.
- `if`/`elif`/`else` decide; `for` and `while` repeat; `drip` creates functions.
- Lists count from 0, and `int`, `float`, `str` and `bool` convert values.

??? info "For the curious 🤓"
    Every piece on this page has its own reference page with all the details: [Type system](../language/type-system.md), [Operators and expressions](../language/operators.md), [Control structures](../language/control-structures.md), [Functions](../language/functions.md) and [Lists](../language/lists.md).

[Next: Lexical structure :material-arrow-right:](../language/lexical-structure.md){ .md-button .md-button--primary }
