"""Abstract base class for loss functions."""
from abc import ABC, abstractmethod

from global_utils import check_sig
from TypeUtils import (
    float_type,
    integer_type,
    numeric_matrix_types,
    numeric_vector_types,
)


class LossFunction(ABC):
    @abstractmethod
    @check_sig([3], numeric_vector_types + [float_type, integer_type], numeric_vector_types + numeric_matrix_types + [float_type, integer_type], is_method=True)
    def compute(self, y_true, y_pred):
        """Returns the average loss value"""
        pass

    @abstractmethod
    @check_sig([3], numeric_vector_types + [float_type, integer_type], numeric_vector_types + numeric_matrix_types + [float_type, integer_type], is_method=True)
    def derivative(self, y_true, y_pred):
        """Returns the gradient ∂L/∂y_pred"""
        pass