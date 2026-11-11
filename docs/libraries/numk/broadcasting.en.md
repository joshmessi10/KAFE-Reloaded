# NUMK: broadcasting

Imagine you want to raise the price in the first column of a table by 10 and the price in the second by 20, in **every** row. You could write a row `[10, 20]` for each row of the table… or let NUMK **stretch** it for you. That is **broadcasting**: the small thing is copied until it is the same size as the big one.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/numk-broadcast.svg"
<figcaption>The row `[10, 20]` is copied downward until it covers the table, and then added element by element.</figcaption>
</figure>

## When it can stretch { #rules }

NUMK compares the shapes **starting from the end** (from the right). Two sizes fit if:

- they are equal, or
- one of them is `1` (that one gets copied), or
- one of the shapes is missing axes (they are added on the left).

For example, `(2, 2)` and `(2,)` fit: the row is copied into each row. `(2, 2)` and `(2, 1)` also fit: the column is copied into each column. A single number (like `5`) fits with everything. But `(1, 3)` and `(2,)` do **not** fit, because 3 and 2 are different and neither is 1.

!!! tip "Works with vectors"
    Unlike `add` and `sub`, these functions accept vectors, matrices, tensors and even single numbers.

### `numk.broadcast_add(a, b)` { #broadcast_add }

**What it does:** Adds element by element, stretching whichever is smaller.

**When to use it:** To add the same **bias** to every row of results from a neural network layer, or the same raise to a whole table.

| Parameter | Type | What it means |
|---|---|---|
| `a` | number or `List[...]` of numbers | The first tensor. |
| `b` | number or `List[...]` of numbers | The second tensor, of a compatible shape. |

**Returns:** A tensor with the larger of the two shapes.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/broadcast_add.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/broadcast_add.expec"
```

The first sum stretches a row, the second stretches a column (`[[100], [200]]`) and the third stretches a single number.

??? warning "Common mistake"
    If the shapes don't fit, NUMK doesn't know how to stretch:

    ```kafe
    --8<-- "tests/DocsExamples/numk/broadcast-shape.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/numk/broadcast-shape.error.stderr.expec"
    ```

### `numk.broadcast_sub(a, b)` { #broadcast_sub }

**What it does:** Subtracts element by element, stretching the smaller one.

**When to use it:** To subtract each column's average from it, a common step when preparing data.

| Parameter | Type | What it means |
|---|---|---|
| `a` | number or `List[...]` of numbers | The tensor you subtract from. |
| `b` | number or `List[...]` of numbers | What you subtract, of a compatible shape. |

**Returns:** A tensor with the larger of the two shapes.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/broadcast_sub.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/broadcast_sub.expec"
```

### `numk.broadcast_mul(a, b)` { #broadcast_mul }

**What it does:** Multiplies element by element, stretching the smaller one.

**When to use it:** To give each column a different weight, for example converting different currencies with their own exchange rate.

| Parameter | Type | What it means |
|---|---|---|
| `a` | number or `List[...]` of numbers | The first tensor. |
| `b` | number or `List[...]` of numbers | The second tensor, of a compatible shape. |

**Returns:** A tensor with the larger of the two shapes.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/broadcast_mul.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/broadcast_mul.expec"
```

### `numk.broadcast_div(a, b)` { #broadcast_div }

**What it does:** Divides element by element, stretching the smaller one.

**When to use it:** To turn amounts into proportions, dividing each row by its own total.

| Parameter | Type | What it means |
|---|---|---|
| `a` | number or `List[...]` of numbers | The tensor you divide. |
| `b` | number or `List[...]` of numbers | The divisor, of a compatible shape. It cannot contain zeros. |

**Returns:** A tensor of `FLOAT` with the larger of the two shapes.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/broadcast_div.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/broadcast_div.expec"
```

The column `[[2], [3]]` is stretched: the first row is divided by 2 and the second by 3.

??? info "For the curious 🤓"
    If `a` has shape $(2, 2)$ and `b` has shape $(2,)$, NUMK computes $C_{ij} = a_{ij} + b_j$. If `b` has shape $(2, 1)$, it computes $C_{ij} = a_{ij} + b_{i0}$. The copy is never stored: NUMK just "reads" the same cell several times.

## What did you learn?

- **Broadcasting** stretches the small thing so it fits the big one.
- Shapes are compared from the right: they fit if they are equal or if one is 1.
- The four `broadcast_*` functions accept vectors, matrices, tensors and single numbers.

[Next: reductions, sums and maximums :material-arrow-right:](reductions.md){ .md-button .md-button--primary }
