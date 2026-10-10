"""Capa de entrada simbólica."""
from .layer import Layer

class Input(Layer):
    def __init__(self, shape):
        super().__init__()
        self.shape = shape
        self.layer = None
        self.inbound_nodes = []
        self._output_cache = None
    def clear_cache(self): self._output_cache = None
    def forward(self, input_data): return input_data
    def backward(self, output_error, regularization_lambda=0.0): return output_error
    def summary(self): print(f"Input(shape={self.shape})")

__all__ = ['Input']
