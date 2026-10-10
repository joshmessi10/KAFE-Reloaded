"""Padding espacial con ceros."""
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer

class ZeroPadding2D(Layer):
    def __init__(self, padding=(1, 1)): super().__init__(); self.padding=tuple(padding); self._shape=None
    def forward(self,x):
        self._shape=numk.shape(x); c,h,w=self._shape; py,px=self.padding; out=numk.zeros_nd([c,h+2*py,w+2*px])
        for ch in range(c):
            for y in range(h):
                for xx in range(w): out[ch][y+py][xx+px]=x[ch][y][xx]
        return out
    def backward(self,e,regularization_lambda=0.0):
        c,h,w=self._shape; py,px=self.padding; return [[[e[ch][y+py][x+px] for x in range(w)] for y in range(h)] for ch in range(c)]
    def summary(self): print(f"ZeroPadding2D   | padding: {self.padding}")

__all__ = ['ZeroPadding2D']
