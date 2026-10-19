from abc import ABC, abstractmethod

class Initializer(ABC):
    @abstractmethod
    def __call__(self, shape): pass

def fans(shape):
    if not isinstance(shape, (list, tuple)) or not shape or any(type(v) is not int or v <= 0 for v in shape):
        raise ValueError("initializer requiere una forma con dimensiones positivas")
    if len(shape) == 1: return shape[0], shape[0]
    if len(shape) == 2: return shape[0], shape[1]
    receptive = 1
    for value in shape[2:]: receptive *= value
    return shape[1] * receptive, shape[0] * receptive
