from .base import Initializer, fans
from lib.KafeNUMK import funciones as numk
from math import sqrt

class RandomUniform(Initializer):
    def __init__(self, minval=-0.05, maxval=0.05, seed=None):
        if minval > maxval: raise ValueError("RandomUniform requiere minval <= maxval")
        self.minval, self.maxval, self.seed = minval, maxval, seed
    def __call__(self, shape): return numk.random_tensor(list(shape), self.minval, self.maxval, self.seed)

class RandomNormal(Initializer):
    def __init__(self, mean=0.0, stddev=0.05, seed=None):
        if stddev < 0: raise ValueError("RandomNormal requiere stddev no negativo")
        self.mean, self.stddev, self.seed = mean, stddev, seed
    def __call__(self, shape): return numk.normal_tensor(list(shape), self.mean, self.stddev, self.seed)

class GlorotUniform(RandomUniform):
    def __init__(self, seed=None): self.seed = seed
    def __call__(self, shape):
        fan_in, fan_out = fans(shape); limit = sqrt(6.0 / (fan_in + fan_out))
        return numk.random_tensor(list(shape), -limit, limit, self.seed)

class GlorotNormal(RandomNormal):
    def __init__(self, seed=None): self.seed = seed
    def __call__(self, shape):
        fan_in, fan_out = fans(shape)
        return numk.normal_tensor(list(shape), 0.0, sqrt(2.0 / (fan_in + fan_out)), self.seed)

class HeUniform(RandomUniform):
    def __init__(self, seed=None): self.seed = seed
    def __call__(self, shape):
        fan_in, _ = fans(shape); limit = sqrt(6.0 / fan_in)
        return numk.random_tensor(list(shape), -limit, limit, self.seed)

class HeNormal(RandomNormal):
    def __init__(self, seed=None): self.seed = seed
    def __call__(self, shape):
        fan_in, _ = fans(shape)
        return numk.normal_tensor(list(shape), 0.0, sqrt(2.0 / fan_in), self.seed)
