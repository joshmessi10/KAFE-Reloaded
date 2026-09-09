"""Clase base abstracta para optimizadores."""
from abc import abstractmethod
from global_utils import check_sig
from TypeUtils import vector_numeros_t


class Optimizer:
    @abstractmethod
    @check_sig([3], vector_numeros_t, vector_numeros_t, is_method=True)
    def step(self, params, grads):
        raise NotImplementedError()