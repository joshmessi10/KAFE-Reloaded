"""Capas para KafeGESHA."""
from abc import ABC, abstractmethod
from lib.KafeGESHA.core import Parameter, Node
from lib.KafeGESHA.activations import ActivationFunctionLoader
from lib.KafeNUMK import funciones as numk


class Layer(ABC):
    def __init__(self):
        self.name = self.__class__.__name__
        self._training = True
        self._last_inputs = None

    def connect(self, inbound_nodes):
        if not isinstance(inbound_nodes, list):
            inbound_nodes = [inbound_nodes]
        return Node(layer=self, inbound_nodes=inbound_nodes)

    __call__ = connect

    @abstractmethod
    def forward(self, input_data):
        pass

    @abstractmethod
    def backward(self, output_error, regularization_lambda=0.0):
        pass

    def parameters(self):
        return []

    def train(self): self._training = True
    def eval(self): self._training = False


class Input(Layer):
    def __init__(self, shape):
        super().__init__()
        self.shape = shape
        self.layer = None
        self.inbound_nodes = []
        self._output_cache = None
    def clear_cache(self): self._output_cache = None
    def forward(self, input_data): return input_data
    def backward(self, output_error, regularization_lambda=0.0): return output_error
    def summary(self): print(f"Input(shape={self.shape})")


class Dense(Layer):
    """Z = XW + b, seguido de una activación que guarda su propio contexto."""
    def __init__(self, units, activation="linear", input_shape=None, regularization_lambda=0.0, seed=None, name=None):
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
        self.w = Parameter(numk.random_tensor([input_dim, self.units], -0.5, 0.5, self.seed),
                           name=f"{self.name}_w")
        self.b = Parameter(numk.zeros_nd([self.units]), name=f"{self.name}_b")

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


class Dropout(Layer):
    def __init__(self, rate=0.5, seed=None):
        super().__init__()
        if not 0.0 <= rate < 1.0:
            raise ValueError("Dropout rate debe estar entre 0 y 1")
        self.rate = rate
        self.mask = None
        if seed is not None:
            import random as py_random
            py_random.seed(seed)

    def forward(self, input_data):
        if not self._training:
            return input_data[:]
        draws = numk.random_tensor(list(numk.shape(input_data)), 0.0, 1.0)
        self.mask = numk.map_elements(
            lambda value: 0.0 if value < self.rate else 1.0 / (1.0 - self.rate), draws)
        return numk.emul(input_data, self.mask)

    def backward(self, output_error, regularization_lambda=0.0):
        if not self._training or self.mask is None:
            return output_error[:]
        return numk.emul(output_error, self.mask)

    def summary(self):
        print(f"Dropout         | rate: {self.rate}")


class Flatten(Layer):
    def __init__(self, input_shape=None):
        super().__init__()
        self.input_shape = tuple(input_shape) if input_shape else None
        self._last_shape = None

    def forward(self, input_data):
        self._last_shape = numk.shape(input_data)
        size = 1
        for dimension in self._last_shape:
            size *= dimension
        return numk.reshape(input_data, [size])

    def backward(self, output_error, regularization_lambda=0.0):
        if self._last_shape is None:
            raise RuntimeError("Flatten.backward requiere forward")
        return numk.reshape(output_error, list(self._last_shape))

    def summary(self):
        print("Flatten         |")


class Add(Layer):
    def __init__(self):
        super().__init__()
        self._last_inputs = None

    def forward(self, inputs):
        if not inputs:
            raise ValueError("Add requiere al menos una entrada")
        self._last_inputs = inputs
        return numk.sum_axis(inputs, 0)

    def backward(self, output_error, regularization_lambda=0.0):
        n = len(self._last_inputs) if self._last_inputs else 1
        return [output_error[:] for _ in range(n)]

    def summary(self):
        print("Add             |")


class ActivationLayer(Layer):
    def __init__(self, activation):
        super().__init__()
        self.activation = ActivationFunctionLoader.get(activation)

    def forward(self, input_data):
        return self.activation.forward(input_data)

    def backward(self, output_error, regularization_lambda=0.0):
        return self.activation.backward(output_error)

    def summary(self):
        print(f"ActivationLayer | act: {self.activation.__class__.__name__}")
