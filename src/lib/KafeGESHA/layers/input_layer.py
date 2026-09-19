"""Capa de entrada simbólica para la API Functional.

Input no es una capa de transformación; es un punto de partida simbólico
que define la forma esperada de los datos de entrada. Produce un InputNode
que el modelo Functional usa para arrancar el recorrido del grafo.

Uso:

    inputs = Input(shape=(784,))
    x = Dense(128)(inputs)      # Dense.__call__(inputs) → Node
    x = ReLULayer()(x)
    outputs = Dense(10)(x)
    model = Functional(inputs=inputs, outputs=outputs)
"""
from lib.KafeGESHA.core.node import InputNode


class Input:
    """Tensor simbólico de entrada para la API Functional.

    No hereda de Layer porque no transforma datos; es solo un marcador
    de inicio del grafo.

    Args:
        shape: Tupla con la forma de la entrada (e.g., (784,) o (28, 28)).
               Solo informativa — el entrenamiento recibe los datos ya preparados.

    Attributes:
        shape: Forma de entrada.
        node: InputNode simbólico que representa este tensor en el grafo.

    Uso:
        inputs = Input(shape=(784,))
        x = Dense(128)(inputs)   # Dense.__call__ acepta Input o Node
    """

    def __init__(self, shape):
        if isinstance(shape, int):
            shape = (shape,)
        self.shape = tuple(shape)
        self.node = InputNode(shape=self.shape)

    def __repr__(self):
        return f"Input(shape={self.shape})"
