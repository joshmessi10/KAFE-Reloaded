"""Symbolic nodes for the construction of the computational graph (Functional API).

The graph is constructed at model definition time using the
graph-tracing pattern:

    inputs = Input(shape=(784,))
    x = Dense(128)(inputs) ← calls Layer.__call__, returns a Node
    x = ReLULayer()(x)
    outputs = Dense(10)(x)
    model = Functional(inputs=inputs, outputs=outputs)

Each call to layer(node) creates a new Node that registers:
- The layer that produces it
- Inbound nodes (inbound_nodes)

The Functional model traverses the graph topologically to execute
forward y backward.
"""
from typing import Any


class Node:
    """Node in the computational graph.

    Represents the symbolic output of a layer. Connect layers to each other
    when building the model with the Functional API.

    Attributes:
        layer: The KafeGESHA layer that produces this node.
        inbound_nodes: List of input nodes that feed this layer.
        _output_cache: Output calculated in the last forward pass (for reuse).
    """

    def __init__(self, layer=None, inbound_nodes=None):
        self.layer = layer
        self.inbound_nodes = inbound_nodes or []
        self._output_cache: Any = None

    def clear_cache(self):
        """Clear the forward pass cache (call before each forward)."""
        self._output_cache = None

    def __repr__(self):
        layer_name = self.layer.__class__.__name__ if self.layer else "Input"
        return f"Node(layer={layer_name}, inbound={len(self.inbound_nodes)})"


class InputNode(Node):
    """Entry node of the graph.

    It has no associated layer. Its output is the input data of the model.
    Produced by the Input layer.

    Attributes:
        shape: Expected shape of the input tensor (informational only,
               validation is done by the user before calling fit).
    """

    def __init__(self, shape):
        super().__init__(layer=None, inbound_nodes=[])
        self.shape = shape

    def __repr__(self):
        return f"InputNode(shape={self.shape})"
