"""Contrato común de las funciones de activación."""
from abc import ABC, abstractmethod
from lib.KafeNUMK import funciones as numk

class ActivationFunction(ABC):
    @abstractmethod
    def activate(self, x): pass
    @abstractmethod
    def derivative(self, x): pass
    def forward(self, z):
        self.z_cache = numk.tensor(z)
        return numk.map_elements(self.activate, self.z_cache)
    def backward(self, output_gradient):
        if not hasattr(self, 'z_cache'):
            raise RuntimeError("Activation.backward requiere forward")
        return numk.emul(output_gradient, numk.map_elements(self.derivative, self.z_cache))

Activation = ActivationFunction
