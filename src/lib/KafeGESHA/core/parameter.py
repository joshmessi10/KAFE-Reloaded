"""Trainable parameters for deep learning models."""
from lib.KafeGESHA.core.tensor import Tensor


class Parameter:
    """
    Represents a trainable parameter (weights or bias).
    Wraps a Tensor with metadata for optimization.
    """
    
    def __init__(self, data, name=None, requires_grad=True):
        """
        Initializes a parameter.
        
        Args:
            data: List of lists or list of numbers
            name: Optional parameter name
            requires_grad: If True, calculate gradients
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
        """Create a parameter of zeros."""
        from lib.KafeNUMK import functions as numk
        return Parameter(numk.zeros_nd(shape), name)
    
    @staticmethod
    def random(shape, name=None):
        """Create a parameter with random values."""
        from lib.KafeNUMK import functions as numk
        return Parameter(numk.random_tensor(shape), name)
    
    def __len__(self):
        return len(self.tensor)
    
    def __getitem__(self, idx):
        return self.tensor[idx]
    
    def __setitem__(self, idx, value):
        self.tensor[idx] = value
    
    def __repr__(self):
        return f"Parameter(shape={self.shape}, name={self.name})"
