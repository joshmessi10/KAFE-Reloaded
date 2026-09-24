"""API pública de KafeGESHA para el intérprete KAFE.

Funciones disponibles desde KAFE con `import geshaDeep`:

    Construcción de modelos:
        geshaDeep.sequential([layers])    → Sequential
        geshaDeep.functional(inputs, outputs) → Functional
        geshaDeep.input_layer(shape)      → Input simbólico

    Construcción de capas:
        geshaDeep.create_dense(units, activation, input_shape, reg, seed)
        geshaDeep.relu_layer()
        geshaDeep.sigmoid_layer()
        geshaDeep.tanh_layer()
        geshaDeep.softmax_layer()
        geshaDeep.dropout_layer(rate, seed)
        geshaDeep.flatten_layer()
        geshaDeep.add_layer()             → capa Add para skip-connections

    Utilidades de tensores:
        geshaDeep.tensor(data)
        geshaDeep.tensor_zeros(shape)
        geshaDeep.tensor_ones(shape)
        geshaDeep.tensor_random(shape)

    Operaciones sobre el modelo:
        geshaDeep.compile(model, optimizer, loss, metrics)
        geshaDeep.set_lr(model, new_lr)

Pipeline esperado desde KAFE:

    import geshaDeep;

    -- Datos ya preparados (el preprocesamiento está fuera)
    List[List[FLOAT]] X_train = [...];
    List[INT]         y_train = [...];

    GESHA model = geshaDeep.sequential([
        geshaDeep.create_dense(128, "relu", [784], 0.0),
        geshaDeep.create_dense(10,  "softmax", [], 0.0)
    ]);
    model.compile("adam", "categorical_crossentropy", ["accuracy"]);
    model.fit(X_train, y_train, 20, 32);
"""
from global_utils import check_sig
from TypeUtils import (
    entero_t, cadena_t, flotante_t, gesha_t,
    vector_numeros_t, matriz_numeros_t,
    lista_cadenas_t, lista_cualquiera_t, void_t
)
from lib.KafeGESHA.layers import Dense, Dropout, Flatten, Input, Add, ActivationLayer
from lib.KafeGESHA.models import Sequential, Functional
from lib.KafeNUMK import funciones as numk

def ReLULayer(): return ActivationLayer("relu")
def SigmoidLayer(): return ActivationLayer("sigmoid")
def TanhLayer(): return ActivationLayer("tanh")
def SoftmaxLayer(): return ActivationLayer("softmax")
def LinearLayer(): return ActivationLayer("linear")


# --------------------------------------------------------------------------
# Capas
# --------------------------------------------------------------------------

@check_sig([3, 4, 5], [entero_t], [cadena_t, void_t], vector_numeros_t + [void_t], [flotante_t, entero_t], [entero_t, void_t])
def create_dense(units, activation, input_shape, regularization_lambda=0.0, seed=None):
    """Crea una capa Dense.

    Args:
        units: Número de neuronas.
        activation: Función de activación ('relu', 'sigmoid', 'softmax', 'tanh', 'linear', None).
        input_shape: Lista con la dimensión de entrada, o [] para inferencia automática.
        regularization_lambda: Coeficiente de regularización L2 (opcional, default 0.0).
        seed: Semilla para reproducibilidad (opcional, default None).

    Ejemplo:
        # Uso simple (3 args)
        geshaDeep.create_dense(1, "sigmoid", [2])
        # Con regularización (4 args)
        geshaDeep.create_dense(1, "sigmoid", [2], 0.01)
        # Con regularización y semilla (5 args)
        geshaDeep.create_dense(1, "sigmoid", [2], 0.01, 42)
    """
    shape = tuple(input_shape) if input_shape else None
    return Dense(units, activation, shape, regularization_lambda, seed=seed)


@check_sig([0], [])
def relu_layer():
    """Crea una capa ReLU independiente."""
    return ReLULayer()


@check_sig([0], [])
def sigmoid_layer():
    """Crea una capa Sigmoid independiente."""
    return SigmoidLayer()


@check_sig([0], [])
def tanh_layer():
    """Crea una capa Tanh independiente."""
    return TanhLayer()


@check_sig([0], [])
def softmax_layer():
    """Crea una capa Softmax independiente."""
    return SoftmaxLayer()


