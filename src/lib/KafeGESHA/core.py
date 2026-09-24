"""Componentes core para KafeGESHA: Tensor, Parameter y Node."""
from lib.KafeNUMK import funciones as numk


class Tensor:
    """Tensor N-dimensional para Deep Learning (wrapper de listas)."""
    
    def __init__(self, data):
        self.data = data
        self.shape = numk.shape(data)
        self._validate_regular()

    def _validate_regular(self):
        self._validate_recursive(self.data, self.shape, 0)

    def _validate_recursive(self, data, expected_shape, depth):
        if depth == len(expected_shape) - 1:
            if len(data) != expected_shape[depth]:
                raise ValueError(f"Tensor irregular en dim {depth}")
        else:
            if len(data) != expected_shape[depth]:
                raise ValueError(f"Tensor irregular en dim {depth}")
            for sublist in data:
                if not isinstance(sublist, list):
                    raise ValueError(f"Se esperaba sublista en dim {depth}")
                self._validate_recursive(sublist, expected_shape, depth + 1)

    @property
    def ndim(self): return len(self.shape)
    def __len__(self): return len(self.data)
    def __getitem__(self, idx): return self.data[idx]
    def __setitem__(self, idx, value): self.data[idx] = value
    def __repr__(self): return f"Tensor(shape={self.shape})"


def tensor_zeros(shape): return Tensor(numk.zeros_nd(shape))
def tensor_ones(shape): return Tensor(numk.ones(shape))
def tensor_random(shape, low=-0.5, high=0.5): return Tensor(numk.random_tensor(shape, low, high))


class Parameter:
    """Parámetro entrenable (pesos o sesgo). Almacena datos y gradientes."""
    
    def __init__(self, data, name=None):
        self.data = data
        self.grad = None
        self.name = name

    def __repr__(self):
        return f"Parameter(name={self.name})"


class Node:
    """Nodo en el grafo computacional de la API Functional."""
    
    def __init__(self, layer=None, inbound_nodes=None):
        self.layer = layer
        self.inbound_nodes = inbound_nodes or []
        self._output_cache = None

    def clear_cache(self):
        self._output_cache = None

    def __repr__(self):
        lname = self.layer.__class__.__name__ if self.layer else "Input"
        return f"Node(layer={lname}, inbound={len(self.inbound_nodes)})"


class InputNode(Node):
    """Nodo de entrada del grafo."""
    
    def __init__(self, shape):
        super().__init__(layer=None, inbound_nodes=[])
        self.shape = shape

    def __repr__(self):
        return f"InputNode(shape={self.shape})"
