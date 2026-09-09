"""Representación de tensores para KafeGESHA."""
from TypeUtils import vector_numeros_t, matriz_numeros_t


class Tensor:
    """
    Representación básica de tensor como lista de listas.
    Soporta vectores (1D) y matrices (2D).
    """
    
    def __init__(self, data):
        """
        Inicializa un tensor con datos.
        
        Args:
            data: Lista de listas o lista de números
        """
        self.data = data
        self.shape = self._compute_shape()
    
    def _compute_shape(self):
        """Calcula la forma del tensor."""
        if not self.data:
            return (0,)
        if isinstance(self.data[0], list):
            return (len(self.data), len(self.data[0]))
        return (len(self.data),)
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        return self.data[idx]
    
    def __setitem__(self, idx, value):
        self.data[idx] = value
    
    def __repr__(self):
        return f"Tensor(shape={self.shape}, data={self.data})"


def tensor_zeros(shape):
    """Crea un tensor de ceros con la forma dada."""
    if len(shape) == 1:
        return Tensor([0.0 for _ in range(shape[0])])
    elif len(shape) == 2:
        return Tensor([[0.0 for _ in range(shape[1])] for _ in range(shape[0])])
    else:
        raise ValueError("Solo se soportan tensores 1D y 2D")


def tensor_ones(shape):
    """Crea un tensor de unos con la forma dada."""
    if len(shape) == 1:
        return Tensor([1.0 for _ in range(shape[0])])
    elif len(shape) == 2:
        return Tensor([[1.0 for _ in range(shape[1])] for _ in range(shape[0])])
    else:
        raise ValueError("Solo se soportan tensores 1D y 2D")


def tensor_random(shape, low=-0.5, high=0.5):
    """Crea un tensor con valores aleatorios en el rango [low, high]."""
    import random
    if len(shape) == 1:
        return Tensor([random.uniform(low, high) for _ in range(shape[0])])
    elif len(shape) == 2:
        return Tensor([[random.uniform(low, high) for _ in range(shape[1])] for _ in range(shape[0])])
    else:
        raise ValueError("Solo se soportan tensores 1D y 2D")