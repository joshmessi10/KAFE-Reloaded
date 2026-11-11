# NUMK: creating and measuring tensors

Before doing any math you need your numbers neatly arranged. Here you learn to check a list, to create blank tables (full of zeros or ones), to fill them with random numbers and to measure their shape.

If you don't know yet what a vector, a matrix or a tensor is, read [the NUMK entry page](../numk.md#shapes) first.

## Checking your data { #checking }

A table has to be **even**: all its rows must be the same length, like an egg carton where every row has the same number of holes. `numk.tensor` checks that for you.

### `numk.tensor(data)` { #tensor }

**What it does:** Checks that `data` is a well-formed tensor of numbers and gives you back a **copy**.

**When to use it:** At the start of your program, to make sure your data has no rows of different sizes and no text mixed in.

| Parameter | Type | What it means |
|---|---|---|
| `data` | `List[...]` of `INT` or `FLOAT` | A vector, a matrix or a tensor. |

**Returns:** A copy of `data`, with the same shape.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/tensor.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/tensor.expec"
```

??? warning "Common mistake"
    A row shorter than the others makes a "crooked" table:

    ```kafe
    --8<-- "tests/DocsExamples/numk/tensor-irregular.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/numk/tensor-irregular.error.stderr.expec"
    ```

## Creating tensors full of zeros or ones { #filled }

Often you need a "blank" table that you fill in later, like a fresh sheet of grid paper. These functions create one of the size you ask for.

### `numk.zeros(n)` { #zeros }

**What it does:** Creates a vector of `n` zeros.

**When to use it:** To start one counter for each thing, for example the votes of 4 candidates.

| Parameter | Type | What it means |
|---|---|---|
| `n` | `INT` | How many zeros you want. |

**Returns:** `List[INT]`

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/zeros.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/zeros.expec"
```

### `numk.zeros_matrix(rows, cols)` { #zeros_matrix }

**What it does:** Creates a table of zeros with `rows` rows and `cols` columns.

**When to use it:** For an empty score table, for example 2 teams × 3 matches.

| Parameter | Type | What it means |
|---|---|---|
| `rows` | `INT` | Number of rows. |
| `cols` | `INT` | Number of columns. |

**Returns:** `List[List[INT]]`

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/zeros_matrix.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/zeros_matrix.expec"
```

### `numk.zeros_nd(shape)` { #zeros_nd }

**What it does:** Creates a tensor of zeros with **any shape**: you give the list of sizes.

**When to use it:** When you need more than two axes, like a stack of tables for an image.

| Parameter | Type | What it means |
|---|---|---|
| `shape` | `List[INT]` | The shape, for example `[2, 2, 2]`. |

**Returns:** A tensor of `FLOAT` (`0.0`) with that shape.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/zeros_nd.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/zeros_nd.expec"
```

!!! note "Watch out"
    `zeros` and `zeros_matrix` give integer zeros (`0`), but `zeros_nd` gives decimal zeros (`0.0`).

### `numk.ones(shape)` { #ones }

**What it does:** Creates a tensor full of ones with the shape you ask for.

**When to use it:** To start with a neutral value for multiplication, or to give everything the same weight.

| Parameter | Type | What it means |
|---|---|---|
| `shape` | `List[INT]` | The shape, for example `[2, 3]`. |

**Returns:** A tensor of `FLOAT` (`1.0`) with that shape.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/ones.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/ones.expec"
```

## Random numbers { #random }

A neural network starts with random numbers, like shuffling the cards before a game. But sometimes you want the "randomness" to be **repeatable**, so your program always gives the same result. That is what the **seed** is for: a number that fixes the shuffle. The same seed gives the same numbers.

### `numk.random_tensor(shape, low, high, seed)` { #random_tensor }

**What it does:** Creates a tensor with random numbers between `low` and `high`. Every value is equally likely to come up (like a die).

**When to use it:** To give starting values to the weights of a network, or to make up test data.

| Parameter | Type | What it means |
|---|---|---|
| `shape` | `List[INT]` | The shape of the tensor. |
| `low` | `INT | FLOAT` | Optional. The lowest value. If you leave it out, it is `-0.5`. |
| `high` | `INT | FLOAT` | Optional. The highest value. If you leave it out, it is `0.5`. |
| `seed` | `INT` | Optional. The seed that repeats the same numbers. |

**Returns:** A tensor of `FLOAT` with that shape.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/random_tensor.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/random_tensor.expec"
```

The first two lines are equal because they use the same seed, `7`. The third one uses no seed: its numbers change every time, so we only show its shape.

!!! note "Watch out"
    You can give it 1, 3 or 4 values, but not 2: if you give `low`, you must also give `high`.

### `numk.normal_tensor(shape, mean, stddev, seed)` { #normal_tensor }

**What it does:** Creates a tensor with random numbers that gather around an **average** (`mean`). Most of them land close to the average and only a few land far away, like the heights of the people in a class.

**When to use it:** To make up data that looks like real measurements, or to start the weights of a network.

| Parameter | Type | What it means |
|---|---|---|
| `shape` | `List[INT]` | The shape of the tensor. |
| `mean` | `INT | FLOAT` | Optional. The average. If you leave it out, it is `0.0`. |
| `stddev` | `INT | FLOAT` | Optional. How spread out the numbers are (the **standard deviation**). If you leave it out, it is `1.0`. It cannot be negative. |
| `seed` | `INT` | Optional. The seed that repeats the same numbers. |

**Returns:** A tensor of `FLOAT` with that shape.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/normal_tensor.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/normal_tensor.expec"
```

Here we imagine heights in centimeters, with an average of 170 and a deviation of 10.

??? info "For the curious 🤓"
    The numbers follow the **normal distribution** (the "bell curve"). Roughly 68 out of every 100 numbers land between $\text{mean} - \text{stddev}$ and $\text{mean} + \text{stddev}$.

## Measuring the shape { #measuring }

### `numk.shape(data)` { #shape }

**What it does:** Tells you the shape of a vector, a matrix or a tensor: how long each axis is.

**When to use it:** To check that your data has the size you expect before doing any math.

| Parameter | Type | What it means |
|---|---|---|
| `data` | `List[...]` | A vector, a matrix or a tensor. |

**Returns:** The shape, written in parentheses, like `(2, 3)`.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/shape.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/shape.expec"
```

!!! note "Watch out"
    The shape comes out in parentheses because it is not a KAFE list. For now, use it with `show`: storing it in a `List[INT]` variable does not work yet. If you need a number, `len(data)` gives you the length of the first axis.

## What did you learn?

- `numk.tensor` checks that your data forms an even table.
- `zeros`, `zeros_matrix`, `zeros_nd` and `ones` create "blank" tensors.
- With a **seed**, random numbers repeat exactly the same every time.
- `numk.shape` tells you how long each axis is.

[Next: element-wise operations :material-arrow-right:](element-wise.md){ .md-button .md-button--primary }
