# NUMK: element-wise operations

Imagine two spreadsheets of the same size, one on top of the other. An **element-wise** operation pairs each cell with the cell right below it: top-left with top-left, and so on for all of them. That is why both tables must be **the same size**.

## Adding and subtracting tables { #add-sub }

Think of a shop with two branches. Each table stores how many products were sold. To get the total, you add cell to cell.

### `numk.add(a, b)` { #add }

**What it does:** Adds two matrices element by element.

**When to use it:** To combine two tables of the same size, like Monday's and Tuesday's sales.

| Parameter | Type | What it means |
|---|---|---|
| `a` | `List[List[INT | FLOAT]]` | The first matrix. |
| `b` | `List[List[INT | FLOAT]]` | The second matrix, of the same size. |

**Returns:** A new matrix with the sums.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/add.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/add.expec"
```

!!! note "Watch out"
    `add` and `sub` only accept **matrices** (lists of lists). To add vectors or other tensors, use [`broadcast_add`](broadcasting.md#broadcast_add).

??? warning "Common mistake"
    If the tables are not the same size, some cells have no partner:

    ```kafe
    --8<-- "tests/DocsExamples/numk/add-shape.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/numk/add-shape.error.stderr.expec"
    ```

### `numk.sub(a, b)` { #sub }

**What it does:** Subtracts two matrices element by element: from each cell of `a` it takes away the matching cell of `b`.

**When to use it:** To see what is left, for example what was in the warehouse minus what was sold.

| Parameter | Type | What it means |
|---|---|---|
| `a` | `List[List[INT | FLOAT]]` | The matrix you subtract from. |
| `b` | `List[List[INT | FLOAT]]` | The matrix you subtract, of the same size. |

**Returns:** A new matrix with the differences.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/sub.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/sub.expec"
```

## Multiplying element by element { #multiply }

There are two ways to multiply tables. Here is the simple one: each cell times its partner. The other one, "row by column", is in [Multiplying matrices](matrix-multiplication.md).

### `numk.emul(a, b)` { #emul }

**What it does:** Multiplies two tensors of the same shape element by element. It works with vectors, matrices and tensors.

**When to use it:** To work out how much you pay for each product: quantity × price.

| Parameter | Type | What it means |
|---|---|---|
| `a` | `List[...]` of numbers | The first tensor. |
| `b` | `List[...]` of numbers | The second tensor, of the same shape. |

**Returns:** A new tensor with the products.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/emul.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/emul.expec"
```

2 items at 5 make 10, 1 at 10 makes 10 and 3 at 4 make 12.

??? info "For the curious 🤓"
    This multiplication is called the **Hadamard product** and is written $C = A \odot B$, with $C_{ij} = A_{ij} \cdot B_{ij}$.

### `numk.scalar_mul(scalar, data)` { #scalar_mul }

**What it does:** Multiplies **every** cell by the same number (a **scalar**: a single number, not a list).

**When to use it:** To double a recipe, or to apply a 50% discount to every price.

| Parameter | Type | What it means |
|---|---|---|
| `scalar` | `INT | FLOAT` | The number you multiply by. |
| `data` | `List[...]` of numbers | The tensor. |

**Returns:** A new tensor of the same shape.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/scalar_mul.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/scalar_mul.expec"
```

## Applying a function to every number { #map }

Sometimes you want to do the same thing to every number: square it, drop its sign… It is like putting every fruit in a basket through the same blender.

### `numk.map_elements(function, data, ...)` { #map_elements }

**What it does:** Applies your own function to every cell. If you give several tensors of the same shape, the function receives one number from each.

**When to use it:** When NUMK doesn't have the calculation you need: you write it yourself as a [lambda](../../aprende/funciones.md) and NUMK applies it everywhere.

| Parameter | Type | What it means |
|---|---|---|
| `function` | `FUNC` | The function that receives one or more numbers and returns one. |
| `data, ...` | `List[...]` of numbers | One or more tensors of the same shape. There must be as many as the values the function receives. |

**Returns:** A new tensor of the same shape with the results.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/map_elements.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/map_elements.expec"
```

`middle` receives one number from each list: (1 + 5) / 2 = 3.0, (8 + 2) / 2 = 5.0 and (3 + 9) / 2 = 6.0.

### `numk.exp_tensor(data)` { #exp_tensor }

**What it does:** Computes the **exponential** ($e^x$) of every cell, with [`math.exp`](../math/powers.md#exp).

**When to use it:** In neural networks, for functions like *softmax*, which turn scores into probabilities.

| Parameter | Type | What it means |
|---|---|---|
| `data` | `List[...]` of numbers | The tensor. |

**Returns:** A tensor of `FLOAT` of the same shape.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/exp_tensor.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/exp_tensor.expec"
```

!!! note "Watch out"
    The last decimals may not be exact: `math.exp` is written from scratch in KAFE and the computer rounds a tiny bit.

### `numk.abs_tensor(data)` { #abs_tensor }

**What it does:** Removes the minus sign from every cell (the **absolute value**).

**When to use it:** To measure the size of several errors no matter whether they are too high or too low.

| Parameter | Type | What it means |
|---|---|---|
| `data` | `List[...]` of numbers | The tensor. |

**Returns:** A new tensor of the same shape, with no negatives.

**Example:**

```kafe
--8<-- "tests/DocsExamples/numk/abs_tensor.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/numk/abs_tensor.expec"
```

## What did you learn?

- Element-wise means pairing each number with its partner in the same position.
- `add`, `sub` and `emul` need tables of the same size.
- `scalar_mul` multiplies everything by a single number.
- With `map_elements` you apply your own function to every cell.

[Next: multiplying matrices :material-arrow-right:](matrix-multiplication.md){ .md-button .md-button--primary }
