from .errores import raiseDifferentDimension, raiseNonUniformMatrix
from .utils import (
    es_misma_dimension, es_uniforme, operar_matrices,
    _shape_nd,
    _sum_nd, _max_nd, _reshape_nd, _map_nd, _broadcast_op,
    _validate_dimensions
)
from TypeUtils import matriz_cualquiera_t, matriz_numeros_t, vector_numeros_t, entero_t, flotante_t, lista_cualquiera_t
from global_utils import check_sig
import random as _random_module

_numeric_nd = [entero_t, flotante_t] + lista_cualquiera_t


def map_elements(operation, *values):
    """API Python para aplicar una operación escalar a listas de igual forma.

    Centraliza el recorrido N-dimensional usado por las bibliotecas. No hace
    broadcasting ni acepta truncamientos implícitos entre formas diferentes.
    """
    if not values:
        raise ValueError("NUMK: map_elements requiere datos")
    expected = _shape_nd(values[0])
    if any(_shape_nd(value) != expected for value in values[1:]):
        raise ValueError("NUMK: formas incompatibles")
    return _map_nd(operation, *values)


@check_sig([1], _numeric_nd)
def tensor(data):
    """Valida y copia datos numéricos; devuelve listas, nunca un wrapper."""
    return map_elements(lambda value: value, data)


@check_sig([1], _numeric_nd)
def exp_tensor(data):
    """Exponencial elemento a elemento mediante KafeMATH."""
    from lib.KafeMATH.funciones import exp
    return map_elements(exp, data)


@check_sig([2], _numeric_nd, _numeric_nd)
def broadcast_div(a, b):
    """División con broadcasting; divisor cero produce ZeroDivisionError."""
    return _broadcast_op(a, b, lambda x, y: x / y)

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
    _validate_dimensions(shape)
    def _create(s):
        if len(s) == 0:
            return 0.0
        if len(s) == 1:
            return [0.0 for _ in range(s[0])]
        return [_create(s[1:]) for _ in range(s[0])]
    return _create(list(shape))

@check_sig([1], lista_cualquiera_t)
def shape(obj):
    return _shape_nd(obj)


# ============================================================
# N-D EXTENSIONS — Element-wise operations
# ============================================================

@check_sig([2], _numeric_nd, _numeric_nd)
def emul(a, b):
    """
    Multiplicación elemento a elemento (Hadamard product).
    Soporta cualquier dimensionalidad.
    
    emul([1,2,3], [4,5,6]) → [4, 10, 18]
    emul([[1,2],[3,4]], [[5,6],[7,8]]) → [[5,12],[21,32]]
    """
    return map_elements(lambda x, y: x * y, a, b)


# ============================================================
# N-D EXTENSIONS — Broadcasting
# ============================================================

@check_sig([2], _numeric_nd, _numeric_nd)
def broadcast_add(a, b):
    """
    Suma con soporte de broadcasting.
    Permite sumar tensores de diferentes formas cuando son compatibles.
    
    broadcast_add([[1,2],[3,4]], [0.1, 0.2]) → [[1.1,2.2],[3.1,4.2]]
    broadcast_add([[1,2],[3,4]], [[10],[20]]) → [[11,12],[23,24]]
    """
    return _broadcast_op(a, b, lambda x, y: x + y)


@check_sig([2], _numeric_nd, _numeric_nd)
def broadcast_sub(a, b):
    """
    Resta con soporte de broadcasting.
    """
    return _broadcast_op(a, b, lambda x, y: x - y)


@check_sig([2], _numeric_nd, _numeric_nd)
def broadcast_mul(a, b):
    """
    Multiplicación con soporte de broadcasting.
    """
    return _broadcast_op(a, b, lambda x, y: x * y)


def conv2d_chw(input_data, kernels, bias, stride=1, padding="valid"):
    """Convolución 2D para CHW y kernels [F,C,KH,KW]."""
    in_shape = shape(input_data)
    kernel_shape = shape(kernels)
    if len(in_shape) != 3 or len(kernel_shape) != 4:
        raise ValueError("NUMK: conv2d_chw requiere CHW y kernels FCHW")
    channels, height, width = in_shape
    filters, kernel_channels, kh, kw = kernel_shape
    if channels != kernel_channels or len(bias) != filters:
        raise ValueError("NUMK: canales o bias incompatibles en conv2d")
    if type(stride) is not int or stride <= 0:
        raise ValueError("NUMK: stride debe ser entero positivo")
    if padding not in ("valid", "same"):
        raise ValueError("NUMK: padding debe ser valid o same")
    pad_h = (kh - 1) // 2 if padding == "same" else 0
    pad_w = (kw - 1) // 2 if padding == "same" else 0
    out_h = (height + 2 * pad_h - kh) // stride + 1
    out_w = (width + 2 * pad_w - kw) // stride + 1
    if out_h <= 0 or out_w <= 0:
        raise ValueError("NUMK: kernel mayor que la entrada")
    output = zeros_nd([filters, out_h, out_w])
    for f in range(filters):
        for oy in range(out_h):
            for ox in range(out_w):
                value = bias[f]
                for c in range(channels):
                    for ky in range(kh):
                        iy = oy * stride + ky - pad_h
                        if iy < 0 or iy >= height:
                            continue
                        for kx in range(kw):
                            ix = ox * stride + kx - pad_w
                            if 0 <= ix < width:
                                value += input_data[c][iy][ix] * kernels[f][c][ky][kx]
                output[f][oy][ox] = value
    return output


