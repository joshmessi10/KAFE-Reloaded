"""Funciones de activación para KafeGESHA.

    ActivationFunction  — clase base abstracta
    ReLU, Sigmoide, Tanh, Softmax, Identidad, Escalonada — implementaciones
    ActivationFunctionLoader — factory: nombre → instancia
"""
from abc import ABC, abstractmethod
from lib.KafeMATH.funciones import exp
from lib.KafeNUMK import funciones as numk


class ActivationFunction(ABC):
    """Clase base para funciones de activación."""

    @abstractmethod
    def activate(self, x):
        pass

    @abstractmethod
    def derivative(self, x):
        pass

    # Contrato de composición usado por Layer. Los métodos activate y
    # derivative se conservan para compatibilidad con la API histórica.
    def forward(self, z):
        self.z_cache = numk.tensor(z)
        return numk.map_elements(self.activate, self.z_cache)

    def backward(self, output_gradient):
        if not hasattr(self, "z_cache"):
            raise RuntimeError("Activation.backward requiere forward")
        local = numk.map_elements(self.derivative, self.z_cache)
        return numk.emul(output_gradient, local)


class ReLU(ActivationFunction):
    """f(x) = max(0, x)"""

    def __init__(self):
        self.last_input = None

    def activate(self, x):
        self.last_input = x
        return x if x > 0 else type(x)(0)

    def derivative(self, x):
        if x is None:
            inp = self.last_input if self.last_input is not None else 0
        else:
            inp = x
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
        if x is None:
            if self.last_output is None:
                return 0.25
            return self.last_output * (1.0 - self.last_output)
        s = 1.0 / (1.0 + exp(-x))
        return s * (1.0 - s)


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
        if x is None:
            if self.last_output is None:
                return 1.0
            return 1.0 - self.last_output * self.last_output
        t = self.activate(x)
        return 1.0 - t * t


class Softmax(ActivationFunction):
    """f(x) = exp(x_i) / Σ exp(x). Opera sobre el vector completo."""

    def __init__(self):
        self.last_output = None

    def activate(self, vec):
        shape = numk.shape(vec)
        if len(shape) not in (1, 2) or 0 in shape:
            raise ValueError("Softmax requiere un vector o una matriz no vacia")
        rows = [vec] if len(shape) == 1 else vec
        maxima = numk.reshape(numk.max_axis(rows, 1), [len(rows), 1])
        exponentials = numk.exp_tensor(numk.broadcast_sub(rows, maxima))
        totals = numk.reshape(numk.sum_axis(exponentials, 1), [len(rows), 1])
        probabilities = numk.broadcast_div(exponentials, totals)
        self.last_output = probabilities[0] if len(shape) == 1 else probabilities
        return numk.tensor(self.last_output)

    def forward(self, z):
        self.z_cache = numk.tensor(z)
        self.output_cache = self.activate(z)
        return numk.tensor(self.output_cache)

    def backward(self, output_gradient):
        if not hasattr(self, "output_cache"):
            raise RuntimeError("Softmax.backward requiere forward")
        probabilities = self.output_cache
        product = numk.emul(output_gradient, probabilities)
        if len(numk.shape(probabilities)) == 1:
            projection = numk.sum_all(product)
        else:
            projection = numk.reshape(numk.sum_axis(product, 1), [len(product), 1])
        return numk.emul(probabilities, numk.broadcast_sub(output_gradient, projection))

    def derivative(self, vec):
        s = self.last_output if vec is None else self.activate(vec)
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
        if isinstance(name, ActivationFunction):
            return name
        if not name:
            return Identidad()
        klass = ActivationFunctionLoader._REGISTRY.get(name.lower())
        if klass is None:
            from warnings import warn
            warn(f"Activación '{name}' no reconocida. Se usará Identidad.", stacklevel=2)
            return Identidad()
        return klass()


# Nombre conceptual del contrato definido en la propuesta arquitectónica.
Activation = ActivationFunction
