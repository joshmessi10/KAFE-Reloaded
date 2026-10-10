from .base import ActivationFunction
class Identidad(ActivationFunction):
    def activate(self,x): return x
    def derivative(self,x): return 1.0
