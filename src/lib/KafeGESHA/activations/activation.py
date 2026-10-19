"""Abstract base class for activation functions."""

from abc import ABC, abstractmethod
from typing import Any

from global_utils import check_sig
from TypeUtils import float_type, integer_type, numeric_vector_types


class ActivationFunction(ABC):
    last_input: Any
    last_output: Any

    @abstractmethod
    @check_sig([2], [float_type, integer_type] + numeric_vector_types, is_method=True)
    def activate(self, x):
        pass

    @abstractmethod
    @check_sig([2], [float_type, integer_type] + numeric_vector_types, is_method=True)
    def derivative(self, x):
        pass

    def forward(self, values) -> Any:
        from lib.KafeNUMK import functions as numk

        self._forward_input = numk.tensor(values)
        return numk.map_elements(self.activate, self._forward_input)

    def backward(self, output_gradient):
        from lib.KafeNUMK import functions as numk

        if not hasattr(self, "_forward_input"):
            raise RuntimeError("Activation.backward requires forward")

        def derivative_at(value):
            if hasattr(self, "last_input"):
                self.last_input = None
            if hasattr(self, "last_output"):
                self.last_output = None
            return self.derivative(value)

        derivatives = numk.map_elements(derivative_at, self._forward_input)
        return numk.emul(output_gradient, derivatives)