def conv2d_chw_backward(input_data, kernels, grad_output, stride=1, padding="valid"):
    """Gradientes (entrada, kernels, bias) de :func:`conv2d_chw`."""
    channels, height, width = shape(input_data)
    filters, kernel_channels, kh, kw = shape(kernels)
    if channels != kernel_channels:
        raise ValueError("NUMK: canales incompatibles en backward conv2d")
    expected = shape(conv2d_chw(input_data, kernels, [0.0] * filters, stride, padding))
    if shape(grad_output) != expected:
        raise ValueError("NUMK: grad_output incompatible en backward conv2d")
    pad_h = (kh - 1) // 2 if padding == "same" else 0
    pad_w = (kw - 1) // 2 if padding == "same" else 0
    dx = zeros_nd([channels, height, width])
    dw = zeros_nd([filters, channels, kh, kw])
    db = zeros_nd([filters])
    for f in range(filters):
        for oy in range(expected[1]):
            for ox in range(expected[2]):
                grad = grad_output[f][oy][ox]
                db[f] += grad
                for c in range(channels):
                    for ky in range(kh):
                        iy = oy * stride + ky - pad_h
                        if iy < 0 or iy >= height:
                            continue
                        for kx in range(kw):
                            ix = ox * stride + kx - pad_w
                            if 0 <= ix < width:
                                dw[f][c][ky][kx] += input_data[c][iy][ix] * grad
                                dx[c][iy][ix] += kernels[f][c][ky][kx] * grad
    return dx, dw, db


def transpose_axes(data, axes):
    """Permuta ejes N-dimensionales sin introducir un wrapper Tensor."""
    source_shape = shape(data)
    if sorted(axes) != list(range(len(source_shape))):
        raise ValueError("NUMK: axes debe ser una permutación")
    output_shape = [source_shape[axis] for axis in axes]
    output = zeros_nd(output_shape)

    def get_value(indices):
        value = data
        for index in indices:
            value = value[index]
        return value

    def set_value(indices, value):
        target = output
        for index in indices[:-1]:
            target = target[index]
        target[indices[-1]] = value

    def visit(indices, depth):
        if depth == len(output_shape):
            source_indices = [0] * len(axes)
            for output_axis, source_axis in enumerate(axes):
                source_indices[source_axis] = indices[output_axis]
            set_value(indices, get_value(source_indices))
            return
        for index in range(output_shape[depth]):
            visit(indices + [index], depth + 1)

    visit([], 0)
    return output


def concatenate(values, axis=0):
    """Concatena listas ND con formas iguales excepto en ``axis``."""
    if not values:
        raise ValueError("NUMK: concatenate requiere entradas")
    shapes = [shape(value) for value in values]
    rank = len(shapes[0])
    if axis < 0:
        axis += rank
    if not 0 <= axis < rank or any(len(item) != rank for item in shapes):
        raise ValueError("NUMK: axis/rangos incompatibles")
    for dimension in range(rank):
        if dimension != axis and len({item[dimension] for item in shapes}) != 1:
            raise ValueError("NUMK: formas incompatibles para concatenate")
    if axis == 0:
        result = []
        for value in values:
            result.extend(tensor(value))
        return result
    return [concatenate([value[index] for value in values], axis - 1)
            for index in range(shapes[0][0])]


def split_sizes(data, sizes, axis=0):
    """Operación inversa de concatenate para tamaños explícitos."""
    if axis < 0:
        axis += len(shape(data))
    if axis == 0:
        result, start = [], 0
        for size in sizes:
            result.append(tensor(data[start:start + size]))
            start += size
        return result
    child_splits = [split_sizes(child, sizes, axis - 1) for child in data]
    return [[child[index] for child in child_splits] for index in range(len(sizes))]


# ============================================================
# N-D EXTENSIONS — Axis reduction
# ============================================================

