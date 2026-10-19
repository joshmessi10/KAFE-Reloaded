from .base import Regularizer, flatten_values
from lib.KafeNUMK import funciones as numk
class L2(Regularizer):
    def __init__(self, l2=0.01):
        if l2 < 0: raise ValueError("L2 requiere un factor no negativo")
        self.l2 = l2
    def penalty(self, weights): return self.l2 * sum(x*x for x in flatten_values(weights))
    def gradient(self, weights): return numk.scalar_mul(2.0*self.l2, weights)
