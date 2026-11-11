# NUMK: changing the shape

Sometimes you have the right numbers in the wrong arrangement. Think of 6 eggs: you can keep them in a 2 × 3 carton, a 3 × 2 carton or a row of 6. They are still the same eggs. Here you learn to rearrange, turn, join and split tensors **without changing their numbers**.

## Rearranging and turning { #rearrange }

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/numk-reshape.svg"
<figcaption>`reshape` takes the numbers in order and arranges them again: a row of 6 becomes a 2 × 3 table.</figcaption>
</figure>

### `numk.reshape(data, new_shape)` { #reshape }

**What it does:** Arranges the same numbers in a new shape. It reads them in order (row by row) and fills them back in that same order.

**When to use it:** To turn an image into a row before a dense layer, or a long list into a table.

| Parameter | Type | What it means |
|---|---|---|
| `data` | `List[...]` of numbers | The tensor. |
| `new_shape` | `List[INT]` | The new shape. It must have the same total number of cells. |

**Returns:** A new tensor with shape `new_shape`.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/reshape.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/reshape.expec"
```

??? warning "Common mistake"
    6 eggs don't exactly fill a 4 × 2 = 8 hole carton:

    ```kafe
    --8<-- "tests/DocsExamples/numk/reshape-size.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/numk/reshape-size.error.stderr.expec"
    ```

### `numk.transpose(m)` { #transpose }

**What it does:** **Transposes** a matrix: rows become columns and columns become rows. It is like flipping the table over its diagonal.

**When to use it:** When the shapes don't fit for [`mul`](matrix-multiplication.md#mul) and you need to "flip" a table.

| Parameter | Type | What it means |
|---|---|---|
| `m` | `List[List[...]]` | A matrix. |

**Returns:** A new matrix: if `m` has shape `(n, p)`, the result has shape `(p, n)`.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/transpose.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/transpose.expec"
```

!!! note "Watch out"
    If the rows are not the same length, `transpose` doesn't warn you: it cuts the long rows. Check your data first with [`numk.tensor`](creating.md#tensor).

### `numk.transpose_axes(data, axes)` { #transpose_axes }

**What it does:** Changes the order of the axes of any tensor. You say which old axis goes in each new place.

**When to use it:** To turn an image from `(channels, height, width)` into `(height, width, channels)`, or the other way around.

| Parameter | Type | What it means |
|---|---|---|
| `data` | `List[...]` | The tensor. |
| `axes` | `List[INT]` | The new order of the axes. It must contain each axis exactly once, for example `[1, 2, 0]`. |

**Returns:** A new tensor with the axes reordered.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/transpose_axes.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/transpose_axes.expec"
```

With `[1, 0]` it is the same as `transpose`. With `[1, 2, 0]`, axis 0 (the channel) moves to the end.

??? info "For the curious 🤓"
    If $\text{axes} = [a_0, a_1, \dots]$, the new axis $i$ is the old axis $a_i$. For a matrix, $B_{ji} = A_{ij}$.

## Joining and splitting { #join-split }

Joining is like taping two notebook pages together: one below the other (axis 0) or side by side (axis 1). Splitting is the opposite: cutting with scissors into the sizes you choose.

### `numk.concatenate(values, axis)` { #concatenate }

**What it does:** Joins several tensors into one, along an axis.

**When to use it:** To put the data of two months into a single table, or to attach new columns.

| Parameter | Type | What it means |
|---|---|---|
| `values` | `List[...]` of tensors | The tensors to join. They all have the same size, except along the axis you join. |
| `axis` | `INT` | The axis you join along. If you leave it out, it is `0`. |

**Returns:** A new tensor with all of them together.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/concatenate.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/concatenate.expec"
```

With axis 0, `b` ends up below `a`. With axis 1, `b` ends up beside it.

### `numk.split_sizes(data, sizes, axis)` { #split_sizes }

**What it does:** Splits a tensor into pieces of the sizes you ask for, along an axis. It is the opposite of `concatenate`.

**When to use it:** To separate your data into one part for training and another for testing.

| Parameter | Type | What it means |
|---|---|---|
| `data` | `List[...]` | The tensor to split. |
| `sizes` | `List[INT]` | The size of each piece. |
| `axis` | `INT` | The axis you cut along. If you leave it out, it is `0`. |

**Returns:** A list with the pieces.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/split_sizes.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/split_sizes.expec"
```

The second line cuts by columns (axis 1): one piece with the first column and another with the next two.

!!! note "Watch out"
    The sizes should add up to the length of the axis. If they add up to less, NUMK doesn't warn you: whatever is left over is lost.

## What did you learn?

- `reshape` arranges the same numbers in another shape with the same total.
- `transpose` flips a table; `transpose_axes` reorders the axes of any tensor.
- `concatenate` joins and `split_sizes` splits along an axis.

[Next: convolution :material-arrow-right:](convolution.md){ .md-button .md-button--primary }
