"""Funciones de activación para KafeGESHA.

    ActivationFunction  — clase base abstracta
    ReLU, Sigmoide, Tanh, Softmax, Identidad, Escalonada — implementaciones
    ActivationFunctionLoader — factory: nombre → instancia
"""
from abc import ABC, abstractmethod
from lib.KafeMATH.funciones import exp


class ActivationFunction(ABC):
    """Clase base para funciones de activación."""

    @abstractmethod
    def activate(self, x):
        pass

    @abstractmethod
    def derivative(self, x):
        pass


class ReLU(ActivationFunction):
    """f(x) = max(0, x)"""

    def __init__(self):
        self.last_input = None

    def activate(self, x):
        self.last_input = x
        return x if x > 0 else 0

    def derivative(self, x):
        inp = self.last_input if self.last_input is not None else x
        return 1 if inp > 0 else 0


class Sigmoide(ActivationFunction):
    """f(x) = 1 / (1 + e^-x)"""

    def __init__(self):
        self.last_output = None

    def activate(self, x):
        s = 1.0 / (1.0 + exp(-x))
        self.last_output = s
        return s

    def derivative(self, x):
        if self.last_output is None:
            s = 1.0 / (1.0 + exp(-x))
            return s * (1.0 - s)
        return self.last_output * (1.0 - self.last_output)


class Tanh(ActivationFunction):
    """f(x) = tanh(x)"""

    def __init__(self):
        self.last_output = None

    def activate(self, x):
        e_pos, e_neg = exp(x), exp(-x)
        t = (e_pos - e_neg) / (e_pos + e_neg)
        self.last_output = t
        return t

    def derivative(self, x):
        if self.last_output is None:
            t = self.activate(x)
            return 1.0 - t * t
        return 1.0 - self.last_output * self.last_output


class Softmax(ActivationFunction):
    """f(x) = exp(x_i) / Σ exp(x). Opera sobre el vector completo."""

    def __init__(self):
        self.last_output = None

    def activate(self, vec):
        exp_vec = [exp(v) for v in vec]
        s = sum(exp_vec)
        self.last_output = [v / s for v in exp_vec]
        return self.last_output[:]

    def derivative(self, vec):
        s = self.activate(vec)
        n = len(s)
        return [
            [s[i] * (1.0 - s[i]) if i == j else -s[i] * s[j] for j in range(n)]
            for i in range(n)
        ]


class Identidad(ActivationFunction):
    """f(x) = x  (activación lineal)."""

    def activate(self, x): return x
    def derivative(self, x): return 1.0


class Escalonada(ActivationFunction):
    """f(x) = 1 si x ≥ 0 else 0."""

    def activate(self, x): return 1 if x >= 0 else 0
    def derivative(self, x): return 0.0


class ActivationFunctionLoader:
    """Factory: devuelve la ActivationFunction correspondiente a un nombre de cadena."""

    _REGISTRY = {
        "sigmoid": Sigmoide, "sigmoide": Sigmoide,
        "relu": ReLU,
        "tanh": Tanh, "tangente": Tanh,
        "linear": Identidad, "identity": Identidad, "identidad": Identidad,
        "step": Escalonada, "escalon": Escalonada, "escalonada": Escalonada,
        "softmax": Softmax,
    }

    @staticmethod
    def get(name):
        if not name:
            return Identidad()
        klass = ActivationFunctionLoader._REGISTRY.get(name.lower())
        if klass is None:
            from warnings import warn
            warn(f"Activación '{name}' no reconocida. Se usará Identidad.", stacklevel=2)
            return Identidad()
        return klass()
