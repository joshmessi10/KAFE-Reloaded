"""Convolución 2D channels-first."""
from lib.KafeGESHA.core import Parameter
from lib.KafeGESHA.activations import ActivationFunctionLoader
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer
from lib.KafeGESHA.initializers import get as get_initializer, RandomUniform
from lib.KafeGESHA.regularizers import get as get_regularizer

class Conv2D(Layer):
    """Convolución entrenable para una imagen en formato [C,H,W]."""

    def __init__(self, filters, kernel_size, activation="linear", input_shape=None,
                 stride=1, padding="valid", seed=None, name=None,
                 kernel_initializer=None, bias_initializer="zeros", kernel_regularizer=None):
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
        self.kernel_initializer = (RandomUniform(-0.25, 0.25, seed) if kernel_initializer is None
                                   else get_initializer(kernel_initializer, seed))
        self.bias_initializer = get_initializer(bias_initializer, seed)
        self.kernel_regularizer = get_regularizer(kernel_regularizer)
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
        values = self.kernel_initializer([self.filters, channels, kh, kw])
        self.kernels = Parameter(values, name=f"{self.name}_kernels", regularizer=self.kernel_regularizer)
        self.bias = Parameter(self.bias_initializer([self.filters]), name=f"{self.name}_bias")

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

__all__ = ['Conv2D']
