"""Dropout de canales completos."""

import random

from lib.KafeNUMK import functions as numk

from ..base.layer import Layer


class SpatialDropout2D(Layer):
    def __init__(self, rate=0.5, seed=None):
        super().__init__()
        if not 0 <= rate < 1:
            raise ValueError("SpatialDropout2D rate inválido")
        self.rate, self.seed, self.mask = rate, seed, None
        self._rng = random.Random(seed) if seed is not None else None

    def forward(self, x):
        if not self._training:
            return numk.tensor(x)
        draw_seed = self._rng.randrange(2**32) if self._rng is not None else None
        draws = numk.random_tensor([len(x)], 0.0, 1.0, draw_seed)
        self.mask = [0.0 if v < self.rate else 1.0 / (1 - self.rate) for v in draws]
        return [
            [[v * self.mask[c] for v in row] for row in channel]
            for c, channel in enumerate(x)
        ]

    def backward(self, e, regularization_lambda=0.0):
        return (
            [
                [[v * self.mask[c] for v in row] for row in channel]
                for c, channel in enumerate(e)
            ]
            if self._training
            else numk.tensor(e)
        )

    def summary(self):
        print(f"SpatialDropout2D| rate: {self.rate}")


__all__ = ["SpatialDropout2D"]
