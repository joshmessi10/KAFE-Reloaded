"""Función de activación Tangente Hiperbólica."""
from lib.KafeMATH.funciones import exp
from lib.KafeGESHA.activations.activation import ActivationFunction


class Tanh(ActivationFunction):
    def __init__(self):
        self.last_output = None

    def activate(self, x):
        e_pos = exp(x)
        e_neg = exp(-x)
        t = (e_pos - e_neg) / (e_pos + e_neg)
        self.last_output = t
        return t

    def derivative(self, x):
        if self.last_output is None:
            t = self.activate(x)
            return 1.0 - t * t
        return 1.0 - self.last_output * self.last_output