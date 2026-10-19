"""Average pooling espacial."""
from ._pooling2d import _Pooling2D

class AveragePooling2D(_Pooling2D):
    def __init__(self, pool_size=(2, 2), stride=None): super().__init__(pool_size, stride, "average")

__all__ = ['AveragePooling2D']
