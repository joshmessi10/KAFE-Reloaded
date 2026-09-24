"""Dense layer (fully connected)."""
import random
from typing import cast

from global_utils import check_sig
from lib.KafeGESHA.activations.ActivationFunctionLoader import ActivationFunctionLoader
from lib.KafeGESHA.layers.layer import Layer
from lib.KafeGESHA.layers.utils import check_regularization
from TypeUtils import float_type, integer_type, numeric_vector_types, void_t


class Dense(Layer):
    """Fully connected layer (fully-connected).

    Implements the affine transformation: z = Wx + b, followed by a
    optional activation function.

    Args:
        units: Number of output neurons.
        activation: Activation function name (str) or None for linear.
        input_shape: Tuple with the shape of the input (optional, inferred in the first forward).
        regularization_lambda: L2 regularization coefficient.
        seed: Seed for reproducibility of weight initialization.
    """

    def __init__(
        self,
        units,
        activation=None,
        input_shape=None,
        regularization_lambda=0.0,
        seed=None,
    ):
        super().__init__()
        self.units = units
        self.activation_name = activation
        self.activation = ActivationFunctionLoader.get(activation)
        self.input_shape = input_shape

        self._rng = random.Random(seed) if seed is not None else random
        self.seed = seed

        self.weights: list[list[float]] | None = None
        self.bias: list[float] | None = None
        self.last_input: list[int | float] | None = None
        self.last_z: list[float] | None = None

        self.regularization_lambda = check_regularization(regularization_lambda)

    def _random_matrix(self, rows, cols):
        return [[(self._rng.random() - 0.5) for _ in range(cols)] for _ in range(rows)]

    def _zeros_vector(self, n):
        return [0.0 for _ in range(n)]

    @check_sig([2], [integer_type], is_method=True)
    def build(self, input_dim):
        """Initializes weights and biases given the number of inputs."""
        self.weights = self._random_matrix(input_dim, self.units)
        self.bias = self._zeros_vector(self.units)

    @check_sig([2], numeric_vector_types, is_method=True)
    def forward(self, x):
        """Forward propagation: z = Wx + b, output = activation(z)."""
        self.last_input = x[:]
        if self.weights is None:
            self.build(len(x))
        weights = cast(list[list[float]], self.weights)
        bias = cast(list[float], self.bias)

        z = [
            sum(x[i] * weights[i][j] for i in range(len(x))) + bias[j]
            for j in range(self.units)
        ]
        self.last_z = z[:]

        if self.activation_name and self.activation_name.lower() == "softmax":
            return self.activation.activate(z)

        return [self.activation.activate(v) for v in z]

    @check_sig([3, 4], numeric_vector_types + [float_type], [float_type], [float_type, void_t], is_method=True)
    def backward(self, output_error, learning_rate, regularization_lambda=None):
        """Backward propagation with weight update (SGD inline).

        Returns the gradient propagated to the previous layer.
        """
        if not isinstance(output_error, list):
            output_error = [output_error]

        if regularization_lambda is None:
            regularization_lambda = self.regularization_lambda

        if self.activation_name and self.activation_name.lower() == "softmax":
            dL_dz = output_error[:]
        else:
            dL_dz = [
                output_error[j] * self.activation.derivative(cast(list[float], self.last_z)[j])
                for j in range(self.units)
            ]

        input_dim = len(cast(list[int | float], self.last_input))
        last_input = cast(list[int | float], self.last_input)
        weights = cast(list[list[float]], self.weights)
        bias = cast(list[float], self.bias)
        grad_w = [
            [last_input[i] * dL_dz[j] for j in range(self.units)]
            for i in range(input_dim)
        ]
        grad_b = dL_dz[:]

        if regularization_lambda > 0:
            for i in range(input_dim):
                for j in range(self.units):
                    grad_w[i][j] += regularization_lambda * weights[i][j]

        for i in range(input_dim):
            for j in range(self.units):
                weights[i][j] -= learning_rate * grad_w[i][j]
        for j in range(self.units):
            bias[j] -= learning_rate * grad_b[j]

        return [
            sum(weights[i][j] * dL_dz[j] for j in range(self.units))
            for i in range(input_dim)
        ]

    def parameters(self):
        """Returns flat list of all trainable parameters [W, b]."""
        if self.weights is None:
            return []
        params = []
        for row in cast(list[list[float]], self.weights):
            params.extend(row)
        params.extend(cast(list[float], self.bias))
        return params

    def summary(self):
        act = self.activation_name or "linear"
        reg = f"L2={self.regularization_lambda}" if self.regularization_lambda > 0 else "-"
        sd  = f", seed={self.seed}" if self.seed is not None else ""
        print(f"Dense(units={self.units}, act={act}, reg={reg}{sd})")
