"""Adaptive Moment Estimation."""
from lib.KafeMATH.funciones import sqrt
from lib.KafeNUMK import funciones as numk
from .base import Optimizer


class Adam(Optimizer):
    def __init__(self, lr=0.001, beta1=0.9, beta2=0.999, epsilon=1e-8):
        self.lr = lr
        self.beta1 = beta1
        self.beta2 = beta2
        self.epsilon = epsilon
        self.m = {}
        self.v = {}
        self.t = 0

    def step(self, parameters):
        self.t += 1
        for parameter in parameters:
            if parameter.grad is None:
                continue
            identity = id(parameter)
            if identity not in self.m:
                shape = list(numk.shape(parameter.grad))
                self.m[identity] = numk.zeros_nd(shape)
                self.v[identity] = numk.zeros_nd(shape)
            self.m[identity] = numk.map_elements(
                lambda moment, gradient: self.beta1 * moment + (1 - self.beta1) * gradient,
                self.m[identity],
                parameter.grad,
            )
            self.v[identity] = numk.map_elements(
                lambda moment, gradient: self.beta2 * moment + (1 - self.beta2) * gradient ** 2,
                self.v[identity],
                parameter.grad,
            )

            def update(value, first_moment, second_moment):
                corrected_m = first_moment / (1 - self.beta1 ** self.t)
                corrected_v = second_moment / (1 - self.beta2 ** self.t)
                return value - self.lr * corrected_m / (sqrt(corrected_v) + self.epsilon)

            parameter.data = numk.map_elements(
                update,
                parameter.data,
                self.m[identity],
                self.v[identity],
            )