@check_sig([0], [])
def linear_layer():
    """Crea una capa de activación lineal (identidad)."""
    return LinearLayer()


@check_sig([0, 1, 2], [flotante_t, entero_t], [entero_t, void_t])
def dropout_layer(rate=0.5, seed=None):
    """Crea una capa Dropout.

    Args:
        rate: Proporción de neuronas a desactivar (0.0 a 1.0).
        seed: Semilla para reproducibilidad.
    """
    return Dropout(rate=rate, seed=seed)


@check_sig([0, 1], [vector_numeros_t, void_t])
def flatten_layer(input_shape=None):
    """Crea una capa Flatten."""
    shape = tuple(input_shape) if input_shape else None
    return Flatten(input_shape=shape)


@check_sig([0], [])
def add_layer():
    """Crea una capa Add para merge de ramas (skip-connections).

    Uso en la API Functional:
        merged = add_layer()([branch_a, branch_b])
    """
    return Add()


# --------------------------------------------------------------------------
# Modelos
# --------------------------------------------------------------------------

@check_sig([0, 1], lista_cualquiera_t + ["List[GESHA]", void_t])
def sequential(layers=None):
    """Crea un modelo Sequential.

    Args:
        layers: Lista de capas iniciales (opcional).

    Ejemplo:
        GESHA model = geshaDeep.sequential([
            geshaDeep.create_dense(128, "relu", [784], 0.0),
            geshaDeep.create_dense(10, "softmax", [], 0.0)
        ]);
    """
    return Sequential(layers=layers)


@check_sig([2], [gesha_t], [gesha_t])
def functional(inputs, outputs):
    """Crea un modelo Functional a partir de tensores simbólicos.

    Args:
        inputs: Tensor simbólico de entrada (Input).
        outputs: Nodo simbólico de salida del grafo.

    Ejemplo:
        GESHA inputs  = geshaDeep.input_layer([784]);
        GESHA x       = geshaDeep.create_dense(128, "relu", [], 0.0)(inputs);
        GESHA outputs = geshaDeep.create_dense(10, "softmax", [], 0.0)(x);
        GESHA model   = geshaDeep.functional(inputs, outputs);
    """
    return Functional(inputs=inputs, outputs=outputs)


@check_sig([1], [vector_numeros_t])
def input_layer(shape):
    """Crea un tensor simbólico de entrada para la API Functional.

    Args:
        shape: Lista con las dimensiones de entrada (e.g., [784] o [28, 28]).
    """
    return Input(shape=tuple(shape))


# --------------------------------------------------------------------------
# Operaciones sobre el modelo
# --------------------------------------------------------------------------

@check_sig([4], [gesha_t], [cadena_t], [cadena_t], [lista_cadenas_t])
def compile(model, optimizer, loss, metrics):
    """Configura el optimizador y la función de pérdida del modelo."""
    model.compile(optimizer=optimizer, loss=loss, metrics=metrics)


@check_sig([2], [gesha_t], [flotante_t, entero_t])
def set_lr(model, new_lr):
    """Actualiza la tasa de aprendizaje del optimizador."""
    model.set_lr(new_lr)


# --------------------------------------------------------------------------
# Utilidades de tensores
# --------------------------------------------------------------------------

@check_sig([1], vector_numeros_t)
def tensor_zeros(shape):
    """Crea un tensor de ceros con la forma dada. Delega a KafeNUMK."""
    from lib.KafeGESHA.core import tensor_zeros as _tz
    return _tz(shape)


@check_sig([1], vector_numeros_t)
def tensor_ones(shape):
    """Crea un tensor de unos con la forma dada. Delega a KafeNUMK."""
    from lib.KafeGESHA.core import tensor_ones as _to
    return _to(shape)


@check_sig([1], vector_numeros_t)
def tensor_random(shape):
    """Crea un tensor con valores aleatorios. Delega a KafeNUMK."""
    from lib.KafeGESHA.core import tensor_random as _tr
    return _tr(shape)


@check_sig([1], lista_cualquiera_t)
def tensor(data):
    """Crea un tensor desde datos. Delega a KafeNUMK."""
    from lib.KafeGESHA.core import Tensor as _Tensor
    return _Tensor(data)
