"""Capas para KafeGESHA."""
from abc import ABC, abstractmethod
from lib.KafeGESHA.core import Parameter, Node
from lib.KafeGESHA.activations import ActivationFunctionLoader, Identidad
from lib.KafeMATH.funciones import exp
from random import random

def _zeros(shape):
    if len(shape) == 1: return [0.0 for _ in range(shape[0])]
    return [[0.0 for _ in range(shape[1])] for _ in range(shape[0])]

def _random(shape):
    if len(shape) == 1: return [random() - 0.5 for _ in range(shape[0])]
    return [[random() - 0.5 for _ in range(shape[1])] for _ in range(shape[0])]


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
    def forward(self, input_data): return input_data
    def backward(self, output_error, regularization_lambda=0.0): return output_error
    def summary(self): print(f"Input(shape={self.shape})")


class Dense(Layer):
    def __init__(self, units, activation="linear", input_shape=None, regularization_lambda=0.0, seed=None, name=None):
        super().__init__()
        self.units = units
        self.activation = ActivationFunctionLoader.get(activation)
        self.name = name or f"Dense_{units}"
        self.w = None
        self.b = None
        self._last_input = None
        
        if seed is not None:
            import random as py_random
            py_random.seed(seed)

    def build(self, input_dim):
        self.w = Parameter(_random((input_dim, self.units)), name=f"{self.name}_w")
        self.b = Parameter(_zeros((self.units,)), name=f"{self.name}_b")

    def forward(self, input_data):
        input_dim = len(input_data)
        if self.w is None:
            self.build(input_dim)
        self._last_input = input_data[:]
        
        w_data, b_data = self.w.data, self.b.data
        z = [sum(input_data[i] * w_data[i][j] for i in range(input_dim)) + b_data[j] for j in range(self.units)]
        return self.activation.activate(z)

    def backward(self, output_error, regularization_lambda=0.0):
        w_data = self.w.data
        input_dim = len(self._last_input)
        
        # dL/dz
        act_grad = self.activation.derivative(None)
        if isinstance(act_grad, list) and isinstance(act_grad[0], list): # Jacobian
            dz = [sum(output_error[i] * act_grad[i][j] for i in range(self.units)) for j in range(self.units)]
        else: # Vector
            dz = [output_error[j] * (act_grad[j] if isinstance(act_grad, list) else act_grad) for j in range(self.units)]

        # dL/dx
        dx = [sum(dz[j] * w_data[i][j] for j in range(self.units)) for i in range(input_dim)]

        # Gradientes de los parámetros
        grad_w = _zeros((input_dim, self.units))
        for i in range(input_dim):
            for j in range(self.units):
                grad_w[i][j] = self._last_input[i] * dz[j]
                if regularization_lambda > 0:
                    grad_w[i][j] += regularization_lambda * w_data[i][j]
        
        self.w.grad = grad_w
        self.b.grad = dz[:]
        
        return dx

    def parameters(self):
        return [self.w, self.b] if self.w else []

    def summary(self):
        params = (len(self.w.data) * self.units + self.units) if self.w else 0
        print(f"{self.name:15} | units: {self.units:<5} | params: {params:<6} | act: {self.activation.__class__.__name__}")


class Dropout(Layer):
    def __init__(self, rate=0.5):
        super().__init__()
        self.rate = rate
        self.mask = None

    def forward(self, input_data):
        if not self._training:
            return input_data[:]
        self.mask = [0.0 if random() < self.rate else 1.0 / (1.0 - self.rate) for _ in input_data]
        return [x * m for x, m in zip(input_data, self.mask)]

    def backward(self, output_error, regularization_lambda=0.0):
        if not self._training or self.mask is None:
            return output_error[:]
        return [e * m for e, m in zip(output_error, self.mask)]

    def summary(self):
        print(f"Dropout         | rate: {self.rate}")


class Flatten(Layer):
    def __init__(self):
        super().__init__()
        self._last_shape = None

    def forward(self, input_data):
        self._last_shape = self._get_shape(input_data)
        flat = []
        self._flatten_recursive(input_data, flat)
        return flat

    def backward(self, output_error, regularization_lambda=0.0):
        iterator = iter(output_error)
        return self._reshape_recursive(self._last_shape, iterator)

    def _get_shape(self, data):
        if not isinstance(data, list): return []
        return [len(data)] + self._get_shape(data[0])

    def _flatten_recursive(self, data, out):
        if not isinstance(data, list): out.append(data)
        else:
            for item in data: self._flatten_recursive(item, out)

    def _reshape_recursive(self, shape, iterator):
        if not shape: return next(iterator)
        return [self._reshape_recursive(shape[1:], iterator) for _ in range(shape[0])]

    def summary(self):
        print("Flatten         |")


class Add(Layer):
    def __init__(self):
        super().__init__()
        self._last_inputs = None

    def forward(self, inputs):
        self._last_inputs = inputs
        return [sum(inp[i] for inp in inputs) for i in range(len(inputs[0]))]

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
        return self.activation.activate(input_data)

    def backward(self, output_error, regularization_lambda=0.0):
        act_grad = self.activation.derivative(None)
        if isinstance(act_grad, list) and isinstance(act_grad[0], list):
            n = len(output_error)
            return [sum(output_error[i] * act_grad[i][j] for i in range(n)) for j in range(n)]
        else:
            return [e * (act_grad[j] if isinstance(act_grad, list) else act_grad) for j, e in enumerate(output_error)]

    def summary(self):
        print(f"ActivationLayer | act: {self.activation.__class__.__name__}")

