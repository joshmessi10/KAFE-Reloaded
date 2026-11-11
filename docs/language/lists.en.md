# Lists

A **list** stores many values of the same type, one after another. In the [Variables](../aprende/variables.md#lists-a-box-with-compartments) lesson you saw that it is like a box with numbered compartments, and you learned `[0]`, `len` and `append`. Here you will see everything else.

## Creating lists

The type of a list is written `List[TYPE]`, and its values go between square brackets `[ ]`, separated by commas. A list can be empty, and it can also hold **other lists** (a list of lists is like a table, or a **matrix**):

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-declare.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-declare.expec"
```

| Type | What it holds |
|---|---|
| `List[INT]` | Whole numbers, like `[1, 2, 3]` |
| `List[List[INT]]` | Lists of whole numbers: a table with rows and columns |
| `List[List[List[BOOL]]]` | Lists of lists of `BOOL`: a three-level "cube" |

!!! note "All of the same type"
    A list is **homogeneous**: all its elements have the same type. `List` is written with a capital first letter and the rest in lowercase.

## Adding, removing and counting

### An everyday comparison

Think of your **shopping list**. You add things at the end, cross out what you already bought and count how many things are left.

| Function | What it does |
|---|---|
| `append(list, element)` | Adds `element` **at the end** of the list |
| `remove(list, element)` | Removes the **first** time `element` appears |
| `len(list)` | Returns how many elements there are (an `INT`) |

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-compras.en.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-compras.en.expec"
```

`append` and `remove` change the list you give them; you do not need to store it again. When `show` prints a list of texts, each text appears between single quotes.

If the element appears several times, `remove` only removes the first one:

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-remove-first.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-remove-first.expec"
```

!!! note "`len` only counts lists"
    In KAFE, `len` accepts lists, but not texts. `len("hello")` gives an error.

To create lists of numbers in a row, use `range(...)`, which you saw in [Control structures](control-structures.md).

## Indexes: the position of each element

### The idea in one sentence

The **index** is the compartment number of an element, and it is counted **from 0**.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/tutorial-lang2-indices.svg"
<figcaption>On top, the indexes from the start (0, 1, 2). Below, the negative indexes, which count from the end (-1 is the last one).</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-index.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-index.expec"
```

| Rule | What it means |
|---|---|
| Starts at 0 | `nums[0]` is the first element |
| Negative indexes | `nums[-1]` is the last one; `nums[-2]`, the one before it |
| Changing an element | `nums[0] = 99;` replaces the value in that compartment |
| Out of range | Asking for a position that does not exist gives an `IndexError` |
| Index type | The index must be an `INT` |

## Lists inside lists: matrices

A **matrix** is a table of numbers. In KAFE it is a list of rows, and each row is a list. To reach a number you use **two** indexes: first the row, then the column. It is like finding a seat at the movies: row 1, seat 2.

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-matrix.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-matrix.expec"
```

!!! tip "What happened here?"
    1. `matrix[0]` is the whole first row: `[1, 2, 3]`.
    2. `matrix[1][2]` is row 1, column 2: the `6`. `matrix[-1][-1]` is the last row, last column: the `9`.
    3. `matrix[1][1] = 0;` replaced the `5` in the middle with `0`.
    4. `len(matrix)` counts the rows (3) and `len(matrix[0])` counts the columns of the first row (3).

For linear algebra with matrices (adding, multiplying, transposing), use the [NUMK](../libraries/numk.md) library.

## Joining lists with `+`

The `+` operator joins two lists of the same type, one after the other (this is called **concatenating**):

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-concat.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-concat.expec"
```

!!! warning "For now, `+` also changes the first list"
    `c` is `[1, 2, 3, 4]`, as you expected. But look at the second line: `a` changed **too**, even though we only wrote `a + b`. This is how KAFE works today. If you need to keep `a` unchanged, do not use it on the left of `+`.

??? info "For the curious 🤓: two names, one list"
    When you write `List[INT] other = original;`, no new list is created: `other` and `original` are **two labels stuck on the same box**. If you change one, you see the change in the other:

    ```kafe
    --8<-- "tests/DocsExamples/tutorial/lists-shared.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/tutorial/lists-shared.expec"
    ```

## Common errors

### Asking for a position that does not exist

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-out-of-range.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-out-of-range.error.stderr.expec"
```

The list has 3 elements, so its indexes are 0, 1 and 2. The last one is `nums[2]` (or `nums[-1]`).

### Mixing types in a list

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-mixed-types.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-mixed-types.error.stderr.expec"
```

A `List[INT]` only holds whole numbers. Careful: today KAFE does not complain at the `append`, but the next time you use the list (here, in `show`). If you see this error, look back for where you added the wrong value.

### Removing something that is not there

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-remove-missing.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-remove-missing.error.stderr.expec"
```

The `5` is not in the list, so it cannot be removed.

### Using an index that is not an `INT`

```kafe
--8<-- "tests/DocsExamples/tutorial/lists-float-index.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lists-float-index.error.stderr.expec"
```

`1.0` is a `FLOAT`. There is no compartment "one point zero": write `nums[1]`.

## What did you learn?

- `append` adds at the end, `remove` removes the first match and `len` counts.
- Indexes start at 0; negative ones count from the end.
- A list of lists is a matrix: `matrix[row][column]`.

[Next: Imports :material-arrow-right:](imports.md){ .md-button .md-button--primary }
