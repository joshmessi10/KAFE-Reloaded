"""Dropout layer for regularization."""
import random

from lib.KafeGESHA.layers.layer import Layer


class Dropout(Layer):
    """Dropout layer that randomly deactivates neurons during training.

    Implements inverted dropout: during training it scales the output by
    1/(1-rate) to maintain activation hope.

    Args:
        rate: Proportion of neurons to deactivate (0.0 to 1.0, excluded).
        seed: Seed for reproducibility.
    """

    def __init__(self, rate=0.5, seed=None):
        super().__init__()
        if not 0.0 <= rate < 1.0:
            raise ValueError("Dropout rate must be between 0.0 and 1.0")

        self.rate = rate
        self.seed = seed
        self._rng = random.Random(seed) if seed is not None else random
        self._mask = None

    def forward(self, x):
        """Forward propagation with random mask in training mode."""
        if not self._training or self.rate == 0.0:
            self._mask = [1.0 for _ in x]
            return x[:]

        self._mask = [
            0.0 if self._rng.random() < self.rate else 1.0
            for _ in x
        ]

        return [x[i] * self._mask[i] / (1.0 - self.rate) for i in range(len(x))]

    def backward(self, output_error, learning_rate, regularization_lambda=None):
        """Backward propagation using the mask saved in forward."""
        if not self._training or self.rate == 0.0:
            return output_error[:]

        return [output_error[i] * self._mask[i] / (1.0 - self.rate) for i in range(len(output_error))]

    def summary(self):
        print(f"Dropout(rate={self.rate})")