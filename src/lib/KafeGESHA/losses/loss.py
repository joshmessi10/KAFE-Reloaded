"""Clase base abstracta para funciones de pérdida."""
from abc import ABC, abstractmethod
from global_utils import check_sig
from TypeUtils import vector_numeros_t, flotante_t, entero_t, matriz_numeros_t


class LossFunction(ABC):
    @abstractmethod
    @check_sig([3], vector_numeros_t + [flotante_t, entero_t], vector_numeros_t + matriz_numeros_t + [flotante_t, entero_t], is_method=True)
    def compute(self, y_true, y_pred):
        """Devuelve el valor promedio de la pérdida"""
        pass

    @abstractmethod
    @check_sig([3], vector_numeros_t + [flotante_t, entero_t], vector_numeros_t + matriz_numeros_t + [flotante_t, entero_t], is_method=True)
    def derivative(self, y_true, y_pred):
        """Devuelve el gradiente ∂L/∂y_pred"""
        pass