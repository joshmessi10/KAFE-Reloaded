from .base import ActivationFunction
from lib.KafeMATH.funciones import exp
class Sigmoide(ActivationFunction):
    def __init__(self): self.last_output = None
    def activate(self, x):
        self.last_output = 1.0 / (1.0 + exp(-x)); return self.last_output
    def derivative(self, x):
        if x is None: value = self.last_output
        else: value = 1.0 / (1.0 + exp(-x))
        return .25 if value is None else value * (1.0-value)
