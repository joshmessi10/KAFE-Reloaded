"""Suma de ramas Functional."""
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer

class Add(Layer):
    def __init__(self):
        super().__init__()
        self._last_inputs = None

    def forward(self, inputs):
        if not inputs:
            raise ValueError("Add requiere al menos una entrada")
        self._last_inputs = inputs
        return numk.sum_axis(inputs, 0)

    def backward(self, output_error, regularization_lambda=0.0):
        n = len(self._last_inputs) if self._last_inputs else 1
        return [output_error[:] for _ in range(n)]

    def summary(self):
        print("Add             |")

__all__ = ['Add']
