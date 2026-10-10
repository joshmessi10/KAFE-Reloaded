from .l1 import L1
from .l2 import L2
from lib.KafeNUMK import funciones as numk
class L1L2:
    def __init__(self, l1=0.01, l2=0.01): self._l1, self._l2 = L1(l1), L2(l2)
    def penalty(self, weights): return self._l1.penalty(weights) + self._l2.penalty(weights)
    def gradient(self, weights): return numk.broadcast_add(self._l1.gradient(weights), self._l2.gradient(weights))
