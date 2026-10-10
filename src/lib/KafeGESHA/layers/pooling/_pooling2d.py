"""Base interna para pooling 2D."""
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer

class _Pooling2D(Layer):
    def __init__(self, pool_size=(2, 2), stride=None, mode="max"):
        super().__init__()
        if len(pool_size) != 2 or any(type(v) is not int or v <= 0 for v in pool_size): raise ValueError("pool_size debe contener dos enteros positivos")
        self.pool_size = tuple(pool_size); self.stride = stride or self.pool_size[0]
        if type(self.stride) is not int or self.stride <= 0: raise ValueError("stride debe ser entero positivo")
        self.mode = mode; self._input = None; self._positions = None
    def forward(self, x):
        if len(numk.shape(x)) != 3: raise ValueError("Pooling2D requiere CHW")
        self._input = numk.tensor(x); c, h, w = numk.shape(x); ph, pw = self.pool_size
        oh, ow = (h - ph) // self.stride + 1, (w - pw) // self.stride + 1
        out, self._positions = numk.zeros_nd([c, oh, ow]), {}
        for ch in range(c):
            for oy in range(oh):
                for ox in range(ow):
                    cells = [(x[ch][oy*self.stride+dy][ox*self.stride+dx], oy*self.stride+dy, ox*self.stride+dx) for dy in range(ph) for dx in range(pw)]
                    if self.mode == "max":
                        value, iy, ix = max(cells, key=lambda item: item[0]); self._positions[(ch, oy, ox)] = (iy, ix); out[ch][oy][ox] = value
                    else: out[ch][oy][ox] = sum(v for v, _, _ in cells) / len(cells)
        return out
    def backward(self, error, regularization_lambda=0.0):
        dx = numk.zeros_nd(list(numk.shape(self._input))); ph, pw = self.pool_size
        for ch in range(len(error)):
            for oy in range(len(error[ch])):
                for ox in range(len(error[ch][oy])):
                    if self.mode == "max":
                        iy, ix = self._positions[(ch, oy, ox)]; dx[ch][iy][ix] += error[ch][oy][ox]
                    else:
                        share = error[ch][oy][ox] / (ph * pw)
                        for dy in range(ph):
                            for ddx in range(pw): dx[ch][oy*self.stride+dy][ox*self.stride+ddx] += share
        return dx
    def summary(self): print(f"{self.__class__.__name__:15} | pool: {self.pool_size}")

__all__ = ['_Pooling2D']
