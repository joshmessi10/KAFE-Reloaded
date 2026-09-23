"""Sequential model — linear graph of layers.

A Sequential model represents a stack of layers where the output
From each layer is the input to the following:

    Input → Layer 1 → Layer 2 → ... → Layer N → Output

Usage:

    model = Sequential([
        Dense(128, activation="relu"),
        Dense(64, activation="relu"),
        Dense(10, activation="softmax")
    ])
    model.compile("adam", "categorical_crossentropy", ["accuracy"])
    model.fit(X_train, y_train, epochs=10, batch_size=32)

You can also build layer by layer:

    model = Sequential()
    model.add(Dense(128, activation="relu"))
    model.add(Dense(10, activation="softmax"))

Or with separate activation layers (useful for visualizing the graph):

    model = Sequential([
        Dense(128),
        ReLULayer(),
        Dense(10),
        SoftmaxLayer()
    ])
"""
from lib.KafeGESHA.core.model import Model
from global_utils import check_sig
from TypeUtils import gesha_type


class Sequential(Model):
    """Linear graph model.

    Implements forward as a direct path of the layers and backward
    as a reverse route.

    Attributes:
        layers: List of layers in order of execution.
    """

    def __init__(self, layers=None):
        """Initializes the Sequential model.

        Args:
            layers: Initial list of layers (optional). can be added
                    more layers with add().
        """
        super().__init__()
        self.layers = []
        if layers:
            for layer in layers:
                self.add(layer)

    @check_sig([2], [gesha_type], is_method=True)
    def add(self, layer):
        """Adds a layer to the end of the linear graph.

        If the layer has empty input_shape and there are already layers in the model,
        infers the input_shape from the previous layer (if it has .units).

        Args:
            layer: Layer instance.

        Returns:
            self (for fluent chaining: model.add(l1).add(l2)).
        """
        if self.layers and hasattr(layer, "input_shape") and not layer.input_shape:
            prev = self.layers[-1]
            if hasattr(prev, "units"):
                layer.input_shape = (prev.units,)
        self.layers.append(layer)
        return self

    # ------------------------------------------------------------------
    # Interfaz abstracta Model
    # ------------------------------------------------------------------

    def forward(self, x):
        """Forward Propagation: Loop through all layers in order."""
        out = x
        for layer in self.layers:
            out = layer.forward(out)
        return out

    def backward(self, grad):
        """Backward Propagation: Traverses the layers in reverse order.

        Apply the backward of each layer passing learning_rate of the optimizer.
        """
        if not isinstance(grad, list):
            grad = [grad]
        for layer in reversed(self.layers):
            grad = layer.backward(grad, learning_rate=self._optimizer_obj.lr)
        return grad

    def parameters(self):
        """Returns a flat list of all trainable parameters."""
        params = []
        for layer in self.layers:
            params.extend(layer.parameters())
        return params

    def get_layers(self):
        """Returns the list of layers in execution order."""
        return self.layers

    # ------------------------------------------------------------------
    # summary
    # ------------------------------------------------------------------

    def summary(self):
        """Prints a summary of the Sequential architecture."""
        print("=== Sequential ===")
        for i, layer in enumerate(self.layers, 1):
            print(f"  [{i}] ", end="")
            layer.summary()
        total = len(self.parameters())
        print(f"  Total parameters: {total}")
        print("==================")

    def __repr__(self):
        names = [layer.__class__.__name__ for layer in self.layers]
        return f"Sequential(layers={names})"