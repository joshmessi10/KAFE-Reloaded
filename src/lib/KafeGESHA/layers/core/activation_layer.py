"""Activación como capa explícita."""
from lib.KafeGESHA.activations import ActivationFunctionLoader
from ..base.layer import Layer

class ActivationLayer(Layer):
    def __init__(self, activation):
        super().__init__()
        self.activation = ActivationFunctionLoader.get(activation)

    def forward(self, input_data):
        return self.activation.forward(input_data)

    def backward(self, output_error, regularization_lambda=0.0):
        return self.activation.backward(output_error)

    def summary(self):
        print(f"ActivationLayer | act: {self.activation.__class__.__name__}")

__all__ = ['ActivationLayer']
