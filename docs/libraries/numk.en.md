# NUMK: vectors, matrices and tensors

The **NUMK** library is for doing math with **many numbers at once**. Instead of adding two numbers, you add two whole tables in one go. It is the foundation of everything a neural network does: images, weights and results are piles of neatly arranged numbers.

Its name comes from *NumPy*, the famous Python library, but NUMK is written from scratch for KAFE, so you can see how every calculation works.

## Before you start: import the library

A library is an extra **toolbox**. To use it, first bring it into your program with `import`, then use each tool with `numk.` in front:

```kafe
--8<-- "tests/DocsExamples/numk/tensor.kf"
```

```text
--8<-- "tests/DocsExamples/numk/tensor.expec"
```

!!! warning "Common mistake: forgetting the `import`"
    If you use `numk.` without writing `import numk;`, KAFE doesn't know which box you mean:

    ```kafe
    --8<-- "tests/DocsExamples/numk/no-import.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/numk/no-import.error.stderr.expec"
    ```

## Vectors, matrices and tensors { #shapes }

These three words sound hard, but they are ideas you already know:

- A **vector** is a row of numbers. Like a shopping list with quantities: `[3, 5, 2]` is 3 apples, 5 pears and 2 lemons. You can also see it as an arrow that says "3 steps right, 5 up…".
- A **matrix** is a table: rows and columns, like a spreadsheet or an egg carton. In KAFE it is a list of lists: `[[1, 2, 3], [4, 5, 6]]` has 2 rows and 3 columns.
- A **tensor** is a stack of tables. A color photo is a tensor: it has 3 tables, one for red, one for green and one for blue.

The **shape** says how long each direction is. It is written in parentheses: `(3,)` is a vector of 3 numbers, `(2, 3)` is a table with 2 rows and 3 columns, and `(3, 2, 2)` is 3 tables of 2 × 2. Each direction is called an **axis**: axis 0 is the first, axis 1 the second, and so on.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/numk-formas.svg"
<figcaption>A vector is a row, a matrix is a table and a tensor is a stack of tables. Below each one is its shape.</figcaption>
</figure>

!!! tip "INT or FLOAT"
    NUMK works with `INT` and `FLOAT` numbers. You can mix the two.

## How it works inside { #inside }

There is nothing magical hidden in NUMK. Let's open the box.

**1. Tensors are lists of lists.** NUMK does not invent a new kind of data. A vector is a normal KAFE list, a matrix is a list of lists and a tensor is a list of lists of lists. That is why you can display them with `show` and walk through them with `for`, like any list. Every function returns new lists: they never change the list you give them.

**2. The shape is found by going down through the first box.** To find the shape, NUMK counts how many elements the big list has, then steps into the first element and counts again, and so on until it reaches a number. It also checks that all sibling boxes are the same size. If one row is shorter, the table is "crooked" and NUMK warns you with the error `tensor irregular`.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/numk-por-dentro-forma.svg"
<figcaption>For `[[1, 2, 3], [4, 5, 6]]`: the big list has 2 boxes, the first has 3 numbers and so does the second. The shape is (2, 3).</figcaption>
</figure>

**3. The math is loops.** Every function walks through the lists with `for` loops, cell by cell. For example, to multiply matrices (`mul`), NUMK uses three loops: `i` goes through the rows of the first matrix, `j` through the columns of the second, and `k` walks along that row and that column at the same time, adding products into a variable called `suma` (Spanish for "sum").

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/numk-por-dentro-bucle.svg"
<figcaption>The `k` loop of `mul` computing the first cell: it starts at 0, adds 1·5 and then 2·7. The result, 19, is stored in the top-left cell.</figcaption>
</figure>

**4. It checks before calculating.** Each function first checks the types of what you give it (for example, that `add` receives two matrices) and the shapes (for example, that both tables are the same size). If something doesn't fit, it stops with a message that starts with `numk:`.

??? info "For the curious 🤓"
    The code is in `src/lib/KafeNUMK/`. `functions.py` holds every function you call from KAFE. `utils.py` holds the internal helpers: the one that computes the shape, the one that walks two tensors cell by cell and the one that does the *broadcasting*. `errors.py` holds the error messages. When you write `numk.add(a, b)`, the interpreter looks in that module for a function called `add` and calls it with your data. To multiply an `n × m` matrix by an `m × p` one, the three loops perform $n \cdot m \cdot p$ multiplications.

## Library map { #map }

