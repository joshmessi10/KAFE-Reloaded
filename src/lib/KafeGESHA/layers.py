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


class Conv2D(Layer):
    """Convolución entrenable para una imagen en formato [C,H,W]."""

    def __init__(self, filters, kernel_size, activation="linear", input_shape=None,
                 stride=1, padding="valid", seed=None, name=None):
        super().__init__()
        if type(filters) is not int or filters <= 0:
            raise ValueError("Conv2D requiere filters entero positivo")
        if (not isinstance(kernel_size, (list, tuple)) or len(kernel_size) != 2
                or any(type(v) is not int or v <= 0 for v in kernel_size)):
            raise ValueError("Conv2D kernel_size debe ser [alto, ancho]")
        if type(stride) is not int or stride <= 0:
            raise ValueError("Conv2D stride debe ser entero positivo")
        if padding not in ("valid", "same"):
            raise ValueError("Conv2D padding debe ser valid o same")
        if padding == "same" and any(v % 2 == 0 for v in kernel_size):
            raise ValueError("Conv2D same requiere kernels impares")
        self.filters = filters
        self.kernel_size = tuple(kernel_size)
        self.stride = stride
        self.padding = padding
        self.activation = ActivationFunctionLoader.get(activation)
        self.input_shape = tuple(input_shape) if input_shape else None
        self.seed = seed
        self.name = name or f"Conv2D_{filters}"
        self.kernels = None
        self.bias = None
        self._last_input = None
        if self.input_shape:
            self.build(self.input_shape[0])

    def build(self, channels):
        if type(channels) is not int or channels <= 0:
            raise ValueError("Conv2D requiere canales positivos")
        if self.kernels is not None:
            if len(self.kernels.data[0]) != channels:
                raise ValueError("Conv2D: canales de entrada incompatibles")
            return
        kh, kw = self.kernel_size
        values = numk.random_tensor([self.filters, channels, kh, kw], -0.25, 0.25, self.seed)
        self.kernels = Parameter(values, name=f"{self.name}_kernels")
        self.bias = Parameter(numk.zeros_nd([self.filters]), name=f"{self.name}_bias")

    def forward(self, input_data):
        input_shape = numk.shape(input_data)
        if len(input_shape) != 3 or 0 in input_shape:
            raise ValueError("Conv2D requiere entrada [canales, alto, ancho]")
        self.build(input_shape[0])
        self._last_input = numk.tensor(input_data)
        z = numk.conv2d_chw(self._last_input, self.kernels.data, self.bias.data,
                            self.stride, self.padding)
        return self.activation.forward(z)

    def backward(self, output_error, regularization_lambda=0.0):
        if self._last_input is None:
            raise RuntimeError("Conv2D.backward requiere forward")
        dz = self.activation.backward(output_error)
        dx, dw, db = numk.conv2d_chw_backward(
            self._last_input, self.kernels.data, dz, self.stride, self.padding)
        if regularization_lambda > 0:
            dw = numk.broadcast_add(dw, numk.scalar_mul(regularization_lambda, self.kernels.data))
        self.kernels.grad, self.bias.grad = dw, db
        return dx

    def parameters(self):
        return [self.kernels, self.bias] if self.kernels else []

    def summary(self):
        channels = len(self.kernels.data[0]) if self.kernels else 0
        kh, kw = self.kernel_size
        params = self.filters * channels * kh * kw + self.filters if channels else 0
        print(f"{self.name:15} | filters: {self.filters:<4} | kernel: {kh}x{kw} | params: {params}")


