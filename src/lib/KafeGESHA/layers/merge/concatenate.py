"""Concatenación de ramas Functional."""
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer

class Concatenate(Layer):
    def __init__(self,axis=0): super().__init__(); self.axis=axis; self._sizes=None
    def forward(self,inputs):
        self._sizes=[numk.shape(x)[self.axis] for x in inputs]; return numk.concatenate(inputs,self.axis)
    def backward(self,e,regularization_lambda=0.0): return numk.split_sizes(e,self._sizes,self.axis)
    def summary(self): print(f"Concatenate     | axis: {self.axis}")

__all__ = ['Concatenate']
