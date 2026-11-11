# Type system

## The idea in one sentence

The **type system** is the set of rules that says what kind of value each variable can hold and which operations make sense for each kind of value.

## An everyday comparison

Think of a tidy kitchen. Milk goes in a bottle, eggs in an egg carton and flour in a jar. Each container says what fits in it. If you try to put eggs in the milk bottle, something goes wrong.

In KAFE every variable is a container with a **type** label. KAFE uses **explicit static typing**: you **write** the type when you create the variable (explicit) and that type **never changes** (static).

```kafe
INT variableName = 42;
```

Every statement ends with a semicolon (`;`).

!!! note "If this is your first time"
    The lesson [Variables and types](../aprende/variables.md) explains variables from scratch. Here we go one step further: all the types, how they combine and which errors appear.

---

## Primitive types

| Type | What it holds | Example | Valid values |
|---|---|---|---|
| `INT` | Whole numbers, of any size | `INT a = 5;` | …, -1, 0, 1, … |
| `FLOAT` | Numbers with decimals | `FLOAT e = 2.5;` | 3.14, -0.5 |
| `BOOL` | True or false | `BOOL b = True;` | `True`, `False` |
| `STR` | Text | `STR s = 'Hello';` | Quoted text |
| `VOID` | "Nothing": the absence of a value | `=> VOID` (functions only) | Not assignable |

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-primitives.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-primitives.expec"
```

!!! tip "What happened here?"
    We created one variable of each type and showed them. The last line computes 2¹⁰⁰: an `INT` in KAFE has no maximum size, so the result comes out in full.

### Variables without an initial value

If you declare a variable without `=`, KAFE gives it a **default value**: the "zero" of its type.

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-defaults.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-defaults.expec"
```

