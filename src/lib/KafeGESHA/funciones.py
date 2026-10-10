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
    Conv1D, DepthwiseConv2D, Conv2DTranspose, MaxPooling1D, MaxPooling2D,
    AveragePooling2D, GlobalAveragePooling2D, GlobalMaxPooling2D,
    BatchNormalization, ZeroPadding2D, UpSampling2D, Reshape, Permute,
    Concatenate, Multiply, SpatialDropout2D, LSTM, GRU, Bidirectional,
    Embedding,
)
from lib.KafeGESHA.models import Sequential, Functional
from lib.KafeNUMK import funciones as numk
from lib.KafeGESHA.initializers import (Zeros, Ones, RandomUniform, RandomNormal,
    GlorotUniform, GlorotNormal, HeUniform, HeNormal, Orthogonal, Constant)
from lib.KafeGESHA.callbacks import EarlyStopping, ModelCheckpoint
from lib.KafeGESHA.regularizers import L1, L2, L1L2


@check_sig([3, 4, 5, 6, 7], [entero_t], [cadena_t, void_t], vector_numeros_t + [void_t],
           [flotante_t, entero_t], [entero_t, void_t], [gesha_t, cadena_t], [gesha_t, cadena_t, void_t])
def create_dense(units, activation, input_shape, regularization_lambda=0.0, seed=None,
                 kernel_initializer=None, kernel_regularizer=None):
    """Crea Dense; [] infiere features al primer forward; reg penaliza pesos L2."""
    return Dense(units, activation, input_shape, regularization_lambda, seed=seed,
                 kernel_initializer=kernel_initializer, kernel_regularizer=kernel_regularizer)

@check_sig([0], [])
def zeros_initializer(): return Zeros()
@check_sig([0], [])
def ones_initializer(): return Ones()
@check_sig([0, 1, 2, 3], [flotante_t, entero_t], [flotante_t, entero_t], [entero_t, void_t])
def random_uniform(minval=-0.05, maxval=0.05, seed=None): return RandomUniform(minval, maxval, seed)
@check_sig([0, 1, 2, 3], [flotante_t, entero_t], [flotante_t, entero_t], [entero_t, void_t])
def random_normal(mean=0.0, stddev=0.05, seed=None): return RandomNormal(mean, stddev, seed)
@check_sig([0, 1], [entero_t, void_t])
def glorot_uniform(seed=None): return GlorotUniform(seed)
@check_sig([0, 1], [entero_t, void_t])
def glorot_normal(seed=None): return GlorotNormal(seed)
@check_sig([0, 1], [entero_t, void_t])
def he_uniform(seed=None): return HeUniform(seed)
@check_sig([0, 1], [entero_t, void_t])
def he_normal(seed=None): return HeNormal(seed)
@check_sig([0, 1, 2], [flotante_t, entero_t], [entero_t, void_t])
def orthogonal(gain=1.0, seed=None): return Orthogonal(gain, seed)
@check_sig([1], [flotante_t, entero_t])
def constant_initializer(value): return Constant(value)

@check_sig([0, 1], [flotante_t, entero_t])
def l1_regularizer(value=0.01): return L1(value)
@check_sig([0, 1], [flotante_t, entero_t])
def l2_regularizer(value=0.01): return L2(value)
@check_sig([0, 1, 2], [flotante_t, entero_t], [flotante_t, entero_t])
def l1_l2_regularizer(l1=0.01, l2=0.01): return L1L2(l1, l2)

@check_sig([0, 1, 2, 3, 4, 5], [cadena_t], [entero_t], [flotante_t, entero_t], [cadena_t], [booleano_t])
def early_stopping(monitor='val_loss', patience=0, min_delta=0.0, mode='min', restore_best_weights=False):
    return EarlyStopping(monitor, patience, min_delta, mode, restore_best_weights)
@check_sig([1, 2, 3, 4], [cadena_t], [cadena_t], [booleano_t], [cadena_t])
def model_checkpoint(filepath, monitor='val_loss', save_best_only=False, mode='min'):
    return ModelCheckpoint(filepath, monitor, save_best_only, mode)
@check_sig([2], [gesha_t], [gesha_t])
def add_callback(model, callback): model.add_callback(callback)


@check_sig([3, 4, 5, 6, 7, 8, 9], [entero_t], vector_numeros_t, [cadena_t],
           vector_numeros_t + [void_t], [entero_t], [cadena_t], [entero_t, void_t],
           [gesha_t, cadena_t], [gesha_t, cadena_t, void_t])
