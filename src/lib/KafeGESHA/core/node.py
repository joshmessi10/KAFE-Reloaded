"""Nodos simbólicos para la construcción del grafo computacional (API Functional).

El grafo se construye en tiempo de definición del modelo mediante el
patrón de graph-tracing:

    inputs = Input(shape=(784,))
    x = Dense(128)(inputs)   ← llama a Layer.__call__, retorna un Node
    x = ReLULayer()(x)
    outputs = Dense(10)(x)
    model = Functional(inputs=inputs, outputs=outputs)

Cada llamada a layer(node) crea un nuevo Node que registra:
- La capa que lo produce
- Los nodos de entrada (inbound_nodes)

El modelo Functional recorre el grafo topológicamente para ejecutar
forward y backward.
"""


class Node:
    """Nodo en el grafo computacional.

    Representa la salida simbólica de una capa. Conecta capas entre sí
    al construir el modelo con la API Functional.

    Attributes:
        layer: La capa de KafeGESHA que produce este nodo.
        inbound_nodes: Lista de nodos de entrada que alimentan esta capa.
        _output_cache: Salida calculada en el último forward pass (para reutilización).
    """

    def __init__(self, layer=None, inbound_nodes=None):
        self.layer = layer
        self.inbound_nodes = inbound_nodes or []
        self._output_cache = None

    def clear_cache(self):
        """Limpia la caché de forward pass (llamar antes de cada forward)."""
        self._output_cache = None

    def __repr__(self):
        layer_name = self.layer.__class__.__name__ if self.layer else "Input"
        return f"Node(layer={layer_name}, inbound={len(self.inbound_nodes)})"


class InputNode(Node):
    """Nodo de entrada del grafo.

    No tiene capa asociada. Su salida es el dato de entrada del modelo.
    Producido por la capa Input.

    Attributes:
        shape: Forma esperada del tensor de entrada (solo informativa,
               la validación la hace el usuario antes de llamar a fit).
    """

    def __init__(self, shape):
        super().__init__(layer=None, inbound_nodes=[])
        self.shape = shape

    def __repr__(self):
        return f"InputNode(shape={self.shape})"
