"""Estado compartido de GESHA: parámetros entrenables y nodos del grafo.

Los datos son listas numéricas de NUMK. Este módulo no realiza aritmética.
"""


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
