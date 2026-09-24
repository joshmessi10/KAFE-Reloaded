"""Separate activation layers for use in Sequential/Functional.

These layers wrap existing activation functions
so they can be used as separate layers in a graph:

    Sequential([Dense(128), ReLU(), Dense(10), Softmax()])

The difference with the integrated activation in Dense is that here the
activation occupies its own node in the graph, allowing architectures
where the same activation block is shared or connected
nonlinearly (e.g., with skip connections in the Functional API).
"""
from lib.KafeGESHA.activations.relu import ReLU as _ReLU
from lib.KafeGESHA.activations.sigmoid import SigmoidActivation as _SigmoidActivation
from lib.KafeGESHA.activations.softmax import Softmax as _Softmax
from lib.KafeGESHA.activations.step import IdentityActivation as _IdentityActivation
from lib.KafeGESHA.activations.tanh import Tanh as _Tanh
from lib.KafeGESHA.layers.layer import Layer


class ActivationLayer(Layer):
    """Base layer for element-wise activations used as independent layers.

    Applies an activation function to each element of the input vector.
    The backward propagates the gradient through the derivative of the activation.

    Args:
        activation_fn: ActivationFunction instance.
    """

    def __init__(self, activation_fn):
        super().__init__()
        self._fn = activation_fn
        self._last_input = None

    def forward(self, x):
        """Forward Propagation: Applies element-wise activation."""
        self._last_input = x[:]
        return [self._fn.activate(v) for v in x]

    def backward(self, output_error, learning_rate, regularization_lambda=None):
        """Backward propagation: multiply by the derivative of the activation."""
        if not isinstance(output_error, list):
            output_error = [output_error]
        return [
            output_error[i] * self._fn.derivative(self._last_input[i])
            for i in range(len(output_error))
        ]

    def parameters(self):
        return []


class SoftmaxLayer(Layer):
    """Softmax layer as independent layer.

    Softmax operates on the entire vector (not element-wise), so
    requires a separate implementation of backward.

    In combination with Categorical Cross-Entropy, the simplified gradient
    is (y_pred - y_true), which is already pre-calculated from the loss. Therefore,
    the backward of SoftmaxLayer passes the gradient without modification when
    comes from CCE (safe pass-through for the softmax+CCE pair).
    """

    def __init__(self):
        super().__init__()
        self._fn = _Softmax()
        self._last_output = None

    def forward(self, x):
        """Forward propagation: softmax over the full vector."""
        result = self._fn.activate(x)
        self._last_output = result[:]
        return result

    def backward(self, output_error, learning_rate, regularization_lambda=None):
        """Backward propagation.

        When combined with CCE, the gradient already incorporates simplification
        (∂CCE/∂softmax)(∂softmax/∂z) = y_pred - y_true. The gradient is
        passes directly without further modification.
        """
        if not isinstance(output_error, list):
            output_error = [output_error]
        return output_error[:]

    def parameters(self):
        return []

    def summary(self):
        print("Softmax()")


class ReLULayer(ActivationLayer):
    """Independent ReLU layer: f(x) = max(0, x)."""

    def __init__(self):
        super().__init__(_ReLU())

    def summary(self):
        print("ReLU()")


class SigmoidLayer(ActivationLayer):
    """Independent Sigmoid layer: f(x) = 1 / (1 + e^-x)."""

    def __init__(self):
        super().__init__(_SigmoidActivation())

    def summary(self):
        print("Sigmoid()")


class TanhLayer(ActivationLayer):
    """Independent Tanh layer: f(x) = tanh(x)."""

    def __init__(self):
        super().__init__(_Tanh())

    def summary(self):
        print("Tanh()")


class LinearLayer(ActivationLayer):
    """Linear activation/identity layer. Pass-through."""

    def __init__(self):
        super().__init__(_IdentityActivation())

    def summary(self):
        print("Linear()")
