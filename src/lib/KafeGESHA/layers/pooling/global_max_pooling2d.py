"""Máximo espacial global por canal."""
from ._global_pooling2d import _GlobalPooling2D

class GlobalMaxPooling2D(_GlobalPooling2D):
    def __init__(self): super().__init__("max")

__all__ = ['GlobalMaxPooling2D']
