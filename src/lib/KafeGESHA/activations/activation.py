"""Clase base abstracta para funciones de activación."""
from abc import ABC, abstractmethod
from global_utils import check_sig
from TypeUtils import flotante_t, entero_t, vector_numeros_t


class ActivationFunction(ABC):
    @abstractmethod
    @check_sig([2], [flotante_t, entero_t] + vector_numeros_t, is_method=True)
    def activate(self, x):
        pass

    @abstractmethod
    @check_sig([2], [flotante_t, entero_t] + vector_numeros_t, is_method=True)
    def derivative(self, x):
        pass