@check_sig([2], lista_cualquiera_t, [entero_t])
def sum_axis(a, axis):
    """
    Suma a lo largo del eje especificado.
    
    sum_axis([[1,2],[3,4]], 0) → [4, 6]       (suma filas)
    sum_axis([[1,2],[3,4]], 1) → [3, 7]       (suma columnas)
    sum_axis([[[1,2],[3,4]],[[5,6],[7,8]]], 0) → [[6,8],[10,12]]
    """
    if not -len(shape(a)) <= axis < len(shape(a)):
        raise ValueError("NUMK: eje fuera de rango")
    return _sum_nd(a, axis)


@check_sig([2], lista_cualquiera_t, [entero_t])
def max_axis(a, axis):
    """
    Máximo a lo largo del eje especificado.
    
    max_axis([[1,2],[3,4]], 0) → [3, 4]       (max de filas)
    max_axis([[1,2],[3,4]], 1) → [2, 4]       (max de columnas)
    """
    if not -len(shape(a)) <= axis < len(shape(a)):
        raise ValueError("NUMK: eje fuera de rango")
    return _max_nd(a, axis)


# ============================================================
# N-D EXTENSIONS — Reshape
# ============================================================

@check_sig([2], _numeric_nd, lista_cualquiera_t)
def reshape(a, new_shape):
    """
    Reorganiza un tensor a una nueva forma.
    
    reshape([1,2,3,4], [2,2]) → [[1,2],[3,4]]
    reshape([[1,2],[3,4]], [4]) → [1,2,3,4]
    reshape([1,2,3,4,5,6], [3,2]) → [[1,2],[3,4],[5,6]]
    """
    _shape_nd(a)
    _validate_dimensions(new_shape)
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
    _validate_dimensions(shape)
    def _create(shape, val):
        if len(shape) == 0:
            return val
        if len(shape) == 1:
            return [val for _ in range(shape[0])]
        return [_create(shape[1:], val) for _ in range(shape[0])]
    return _create(list(shape), 1.0)


@check_sig([1, 3, 4], vector_numeros_t, [flotante_t, entero_t], [flotante_t, entero_t], [entero_t, "VOID"])
def random_tensor(shape, low=-0.5, high=0.5, seed=None):
    """
    Crea un tensor con valores aleatorios en el rango [low, high].
    
    random_tensor([3]) → [0.12, -0.34, 0.56]
    random_tensor([2, 2], -1.0, 1.0) → [[...], [...]]
    """
    _validate_dimensions(shape)
    rng = _random_module if seed is None else _random_module.Random(seed)
    def _rand(shape):
        if not shape:
            return rng.uniform(low, high)
        if len(shape) == 1:
            return [rng.uniform(low, high) for _ in range(shape[0])]
        return [_rand(shape[1:]) for _ in range(shape[0])]
    return _rand(list(shape))


@check_sig([1, 2, 3, 4], vector_numeros_t, [flotante_t, entero_t],
           [flotante_t, entero_t], [entero_t, "VOID"])
def normal_tensor(shape, mean=0.0, stddev=1.0, seed=None):
    """Crea un tensor N-dimensional con muestras gaussianas."""
    _validate_dimensions(shape)
    if stddev < 0:
        raise ValueError("normal_tensor: stddev debe ser no negativo")
    rng = _random_module if seed is None else _random_module.Random(seed)
    def _rand(dims):
        if not dims:
            return rng.gauss(mean, stddev)
        return [_rand(dims[1:]) for _ in range(dims[0])]
    return _rand(list(shape))


@check_sig([2], [flotante_t, entero_t], _numeric_nd)
def scalar_mul(scalar, tensor):
    """
    Multiplica un tensor por un escalar.
    
    scalar_mul(3.0, [1, 2, 3]) → [3.0, 6.0, 9.0]
    scalar_mul(2.0, [[1,2],[3,4]]) → [[2.0,4.0],[6.0,8.0]]
    """
    return map_elements(lambda value: scalar * value, tensor)


@check_sig([1], _numeric_nd)
def sum_all(tensor):
    """
    Suma todos los elementos de un tensor.
    
    sum_all([[1,2],[3,4]]) → 10
    sum_all([1, 2, 3]) → 6
    """
    _shape_nd(tensor)
    total = 0.0
    def _sum(t):
        nonlocal total
        if isinstance(t, list):
            for item in t:
                _sum(item)
        else:
            if type(t) not in (int, float):
                raise ValueError("NUMK: se requieren valores numericos")
            total += t
    _sum(tensor)
    return total


@check_sig([1], _numeric_nd)
def abs_tensor(tensor):
    """
    Valor absoluto de cada elemento.
    """
    return map_elements(abs, tensor)
