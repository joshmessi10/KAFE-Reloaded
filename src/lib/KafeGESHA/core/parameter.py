"""Parámetros entrenables para modelos de deep learning."""
from lib.KafeGESHA.core.tensor import Tensor, tensor_zeros, tensor_random


class Parameter:
    """
    Representa un parámetro entrenable (pesos o sesgo).
    Incluye metadatos para optimización y regularización.
    """
    
    def __init__(self, data, name=None, requires_grad=True):
        """
        Inicializa un parámetro.
        
        Args:
            data: Lista de listas o lista de números
            name: Nombre opcional del parámetro
            requires_grad: Si True, calcula gradientes
        """
        self.tensor = Tensor(data)
        self.name = name
        self.requires_grad = requires_grad
        self.grad = None
        self.shape = self.tensor.shape
    
    @staticmethod
    def zeros(shape, name=None):
        """Crea un parámetro de ceros."""
        return Parameter(tensor_zeros(shape).data, name)
    
    @staticmethod
    def random(shape, name=None):
        """Crea un parámetro con valores aleatorios."""
        return Parameter(tensor_random(shape).data, name)
    
    def __len__(self):
        return len(self.tensor)
    
    def __getitem__(self, idx):
        return self.tensor[idx]
    
    def __setitem__(self, idx, value):
        self.tensor[idx] = value
    
    def __repr__(self):
        return f"Parameter(shape={self.shape}, name={self.name})"