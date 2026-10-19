"""Descenso de gradiente estocástico."""
from lib.KafeNUMK import funciones as numk
from .base import Optimizer


class SGD(Optimizer):
    def __init__(self, lr=0.01):
        self.lr = lr

    def step(self, parameters):
        for parameter in parameters:
            if parameter.grad is None:
                continue
            parameter.data = numk.map_elements(
                lambda value, gradient: value - self.lr * gradient,
                parameter.data,
                parameter.grad,
            )
