"""Base interna para pooling global."""
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer

class _GlobalPooling2D(Layer):
    def __init__(self, mode): super().__init__(); self.mode = mode; self._input = None; self._positions = []
    def forward(self, x):
        self._input = numk.tensor(x); out=[]; self._positions=[]
        for channel in x:
            flat=[v for row in channel for v in row]
            if self.mode == "max":
                value=max(flat); idx=flat.index(value); self._positions.append((idx//len(channel[0]), idx%len(channel[0]))); out.append(value)
            else: out.append(sum(flat)/len(flat))
        return out
    def backward(self, e, regularization_lambda=0.0):
        dx=numk.zeros_nd(list(numk.shape(self._input)))
        for c,g in enumerate(e):
            if self.mode == "max": y,x=self._positions[c]; dx[c][y][x]=g
            else:
                share=g/(len(dx[c])*len(dx[c][0]))
                for y in range(len(dx[c])):
                    for x in range(len(dx[c][y])): dx[c][y][x]=share
        return dx
    def summary(self): print(self.__class__.__name__)

__all__ = ['_GlobalPooling2D']
