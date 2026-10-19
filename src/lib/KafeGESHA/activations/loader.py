from .base import ActivationFunction
from .relu import ReLU
from .sigmoid import Sigmoide
from .tanh import Tanh
from .softmax import Softmax
from .linear import Identidad
from .step import Escalonada
class ActivationFunctionLoader:
    _REGISTRY={'sigmoid':Sigmoide,'sigmoide':Sigmoide,'relu':ReLU,'tanh':Tanh,'tangente':Tanh,
      'linear':Identidad,'identity':Identidad,'identidad':Identidad,'step':Escalonada,
      'escalon':Escalonada,'escalonada':Escalonada,'softmax':Softmax}
    @staticmethod
    def get(name):
        if isinstance(name,ActivationFunction): return name
        if not name: return Identidad()
        klass=ActivationFunctionLoader._REGISTRY.get(name.lower())
        if klass is None:
            from warnings import warn
            warn(f"Activación '{name}' no reconocida. Se usará Identidad.",stacklevel=2)
            return Identidad()
        return klass()
