"""RMSprop con promedio móvil del gradiente cuadrático."""
from lib.KafeMATH.funciones import sqrt
from lib.KafeNUMK import funciones as numk
from .base import Optimizer


class RMSprop(Optimizer):
    def __init__(self, lr=0.001, rho=0.9, epsilon=1e-8):
        self.lr = lr
        self.rho = rho
        self.epsilon = epsilon
        self.cache = {}

    def step(self, parameters):
        for parameter in parameters:
            if parameter.grad is None:
                continue
            identity = id(parameter)
            if identity not in self.cache:
                self.cache[identity] = numk.zeros_nd(list(numk.shape(parameter.grad)))
            self.cache[identity] = numk.map_elements(
                lambda average, gradient: self.rho * average + (1 - self.rho) * gradient ** 2,
                self.cache[identity],
                parameter.grad,
            )
            parameter.data = numk.map_elements(
                lambda value, gradient, average: value - self.lr * gradient / (sqrt(average) + self.epsilon),
                parameter.data,
                parameter.grad,
                self.cache[identity],
            )
