"""Capa Flatten para remodelar tensores."""
from lib.KafeGESHA.layers.layer import Layer
from global_utils import check_sig
from TypeUtils import vector_numeros_t, matriz_numeros_t


class Flatten(Layer):
    """
    Capa Flatten que convierte tensores multidimensionales en vectores unidimensionales.
    Útil para conectar capas convolucionales con capas densas.
    """
    
    def __init__(self, input_shape=None):
        """
        Inicializa la capa Flatten.
        
        Args:
            input_shape: Forma de entrada esperada (opcional)
        """
        self.input_shape = input_shape
        self._original_shape = None
    
    @check_sig([2], vector_numeros_t + matriz_numeros_t, is_method=True)
    def forward(self, x):
        """Propagación hacia adelante: aplanar el tensor."""
        if isinstance(x[0], list):
            self._original_shape = (len(x), len(x[0]))
            return [x[i][j] for i in range(len(x)) for j in range(len(x[0]))]
        else:
            self._original_shape = (len(x),)
            return x[:]
    
    def backward(self, output_error, learning_rate, regularization_lambda=None):
        """Propagación hacia atrás: restaurar la forma original."""
        if self._original_shape is None:
            return output_error[:]
        
        if len(self._original_shape) == 1:
            return output_error[:]
        
        rows, cols = self._original_shape
        return [
            [output_error[i * cols + j] for j in range(cols)]
            for i in range(rows)
        ]
    
    def summary(self):
        """Imprime información de la capa."""
        shape_str = f"input_shape={self.input_shape}" if self.input_shape else ""
        print(f"Flatten({shape_str})")