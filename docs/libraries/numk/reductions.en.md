# NUMK: reductions, sums and maximums

To **reduce** is to turn many numbers into fewer numbers. At the end of the month, each day's receipt becomes a single total: that is reducing. You can reduce **everything** to one number, or reduce **along an axis**: for example, add up each column separately.

## Adding everything up { #total }

### `numk.sum_all(data)` { #sum_all }

**What it does:** Adds up **every** cell of a tensor, whatever its shape.

**When to use it:** For a grand total, like all the sales in a table.

| Parameter | Type | What it means |
|---|---|---|
| `data` | `List[...]` of numbers | The tensor. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/sum_all.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/sum_all.expec"
```

!!! note "Watch out"
    The total is always a `FLOAT`, even when every number is an integer.

## Reducing along an axis { #axis }

In a table, **axis 0** goes down (from row to row) and **axis 1** goes right (from column to column). When you reduce along an axis, that axis **disappears**:

- With `axis = 0`, you combine the rows: one number is left for each **column**.
- With `axis = 1`, you combine the columns: one number is left for each **row**.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/numk-ejes.svg"
<figcaption>With axis 0 you add downward and get `[4, 6]`. With axis 1 you add to the right and get `[3, 7]`.</figcaption>
</figure>

You can also use negative axes: `-1` is the last axis, just like list indexes.

### `numk.sum_axis(data, axis)` { #sum_axis }

**What it does:** Adds up along an axis.

**When to use it:** For the total of each product (axis 0) or the total of each day (axis 1) in a sales table.

| Parameter | Type | What it means |
|---|---|---|
| `data` | `List[...]` of numbers | The tensor. |
| `axis` | `INT` | The axis that is added up and disappears. |

**Returns:** A tensor with one axis fewer.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/sum_axis.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/sum_axis.expec"
```

??? warning "Common mistake"
    A table has axes 0 and 1. Axis 2 does not exist:

    ```kafe
    --8<-- "tests/DocsExamples/numk/sum_axis-range.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/numk/sum_axis-range.error.stderr.expec"
    ```

### `numk.max_axis(data, axis)` { #max_axis }

**What it does:** Finds the **largest** number along an axis.

**When to use it:** For the best grade on each exam (axis 0) or the best grade of each student (axis 1).

| Parameter | Type | What it means |
|---|---|---|
| `data` | `List[...]` of numbers | The tensor. |
| `axis` | `INT` | The axis where you look for the maximum. |

**Returns:** A tensor with one axis fewer.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/max_axis.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/max_axis.expec"
```

With axis 0, each column gives its largest: 8 and 9. With axis 1, each row gives its largest: 9 and 8.

??? info "For the curious 🤓"
    For a matrix $A$: `sum_axis(A, 0)` gives $s_j = \sum_i A_{ij}$ and `sum_axis(A, 1)` gives $s_i = \sum_j A_{ij}$. The same holds for `max_axis`, replacing the sum with $\max$.

## What did you learn?

- **Reducing** turns many numbers into fewer numbers.
- `sum_all` adds everything up and gives a `FLOAT`.
- With `sum_axis` and `max_axis`, the axis you choose disappears.

[Next: changing the shape :material-arrow-right:](reshaping.md){ .md-button .md-button--primary }
