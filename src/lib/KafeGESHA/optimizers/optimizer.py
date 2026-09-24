"""Abstract base class for optimizers."""
from abc import abstractmethod

from global_utils import check_sig
from TypeUtils import numeric_vector_types


class Optimizer:
    @abstractmethod
    @check_sig([3], numeric_vector_types, numeric_vector_types, is_method=True)
    def step(self, params, grads):
        raise NotImplementedError()