def create_conv2d(filters, kernel_size, activation="linear", input_shape=None,
                  stride=1, padding="valid", seed=None, kernel_initializer=None,
                  kernel_regularizer=None):
    """Crea Conv2D para entradas [canales, alto, ancho]."""
    return Conv2D(filters, kernel_size, activation, input_shape, stride, padding, seed,
                  kernel_initializer=kernel_initializer, kernel_regularizer=kernel_regularizer)


@check_sig([1, 2, 3, 4, 5], [entero_t], [cadena_t],
           vector_numeros_t + [void_t], [booleano_t], [entero_t, void_t])
def create_rnn(units, activation="tanh", input_shape=None,
               return_sequences=False, seed=None):
    """Crea SimpleRNN para entradas [timesteps, features]."""
    return SimpleRNN(units, activation, input_shape, return_sequences, seed)


@check_sig([2, 3, 4, 5, 6, 7], [entero_t], [entero_t], [cadena_t],
           vector_numeros_t + [void_t], [entero_t], [cadena_t], [entero_t, void_t])
def create_conv1d(filters, kernel_size, activation="linear", input_shape=None,
                  stride=1, padding="valid", seed=None):
    return Conv1D(filters, kernel_size, activation, input_shape, stride, padding, seed)


@check_sig([1, 2, 3, 4, 5, 6, 7], vector_numeros_t, [entero_t], [cadena_t],
           vector_numeros_t + [void_t], [entero_t], [cadena_t], [entero_t, void_t])
def create_depthwise_conv2d(kernel_size, depth_multiplier=1, activation="linear",
                            input_shape=None, stride=1, padding="valid", seed=None):
    return DepthwiseConv2D(kernel_size, depth_multiplier, activation, input_shape, stride, padding, seed)


@check_sig([2, 3, 4, 5, 6, 7], [entero_t], vector_numeros_t, [cadena_t],
           vector_numeros_t + [void_t], [entero_t], [cadena_t], [entero_t, void_t])
def create_conv2d_transpose(filters, kernel_size, activation="linear", input_shape=None,
                            stride=1, padding="valid", seed=None):
    return Conv2DTranspose(filters, kernel_size, activation, input_shape, stride, padding, seed)


@check_sig([0, 1, 2], [entero_t], [entero_t, void_t])
def max_pooling1d(pool_size=2, stride=None): return MaxPooling1D(pool_size, stride)

@check_sig([0, 1, 2], vector_numeros_t, [entero_t, void_t])
def max_pooling2d(pool_size=[2, 2], stride=None): return MaxPooling2D(pool_size, stride)

@check_sig([0, 1, 2], vector_numeros_t, [entero_t, void_t])
def average_pooling2d(pool_size=[2, 2], stride=None): return AveragePooling2D(pool_size, stride)

@check_sig([0], [])
def global_average_pooling2d(): return GlobalAveragePooling2D()

@check_sig([0], [])
def global_max_pooling2d(): return GlobalMaxPooling2D()

@check_sig([0, 1, 2], [flotante_t, entero_t], [flotante_t, entero_t])
def batch_normalization(epsilon=1e-5, momentum=0.9): return BatchNormalization(epsilon, momentum)

@check_sig([0, 1], vector_numeros_t)
def zero_padding2d(padding=[1, 1]): return ZeroPadding2D(padding)

@check_sig([0, 1], vector_numeros_t)
def up_sampling2d(size=[2, 2]): return UpSampling2D(size)

@check_sig([1], vector_numeros_t)
def reshape_layer(target_shape): return Reshape(target_shape)

@check_sig([1], vector_numeros_t)
def permute_layer(dims): return Permute(dims)

@check_sig([0, 1], [entero_t])
def concatenate_layer(axis=0): return Concatenate(axis)

@check_sig([0], [])
def multiply_layer(): return Multiply()

@check_sig([0, 1, 2], [flotante_t, entero_t], [entero_t, void_t])
def spatial_dropout2d(rate=0.5, seed=None): return SpatialDropout2D(rate, seed)

@check_sig([1, 2, 3, 4], [entero_t], vector_numeros_t + [void_t], [booleano_t], [entero_t, void_t])
def create_lstm(units, input_shape=None, return_sequences=False, seed=None):
    return LSTM(units, input_shape, return_sequences, seed)

@check_sig([1, 2, 3, 4], [entero_t], vector_numeros_t + [void_t], [booleano_t], [entero_t, void_t])
def create_gru(units, input_shape=None, return_sequences=False, seed=None):
    return GRU(units, input_shape, return_sequences, seed)

@check_sig([1], [gesha_t])
def bidirectional(layer): return Bidirectional(layer)

@check_sig([2, 3], [entero_t], [entero_t], [entero_t, void_t])
def embedding(input_dim, output_dim, seed=None): return Embedding(input_dim, output_dim, seed)


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
