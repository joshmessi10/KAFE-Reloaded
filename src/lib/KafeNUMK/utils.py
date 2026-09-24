def has_same_dimensions(matrix1, matrix2):
    if len(matrix1) == len(matrix2):
        same_row_dimensions = True
        for i in range(len(matrix1)):
            if len(matrix1[i]) != len(matrix2[i]):
                same_row_dimensions = False
                break

        if (same_row_dimensions):
            return True

    return False

def is_uniform_matrix(matrix):
    if not matrix:
        return True

    row_length = len(matrix[0])
    for row in matrix:
        if len(row) != row_length:
            return False
    return True

def apply_matrix_operation(matrix1, matrix2, operation):
    result = []
    for i in range(len(matrix1)):
        row = []
        for j in range(len(matrix1[i])):
            row.append(operation(matrix1[i][j], matrix2[i][j]))
        result.append(row)

    return result


# --- N-D helpers ---

def _shape_nd(obj):
    """Calculates the shape of an N-D structure recursively."""
    dims = []
    current = obj
    while isinstance(current, list):
        dims.append(len(current))
        if len(current) == 0:
            break
        current = current[0]
    return tuple(dims)


def _depth(obj):
    """Returns the nesting depth."""
    if not isinstance(obj, list):
        return 0
    return 1 + _depth(obj[0]) if obj else 1


def _is_scalar(obj):
    return isinstance(obj, (int, float))


def _op_nd(a, b, op):
    """Applies an element-by-element operation to two N-D structures."""
    if _is_scalar(a) and _is_scalar(b):
        return op(a, b)
    if isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            raise ValueError("Dimension mismatch in element-wise operation")
        return [_op_nd(ai, bi, op) for ai, bi in zip(a, b, strict=True)]
    raise ValueError(f"Cannot apply operation to {type(a).__name__} and {type(b).__name__}")


def _broadcastable(s1, s2):
    """Check if two forms are compatible for broadcasting."""
    # Pad shorter shape with 1s on the left
    max_len = max(len(s1), len(s2))
    s1_padded = (1,) * (max_len - len(s1)) + s1
    s2_padded = (1,) * (max_len - len(s2)) + s2
    for d1, d2 in zip(s1_padded, s2_padded, strict=True):
        if d1 != d2 and d1 != 1 and d2 != 1:
            return False
    return True


def _broadcast_to_nd(tensor, target_shape, src_shape=None):
    """Expands an N-D tensor to the target form using broadcasting."""
    if src_shape is None:
        src_shape = _shape_nd(tensor)

    # Scalar case
    if not isinstance(tensor, list):
        # Build nested list of target_shape filled with tensor
        def _fill(shape, val):
            if len(shape) == 0:
                return val
            return [_fill(shape[1:], val) for _ in range(shape[0])]
        return _fill(target_shape, tensor)

    # Pad source shape with 1s on the left
    max_len = max(len(src_shape), len(target_shape))
    src_padded = (1,) * (max_len - len(src_shape)) + src_shape
    tgt_padded = (1,) * (max_len - len(target_shape)) + target_shape

    # If current dim is 1 but target is larger, replicate
    if src_padded[0] == 1 and tgt_padded[0] > 1:
        if isinstance(tensor, list) and len(tensor) == 1:
            inner = _broadcast_to_nd(tensor[0], target_shape[1:])
        else:
            inner = tensor
        return [inner for _ in range(tgt_padded[0])]

    # If they match, recurse into children
    if isinstance(tensor, list):
        new_inner_shape = target_shape[1:] if len(target_shape) > 0 else ()
        return [_broadcast_to_nd(item, new_inner_shape) if isinstance(item, list) else item for item in tensor]

    return tensor


def _sum_nd(tensor, axis):
    """Sum along the given axis in an N-D tensor."""
    if not isinstance(tensor, list):
        return tensor

    current_shape = _shape_nd(tensor)

    if axis < 0:
        axis = len(current_shape) + axis

    if axis == 0:
        # Sum across the first dimension
        if not tensor:
            return []
        if len(tensor) == 1:
            return tensor[0]
        result = tensor[0]
        for i in range(1, len(tensor)):
            result = _op_nd(result, tensor[i], lambda x, y: x + y)
        return result
    else:
        # Recurse into each element
        return [_sum_nd(item, axis - 1) for item in tensor]


def _max_nd(tensor, axis):
    """Max along the given axis in an N-D tensor."""
    if not isinstance(tensor, list):
        return tensor

    current_shape = _shape_nd(tensor)

    if axis < 0:
        axis = len(current_shape) + axis

    if axis == 0:
        if not tensor:
            return []
        if len(tensor) == 1:
            return tensor[0]

        def _max_scalar(a, b):
            return a if a >= b else b

        result = tensor[0]
        for i in range(1, len(tensor)):
            result = _op_nd(result, tensor[i], _max_scalar)
        return result
    else:
        return [_max_nd(item, axis - 1) for item in tensor]


def _reshape_nd(tensor, new_shape):
    """Rearrange an N-D tensor to a new form."""
    # Flatten first
    flat = []
    def _flatten(t):
        if isinstance(t, list):
            for item in t:
                _flatten(item)
        else:
            flat.append(t)
    _flatten(tensor)

    # Check total size
    total_flat = len(flat)
    total_new = 1
    for d in new_shape:
        total_new *= d
    if total_flat != total_new:
        raise ValueError(
            f"reshape: Cannot reshape tensor of size {total_flat} into shape {new_shape}"
        )

    # Build nested structure from flat list
    def _build(shape, idx):
        if len(shape) == 1:
            result = flat[idx[0]:idx[0] + shape[0]]
            idx[0] += shape[0]
            return result
        return [_build(shape[1:], idx) for _ in range(shape[0])]

    return _build(list(new_shape), [0])
