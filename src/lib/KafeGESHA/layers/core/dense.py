"""Capa totalmente conectada."""
from lib.KafeGESHA.core import Parameter
from lib.KafeGESHA.activations import ActivationFunctionLoader
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer
from lib.KafeGESHA.initializers import get as get_initializer, RandomUniform
from lib.KafeGESHA.regularizers import get as get_regularizer

class Dense(Layer):
    """Z = XW + b, seguido de una activación que guarda su propio contexto."""
    def __init__(self, units, activation="linear", input_shape=None, regularization_lambda=0.0, seed=None, name=None,
                 kernel_initializer=None, bias_initializer="zeros", kernel_regularizer=None):
        super().__init__()
        if type(units) is not int or units <= 0:
            raise ValueError("Dense requiere units entero positivo")
        self.units = units
        self.activation = ActivationFunctionLoader.get(activation)
        self.name = name or f"Dense_{units}"
        self.w = None
        self.b = None
        self._last_input = None
        self._last_z = None
        self.input_shape = tuple(input_shape) if input_shape else None
        self.regularization_lambda = regularization_lambda
        self.seed = seed
        self.kernel_initializer = (RandomUniform(-0.5, 0.5, seed) if kernel_initializer is None
                                   else get_initializer(kernel_initializer, seed))
        self.bias_initializer = get_initializer(bias_initializer, seed)
        self.kernel_regularizer = get_regularizer(kernel_regularizer)
        if self.input_shape:
            if len(self.input_shape) != 1:
                raise ValueError("Dense input_shape debe contener solo features")
            self.build(self.input_shape[-1])

    def build_from_shape(self, input_shape):
        """Construye perezosamente desde una forma NUMK [batch, features]."""
        shape = tuple(input_shape)
        if not shape:
            raise ValueError("Dense requiere una forma de entrada no vacía")
        self.build(shape[-1])

    def build(self, input_dim):
        if isinstance(input_dim, (list, tuple)):
            if not input_dim:
                raise ValueError("Dense requiere una forma no vacia")
            input_dim = input_dim[-1]
        if type(input_dim) is not int or input_dim <= 0:
            raise ValueError("Dense requiere input_dim positivo")
        if self.w is not None:
            if len(self.w.data) != input_dim:
                raise ValueError("Dense: dimension de entrada incompatible")
            return
        self.w = Parameter(self.kernel_initializer([input_dim, self.units]),
                           name=f"{self.name}_w", regularizer=self.kernel_regularizer)
        self.b = Parameter(self.bias_initializer([self.units]), name=f"{self.name}_b")

    @property
    def weights(self):
        return self.w.data if self.w is not None else None

    @property
    def biases(self):
        return self.b.data if self.b is not None else None

    @property
    def d_weights(self):
        return self.w.grad if self.w is not None else None

    @property
    def d_biases(self):
        return self.b.grad if self.b is not None else None

    @property
    def input_cache(self):
        return self._last_input

    def forward(self, input_data):
        shape = numk.shape(input_data)
        if len(shape) not in (1, 2) or 0 in shape:
            raise ValueError("Dense requiere vector o matriz no vacia")
        self.build(shape[-1])
        self._last_input = numk.tensor(input_data)
        self._single_sample = len(shape) == 1
        rows = [self._last_input] if self._single_sample else self._last_input
        z = numk.broadcast_add(numk.dot_matrix(rows, self.w.data), self.b.data)
        self._last_z = z[0] if self._single_sample else z
        return self.activation.forward(self._last_z)

    def backward(self, output_error, regularization_lambda=0.0):
        if self._last_input is None:
            raise RuntimeError("Dense.backward requiere forward")
        dz = self.activation.backward(output_error)
        rows = [self._last_input] if self._single_sample else self._last_input
        dz_rows = [dz] if self._single_sample else dz
        self.w.grad = numk.dot_matrix(numk.transpose(rows), dz_rows)
        self.b.grad = numk.sum_axis(dz_rows, 0)
        reg = regularization_lambda or self.regularization_lambda
        if reg > 0:
            self.w.grad = numk.broadcast_add(self.w.grad, numk.scalar_mul(reg, self.w.data))
        dx = numk.dot_matrix(dz_rows, numk.transpose(self.w.data))
        return dx[0] if self._single_sample else dx

    def parameters(self):
        return [self.w, self.b] if self.w else []

    def summary(self):
        params = (len(self.w.data) * self.units + self.units) if self.w else 0
        print(f"{self.name:15} | units: {self.units:<5} | params: {params:<6} | act: {self.activation.__class__.__name__}")

__all__ = ['Dense']
