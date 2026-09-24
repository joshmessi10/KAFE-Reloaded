import random as _random_module

from global_utils import check_sig
from TypeUtils import (
    any_list_types,
    any_matrix_type,
    float_type,
    integer_type,
    numeric_matrix_types,
    numeric_vector_types,
)

from .errors import raiseDifferentDimension, raiseNonUniformMatrix
from .utils import (
    _broadcast_to_nd,
    _broadcastable,
    _max_nd,
    _op_nd,
    _reshape_nd,
    _shape_nd,
    _sum_nd,
    apply_matrix_operation,
    has_same_dimensions,
    is_uniform_matrix,
)


@check_sig([2], numeric_matrix_types, numeric_matrix_types)
def add(matrix1, matrix2):
    if not has_same_dimensions(matrix1, matrix2):
        raiseDifferentDimension('add')

    return apply_matrix_operation(matrix1, matrix2, lambda x, y: x + y)

@check_sig([2], numeric_matrix_types, numeric_matrix_types)
def sub(matrix1, matrix2):
    if not has_same_dimensions(matrix1, matrix2):
        raiseDifferentDimension('sub')

    return apply_matrix_operation(matrix1, matrix2, lambda x, y: x - y)

@check_sig([2], numeric_matrix_types, numeric_matrix_types)
def mul(matrix1, matrix2):
    if not is_uniform_matrix(matrix1) or not is_uniform_matrix(matrix2):
        raiseNonUniformMatrix('mul')

    if not matrix1 or not matrix2:
        return []

    if len(matrix1) != 0 and len(matrix1[0]) != len(matrix2):
        raise Exception("mul: Matrices are not compatible for multiplication")

    result = []
    for i in range(len(matrix1)):
        row = []
        for j in range(len(matrix2[0])):
            total = 0
            for k in range(len(matrix2)):
                total += matrix1[i][k] * matrix2[k][j]
            row.append(total)
        result.append(row)

    return result

@check_sig([1], numeric_matrix_types)
def inv(matrix):
    if not is_uniform_matrix(matrix):
        raiseNonUniformMatrix('inv')

    if not matrix or not matrix[0]:
        raise Exception("inv: Matrix is empty")

    if len(matrix) != 0 and len(matrix) != len(matrix[0]):
        raise Exception("inv: Matrix is not square")

    n = len(matrix)
    m = len(matrix[0])

    identity = [[0 for _ in range(m)] for _ in range(n)]
    for i in range(n):
        identity[i][i] = 1

    augmented_matrix = [row + identity[i] for i, row in enumerate(matrix)]

    m *= 2

    for i in range(n):
        factor = augmented_matrix[i][i]
        if factor == 0:
            raise Exception("inv: Matrix is singular")
        for j in range(m):
            augmented_matrix[i][j] /= factor
        for k in range(n):
            if k != i:
                factor = augmented_matrix[k][i]
                for j in range(m):
                    augmented_matrix[k][j] -= factor * augmented_matrix[i][j]

    inverse = [row[n:] for row in augmented_matrix]

    return inverse

@check_sig([1], [any_matrix_type])
def transpose(matrix):
    return list(map(list, zip(*matrix, strict=False)))



@check_sig([2], numeric_vector_types, numeric_vector_types)
def dot(vec1, vec2):
    if len(vec1) != len(vec2):
        raiseDifferentDimension('dot')

    return sum(x * y for x, y in zip(vec1, vec2, strict=True))


@check_sig([2], numeric_matrix_types, numeric_matrix_types)
def dot_matrix(m1, m2):
    if not is_uniform_matrix(m1) or not is_uniform_matrix(m2):
        raiseNonUniformMatrix('dot')

    if not m1 or not m2:
        return []

    if len(m1[0]) != len(m2):
        raiseDifferentDimension('dot_matrix')

    result = []
    for i in range(len(m1)):
        row = []
        for j in range(len(m2[0])):
            total = 0
            for k in range(len(m2)):
                total += m1[i][k] * m2[k][j]
            row.append(total)
        result.append(row)
    return result

@check_sig([1], [integer_type])
def zeros(n):
    """Generates a vector of zeros of size n"""
    return [0 for _ in range(n)]

@check_sig([2], [integer_type], [integer_type])
def zeros_matrix(rows, columns):
    """Generates a matrix of zeros of size rows x columns"""
    return [[0 for _ in range(columns)] for _ in range(rows)]

