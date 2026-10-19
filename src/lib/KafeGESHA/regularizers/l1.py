from .base import Regularizer, flatten_values
from lib.KafeNUMK import funciones as numk
class L1(Regularizer):
    def __init__(self, l1=0.01):
        if l1 < 0: raise ValueError("L1 requiere un factor no negativo")
        self.l1 = l1
    def penalty(self, weights): return self.l1 * sum(abs(x) for x in flatten_values(weights))
    def gradient(self, weights): return numk.map_elements(lambda x: self.l1 if x > 0 else (-self.l1 if x < 0 else 0.0), weights)
