from .base import ActivationFunction
from .relu import ReLU
from .sigmoid import SigmoidActivation as Sigmoide
from .softmax_v2 import Softmax
from .step import IdentityActivation as Identidad
from .step import StepActivation as Escalonada
from .tanh import Tanh


class ActivationFunctionLoader:
    _REGISTRY = {
        "sigmoid": Sigmoide,
        "sigmoide": Sigmoide,
        "relu": ReLU,
        "tanh": Tanh,
        "tangente": Tanh,
        "linear": Identidad,
        "identity": Identidad,
        "identidad": Identidad,
        "step": Escalonada,
        "escalon": Escalonada,
        "escalonada": Escalonada,
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

            warn(
                f"Activación '{name}' no reconocida. Se usará Identidad.", stacklevel=2
            )
            return Identidad()
        return klass()
