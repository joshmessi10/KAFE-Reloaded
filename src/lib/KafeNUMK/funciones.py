from .errores import raiseDifferentDimension, raiseNonUniformMatrix
from .utils import (
    es_misma_dimension, es_uniforme, operar_matrices,
    _shape_nd, _op_nd, _broadcastable, _broadcast_to_nd,
    _sum_nd, _max_nd, _reshape_nd, _is_scalar, _depth
)
from TypeUtils import matriz_cualquiera_t, matriz_numeros_t, vector_numeros_t, entero_t, flotante_t, lista_cualquiera_t
from global_utils import check_sig
import random as _random_module

@check_sig([2], matriz_numeros_t, matriz_numeros_t)
def add(matriz1, matriz2):
    if not es_misma_dimension(matriz1, matriz2):
        raiseDifferentDimension('add')

    return operar_matrices(matriz1, matriz2, lambda x, y: x + y)

@check_sig([2], matriz_numeros_t, matriz_numeros_t)
def sub(matriz1, matriz2):
    if not es_misma_dimension(matriz1, matriz2):
        raiseDifferentDimension('sub')

    return operar_matrices(matriz1, matriz2, lambda x, y: x - y)

@check_sig([2], matriz_numeros_t, matriz_numeros_t)
def mul(matriz1, matriz2):
    if not es_uniforme(matriz1) or not es_uniforme(matriz2):
        raiseNonUniformMatrix('mul')

    if not matriz1 or not matriz2:
        return []

    if len(matriz1) != 0 and len(matriz1[0]) != len(matriz2):
        raise Exception("mul: Matrices are not compatible for multiplication")

    resultado = []
    for i in range(len(matriz1)):
        fila = []
        for j in range(len(matriz2[0])):
            suma = 0
            for k in range(len(matriz2)):
                suma += matriz1[i][k] * matriz2[k][j]
            fila.append(suma)
        resultado.append(fila)

    return resultado

@check_sig([1], matriz_numeros_t)
def inv(matriz):
    if not es_uniforme(matriz):
        raiseNonUniformMatrix('inv')

    if not matriz or not matriz[0]:
        raise Exception("inv: Matrix is empty")

    if len(matriz) != 0 and len(matriz) != len(matriz[0]):
        raise Exception("inv: Matrix is not square")

    n = len(matriz)
    m = len(matriz[0])

    identidad = [[0 for _ in range(m)] for _ in range(n)]
    for i in range(n):
        identidad[i][i] = 1

    matriz_aumentada = [fila + identidad[i] for i, fila in enumerate(matriz)]

    m *= 2

    for i in range(n):
        factor = matriz_aumentada[i][i]
        if factor == 0:
            raise Exception("inv: Matrix is singular")
        for j in range(m):
            matriz_aumentada[i][j] /= factor
        for k in range(n):
            if k != i:
                factor = matriz_aumentada[k][i]
                for j in range(m):
                    matriz_aumentada[k][j] -= factor * matriz_aumentada[i][j]

    inversa = [fila[n:] for fila in matriz_aumentada]

    return inversa

@check_sig([1], [matriz_cualquiera_t])
def transpose(matriz):
    return list(map(list, zip(*matriz)))



@check_sig([2], vector_numeros_t, vector_numeros_t)
def dot(vec1, vec2):
    if len(vec1) != len(vec2):
        raiseDifferentDimension('dot')

    return sum(x * y for x, y in zip(vec1, vec2))


@check_sig([2], matriz_numeros_t, matriz_numeros_t)
def dot_matrix(m1, m2):
    if not es_uniforme(m1) or not es_uniforme(m2):
        raiseNonUniformMatrix('dot')

    if not m1 or not m2:
        return []

    if len(m1[0]) != len(m2):
        raiseDifferentDimension('dot_matrix')

    resultado = []
    for i in range(len(m1)):
        fila = []
        for j in range(len(m2[0])):
            suma = 0
            for k in range(len(m2)):
                suma += m1[i][k] * m2[k][j]
            fila.append(suma)
        resultado.append(fila)
    return resultado

@check_sig([1], [entero_t])
def zeros(n):
    """Genera un vector de ceros de tamaño n"""
    return [0 for _ in range(n)]

@check_sig([2], [entero_t], [entero_t])
def zeros_matrix(filas, columnas):
    """Genera una matriz de ceros tamaño filas x columnas"""
    return [[0 for _ in range(columnas)] for _ in range(filas)]

@check_sig([1], vector_numeros_t)
def zeros_nd(shape):
    """
    Crea un tensor N-dimensional de ceros con la forma dada.
    
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

@check_sig([1], lista_cualquiera_t)
def shape(obj):
    dimensiones = []
    while isinstance(obj, list):
        dimensiones.append(len(obj))
        if len(obj) == 0:
            break
        obj = obj[0]
    return tuple(dimensiones)


# ============================================================
# N-D EXTENSIONS — Element-wise operations
# ============================================================

@check_sig([2], matriz_numeros_t + vector_numeros_t, matriz_numeros_t + vector_numeros_t)
def emul(a, b):
    """
    Multiplicación elemento a elemento (Hadamard product).
    Soporta cualquier dimensionalidad.
    
    emul([1,2,3], [4,5,6]) → [4, 10, 18]
    emul([[1,2],[3,4]], [[5,6],[7,8]]) → [[5,12],[21,32]]
    """
    return _op_nd(a, b, lambda x, y: x * y)


# ============================================================
# N-D EXTENSIONS — Broadcasting
# ============================================================

@check_sig([2], matriz_numeros_t + vector_numeros_t, matriz_numeros_t + vector_numeros_t)
def broadcast_add(a, b):
    """
    Suma con soporte de broadcasting.
    Permite sumar tensores de diferentes formas cuando son compatibles.
    
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
    target = tuple(max(d1, d2) for d1, d2 in zip(s1_padded, s2_padded))
    a_bc = _broadcast_to_nd(a, target, s1)
    b_bc = _broadcast_to_nd(b, target, s2)
    return _op_nd(a_bc, b_bc, lambda x, y: x + y)


