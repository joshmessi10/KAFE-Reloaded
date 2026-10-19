"""Convolución 1D para señales."""
from lib.KafeGESHA.core import Parameter
from lib.KafeGESHA.activations import ActivationFunctionLoader
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer

class Conv1D(Layer):
    """Convolución temporal para entradas [canales, longitud]."""
    def __init__(self, filters, kernel_size, activation="linear", input_shape=None,
                 stride=1, padding="valid", seed=None):
        super().__init__()
        if type(filters) is not int or filters <= 0 or type(kernel_size) is not int or kernel_size <= 0:
            raise ValueError("Conv1D requiere filters y kernel_size positivos")
        if type(stride) is not int or stride <= 0 or padding not in ("valid", "same"):
            raise ValueError("Conv1D requiere stride positivo y padding valid/same")
        if padding == "same" and kernel_size % 2 == 0:
            raise ValueError("Conv1D same requiere kernel impar")
        self.filters, self.kernel_size, self.stride, self.padding = filters, kernel_size, stride, padding
        self.activation = ActivationFunctionLoader.get(activation)
        self.seed, self.kernels, self.bias, self._input = seed, None, None, None
        if input_shape: self.build(input_shape[0])

    def build(self, channels):
        if self.kernels is None:
            self.kernels = Parameter(numk.random_tensor([self.filters, channels, self.kernel_size], -.25, .25, self.seed), "conv1d_k")
            self.bias = Parameter(numk.zeros_nd([self.filters]), "conv1d_b")

    def forward(self, x):
        if len(numk.shape(x)) != 2: raise ValueError("Conv1D requiere [canales, longitud]")
        self.build(len(x)); self._input = numk.tensor(x)
        pad = self.kernel_size // 2 if self.padding == "same" else 0
        out_l = (len(x[0]) + 2 * pad - self.kernel_size) // self.stride + 1
        z = numk.zeros_nd([self.filters, out_l])
        for f in range(self.filters):
            for o in range(out_l):
                value = self.bias.data[f]
                for c in range(len(x)):
                    for k in range(self.kernel_size):
                        i = o * self.stride + k - pad
                        if 0 <= i < len(x[c]): value += x[c][i] * self.kernels.data[f][c][k]
                z[f][o] = value
        return self.activation.forward(z)

    def backward(self, error, regularization_lambda=0.0):
        dz = self.activation.backward(error); channels, length = numk.shape(self._input)
        dx, dw, db = numk.zeros_nd([channels, length]), numk.zeros_nd(list(numk.shape(self.kernels.data))), numk.zeros_nd([self.filters])
        pad = self.kernel_size // 2 if self.padding == "same" else 0
        for f in range(self.filters):
            for o in range(len(dz[f])):
                db[f] += dz[f][o]
                for c in range(channels):
                    for k in range(self.kernel_size):
                        i = o * self.stride + k - pad
                        if 0 <= i < length:
                            dw[f][c][k] += self._input[c][i] * dz[f][o]
                            dx[c][i] += self.kernels.data[f][c][k] * dz[f][o]
        self.kernels.grad, self.bias.grad = dw, db
        return dx

    def parameters(self): return [self.kernels, self.bias] if self.kernels else []
    def summary(self): print(f"Conv1D          | filters: {self.filters} | kernel: {self.kernel_size}")

__all__ = ['Conv1D']
