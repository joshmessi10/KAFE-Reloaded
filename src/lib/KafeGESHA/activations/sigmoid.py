"""Sigmoid activation function."""
from lib.KafeMATH.functions import exp
from lib.KafeGESHA.activations.activation import ActivationFunction


class SigmoidActivation(ActivationFunction):
    def __init__(self):
        self.last_output = None

    def activate(self, x):
        s = 1.0 / (1.0 + exp(-x))
        self.last_output = s
        return s

    def derivative(self, x):
        if self.last_output is None:
            s = 1.0 / (1.0 + exp(-x))
            return s * (1.0 - s)
        return self.last_output * (1.0 - self.last_output)