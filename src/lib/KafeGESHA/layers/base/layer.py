"""Contrato abstracto de una capa GESHA."""

from abc import ABC, abstractmethod
from typing import Any

from lib.KafeGESHA.core import Node


class Layer(ABC):
    # Layer subclasses initialize trainable state lazily after the first input.
    kernels: Any
    kernel: Any
    bias: Any
    w: Any
    b: Any
    w_input: Any
    w_recurrent: Any
    wz: Any
    wr: Any
    wh: Any
    gamma: Any
    beta: Any
    embeddings: Any
    _input: Any
    _cache: Any
    _states: Any
    _step_activations: Any
    running_mean: Any
    running_var: Any
    _positions: Any
    mask: Any
    input_shape: Any
    size: Any
    padding: Any
    _last_input: Any
    _indices: Any
    _shape: Any

    def __init__(self):
        self.name = self.__class__.__name__
        self._training = True
        self._last_inputs = None

    def connect(self, inbound_nodes):
        if not isinstance(inbound_nodes, list):
            inbound_nodes = [inbound_nodes]
        return Node(layer=self, inbound_nodes=inbound_nodes)

    __call__ = connect

    @abstractmethod
    def forward(self, input_data):
        pass

    @abstractmethod
    def backward(self, output_error, regularization_lambda=0.0):
        pass

    def parameters(self):
        return []

    def train(self):
        self._training = True

    def eval(self):
        self._training = False


__all__ = ["Layer"]