@check_sig([1], numeric_vector_types)
def zeros_nd(shape):
    """
    Creates an N-dimensional tensor of zeros with the given form.
    
    zeros_nd([3]) → [0, 0, 0]
    zeros_nd([2, 3]) → [[0,0,0],[0,0,0]]
    zeros_nd([2, 2, 2]) → [[[0,0],[0,0]],[[0,0],[0,0]]]
    """
    def _create(s):
        if len(s) == 0:
            return 0.0
        if len(s) == 1:
            return [0.0 for _ in range(s[0])]
        return [_create(s[1:]) for _ in range(s[0])]
    return _create(list(shape))

@check_sig([1], any_list_types)
def shape(obj):
    dimensions = []
    while isinstance(obj, list):
        dimensions.append(len(obj))
        if len(obj) == 0:
            break
        obj = obj[0]
    return tuple(dimensions)


# ============================================================
# N-D EXTENSIONS — Element-wise operations
# ============================================================

@check_sig([2], numeric_matrix_types + numeric_vector_types, numeric_matrix_types + numeric_vector_types)
def emul(a, b):
    """
    Element-by-element multiplication (Hadamard product).
    Supports any dimensionality.
    
    emul([1,2,3], [4,5,6]) → [4, 10, 18]
    emul([[1,2],[3,4]], [[5,6],[7,8]]) → [[5,12],[21,32]]
    """
    return _op_nd(a, b, lambda x, y: x * y)


# ============================================================
# N-D EXTENSIONS — Broadcasting
# ============================================================

@check_sig([2], numeric_matrix_types + numeric_vector_types, numeric_matrix_types + numeric_vector_types)
def broadcast_add(a, b):
    """
    Sum with broadcasting support.
    It allows adding tensors of different shapes when they are compatible.
    
    broadcast_add([[1,2],[3,4]], [0.1, 0.2]) → [[1.1,2.2],[3.1,4.2]]
    broadcast_add([[1,2],[3,4]], [[10],[20]]) → [[11,12],[23,24]]
    """
    s1 = _shape_nd(a)
    s2 = _shape_nd(b)
    if not _broadcastable(s1, s2):
        raise ValueError(
            f"broadcast_add: Shapes {s1} and {s2} are not broadcastable"
        )
    # Pad to same length
    max_len = max(len(s1), len(s2))
    s1_padded = (1,) * (max_len - len(s1)) + s1
    s2_padded = (1,) * (max_len - len(s2)) + s2

    # Broadcast both to target shape
    target = tuple(max(d1, d2) for d1, d2 in zip(s1_padded, s2_padded, strict=True))
    a_bc = _broadcast_to_nd(a, target, s1)
    b_bc = _broadcast_to_nd(b, target, s2)
    return _op_nd(a_bc, b_bc, lambda x, y: x + y)


@check_sig([2], numeric_matrix_types + numeric_vector_types, numeric_matrix_types + numeric_vector_types)
def broadcast_sub(a, b):
    """
    Subtraction with broadcasting support.
    """
    s1 = _shape_nd(a)
    s2 = _shape_nd(b)
    if not _broadcastable(s1, s2):
        raise ValueError(
            f"broadcast_sub: Shapes {s1} and {s2} are not broadcastable"
        )
    max_len = max(len(s1), len(s2))
    s1_padded = (1,) * (max_len - len(s1)) + s1
    s2_padded = (1,) * (max_len - len(s2)) + s2
    target = tuple(max(d1, d2) for d1, d2 in zip(s1_padded, s2_padded, strict=True))
    a_bc = _broadcast_to_nd(a, target, s1)
    b_bc = _broadcast_to_nd(b, target, s2)
    return _op_nd(a_bc, b_bc, lambda x, y: x - y)


@check_sig([2], numeric_matrix_types + numeric_vector_types, numeric_matrix_types + numeric_vector_types)
def broadcast_mul(a, b):
    """
    Multiplication with broadcasting support.
    """
    s1 = _shape_nd(a)
    s2 = _shape_nd(b)
    if not _broadcastable(s1, s2):
        raise ValueError(
            f"broadcast_mul: Shapes {s1} and {s2} are not broadcastable"
        )
    max_len = max(len(s1), len(s2))
    s1_padded = (1,) * (max_len - len(s1)) + s1
    s2_padded = (1,) * (max_len - len(s2)) + s2
    target = tuple(max(d1, d2) for d1, d2 in zip(s1_padded, s2_padded, strict=True))
    a_bc = _broadcast_to_nd(a, target, s1)
    b_bc = _broadcast_to_nd(b, target, s2)
    return _op_nd(a_bc, b_bc, lambda x, y: x * y)


