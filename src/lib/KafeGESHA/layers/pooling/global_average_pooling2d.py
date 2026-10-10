"""Promedio espacial global por canal."""
from ._global_pooling2d import _GlobalPooling2D

class GlobalAveragePooling2D(_GlobalPooling2D):
    def __init__(self): super().__init__("average")

__all__ = ['GlobalAveragePooling2D']
