from .base import Initializer
from lib.KafeNUMK import funciones as numk

class Constant(Initializer):
    def __init__(self, value=0.0): self.value = float(value)
    def __call__(self, shape): return numk.scalar_mul(self.value, numk.ones(list(shape)))

class Zeros(Constant):
    def __init__(self): super().__init__(0.0)

class Ones(Constant):
    def __init__(self): super().__init__(1.0)
