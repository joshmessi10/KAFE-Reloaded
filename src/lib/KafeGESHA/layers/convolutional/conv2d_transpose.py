"""Convolución transpuesta 2D."""
from lib.KafeGESHA.core import Parameter
from lib.KafeGESHA.activations import ActivationFunctionLoader
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer

class Conv2DTranspose(Layer):
    """Convolución transpuesta CHW para aumentar resolución."""
    def __init__(self, filters, kernel_size, activation="linear", input_shape=None, stride=1, padding="valid", seed=None):
        super().__init__()
        if type(filters) is not int or filters <= 0: raise ValueError("Conv2DTranspose filters inválido")
        if len(kernel_size) != 2 or any(type(v) is not int or v <= 0 for v in kernel_size): raise ValueError("Conv2DTranspose kernel_size inválido")
        if type(stride) is not int or stride <= 0 or padding not in ("valid", "same"): raise ValueError("Conv2DTranspose stride/padding inválido")
        self.filters, self.kernel_size, self.activation = filters, tuple(kernel_size), ActivationFunctionLoader.get(activation)
        self.stride, self.padding, self.seed = stride, padding, seed
        self.kernels, self.bias, self._input = None, None, None
        if input_shape: self.build(input_shape[0])

    def build(self, channels):
        if self.kernels is None:
            kh, kw = self.kernel_size
            self.kernels = Parameter(numk.random_tensor([channels, self.filters, kh, kw], -.25, .25, self.seed), "conv2dt_k")
            self.bias = Parameter(numk.zeros_nd([self.filters]), "conv2dt_b")

    def forward(self, x):
        if len(numk.shape(x)) != 3: raise ValueError("Conv2DTranspose requiere CHW")
        self.build(len(x)); self._input = numk.tensor(x)
        channels, height, width = numk.shape(x); kh, kw = self.kernel_size
        pad = (kh // 2, kw // 2) if self.padding == "same" else (0, 0)
        oh, ow = (height - 1) * self.stride + kh - 2 * pad[0], (width - 1) * self.stride + kw - 2 * pad[1]
        z = numk.zeros_nd([self.filters, oh, ow])
        for f in range(self.filters):
            for y in range(oh):
                for xx in range(ow): z[f][y][xx] = self.bias.data[f]
        for c in range(channels):
            for y in range(height):
                for xx in range(width):
                    for f in range(self.filters):
                        for ky in range(kh):
                            oy = y * self.stride + ky - pad[0]
                            for kx in range(kw):
                                ox = xx * self.stride + kx - pad[1]
                                if 0 <= oy < oh and 0 <= ox < ow: z[f][oy][ox] += x[c][y][xx] * self.kernels.data[c][f][ky][kx]
        return self.activation.forward(z)

    def backward(self, error, regularization_lambda=0.0):
        dz = self.activation.backward(error); channels, height, width = numk.shape(self._input); kh, kw = self.kernel_size
        dx, dw, db = numk.zeros_nd([channels, height, width]), numk.zeros_nd(list(numk.shape(self.kernels.data))), numk.zeros_nd([self.filters])
        pad = (kh // 2, kw // 2) if self.padding == "same" else (0, 0)
        for f in range(self.filters): db[f] = sum(sum(row) for row in dz[f])
        for c in range(channels):
            for y in range(height):
                for xx in range(width):
                    for f in range(self.filters):
                        for ky in range(kh):
                            oy = y * self.stride + ky - pad[0]
                            for kx in range(kw):
                                ox = xx * self.stride + kx - pad[1]
                                if 0 <= oy < len(dz[f]) and 0 <= ox < len(dz[f][0]):
                                    g = dz[f][oy][ox]; dw[c][f][ky][kx] += self._input[c][y][xx] * g; dx[c][y][xx] += self.kernels.data[c][f][ky][kx] * g
        self.kernels.grad, self.bias.grad = dw, db
        return dx

    def parameters(self): return [self.kernels, self.bias] if self.kernels else []
    def summary(self): print(f"Conv2DTranspose | filters: {self.filters} | kernel: {self.kernel_size}")

__all__ = ['Conv2DTranspose']
