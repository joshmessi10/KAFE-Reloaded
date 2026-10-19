"""Contrato común para optimizadores GESHA."""
from abc import ABC, abstractmethod


class Optimizer(ABC):
    """Actualiza parámetros entrenables a partir de sus gradientes."""

    @abstractmethod
    def step(self, parameters):
        """Aplica un paso sobre una colección de objetos Parameter."""
        raise NotImplementedError()

    def update(self, layers):
        """Recoge y actualiza una sola vez los parámetros de varias capas."""
        parameters = []
        seen = set()
        for layer in layers:
            for parameter in layer.parameters():
                identity = id(parameter)
                if identity not in seen:
                    parameters.append(parameter)
                    seen.add(identity)
        self.step(parameters)
