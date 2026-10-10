"""Max pooling temporal."""
from ..base.layer import Layer
from .max_pooling2d import MaxPooling2D

class MaxPooling1D(Layer):
    def __init__(self, pool_size=2, stride=None): super().__init__(); self.inner = MaxPooling2D((1, pool_size), stride or pool_size)
    def forward(self, x): return [channel[0] for channel in self.inner.forward([[channel] for channel in x])]
    def backward(self, e, regularization_lambda=0.0): return [channel[0] for channel in self.inner.backward([[channel] for channel in e])]
    def summary(self): print("MaxPooling1D")

__all__ = ['MaxPooling1D']
