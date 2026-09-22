"""Capa Dropout para regularización."""
import random
from lib.KafeGESHA.layers.layer import Layer
from global_utils import check_sig
from TypeUtils import vector_numeros_t, flotante_t, void_t


class Dropout(Layer):
    """Capa Dropout que desactiva neuronas aleatoriamente durante el entrenamiento.

    Implementa inverted dropout: durante entrenamiento escala la salida por
    1/(1-rate) para mantener la esperanza de activación.

    Args:
        rate: Proporción de neuronas a desactivar (0.0 a 1.0, excluido).
        seed: Semilla para reproducibilidad.
    """

    def __init__(self, rate=0.5, seed=None):
        super().__init__()
        if not 0.0 <= rate < 1.0:
            raise ValueError("El rate de Dropout debe estar entre 0.0 y 1.0")

        self.rate = rate
        self.seed = seed
        self._rng = random.Random(seed) if seed is not None else random
        self._mask = None

    def forward(self, x):
        """Propagación hacia adelante con máscara aleatoria en modo entrenamiento."""
        if not self._training or self.rate == 0.0:
            self._mask = [1.0 for _ in x]
            return x[:]

        self._mask = [
            0.0 if self._rng.random() < self.rate else 1.0
            for _ in x
        ]

        return [x[i] * self._mask[i] / (1.0 - self.rate) for i in range(len(x))]

    def backward(self, output_error, learning_rate, regularization_lambda=None):
        """Propagación hacia atrás usando la máscara guardada en forward."""
        if not self._training or self.rate == 0.0:
            return output_error[:]

        return [output_error[i] * self._mask[i] / (1.0 - self.rate) for i in range(len(output_error))]

    def summary(self):
        print(f"Dropout(rate={self.rate})")