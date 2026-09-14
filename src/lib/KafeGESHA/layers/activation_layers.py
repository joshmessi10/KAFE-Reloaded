"""Capas de activación independientes para uso en Sequential/Functional.

Estas capas envuelven las funciones de activación existentes
para que puedan usarse como capas separadas en un grafo:

    Sequential([Dense(128), ReLU(), Dense(10), Softmax()])

La diferencia con la activación integrada en Dense es que aquí la
activación ocupa un nodo propio en el grafo, permitiendo arquitecturas
donde el mismo bloque de activación se comparte o se conecta de forma
no lineal (e.g., Functional API con skip-connections).
"""
from lib.KafeGESHA.layers.layer import Layer
from lib.KafeGESHA.activations.relu import ReLU as _ReLU
from lib.KafeGESHA.activations.sigmoid import Sigmoide as _Sigmoide
from lib.KafeGESHA.activations.tanh import Tanh as _Tanh
from lib.KafeGESHA.activations.softmax import Softmax as _Softmax
from lib.KafeGESHA.activations.step import Identidad as _Identidad


class ActivationLayer(Layer):
    """Capa base para activaciones element-wise usadas como capas independientes.

    Aplica una función de activación a cada elemento del vector de entrada.
    El backward propaga el gradiente a través de la derivada de la activación.

    Args:
        activation_fn: Instancia de ActivationFunction.
    """

    def __init__(self, activation_fn):
        super().__init__()
        self._fn = activation_fn
        self._last_input = None

    def forward(self, x):
        """Propagación hacia adelante: aplica la activación element-wise."""
        self._last_input = x[:]
        return [self._fn.activate(v) for v in x]

    def backward(self, output_error, learning_rate, regularization_lambda=None):
        """Propagación hacia atrás: multiplica por la derivada de la activación."""
        if not isinstance(output_error, list):
            output_error = [output_error]
        return [
            output_error[i] * self._fn.derivative(self._last_input[i])
            for i in range(len(output_error))
        ]

    def parameters(self):
        return []


class SoftmaxLayer(Layer):
    """Capa Softmax como capa independiente.

    Softmax opera sobre el vector completo (no element-wise), por lo que
    requiere una implementación separada de backward.

    En combinación con Categorical Cross-Entropy, el gradiente simplificado
    es (y_pred - y_true), que ya viene pre-calculado del loss. Por ello,
    el backward de SoftmaxLayer pasa el gradiente sin modificación cuando
    viene de CCE (pass-through seguro para el par softmax+CCE).
    """

    def __init__(self):
        super().__init__()
        self._fn = _Softmax()
        self._last_output = None

    def forward(self, x):
        """Propagación hacia adelante: softmax sobre el vector completo."""
        result = self._fn.activate(x)
        self._last_output = result[:]
        return result

    def backward(self, output_error, learning_rate, regularization_lambda=None):
        """Propagación hacia atrás.

        Cuando se combina con CCE, el gradiente ya incorpora la simplificación
        (∂CCE/∂softmax)(∂softmax/∂z) = y_pred - y_true. El gradiente se
        pasa directamente sin modificación adicional.
        """
        if not isinstance(output_error, list):
            output_error = [output_error]
        return output_error[:]

    def parameters(self):
        return []

    def summary(self):
        print("Softmax()")


class ReLULayer(ActivationLayer):
    """Capa ReLU independiente: f(x) = max(0, x)."""

    def __init__(self):
        super().__init__(_ReLU())

    def summary(self):
        print("ReLU()")


class SigmoidLayer(ActivationLayer):
    """Capa Sigmoid independiente: f(x) = 1 / (1 + e^-x)."""

    def __init__(self):
        super().__init__(_Sigmoide())

    def summary(self):
        print("Sigmoid()")


class TanhLayer(ActivationLayer):
    """Capa Tanh independiente: f(x) = tanh(x)."""

    def __init__(self):
        super().__init__(_Tanh())

    def summary(self):
        print("Tanh()")


class LinearLayer(ActivationLayer):
    """Capa de activación lineal/identidad. Pass-through."""

    def __init__(self):
        super().__init__(_Identidad())

    def summary(self):
        print("Linear()")
