"""Symbolic input layer for the Functional API.

Input is not a transformation layer; It is a symbolic starting point
which defines the expected shape of the input data. Produces an InputNode
that the Functional model uses to start the graph path.

Uso:

    inputs = Input(shape=(784,))
    x = Dense(128)(inputs)      # Dense.__call__(inputs) → Node
    x = ReLULayer()(x)
    outputs = Dense(10)(x)
    model = Functional(inputs=inputs, outputs=outputs)
"""
from lib.KafeGESHA.core.node import InputNode


class Input:
    """Input symbolic tensor for the Functional API.

    It does not inherit from Layer because it does not transform data; It's just a marker
    start of the graph.

    Args:
        shape: Tuple with the shape of the input (e.g., (784,) or (28, 28)).
               Informational only — training receives the data already prepared.

    Attributes:
        shape: Entry form.
        node: Symbolic InputNode that represents this tensor in the graph.

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
