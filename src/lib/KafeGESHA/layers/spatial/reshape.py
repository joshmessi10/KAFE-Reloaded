"""Cambio de forma NUMK."""
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer

class Reshape(Layer):
    def __init__(self,target_shape): super().__init__(); self.target_shape=tuple(target_shape); self._shape=None
    def forward(self,x): self._shape=numk.shape(x); return numk.reshape(x,list(self.target_shape))
    def backward(self,e,regularization_lambda=0.0): return numk.reshape(e,list(self._shape))
    def summary(self): print(f"Reshape         | target: {self.target_shape}")

__all__ = ['Reshape']
