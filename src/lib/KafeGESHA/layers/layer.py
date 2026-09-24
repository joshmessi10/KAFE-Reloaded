"""Abstract base class for neural network layers."""
from abc import ABC, abstractmethod

from global_utils import check_sig
from TypeUtils import float_type, numeric_vector_types, void_t


class Layer(ABC):
    """Base class for all KafeGESHA layers.

    Public contract:
    - forward(x) → forward propagation
    - backward(error, learning_rate) → backward propagation
    - parameters() → list of trainable parameters (empty by default)
    - train() / eval() → training / evaluation mode
    - __call__(input_node) → graph-building for the Functional API
    """

    def __init__(self):
        self._training = True
        self.name = None

    @abstractmethod
    @check_sig([2], numeric_vector_types, is_method=True)
    def forward(self, x):
        """Forward propagation."""
        pass

    @abstractmethod
    @check_sig([3, 4], numeric_vector_types + [float_type], [float_type], [float_type, void_t], is_method=True)
    def backward(self, output_error, learning_rate, regularization_lambda=None):
        """Backward propagation."""
        pass

    def parameters(self):
        """Returns a flat list of trainable parameters. Sublayers with weights must override this method."""
        return []

    def train(self):
        """Activate training mode."""
        self._training = True

    def eval(self):
        """Activates evaluation (inference) mode."""
        self._training = False

    def connect(self, input_node):
        """Connect this layer to a symbolic node for the Functional API.

        Note: DO NOT use __call__ here to avoid conflict with the system
        KAFE types (callable(layer) would return True, classifying the layer
        as FUNC instead of GESHA).

        Args:
            input_node: Input, Node or list of Nodes.

        Returns:
            Output symbolic node with this layer registered.
        """
        from lib.KafeGESHA.core.node import Node
        inbound = input_node if isinstance(input_node, list) else [input_node]
        output_node = Node(layer=self, inbound_nodes=inbound)
        self._output_node = output_node
        return output_node

    def summary(self):
        """Print layer information."""
        print(f"{self.__class__.__name__}")