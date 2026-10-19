"""Permutación de ejes NUMK."""
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer

class Permute(Layer):
    def __init__(self,dims):
        super().__init__(); self.dims=tuple(dims)
        if sorted(self.dims)!=list(range(len(self.dims))): raise ValueError("Permute dims debe ser una permutación base 0")
    def forward(self,x): self._shape=numk.shape(x); return numk.transpose_axes(x,list(self.dims))
    def backward(self,e,regularization_lambda=0.0):
        inverse=[self.dims.index(i) for i in range(len(self.dims))]; return numk.transpose_axes(e,inverse)
    def summary(self): print(f"Permute         | dims: {self.dims}")

__all__ = ['Permute']