class SimpleRNN(Layer):
    """Capa recurrente Elman con BPTT completo para [T,F]."""

    def __init__(self, units, activation="tanh", input_shape=None,
                 return_sequences=False, seed=None, name=None):
        super().__init__()
        if type(units) is not int or units <= 0:
            raise ValueError("SimpleRNN requiere units entero positivo")
        if type(return_sequences) is not bool:
            raise ValueError("SimpleRNN return_sequences debe ser BOOL")
        self.units = units
        self.activation_name = activation
        ActivationFunctionLoader.get(activation)
        self.input_shape = tuple(input_shape) if input_shape else None
        self.return_sequences = return_sequences
        self.seed = seed
        self.name = name or f"SimpleRNN_{units}"
        self.w_input = None
        self.w_recurrent = None
        self.bias = None
        self._inputs = None
        self._states = None
        self._step_activations = None
        if self.input_shape:
            self.build(self.input_shape[-1])

    def build(self, features):
        if type(features) is not int or features <= 0:
            raise ValueError("SimpleRNN requiere features positivos")
        if self.w_input is not None:
            if len(self.w_input.data) != features:
                raise ValueError("SimpleRNN: features de entrada incompatibles")
            return
        self.w_input = Parameter(
            numk.random_tensor([features, self.units], -0.25, 0.25, self.seed),
            name=f"{self.name}_w_input")
        recurrent_seed = None if self.seed is None else self.seed + 1
        self.w_recurrent = Parameter(
            numk.random_tensor([self.units, self.units], -0.25, 0.25, recurrent_seed),
            name=f"{self.name}_w_recurrent")
        self.bias = Parameter(numk.zeros_nd([self.units]), name=f"{self.name}_bias")

    def forward(self, input_data):
        input_shape = numk.shape(input_data)
        if len(input_shape) != 2 or 0 in input_shape:
            raise ValueError("SimpleRNN requiere entrada [timesteps, features]")
        self.build(input_shape[1])
        self._inputs = numk.tensor(input_data)
        self._states = [numk.zeros_nd([self.units])]
        self._step_activations = []
        for timestep in self._inputs:
            x_part = numk.dot_matrix([timestep], self.w_input.data)[0]
            h_part = numk.dot_matrix([self._states[-1]], self.w_recurrent.data)[0]
            z = numk.broadcast_add(numk.broadcast_add(x_part, h_part), self.bias.data)
            activation = ActivationFunctionLoader.get(self.activation_name)
            state = activation.forward(z)
            self._step_activations.append(activation)
            self._states.append(state)
        return self._states[1:] if self.return_sequences else self._states[-1]

    def backward(self, output_error, regularization_lambda=0.0):
        if self._inputs is None:
            raise RuntimeError("SimpleRNN.backward requiere forward")
        timesteps = len(self._inputs)
        external = output_error if self.return_sequences else [numk.zeros_nd([self.units]) for _ in range(timesteps)]
        if self.return_sequences and numk.shape(external) != (timesteps, self.units):
            raise ValueError("SimpleRNN: gradiente de secuencia incompatible")
        if not self.return_sequences:
            if numk.shape(output_error) != (self.units,):
                raise ValueError("SimpleRNN: gradiente incompatible")
            external[-1] = output_error
        dw_input = numk.zeros_nd(list(numk.shape(self.w_input.data)))
        dw_recurrent = numk.zeros_nd(list(numk.shape(self.w_recurrent.data)))
        db = numk.zeros_nd([self.units])
        dx = numk.zeros_nd(list(numk.shape(self._inputs)))
        dh_next = numk.zeros_nd([self.units])
        for t in range(timesteps - 1, -1, -1):
            dh = numk.broadcast_add(external[t], dh_next)
            dz = self._step_activations[t].backward(dh)
            x_outer = numk.dot_matrix(numk.transpose([self._inputs[t]]), [dz])
            h_outer = numk.dot_matrix(numk.transpose([self._states[t]]), [dz])
            dw_input = numk.broadcast_add(dw_input, x_outer)
            dw_recurrent = numk.broadcast_add(dw_recurrent, h_outer)
            db = numk.broadcast_add(db, dz)
            dx[t] = numk.dot_matrix([dz], numk.transpose(self.w_input.data))[0]
            dh_next = numk.dot_matrix([dz], numk.transpose(self.w_recurrent.data))[0]
        if regularization_lambda > 0:
            dw_input = numk.broadcast_add(dw_input, numk.scalar_mul(regularization_lambda, self.w_input.data))
            dw_recurrent = numk.broadcast_add(dw_recurrent, numk.scalar_mul(regularization_lambda, self.w_recurrent.data))
        self.w_input.grad = dw_input
        self.w_recurrent.grad = dw_recurrent
        self.bias.grad = db
        return dx

    def parameters(self):
        return [self.w_input, self.w_recurrent, self.bias] if self.w_input else []

    def summary(self):
        features = len(self.w_input.data) if self.w_input else 0
        params = features * self.units + self.units * self.units + self.units if features else 0
        print(f"{self.name:15} | units: {self.units:<5} | params: {params:<6} | sequences: {self.return_sequences}")


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
