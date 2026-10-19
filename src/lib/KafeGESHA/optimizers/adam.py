"""Adaptive Moment Estimation."""
from lib.KafeMATH.funciones import sqrt
from lib.KafeNUMK import funciones as numk
from .base import Optimizer


def _adam_update(data, moments, variances, gradient, lr, beta1, beta2, bias_correction_m, bias_correction_v, epsilon):
    """Una sola pasada recursiva: actualiza m, v y los parámetros in-place."""
    for indice in range(len(data)):
        valor = data[indice]
        if isinstance(valor, list):
            _adam_update(valor, moments[indice], variances[indice], gradient[indice], lr, beta1, beta2, bias_correction_m, bias_correction_v, epsilon)
        else:
            grad = gradient[indice]
            momento = beta1 * moments[indice] + (1.0 - beta1) * grad
            varianza = beta2 * variances[indice] + (1.0 - beta2) * grad ** 2
            moments[indice] = momento
            variances[indice] = varianza
            data[indice] = valor - lr * (momento / bias_correction_m) / (sqrt(varianza / bias_correction_v) + epsilon)


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
        bias_correction_m = 1.0 - self.beta1 ** self.t
        bias_correction_v = 1.0 - self.beta2 ** self.t
        for parameter in parameters:
            if parameter.grad is None:
                continue
            identity = id(parameter)
            if identity not in self.m:
                shape = list(numk.shape(parameter.grad))
                self.m[identity] = numk.zeros_nd(shape)
                self.v[identity] = numk.zeros_nd(shape)
            _adam_update(
                parameter.data,
                self.m[identity],
                self.v[identity],
                parameter.grad,
                self.lr,
                self.beta1,
                self.beta2,
                bias_correction_m,
                bias_correction_v,
                self.epsilon,
            )
