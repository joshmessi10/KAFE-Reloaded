"""Dropout elemento a elemento."""
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer

class Dropout(Layer):
    def __init__(self, rate=0.5, seed=None):
        super().__init__()
        if not 0.0 <= rate < 1.0:
            raise ValueError("Dropout rate debe estar entre 0 y 1")
        self.rate = rate
        self.mask = None
        if seed is not None:
            import random as py_random
            py_random.seed(seed)

    def forward(self, input_data):
        if not self._training:
            return input_data[:]
        draws = numk.random_tensor(list(numk.shape(input_data)), 0.0, 1.0)
        self.mask = numk.map_elements(
            lambda value: 0.0 if value < self.rate else 1.0 / (1.0 - self.rate), draws)
        return numk.emul(input_data, self.mask)

    def backward(self, output_error, regularization_lambda=0.0):
        if not self._training or self.mask is None:
            return output_error[:]
        return numk.emul(output_error, self.mask)

    def summary(self):
        print(f"Dropout         | rate: {self.rate}")

__all__ = ['Dropout']
