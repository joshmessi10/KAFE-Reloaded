from abc import ABC, abstractmethod
class Regularizer(ABC):
    @abstractmethod
    def penalty(self, weights): pass
    @abstractmethod
    def gradient(self, weights): pass

def flatten_values(value):
    if isinstance(value, list):
        return [item for child in value for item in flatten_values(child)]
    return [value]
