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