# ============================================================
# N-D EXTENSIONS — Axis reduction
# ============================================================

@check_sig([2], numeric_matrix_types + numeric_vector_types, [integer_type])
def sum_axis(a, axis):
    """
    Sum along the specified axis.
    
    sum_axis([[1,2],[3,4]], 0) → [4, 6]       (sum across rows)
    sum_axis([[1,2],[3,4]], 1) → [3, 7]       (sum across columns)
    sum_axis([[[1,2],[3,4]],[[5,6],[7,8]]], 0) → [[6,8],[10,12]]
    """
    return _sum_nd(a, axis)


@check_sig([2], numeric_matrix_types + numeric_vector_types, [integer_type])
def max_axis(a, axis):
    """
    Maximum along the specified axis.
    
    max_axis([[1,2],[3,4]], 0) → [3, 4] (max rows)
    max_axis([[1,2],[3,4]], 1) → [2, 4] (max of columns)
    """
    return _max_nd(a, axis)


# ============================================================
# N-D EXTENSIONS — Reshape
# ============================================================

@check_sig([2], numeric_matrix_types + numeric_vector_types, any_list_types)
def reshape(a, new_shape):
    """
    Rearrange a tensor to a new shape.
    
    reshape([1,2,3,4], [2,2]) → [[1,2],[3,4]]
    reshape([[1,2],[3,4]], [4]) → [1,2,3,4]
    reshape([1,2,3,4,5,6], [3,2]) → [[1,2],[3,4],[5,6]]
    """
    shape_tuple = tuple(new_shape)
    return _reshape_nd(a, shape_tuple)


# ============================================================
# N-D EXTENSIONS — Creation functions
# ============================================================

@check_sig([1], numeric_vector_types)
def ones(shape):
    """
    Create a ones tensor with the given shape.
    
    ones([3]) → [1, 1, 1]
    ones([2, 3]) → [[1, 1, 1], [1, 1, 1]]
    ones([2, 2, 2]) → [[[1, 1], [1, 1]], [[1, 1], [1, 1]]]
    """
    def _create(shape, val):
        if len(shape) == 0:
            return val
        if len(shape) == 1:
            return [val for _ in range(shape[0])]
        return [_create(shape[1:], val) for _ in range(shape[0])]
    return _create(list(shape), 1.0)


@check_sig([1, 3], numeric_vector_types, [float_type, integer_type], [float_type, integer_type])
def random_tensor(shape, low=-0.5, high=0.5):
    """
    Create a tensor with random values ​​in the range [low, high].
    
    random_tensor([3]) → [0.12, -0.34, 0.56]
    random_tensor([2, 2], -1.0, 1.0) → [[...], [...]]
    """
    def _rand(shape):
        if len(shape) == 1:
            return [_random_module.uniform(low, high) for _ in range(shape[0])]
        return [_rand(shape[1:]) for _ in range(shape[0])]
    return _rand(list(shape))


@check_sig([2], [float_type, integer_type], numeric_matrix_types + numeric_vector_types)
def scalar_mul(scalar, tensor):
    """
    Multiply a tensor by a scalar.
    
    scalar_mul(3.0, [1, 2, 3]) → [3.0, 6.0, 9.0]
    scalar_mul(2.0, [[1,2],[3,4]]) → [[2.0,4.0],[6.0,8.0]]
    """
    def _mul(t):
        if isinstance(t, list):
            return [_mul(item) for item in t]
        return scalar * t
    return _mul(tensor)


@check_sig([1], numeric_matrix_types + numeric_vector_types)
def sum_all(tensor):
    """
    Add all the elements of a tensor.
    
    sum_all([[1,2],[3,4]]) → 10
    sum_all([1, 2, 3]) → 6
    """
    total = 0.0
    def _sum(t):
        nonlocal total
        if isinstance(t, list):
            for item in t:
                _sum(item)
        else:
            total += t
    _sum(tensor)
    return total


@check_sig([1], numeric_matrix_types + numeric_vector_types)
def abs_tensor(tensor):
    """
    Absolute value of each element.
    """
    def _abs(t):
        if isinstance(t, list):
            return [_abs(item) for item in t]
        return t if t >= 0 else -t
    return _abs(tensor)
