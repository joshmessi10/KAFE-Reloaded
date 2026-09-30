def es_misma_dimension(matriz1, matriz2):
    if len(matriz1) == len(matriz2):
        mismaDimension_filas = True
        for i in range(len(matriz1)):
            if len(matriz1[i]) != len(matriz2[i]):
                mismaDimension_filas = False
                break

        if (mismaDimension_filas):
            return True

    return False

def es_uniforme(matriz):
    if not matriz:
        return True

    longitud_fila = len(matriz[0])
    for fila in matriz:
        if len(fila) != longitud_fila:
            return False
    return True

def operar_matrices(matriz1, matriz2, operacion):
    resultado = []
    for i in range(len(matriz1)):
        fila = []
        for j in range(len(matriz1[i])):
            fila.append(operacion(matriz1[i][j], matriz2[i][j]))
        resultado.append(fila)

    return resultado


# --- N-D helpers ---

def _shape_nd(obj):
    """Calcula la forma completa y rechaza listas irregulares."""
    if not isinstance(obj, list):
        return ()
    if not obj:
        return (0,)
    child_shape = _shape_nd(obj[0])
    if any(_shape_nd(child) != child_shape for child in obj[1:]):
        raise ValueError("NUMK: tensor irregular")
    return (len(obj),) + child_shape


def _map_nd(operation, *values):
    """Recorrido compartido; las formas se validan antes de entrar aquí."""
    if isinstance(values[0], list):
        return [_map_nd(operation, *items) for items in zip(*values)]
    if any(type(value) not in (int, float) for value in values):
        raise ValueError("NUMK: se requieren valores numericos")
    return operation(*values)


def _validate_dimensions(dimensions):
    if any(type(d) is not int or d < 0 for d in dimensions):
        raise ValueError("NUMK: las dimensiones deben ser enteros no negativos")


def _depth(obj):
    """Retorna la profundidad de anidamiento."""
    if not isinstance(obj, list):
        return 0
    return 1 + _depth(obj[0]) if obj else 1


def _is_scalar(obj):
    return isinstance(obj, (int, float))


def _op_nd(a, b, op):
    """Aplica una operación elemento a elemento a dos estructuras N-D."""
    if _is_scalar(a) and _is_scalar(b):
        return op(a, b)
    if isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            raise ValueError("Dimension mismatch in element-wise operation")
        return [_op_nd(ai, bi, op) for ai, bi in zip(a, b)]
    raise ValueError(f"Cannot apply operation to {type(a).__name__} and {type(b).__name__}")


def _broadcastable(s1, s2):
    """Verifica si dos formas son compatibles para broadcasting."""
    # Pad shorter shape with 1s on the left
    max_len = max(len(s1), len(s2))
    s1_padded = (1,) * (max_len - len(s1)) + s1
    s2_padded = (1,) * (max_len - len(s2)) + s2
    for d1, d2 in zip(s1_padded, s2_padded):
        if d1 != d2 and d1 != 1 and d2 != 1:
            return False
    return True


def _broadcast_to_nd(tensor, target_shape, src_shape=None):
    """Expande dimensiones de tamaño uno, incluidas las iniciales implícitas."""
    if src_shape is None:
        src_shape = _shape_nd(tensor)
    if not target_shape:
        return tensor
    if len(src_shape) < len(target_shape):
        return [_broadcast_to_nd(tensor, target_shape[1:], src_shape)
                for _ in range(target_shape[0])]
    return [_broadcast_to_nd(tensor[0 if src_shape[0] == 1 else i],
                             target_shape[1:], src_shape[1:])
            for i in range(target_shape[0])]


def _broadcast_op(a, b, operation):
    s1, s2 = _shape_nd(a), _shape_nd(b)
    if not _broadcastable(s1, s2):
        raise ValueError(f"NUMK: shapes {s1} and {s2} are not broadcastable")
    rank = max(len(s1), len(s2))
    padded1 = (1,) * (rank - len(s1)) + s1
    padded2 = (1,) * (rank - len(s2)) + s2
    target = tuple(y if x == 1 else x for x, y in zip(padded1, padded2))
    return _map_nd(operation, _broadcast_to_nd(a, target, s1),
                   _broadcast_to_nd(b, target, s2))


def _sum_nd(tensor, axis):
    """Suma a lo largo del eje dado en un tensor N-D."""
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
    """Max a lo largo del eje dado en un tensor N-D."""
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
    """Reorganiza un tensor N-D a una nueva forma."""
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
        if not shape:
            return flat[0]
        if len(shape) == 1:
            result = flat[idx[0]:idx[0] + shape[0]]
            idx[0] += shape[0]
            return result
        return [_build(shape[1:], idx) for _ in range(shape[0])]

    return _build(list(new_shape), [0])
