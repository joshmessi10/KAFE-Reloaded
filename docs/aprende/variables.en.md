# Variables and types

## The idea in one sentence

A **variable** is a name that stores a value so you can use it (and change it) later.

## An everyday comparison

Imagine **labeled boxes**. On one box you write `age` and put a number inside; on another you write `name` and put a text inside. When you need the age, you do not remember it by heart: you open the box labeled `age`.

Each box also has a **type**, which says what fits inside it. You do not put shoes in an egg carton. In KAFE, you do not put a text in an `INT` box.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/variables-cajas.svg"
<figcaption>Each value drops into the box of its type: whole numbers in INT, texts in STR, decimal numbers in FLOAT and true/false in BOOL.</figcaption>
</figure>

## The four basic types

| Type | What it stores | Example |
|---|---|---|
| `INT` | Whole numbers (no decimals) | `10`, `-3`, `0` |
| `FLOAT` | Numbers with decimals | `1.35`, `-0.5` |
| `STR` | Text, always inside quotes | `"Ana"`, `"hello"` |
| `BOOL` | True or false | `True`, `False` |

## Creating and using variables

To create a variable you write **the type, the name, `=` and the value**. After that you can use the name instead of the value:

```kafe
--8<-- "tests/DocsExamples/aprende/variables-cajas.en.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/variables-cajas.en.expec"
```

!!! tip "What happened here?"
    1. We created four boxes, one of each type, and put a value in each one.
    2. `show(name)` opened the `name` box and showed what was inside: `Ana`.
    3. `age = age + 1;` took out the 10, added 1 and stored the 11 **in the same box**. To change the value we do not write the type again: the box already exists.

## Lists: a box with compartments

Sometimes you want to keep many values together, like the points in a game. That is what a **list** is for: a row of numbered compartments. Its type is written `List[TYPE]`.

```kafe
--8<-- "tests/DocsExamples/aprende/variables-lista.en.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/variables-lista.en.expec"
```

!!! note "Compartments start at 0"
    `points[0]` is the **first** element. Computers count from zero: the first one is 0, the second one is 1, and so on. `len(points)` tells you how many elements there are and `append` adds one at the end.

## Common mistake: putting something in the wrong box

```kafe
--8<-- "tests/DocsExamples/aprende/variables-tipo-equivocado.en.error.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/variables-tipo-equivocado.en.error.stderr.expec"
```

KAFE expected an `INT` (a number) and got a `STR` (a text). To fix it, write the number without quotes: `INT age = 10;`.

!!! tip "Why is KAFE so strict?"
    Because that way it finds the mistake **before** it causes trouble. If the age were the text `"ten"`, the calculation `age + 1` would not make sense. Saying the type of each box helps you think clearly.

## What did you learn?

- A variable is a box with a name: `TYPE name = value;`.
- The basic types are `INT`, `FLOAT`, `STR` and `BOOL`.
- A list `List[TYPE]` stores many values and is counted from 0.

??? info "For the curious 🤓"
    KAFE has **explicit static typing**: the type of each variable is written in the program and checked before the value is used. There are more types, like lists inside lists (`List[List[INT]]`) and functions (`FUNC`). You can see them all in [Type system](../language/type-system.md) and [Lists](../language/lists.md).

[Next lesson: Functions :material-arrow-right:](funciones.md){ .md-button .md-button--primary }
