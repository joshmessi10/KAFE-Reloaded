"""Capa Dense (totalmente conectada)."""
import random
from lib.KafeGESHA.layers.layer import Layer
from lib.KafeGESHA.layers.utils import check_regularization
from lib.KafeGESHA.activations.ActivationFunctionLoader import ActivationFunctionLoader
from global_utils import check_sig
from TypeUtils import entero_t, vector_numeros_t, flotante_t, void_t


class Dense(Layer):
    """Capa totalmente conectada (fully-connected).

    Implementa la transformación afín: z = Wx + b, seguida de una
    función de activación opcional.

    Args:
        units: Número de neuronas de salida.
        activation: Nombre de la función de activación (str) o None para lineal.
        input_shape: Tupla con la forma de la entrada (opcional, se infiere en el primer forward).
        regularization_lambda: Coeficiente de regularización L2.
        seed: Semilla para reproducibilidad de la inicialización de pesos.
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

        self.weights = None
        self.bias = None
        self.last_input = None
        self.last_z = None

        self.regularization_lambda = check_regularization(regularization_lambda)

    def _random_matrix(self, rows, cols):
        return [[(self._rng.random() - 0.5) for _ in range(cols)] for _ in range(rows)]

    def _zeros_vector(self, n):
        return [0.0 for _ in range(n)]

    @check_sig([2], [entero_t], is_method=True)
    def build(self, input_dim):
        """Inicializa pesos y sesgos dado el número de entradas."""
        self.weights = self._random_matrix(input_dim, self.units)
        self.bias = self._zeros_vector(self.units)

    @check_sig([2], vector_numeros_t, is_method=True)
    def forward(self, x):
        """Propagación hacia adelante: z = Wx + b, salida = activation(z)."""
        self.last_input = x[:]
        if self.weights is None:
            self.build(len(x))

        z = [
            sum(x[i] * self.weights[i][j] for i in range(len(x))) + self.bias[j]
            for j in range(self.units)
        ]
        self.last_z = z[:]

        if self.activation_name and self.activation_name.lower() == "softmax":
            return self.activation.activate(z)

        return [self.activation.activate(v) for v in z]

    @check_sig([3, 4], vector_numeros_t + [flotante_t], [flotante_t], [flotante_t, void_t], is_method=True)
    def backward(self, output_error, learning_rate, regularization_lambda=None):
        """Propagación hacia atrás con actualización de pesos (SGD inline).

        Devuelve el gradiente propagado hacia la capa anterior.
        """
        if not isinstance(output_error, list):
            output_error = [output_error]

        if regularization_lambda is None:
            regularization_lambda = self.regularization_lambda

        if self.activation_name and self.activation_name.lower() == "softmax":
            dL_dz = output_error[:]
        else:
            dL_dz = [
                output_error[j] * self.activation.derivative(self.last_z[j])
                for j in range(self.units)
            ]

        input_dim = len(self.last_input)
        grad_w = [
            [self.last_input[i] * dL_dz[j] for j in range(self.units)]
            for i in range(input_dim)
        ]
        grad_b = dL_dz[:]

        if regularization_lambda > 0:
            for i in range(input_dim):
                for j in range(self.units):
                    grad_w[i][j] += regularization_lambda * self.weights[i][j]

        for i in range(input_dim):
            for j in range(self.units):
                self.weights[i][j] -= learning_rate * grad_w[i][j]
        for j in range(self.units):
            self.bias[j] -= learning_rate * grad_b[j]

        return [
            sum(self.weights[i][j] * dL_dz[j] for j in range(self.units))
            for i in range(input_dim)
        ]

    def parameters(self):
        """Devuelve lista plana de todos los parámetros entrenables [W, b]."""
        if self.weights is None:
            return []
        params = []
        for row in self.weights:
            params.extend(row)
        params.extend(self.bias)
        return params

    def summary(self):
        act = self.activation_name or "linear"
        reg = f"L2={self.regularization_lambda}" if self.regularization_lambda > 0 else "-"
        sd  = f", seed={self.seed}" if self.seed is not None else ""
        print(f"Dense(units={self.units}, act={act}, reg={reg}{sd})")