"""Convolución espacial independiente por canal."""
from lib.KafeGESHA.core import Parameter
from lib.KafeGESHA.activations import ActivationFunctionLoader
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer

class DepthwiseConv2D(Layer):
    """Un kernel espacial independiente por canal y multiplicador."""
    def __init__(self, kernel_size, depth_multiplier=1, activation="linear", input_shape=None,
                 stride=1, padding="valid", seed=None):
        super().__init__()
        if len(kernel_size) != 2 or any(type(v) is not int or v <= 0 for v in kernel_size): raise ValueError("DepthwiseConv2D kernel inválido")
        if type(depth_multiplier) is not int or depth_multiplier <= 0: raise ValueError("depth_multiplier debe ser positivo")
        if type(stride) is not int or stride <= 0 or padding not in ("valid", "same"): raise ValueError("DepthwiseConv2D stride/padding inválido")
        if padding == "same" and any(v % 2 == 0 for v in kernel_size): raise ValueError("DepthwiseConv2D same requiere kernel impar")
        self.kernel_size, self.depth_multiplier = tuple(kernel_size), depth_multiplier
        self.activation, self.stride, self.padding = ActivationFunctionLoader.get(activation), stride, padding
        self.seed, self.kernels, self.bias, self._input = seed, None, None, None
        if input_shape: self.build(input_shape[0])

    def build(self, channels):
        if self.kernels is None:
            kh, kw = self.kernel_size
            self.kernels = Parameter(numk.random_tensor([channels, self.depth_multiplier, kh, kw], -.25, .25, self.seed), "depthwise_k")
            self.bias = Parameter(numk.zeros_nd([channels * self.depth_multiplier]), "depthwise_b")

    def _expanded_kernels(self):
        result = []
        channels = len(self.kernels.data)
        kh, kw = self.kernel_size
        for c in range(channels):
            for m in range(self.depth_multiplier):
                per_channel = numk.zeros_nd([channels, kh, kw])
                per_channel[c] = self.kernels.data[c][m]
                result.append(per_channel)
        return result

    def forward(self, x):
        if len(numk.shape(x)) != 3: raise ValueError("DepthwiseConv2D requiere CHW")
        self.build(len(x)); self._input = numk.tensor(x)
        z = numk.conv2d_chw(x, self._expanded_kernels(), self.bias.data, self.stride, self.padding)
        return self.activation.forward(z)

    def backward(self, error, regularization_lambda=0.0):
        dz = self.activation.backward(error)
        dx, expanded_dw, db = numk.conv2d_chw_backward(self._input, self._expanded_kernels(), dz, self.stride, self.padding)
        dw = numk.zeros_nd(list(numk.shape(self.kernels.data)))
        index = 0
        for c in range(len(dw)):
            for m in range(self.depth_multiplier):
                dw[c][m] = expanded_dw[index][c]; index += 1
        self.kernels.grad, self.bias.grad = dw, db
        return dx

    def parameters(self): return [self.kernels, self.bias] if self.kernels else []
    def summary(self): print(f"DepthwiseConv2D | multiplier: {self.depth_multiplier} | kernel: {self.kernel_size}")

__all__ = ['DepthwiseConv2D']