| Section | What you learn |
|---|---|
| [Creating and measuring tensors](numk/creating.md) | Create vectors, tables and tensors full of zeros, ones or random numbers, and see their shape. |
| [Element-wise operations](numk/element-wise.md) | Add, subtract and multiply tables of the same size, and apply your own function to every number. |
| [Multiplying matrices](numk/matrix-multiplication.md) | The dot product, row-by-column multiplication and the inverse matrix. |
| [Broadcasting](numk/broadcasting.md) | Combine a table with something smaller that "stretches" to fit. |
| [Reductions: sums and maximums](numk/reductions.md) | Add everything up, or add and find the largest along an axis. |
| [Changing the shape](numk/reshaping.md) | Rearrange, turn, join and split tensors. |
| [Convolution](numk/convolution.md) | A little window that slides over an image: the basis of convolutional networks. |

## Summary of every function { #summary }

| Function | Section |
|---|---|
| [`numk.tensor(data)`](numk/creating.md#tensor) | Creating and measuring tensors |
| [`numk.zeros(n)`](numk/creating.md#zeros) | Creating and measuring tensors |
| [`numk.zeros_matrix(rows, cols)`](numk/creating.md#zeros_matrix) | Creating and measuring tensors |
| [`numk.zeros_nd(shape)`](numk/creating.md#zeros_nd) | Creating and measuring tensors |
| [`numk.ones(shape)`](numk/creating.md#ones) | Creating and measuring tensors |
| [`numk.random_tensor(shape, low, high, seed)`](numk/creating.md#random_tensor) | Creating and measuring tensors |
| [`numk.normal_tensor(shape, mean, stddev, seed)`](numk/creating.md#normal_tensor) | Creating and measuring tensors |
| [`numk.shape(data)`](numk/creating.md#shape) | Creating and measuring tensors |
| [`numk.add(a, b)`](numk/element-wise.md#add) | Element-wise operations |
| [`numk.sub(a, b)`](numk/element-wise.md#sub) | Element-wise operations |
| [`numk.emul(a, b)`](numk/element-wise.md#emul) | Element-wise operations |
| [`numk.scalar_mul(scalar, data)`](numk/element-wise.md#scalar_mul) | Element-wise operations |
| [`numk.map_elements(function, data, ...)`](numk/element-wise.md#map_elements) | Element-wise operations |
| [`numk.exp_tensor(data)`](numk/element-wise.md#exp_tensor) | Element-wise operations |
| [`numk.abs_tensor(data)`](numk/element-wise.md#abs_tensor) | Element-wise operations |
| [`numk.dot(a, b)`](numk/matrix-multiplication.md#dot) | Multiplying matrices |
| [`numk.mul(a, b)`](numk/matrix-multiplication.md#mul) | Multiplying matrices |
| [`numk.dot_matrix(a, b)`](numk/matrix-multiplication.md#dot_matrix) | Multiplying matrices |
| [`numk.inv(m)`](numk/matrix-multiplication.md#inv) | Multiplying matrices |
| [`numk.broadcast_add(a, b)`](numk/broadcasting.md#broadcast_add) | Broadcasting |
| [`numk.broadcast_sub(a, b)`](numk/broadcasting.md#broadcast_sub) | Broadcasting |
| [`numk.broadcast_mul(a, b)`](numk/broadcasting.md#broadcast_mul) | Broadcasting |
| [`numk.broadcast_div(a, b)`](numk/broadcasting.md#broadcast_div) | Broadcasting |
| [`numk.sum_all(data)`](numk/reductions.md#sum_all) | Reductions: sums and maximums |
| [`numk.sum_axis(data, axis)`](numk/reductions.md#sum_axis) | Reductions: sums and maximums |
| [`numk.max_axis(data, axis)`](numk/reductions.md#max_axis) | Reductions: sums and maximums |
| [`numk.reshape(data, new_shape)`](numk/reshaping.md#reshape) | Changing the shape |
| [`numk.transpose(m)`](numk/reshaping.md#transpose) | Changing the shape |
| [`numk.transpose_axes(data, axes)`](numk/reshaping.md#transpose_axes) | Changing the shape |
| [`numk.concatenate(values, axis)`](numk/reshaping.md#concatenate) | Changing the shape |
| [`numk.split_sizes(data, sizes, axis)`](numk/reshaping.md#split_sizes) | Changing the shape |
| [`numk.conv2d_chw(image, kernels, bias, stride, padding)`](numk/convolution.md#conv2d_chw) | Convolution |
| [`numk.conv2d_chw_backward(image, kernels, grad_output, stride, padding)`](numk/convolution.md#conv2d_chw_backward) | Convolution |

## What did you learn?

- To use NUMK you write `import numk;` and then `numk.name(...)`.
- A vector is a list, a matrix is a list of lists and a tensor is a stack of tables.
- The **shape** says how long each axis is, and NUMK finds it by counting boxes.
- Inside, every calculation is a loop that walks the lists cell by cell.

[Start: creating and measuring tensors :material-arrow-right:](numk/creating.md){ .md-button .md-button--primary }
[Next library: PARDOS :material-arrow-right:](pardos.md){ .md-button }
