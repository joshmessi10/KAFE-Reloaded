# NUMK: multiplying matrices

This is the most important calculation in neural networks. Inside every layer, the computer multiplies a table of data by a table of weights. Let's go step by step: first with two lists and then with tables.

## The dot product: quantities times prices { #dot-product }

You go to the shop with a list: 2 apples, 1 pineapple and 3 lemons. The prices are 5, 10 and 4. How much do you pay? You multiply each quantity by its price and **add everything up**: 2·5 + 1·10 + 3·4 = 32. That is the **dot product**.

### `numk.dot(a, b)` { #dot }

**What it does:** Multiplies two vectors element by element and adds up the results. It returns **a single number**.

**When to use it:** For a shopping total, a weighted average, or the calculation of a neuron: inputs times weights.

| Parameter | Type | What it means |
|---|---|---|
| `a` | `List[INT | FLOAT]` | The first vector. |
| `b` | `List[INT | FLOAT]` | The second vector, of the same length. |

**Returns:** A number (`INT` or `FLOAT`).

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/dot.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/dot.expec"
```

??? warning "Common mistake"
    Both vectors must be the same length. The message says "Matrices", even though they are vectors:

    ```kafe
    --8<-- "tests/DocsExamples/numk/dot-length.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/numk/dot-length.error.stderr.expec"
    ```

??? info "For the curious 🤓"
    $a \cdot b = \sum_{i} a_i \, b_i$. In [the neuron](../../aprende/neuronas.md), the sum of inputs times weights is exactly a dot product.

## Row by column { #matrix-product }

To multiply two tables, you do **many dot products**. Each cell of the result comes from a **row** of the first table and a **column** of the second:

1. Pick a row of the first table, for example row 0: `[1, 2]`.
2. Pick a column of the second, for example column 0: `[5, 7]`.
3. Take their dot product: 1·5 + 2·7 = 19.
4. Write 19 in the cell at row 0, column 0 of the result.
5. Repeat with every row and every column.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/numk-dot.svg"
<figcaption>Each cell of the result is a row times a column: multiply number by number and add.</figcaption>
</figure>

That is why there is a rule: the **length of each row** of the first table (its columns) must equal the **length of each column** of the second (its rows). A table of shape `(2, 3)` can be multiplied by one of shape `(3, 4)`, and the result has shape `(2, 4)`.

### `numk.mul(a, b)` { #mul }

**What it does:** Multiplies two matrices **row by column**.

**When to use it:** To pass data through a layer of a neural network, or to combine tables of quantities and prices from several shops.

| Parameter | Type | What it means |
|---|---|---|
| `a` | `List[List[INT | FLOAT]]` | The first matrix, of shape `(n, m)`. |
| `b` | `List[List[INT | FLOAT]]` | The second matrix, of shape `(m, p)`. |

**Returns:** A new matrix of shape `(n, p)`.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/mul.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/mul.expec"
```

The second calculation multiplies a `(1, 3)` row by a `(3, 1)` column: the result is a tiny table with a single cell, `1 + 2 + 3 = 6`.

!!! note "Watch out"
    `mul` is not the same as [`emul`](element-wise.md#emul). `emul` multiplies each cell by its partner; `mul` multiplies rows by columns. Order also matters: `mul(a, b)` almost never gives the same as `mul(b, a)`.

??? warning "Common mistake"
    A table with 3 columns cannot be multiplied by one with 2 rows:

    ```kafe
    --8<-- "tests/DocsExamples/numk/mul-shape.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/numk/mul-shape.error.stderr.expec"
    ```

??? info "For the curious 🤓"
    $C_{ij} = \sum_{k} A_{ik} \, B_{kj}$. For tables of $n \times m$ and $m \times p$ it takes $n \cdot m \cdot p$ multiplications. In [How it works inside](../numk.md#inside) you can see the loop that computes it.

### `numk.dot_matrix(a, b)` { #dot_matrix }

**What it does:** The same as [`mul`](#mul): multiplies two matrices row by column.

**When to use it:** When you prefer that name. Only the error message changes: if the shapes don't fit, it says `dot_matrix: Matrices don't have the same dimension`.

| Parameter | Type | What it means |
|---|---|---|
| `a` | `List[List[INT | FLOAT]]` | The first matrix, of shape `(n, m)`. |
| `b` | `List[List[INT | FLOAT]]` | The second matrix, of shape `(m, p)`. |

**Returns:** A new matrix of shape `(n, p)`.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/dot_matrix.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/dot_matrix.expec"
```

## The inverse matrix: undoing { #inverse }

If multiplying by 2 is undone by dividing by 2, how do you undo multiplying by a table? With its **inverse**. Multiplying a matrix by its inverse gives the **identity matrix**: ones on the diagonal and zeros everywhere else. The identity is like the number 1: multiplying by it changes nothing.

### `numk.inv(m)` { #inv }

**What it does:** Computes the inverse matrix of `m`.

**When to use it:** To solve systems of equations, or to undo a transformation.

| Parameter | Type | What it means |
|---|---|---|
| `m` | `List[List[INT | FLOAT]]` | A **square** matrix (as many rows as columns). |

**Returns:** `List[List[FLOAT]]`

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/inv.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/inv.expec"
```

The second line checks the inverse: `m` times its inverse gives the identity.

!!! note "Watch out"
    `inv` does not swap rows while it computes. If the matrix has a `0` on the diagonal, like `[[0, 1], [1, 0]]`, it may say `Matrix is singular` even though the inverse does exist.

??? warning "Common mistake"
    Some matrices have no inverse (they are called **singular**). In `[[1, 2], [2, 4]]` the second row is twice the first, so there is no way to undo it:

    ```kafe
    --8<-- "tests/DocsExamples/numk/inv-singular.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/numk/inv-singular.error.stderr.expec"
    ```

??? info "For the curious 🤓"
    $A \, A^{-1} = I$. NUMK uses the **Gauss-Jordan** method: it sticks the identity to the right of $A$ and applies row operations until the left part becomes $I$. What is left on the right is $A^{-1}$.

## What did you learn?

- The **dot product** multiplies pair by pair and adds everything up.
- `mul` multiplies **row by column**: each cell is a dot product.
- The first table must have as many columns as the second has rows.
- The **inverse** undoes a multiplication, but not every matrix has one.

[Next: broadcasting :material-arrow-right:](broadcasting.md){ .md-button .md-button--primary }
