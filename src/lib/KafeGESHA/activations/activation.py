"""Abstract base class for activation functions."""
from abc import ABC, abstractmethod
from global_utils import check_sig
from TypeUtils import float_type, integer_type, numeric_vector_types


class ActivationFunction(ABC):
    @abstractmethod
    @check_sig([2], [float_type, integer_type] + numeric_vector_types, is_method=True)
    def activate(self, x):
        pass

    @abstractmethod
    @check_sig([2], [float_type, integer_type] + numeric_vector_types, is_method=True)
    def derivative(self, x):
        pass