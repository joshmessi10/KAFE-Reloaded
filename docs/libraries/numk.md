# NUMK — Linear algebra

NUMK is KAFE's NumPy-inspired linear algebra library. It provides operations on matrices and vectors.

**Import:**

```kafe
import numk;
```

---

## Function reference

| Function | Signature | Description |
|---------|-------------|-------------|
| `numk.add` | `(List[List[NUM]], List[List[NUM]]) -> List[List[NUM]]` | Element-wise addition |
| `numk.sub` | `(List[List[NUM]], List[List[NUM]]) -> List[List[NUM]]` | Element-wise subtraction |
| `numk.mul` | `(List[List[NUM]], List[List[NUM]]) -> List[List[NUM]]` | Matrix multiplication |
| `numk.transpose` | `(List[List[NUM]]) -> List[List[NUM]]` | Transposes a matrix |
| `numk.inv` | `(List[List[FLOAT]]) -> List[List[FLOAT]]` | Computes the inverse |
| `numk.dot` | `(List[NUM], List[NUM]) -> NUM` | Dot product |
| `numk.zeros` | `(INT) -> List[NUM]` | Zero vector |
| `numk.zeros_matrix` | `(INT, INT) -> List[List[NUM]]` | Zero matrix |
| `numk.shape` | `(List[List[NUM]]) -> List[INT]` | Matrix dimensions |

---

## Examples

### Matrix addition

```kafe
import numk;

List[List[INT]] A = [[1, 2], [3, 4]];
List[List[INT]] B = [[5, 6], [7, 8]];

show(numk.add(A, B));
-- [[6, 8], [10, 12]]
```

### Transpose

```kafe
List[List[INT]] A = [[1, 2], [3, 4]];
show(numk.transpose(A));
-- [[1, 3], [2, 4]]
```

### Matrix multiplication

```kafe
List[List[INT]] A = [[1, 2], [3, 4]];
List[List[INT]] B = [[5, 6], [7, 8]];
show(numk.mul(A, B));
-- [[19, 22], [43, 50]]
```

### Inverse

```kafe
List[List[INT]] M = [[2, 1], [7, 4]];
show(numk.inv(M));
-- [[4.0, -1.0], [-7.0, 2.0]]
```

### Vectors and shapes

```kafe
List[INT] v = [1, 2, 3];
show(numk.zeros(3));         -- [0, 0, 0]
show(numk.zeros_matrix(2, 3)); -- [[0,0,0],[0,0,0]]
show(numk.shape([[1,2,3],[4,5,6]])); -- [2, 3]
```

---

## Error handling

| Error | Cause |
|-------|-------|
| **Dimensions** | Matrices of different sizes passed to `add` or `sub` |
| **Multiplication** | Columns(A) ≠ Rows(B) in `mul` |
| **Invertibility** | Determinant = 0 or matrix is not square in `inv` |

!!! note "Supported types"
    NUMK operates on `INT` and `FLOAT`.

## Working with tensors

NUMK represents vectors, matrices and higher-dimensional tensors as nested KAFE lists. Shape is the length of each axis: `[[1, 2], [3, 4]]` has shape `[2, 2]`. Keep rows rectangular; operations that combine arrays require compatible dimensions. `mul` is matrix multiplication, while `emul` multiplies elements at matching positions.

| Function | Use |
|---|---|
| `tensor(data)` | Validate/copy numeric nested data for tensor operations. |
| `emul(a, b)` | Element-wise multiplication. |
| `broadcast_add(a, b)`, `broadcast_sub(a, b)`, `broadcast_mul(a, b)`, `broadcast_div(a, b)` | Combine arrays with compatible broadcast shapes. |
| `zeros_nd(shape)`, `ones(shape)` | Create an N-dimensional constant tensor. |
| `random_tensor(shape, low, high, seed)`, `normal_tensor(shape, mean, stddev, seed)` | Create reproducible random inputs with a seed. |
| `reshape(a, new_shape)`, `transpose_axes(a, axes)` | Change tensor layout without changing its values. |
| `concatenate(values, axis)`, `split_sizes(data, sizes, axis)` | Join and split tensors along an axis. |
| `sum_axis(a, axis)`, `max_axis(a, axis)`, `sum_all(a)` | Reduce numeric data. |
| `scalar_mul(value, tensor)`, `abs_tensor(tensor)`, `exp_tensor(tensor)` | Transform values in a tensor. |

### Choose matrix or element-wise multiplication

```kafe
import numk;
List[List[INT]] a = [[1, 2], [3, 4]];
List[List[INT]] b = [[2, 0], [0, 2]];
show(numk.mul(a, b));   -- [[2, 4], [6, 8]]
show(numk.emul(a, b));  -- [[2, 0], [0, 8]]
show(numk.shape(a));    -- [2, 2]
```

`numk.tensor` returns numeric lists, which Gesha can accept directly as inputs. See [Gesha with NUMK](../ejemplos/gesha/numk-dense.md) for a complete training program.
