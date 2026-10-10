"""API pública de activaciones GESHA."""
from .base import ActivationFunction, Activation
from .relu import ReLU
from .sigmoid import Sigmoide
from .tanh import Tanh
from .softmax import Softmax
from .linear import Identidad
from .step import Escalonada
from .loader import ActivationFunctionLoader
__all__=['ActivationFunction','Activation','ReLU','Sigmoide','Tanh','Softmax','Identidad','Escalonada','ActivationFunctionLoader']
