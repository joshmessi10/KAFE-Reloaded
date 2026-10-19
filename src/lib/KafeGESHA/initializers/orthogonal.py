from .base import Initializer
from lib.KafeNUMK import funciones as numk
from math import sqrt

class Orthogonal(Initializer):
    def __init__(self, gain=1.0, seed=None): self.gain, self.seed = gain, seed
    def __call__(self, shape):
        if len(shape) < 2: raise ValueError("Orthogonal requiere al menos dos dimensiones")
        rows, cols = shape[0], 1
        for value in shape[1:]: cols *= value
        transpose = rows < cols
        m, n = (cols, rows) if transpose else (rows, cols)
        source = numk.normal_tensor([m, n], 0.0, 1.0, self.seed)
        columns = []
        for j in range(n):
            vector = [source[i][j] for i in range(m)]
            for q in columns:
                projection = numk.dot(vector, q)
                vector = [v - projection * qi for v, qi in zip(vector, q)]
            norm = sqrt(numk.dot(vector, vector))
            if norm < 1e-12: raise ValueError("Orthogonal no pudo construir una base estable")
            columns.append([self.gain * v / norm for v in vector])
        matrix = [[columns[j][i] for j in range(n)] for i in range(m)]
        if transpose: matrix = numk.transpose(matrix)
        return numk.reshape(matrix, list(shape))