`INT` starts at `0`, `FLOAT` at `0.0`, `BOOL` at `False`, `STR` at the empty text (that's the blank line) and a list at `[]`.

### Unit type — VOID

**The idea:** `VOID` means "this function returns nothing".

**Comparison:** a function that returns something is like a juicer: you put fruit in and a glass comes out. A `VOID` function is like a doorbell: you press it, it does something (it rings), but it doesn't hand you anything.

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-void.en.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-void.en.expec"
```

`VOID` is only used in a function signature. You can't create variables of type `VOID`:

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-void-variable.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-void-variable.error.stderr.expec"
```

---

## How types combine { #compatibility-and-coercion-rules }

**The idea:** KAFE is **strict when storing** a value in a variable, but **flexible when doing arithmetic** with numbers.

**Comparison:** on a scale you can add 5 kilos and 2.5 kilos without trouble: the result is 7.5 kilos. But if a box says "whole numbers only", you can't store 7.5 in it.

### Automatic conversion in arithmetic

When a calculation mixes an `INT` with a `FLOAT`, KAFE turns the `INT` into a `FLOAT` before operating. This is called **coercion** (turning one type into another automatically). The result is a `FLOAT`.

Also, division `/` always gives a `FLOAT`, even when both numbers are integers and the division is exact.

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-coercion.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-coercion.expec"
```

!!! tip "What happened here?"
    1. `5 + 2.0` and `5 * 2.0`: the `5` became `5.0`, so you get `7.0` and `10.0`.
    2. `10 / 4` gives `2.5` and `10 / 5` gives `2.0` (a `FLOAT`, not an `INT`).
    3. `+` between two texts joins them: `"ab" + "cd"` is `abcd`.
    4. To join a text with a number, you first turn the number into text with `str(10)`.

### Strict assignment

When **storing** a value, KAFE converts nothing: the value's type must be exactly the variable's type.

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-strict-int.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-strict-int.error.stderr.expec"
```

Not even an integer fits in a `FLOAT` variable:

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-strict-float.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-strict-float.error.stderr.expec"
```

To fix it, write the value with decimals (`FLOAT price = 5.0;`) or convert it: `FLOAT price = float(5);`. Conversions are covered in [Operators](operators.md#type-conversions).

### Common error: adding text and a number

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-concat-number.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-concat-number.error.stderr.expec"
```

`+` only joins text with text. Write `"Age: " + str(10)`.

### Compatibility matrix

This table says what happens with an operator between a value on the left (row) and one on the right (column):

| Left \ Right | `INT` | `FLOAT` | `STR` | `BOOL` |
|---|---|---|---|---|
| **`INT`** | `INT` with `+ - * % ^` (`/` gives `FLOAT`) | `FLOAT` with `+ - * / % ^` | Only `*`: repeats the text (`3 * "ab"`) | Works like a number (see note) |
| **`FLOAT`** | `FLOAT` with `+ - * / % ^` | `FLOAT` with `+ - * / % ^` | Error | Works like a number (see note) |
| **`STR`** | Only `*`: repeats the text (`"ab" * 3`) | Error | `+` joins the texts | Error |
| **`BOOL`** | Works like a number (see note) | Works like a number (see note) | Error | `&&`, `\|\|` |

Also:

- `==` and `!=` work with **any** pair of values. Values of different types are different (`"5" == 5` is `False`), except numbers: `5 == 5.0` is `True`.
- `<`, `<=`, `>` and `>=` compare numbers with numbers, texts with texts (alphabetical order) and lists with lists. Mixing a number with a text is an error.
- Any combination marked "Error" raises a `TypeError` **while the program runs**.

!!! warning "Booleans behave like numbers"
    In KAFE, `True` counts as `1` and `False` as `0` inside a calculation. That's why `True + 1` gives `2` instead of an error. It's better not to rely on this: use `BOOL` only with `&&`, `||` and `!`.

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-bool-arithmetic.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-bool-arithmetic.expec"
```

??? info "For the curious 🤓: the rules written as formulas"
    Type systems are described with **typing judgments** inside a context Γ (Gamma), which is the list of known variables and their types:

    $$\Gamma \vdash e : \tau$$

    It reads: "in context Γ, expression $e$ has type $\tau$". The coercion rule for addition is:

    $$\frac{\Gamma \vdash e_1 : \texttt{INT} \qquad \Gamma \vdash e_2 : \texttt{FLOAT}}{\Gamma \vdash e_1 + e_2 : \texttt{FLOAT}}$$

    The conditions go above the line; the conclusion goes below. Note: in KAFE these operation rules are checked **when each operation runs**, while a variable's type is checked every time you store a value in it.

---

## Lists { #compound-types-lists }

**The idea:** a list holds many values **of the same type** in a row. Its type is written `List[TYPE]`, and `TYPE` can be another list: that's how you build matrices.

**Comparison:** an egg carton only holds eggs. A box of egg cartons holds egg cartons: it's a list of lists.

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-lists.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-lists.expec"
```

**Homogeneity rules** (everything of the same type):

- All elements of a list have the same type.
- The empty list `[]` fits any list type.
- Nested lists must have the **same depth** (all lists of numbers, for example), but they may have **different lengths**: `[[1], [2, 3]]` is valid.

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-mixed-list.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-mixed-list.error.stderr.expec"
```

`1` is an `INT` and `2.5` is a `FLOAT`: they can't go together. Write `[1.0, 2.5]` in a `List[FLOAT]`. More about lists in [Lists](lists.md).

---

## Function type — FUNC

**The idea:** in KAFE a function is also a value. You can store it in a variable or pass it to another function. Its type says what it takes and what it returns:

```kafe
FUNC(INPUT_TYPE) => OUTPUT_TYPE
```

**Comparison:** a recipe written on a card. You can keep the card in a drawer (a variable) or give it to someone else (pass it to another function). The card says "flour goes in, bread comes out".

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-func.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-func.expec"
```

!!! tip "What happened here?"
    1. `add(15)` called `add` with a single argument. The result is a **new function** waiting for the second number (this is called *currying*). We stored it in `addFifteen`, of type `FUNC(INT)=>INT`.
    2. `addFifteen(5)` finished the calculation: `15 + 5 = 20`. To see the result you need `show`; calling `addFifteen(5);` on its own shows nothing.
    3. `apply` is a **higher-order function**: it takes another function (`f`) as a parameter. `apply(double, 5)` gives `10`.

### Exact signatures { #func-type-properties }

When a function takes a parameter of type `FUNC`, the function you pass must have **exactly** those types. There's no "close enough": `FUNC(FLOAT)=>FLOAT` doesn't fit where `FUNC(INT)=>INT` is expected. This is called **invariance**.

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-func-signature.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-func-signature.error.stderr.expec"
```

!!! warning "`FUNC` variables are less strict"
    This exact check happens with function **parameters**. When you store a function in a `FUNC(...)=>...` **variable**, KAFE currently only checks that the value is a function, not its types. Write the signature correctly anyway: your program reads better and won't break when KAFE does check it.

More about functions in [Functions](functions.md).

---

## Model types

Three types hold objects from the libraries:

| Type | What it holds | Library |
|---|---|---|
| `GESHA` | Neural networks and their layers | `gesha` |
| `PARDOS` | Data tables (DataFrames) | `pardos` |
| `MACHINE` | Machine learning models | `machine` |

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-models.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-models.expec"
```

A `PARDOS` table is created, for example, by reading a CSV file:

```kafe
PARDOS df = pardos.read_csv("data.csv");
```

---

## What can change (mutability) { #mutability }

**The idea:** some things can be modified after they're created (they are **mutable**) and others can't (they are **immutable**).

**Comparison:** a whiteboard is mutable: you erase and write. A printed book is immutable: if you want different text, you print a new book.

| Element | Can it change? |
|---|---|
| **Variables** | Their value yes; their type, never |
| **Lists** | Yes: you can change, add and remove elements |
| **Texts (`STR`)** | No: operations create a new text |

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-mutability.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-mutability.expec"
```

!!! tip "What happened here?"
    `x` went from `10` to `20`. The list changed its first element and grew. `s + " World"` created a **new** text in `s2`; `s` is still `Hello`.

### Common error: changing a variable's type

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-change-type.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-change-type.error.stderr.expec"
```

`x` was born an `INT` and will stay an `INT`. If you need a text, create another variable: `STR word = "ten";`.

### Common error: changing one letter of a text

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-string-immutable.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-string-immutable.error.stderr.expec"
```

Texts aren't modified letter by letter. Create a new one, for example `s = "J" + "ello";`.

---

## What did you learn?

- Every variable has a fixed type: `INT`, `FLOAT`, `BOOL`, `STR`, `List[...]`, `FUNC(...)=>...`, `GESHA`, `PARDOS` or `MACHINE`. `VOID` only appears in functions.
- In arithmetic, `INT` with `FLOAT` gives `FLOAT`, and `/` always gives `FLOAT`. When storing, the type must match exactly.
- Lists are homogeneous and mutable; texts are immutable.

[Next: Operators :material-arrow-right:](operators.md){ .md-button .md-button--primary }
