from .base import ActivationFunction
class ReLU(ActivationFunction):
    def __init__(self): self.last_input = None
    def activate(self, x):
        self.last_input = x
        return x if x > 0 else type(x)(0)
    def derivative(self, x):
        value = self.last_input if x is None and self.last_input is not None else (x or 0)
        return 1 if value > 0 else 0
