"""Fábricas de geshaDeep: validan argumentos KAFE y crean objetos del backend.

Los datos numéricos son listas de NUMK. GESHA conserva únicamente el estado
del modelo, las capas, los parámetros y el grafo.
"""
from global_utils import check_sig
from TypeUtils import (
    entero_t, cadena_t, flotante_t, gesha_t, vector_numeros_t,
    lista_cadenas_t, lista_cualquiera_t, void_t, booleano_t,
)
from lib.KafeGESHA.layers import (
    Dense, Conv2D, SimpleRNN, Dropout, Flatten, Input, Add, ActivationLayer,
)
from lib.KafeGESHA.models import Sequential, Functional
from lib.KafeNUMK import funciones as numk


@check_sig([3, 4, 5], [entero_t], [cadena_t, void_t], vector_numeros_t + [void_t],
           [flotante_t, entero_t], [entero_t, void_t])
def create_dense(units, activation, input_shape, regularization_lambda=0.0, seed=None):
    """Crea Dense; [] infiere features al primer forward; reg penaliza pesos L2."""
    return Dense(units, activation, input_shape, regularization_lambda, seed=seed)


@check_sig([3, 4, 5, 6, 7], [entero_t], vector_numeros_t, [cadena_t],
           vector_numeros_t + [void_t], [entero_t], [cadena_t], [entero_t, void_t])
def create_conv2d(filters, kernel_size, activation="linear", input_shape=None,
                  stride=1, padding="valid", seed=None):
    """Crea Conv2D para entradas [canales, alto, ancho]."""
    return Conv2D(filters, kernel_size, activation, input_shape, stride, padding, seed)


@check_sig([1, 2, 3, 4, 5], [entero_t], [cadena_t],
           vector_numeros_t + [void_t], [booleano_t], [entero_t, void_t])
def create_rnn(units, activation="tanh", input_shape=None,
               return_sequences=False, seed=None):
    """Crea SimpleRNN para entradas [timesteps, features]."""
    return SimpleRNN(units, activation, input_shape, return_sequences, seed)


@check_sig([0, 1], lista_cualquiera_t + ["List[GESHA]", void_t])
def sequential(layers=None):
    """Modelo con las capas en el orden dado."""
    return Sequential(layers=layers)


@check_sig([2], [gesha_t], [gesha_t])
def functional(inputs, outputs):
    """Modelo DAG construido con layer.connect(entrada)."""
    return Functional(inputs=inputs, outputs=outputs)


@check_sig([1], vector_numeros_t)
def input_layer(shape):
    """Entrada simbólica del grafo; no contiene datos numéricos."""
    return Input(shape=tuple(shape))


@check_sig([4], [gesha_t], [cadena_t], [cadena_t], lista_cadenas_t)
def compile(model, optimizer, loss, metrics):
    """Configura pérdida y optimizador del modelo."""
    model.compile(optimizer=optimizer, loss=loss, metrics=metrics)


@check_sig([2], [gesha_t], [flotante_t, entero_t])
def set_lr(model, new_lr):
    model.set_lr(new_lr)


@check_sig([0, 1, 2], [flotante_t, entero_t], [entero_t, void_t])
def dropout_layer(rate=0.5, seed=None):
    return Dropout(rate=rate, seed=seed)


@check_sig([0, 1], vector_numeros_t + [void_t])
def flatten_layer(input_shape=None):
    return Flatten(input_shape=input_shape)


@check_sig([0], [])
def add_layer():
    return Add()


# Fábricas históricas. Para Dense se recomienda su argumento activation.
@check_sig([0], [])
def relu_layer():
    return ActivationLayer("relu")


@check_sig([0], [])
def sigmoid_layer():
    return ActivationLayer("sigmoid")


@check_sig([0], [])
def tanh_layer():
    return ActivationLayer("tanh")


@check_sig([0], [])
def softmax_layer():
    return ActivationLayer("softmax")


@check_sig([0], [])
def linear_layer():
    return ActivationLayer("linear")


ReLULayer = relu_layer
SigmoidLayer = sigmoid_layer
TanhLayer = tanh_layer
SoftmaxLayer = softmax_layer
LinearLayer = linear_layer


# Nombres existentes de geshaDeep; el valor retornado es una lista NUMK.
@check_sig([1], vector_numeros_t)
def tensor_zeros(shape):
    return numk.zeros_nd(shape)


@check_sig([1], vector_numeros_t)
def tensor_ones(shape):
    return numk.ones(shape)


@check_sig([1], vector_numeros_t)
def tensor_random(shape):
    return numk.random_tensor(shape)


@check_sig([1], lista_cualquiera_t)
def tensor(data):
    """Copia numérica validada: no existe un tipo Tensor adicional."""
    return numk.tensor(data)
