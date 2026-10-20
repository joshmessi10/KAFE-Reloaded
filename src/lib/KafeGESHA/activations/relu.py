"""ReLU activation function."""
from lib.KafeGESHA.activations.activation import ActivationFunction


class ReLU(ActivationFunction):
    def __init__(self):
        self.last_input = None

    def activate(self, x):
        self.last_input = x
        return x if x > 0 else 0

    def derivative(self, x):
        inp = self.last_input if self.last_input is not None else x
        return 1 if inp > 0 else 0