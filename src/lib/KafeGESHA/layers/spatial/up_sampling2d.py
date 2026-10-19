"""Aumento espacial por repetición."""
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer

class UpSampling2D(Layer):
    def __init__(self, size=(2,2)): super().__init__(); self.size=tuple(size); self._shape=None
    def forward(self,x):
        self._shape=numk.shape(x); sy,sx=self.size
        return [[[x[c][y//sy][xx//sx] for xx in range(len(x[c][0])*sx)] for y in range(len(x[c])*sy)] for c in range(len(x))]
    def backward(self,e,regularization_lambda=0.0):
        c,h,w=self._shape; sy,sx=self.size; dx=numk.zeros_nd([c,h,w])
        for ch in range(c):
            for y in range(h*sy):
                for xx in range(w*sx): dx[ch][y//sy][xx//sx]+=e[ch][y][xx]
        return dx
    def summary(self): print(f"UpSampling2D    | size: {self.size}")

__all__ = ['UpSampling2D']
