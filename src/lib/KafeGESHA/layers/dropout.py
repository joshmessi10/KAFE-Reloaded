"""Capa Dropout para regularización."""
import random
from lib.KafeGESHA.layers.layer import Layer
from global_utils import check_sig
from TypeUtils import vector_numeros_t, flotante_t, entero_t


class Dropout(Layer):
    """
    Capa Dropout que desactiva neuronas aleatoriamente durante el entrenamiento.
    Ayuda a prevenir el sobreajuste.
    """
    
    def __init__(self, rate=0.5, seed=None):
        """
        Inicializa la capa Dropout.
        
        Args:
            rate: Proporción de neuronas a desactivar (0.0 a 1.0)
            seed: Semilla para reproducibilidad
        """
        if not 0.0 <= rate < 1.0:
            raise ValueError("El rate de Dropout debe estar entre 0.0 y 1.0")
        
        self.rate = rate
        self.seed = seed
        self._rng = random.Random(seed) if seed is not None else random
        self._training = True
        self._mask = None
    
    def forward(self, x):
        """Propagación hacia adelante."""
        if not self._training or self.rate == 0.0:
            self._mask = [1.0 for _ in x]
            return x[:]
        
        self._mask = [
            0.0 if self._rng.random() < self.rate else 1.0
            for _ in x
        ]
        
        return [x[i] * self._mask[i] / (1.0 - self.rate) for i in range(len(x))]
    
    def backward(self, output_error, learning_rate, regularization_lambda=None):
        """Propagación hacia atrás."""
        if not self._training or self.rate == 0.0:
            return output_error[:]
        
        return [output_error[i] * self._mask[i] / (1.0 - self.rate) for i in range(len(output_error))]
    
    def train_mode(self):
        """Activa el modo entrenamiento."""
        self._training = True
    
    def eval_mode(self):
        """Activa el modo evaluación."""
        self._training = False
    
    def summary(self):
        """Imprime información de la capa."""
        print(f"Dropout(rate={self.rate})")