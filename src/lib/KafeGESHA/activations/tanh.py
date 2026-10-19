from .base import ActivationFunction
from lib.KafeMATH.funciones import exp
class Tanh(ActivationFunction):
    def __init__(self): self.last_output = None
    def activate(self, x):
        p,n=exp(x),exp(-x); self.last_output=(p-n)/(p+n); return self.last_output
    def derivative(self, x):
        value = self.last_output if x is None else self.activate(x)
        return 1.0 if value is None else 1.0-value*value
