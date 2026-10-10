"""Aplanamiento de listas NUMK."""
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer

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

__all__ = ['Flatten']
