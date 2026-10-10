"""Max pooling espacial."""
from ._pooling2d import _Pooling2D

class MaxPooling2D(_Pooling2D):
    def __init__(self, pool_size=(2, 2), stride=None): super().__init__(pool_size, stride, "max")

__all__ = ['MaxPooling2D']
