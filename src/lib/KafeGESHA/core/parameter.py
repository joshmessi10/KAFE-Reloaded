"""Parámetros entrenables para modelos de deep learning."""
from lib.KafeGESHA.core.tensor import Tensor


class Parameter:
    """
    Representa un parámetro entrenable (pesos o sesgo).
    Wraps un Tensor con metadata para optimización.
    """
    
    def __init__(self, data, name=None, requires_grad=True):
        """
        Inicializa un parámetro.
        
        Args:
            data: Lista de listas o lista de números
            name: Nombre opcional del parámetro
            requires_grad: Si True, calcula gradientes
        """
        if isinstance(data, Tensor):
            self.tensor = data
        else:
            self.tensor = Tensor(data)
        self.name = name
        self.requires_grad = requires_grad
        self.grad = None
        self.shape = self.tensor.shape
    
    @staticmethod
    def zeros(shape, name=None):
        """Crea un parámetro de ceros."""
        from lib.KafeNUMK import funciones as numk
        return Parameter(numk.zeros_nd(shape), name)
    
    @staticmethod
    def random(shape, name=None):
        """Crea un parámetro con valores aleatorios."""
        from lib.KafeNUMK import funciones as numk
        return Parameter(numk.random_tensor(shape), name)
    
    def __len__(self):
        return len(self.tensor)
    
    def __getitem__(self, idx):
        return self.tensor[idx]
    
    def __setitem__(self, idx, value):
        self.tensor[idx] = value
    
    def __repr__(self):
        return f"Parameter(shape={self.shape}, name={self.name})"
