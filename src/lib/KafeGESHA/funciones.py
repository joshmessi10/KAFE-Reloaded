"""API pública de KafeGESHA para el intérprete KAFE."""
from global_utils import check_sig
from TypeUtils import entero_t, cadena_t, flotante_t, gesha_t, pardos_t, vector_numeros_t, matriz_numeros_t, lista_cadenas_t, lista_cualquiera_t, void_t
from lib.KafeGESHA.core.model import GeshaDeep
from lib.KafeGESHA.layers.dense import Dense


@check_sig([4, 5], [entero_t], [cadena_t, void_t], vector_numeros_t + [void_t], [flotante_t, entero_t], [entero_t, void_t])
def create_dense(units, activation, input_shape, regularization_lambda, seed=None):
    """
    Crea una capa Dense reproducible.
      · seed: int o None (por defecto) para control de aleatoriedad.
    """
    return Dense(
        units,
        activation,
        input_shape,
        regularization_lambda,
        seed=seed,
    )


@check_sig([0], [])
def classification():
    return GeshaDeep(model_type="classification")


@check_sig([0], [])
def clustering():
    return GeshaDeep(model_type="clustering")


@check_sig([0], [])
def regression():
    return GeshaDeep(model_type="regression")


@check_sig([0], [])
def binary():
    return GeshaDeep(model_type="binary")


@check_sig([0], [])
def categorical():
    return classification()


@check_sig([4], [gesha_t], [cadena_t], [cadena_t], [lista_cadenas_t])
def compile(model, optimizer, loss, metrics):
    model.compile(optimizer=optimizer, loss=loss, metrics=metrics)


@check_sig([2], [gesha_t], [flotante_t, entero_t])
def set_lr(model, new_lr):
    model.set_lr(new_lr)


@check_sig([3, 4, 5, 6, 7], [gesha_t], [pardos_t], [lista_cadenas_t, void_t], [entero_t], [entero_t], matriz_numeros_t + [void_t], matriz_numeros_t + vector_numeros_t + [void_t])
def fit_from_df(model, df, y_columns=None, epochs=1, batch_size=1, x_val=None, y_val=None):
    model.fit_from_df(df, y_columns, epochs, batch_size, x_val, y_val)


@check_sig([1], vector_numeros_t)
def tensor_zeros(shape):
    """Crea un tensor de ceros con la forma dada."""
    from lib.KafeGESHA.core.tensor import tensor_zeros as _tz
    return _tz(shape)


@check_sig([1], vector_numeros_t)
def tensor_ones(shape):
    """Crea un tensor de unos con la forma dada."""
    from lib.KafeGESHA.core.tensor import tensor_ones as _to
    return _to(shape)


@check_sig([1], vector_numeros_t)
def tensor_random(shape):
    """Crea un tensor con valores aleatorios."""
    from lib.KafeGESHA.core.tensor import tensor_random as _tr
    return _tr(shape)


@check_sig([1], lista_cualquiera_t)
def tensor(data):
    """Crea un tensor desde datos."""
    from lib.KafeGESHA.core.tensor import Tensor as _Tensor
    return _Tensor(data)