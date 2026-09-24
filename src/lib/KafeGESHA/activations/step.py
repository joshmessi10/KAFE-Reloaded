"""Identity and Tiered activation functions."""
from lib.KafeGESHA.activations.activation import ActivationFunction


class IdentityActivation(ActivationFunction):
    def activate(self, x):
        return x

    def derivative(self, x):
        return 1.0


class StepActivation(ActivationFunction):
    def activate(self, x):
        return 1 if x >= 0 else 0

    def derivative(self, x):
        return 0.0