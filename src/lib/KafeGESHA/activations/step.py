from .base import ActivationFunction
class Escalonada(ActivationFunction):
    def activate(self,x): return 1 if x>=0 else 0
    def derivative(self,x): return 0.0
