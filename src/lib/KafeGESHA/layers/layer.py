"""Clase base abstracta para capas de red neuronal."""
from abc import ABC, abstractmethod
from global_utils import check_sig
from TypeUtils import vector_numeros_t, entero_t, flotante_t, void_t


class Layer(ABC):
    @abstractmethod
    @check_sig([2], vector_numeros_t, is_method=True)
    def forward(self, x):
        """Propagación hacia adelante."""
        pass

    @abstractmethod
    @check_sig([3, 4], vector_numeros_t + [flotante_t], [flotante_t], [flotante_t, void_t], is_method=True)
    def backward(self, output_error, learning_rate, regularization_lambda=None):
        """Propagación hacia atrás."""
        pass

    def summary(self):
        """Imprime información de la capa."""
        print(f"{self.__class__.__name__}")