@check_sig([2], matriz_numeros_t + vector_numeros_t, matriz_numeros_t + vector_numeros_t)
def broadcast_sub(a, b):
    """
    Resta con soporte de broadcasting.
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
    target = tuple(max(d1, d2) for d1, d2 in zip(s1_padded, s2_padded))
    a_bc = _broadcast_to_nd(a, target, s1)
    b_bc = _broadcast_to_nd(b, target, s2)
    return _op_nd(a_bc, b_bc, lambda x, y: x - y)


@check_sig([2], matriz_numeros_t + vector_numeros_t, matriz_numeros_t + vector_numeros_t)
def broadcast_mul(a, b):
    """
    Multiplicación con soporte de broadcasting.
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
    target = tuple(max(d1, d2) for d1, d2 in zip(s1_padded, s2_padded))
    a_bc = _broadcast_to_nd(a, target, s1)
    b_bc = _broadcast_to_nd(b, target, s2)
    return _op_nd(a_bc, b_bc, lambda x, y: x * y)


# ============================================================
# N-D EXTENSIONS — Axis reduction
# ============================================================

@check_sig([2], matriz_numeros_t + vector_numeros_t, [entero_t])
def sum_axis(a, axis):
    """
    Suma a lo largo del eje especificado.
    
    sum_axis([[1,2],[3,4]], 0) → [4, 6]       (suma filas)
    sum_axis([[1,2],[3,4]], 1) → [3, 7]       (suma columnas)
    sum_axis([[[1,2],[3,4]],[[5,6],[7,8]]], 0) → [[6,8],[10,12]]
    """
    return _sum_nd(a, axis)


@check_sig([2], matriz_numeros_t + vector_numeros_t, [entero_t])
def max_axis(a, axis):
    """
    Máximo a lo largo del eje especificado.
    
    max_axis([[1,2],[3,4]], 0) → [3, 4]       (max de filas)
    max_axis([[1,2],[3,4]], 1) → [2, 4]       (max de columnas)
    """
    return _max_nd(a, axis)


# ============================================================
# N-D EXTENSIONS — Reshape
# ============================================================

@check_sig([2], matriz_numeros_t + vector_numeros_t, lista_cualquiera_t)
def reshape(a, new_shape):
    """
    Reorganiza un tensor a una nueva forma.
    
    reshape([1,2,3,4], [2,2]) → [[1,2],[3,4]]
    reshape([[1,2],[3,4]], [4]) → [1,2,3,4]
    reshape([1,2,3,4,5,6], [3,2]) → [[1,2],[3,4],[5,6]]
    """
    shape_tuple = tuple(new_shape)
    return _reshape_nd(a, shape_tuple)


# ============================================================
# N-D EXTENSIONS — Creation functions
# ============================================================

@check_sig([1], vector_numeros_t)
def ones(shape):
    """
    Crea un tensor de unos con la forma dada.
    
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


@check_sig([1, 3], vector_numeros_t, [flotante_t, entero_t], [flotante_t, entero_t])
def random_tensor(shape, low=-0.5, high=0.5):
    """
    Crea un tensor con valores aleatorios en el rango [low, high].
    
    random_tensor([3]) → [0.12, -0.34, 0.56]
    random_tensor([2, 2], -1.0, 1.0) → [[...], [...]]
    """
    def _rand(shape):
        if len(shape) == 1:
            return [_random_module.uniform(low, high) for _ in range(shape[0])]
        return [_rand(shape[1:]) for _ in range(shape[0])]
    return _rand(list(shape))


@check_sig([2], [flotante_t, entero_t], matriz_numeros_t + vector_numeros_t)
def scalar_mul(scalar, tensor):
    """
    Multiplica un tensor por un escalar.
    
    scalar_mul(3.0, [1, 2, 3]) → [3.0, 6.0, 9.0]
    scalar_mul(2.0, [[1,2],[3,4]]) → [[2.0,4.0],[6.0,8.0]]
    """
    def _mul(t):
        if isinstance(t, list):
            return [_mul(item) for item in t]
        return scalar * t
    return _mul(tensor)


@check_sig([1], matriz_numeros_t + vector_numeros_t)
def sum_all(tensor):
    """
    Suma todos los elementos de un tensor.
    
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


@check_sig([1], matriz_numeros_t + vector_numeros_t)
def abs_tensor(tensor):
    """
    Valor absoluto de cada elemento.
    """
    def _abs(t):
        if isinstance(t, list):
            return [_abs(item) for item in t]
        return t if t >= 0 else -t
    return _abs(tensor)
