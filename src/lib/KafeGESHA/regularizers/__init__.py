from .base import Regularizer
from .l1 import L1
from .l2 import L2
from .l1_l2 import L1L2
def get(identifier):
    if identifier is None or hasattr(identifier, 'gradient'): return identifier
    names = {'l1': L1, 'l2': L2, 'l1_l2': L1L2, 'l1l2': L1L2}
    cls = names.get(str(identifier).lower())
    if cls is None: raise ValueError(f"Regularizador desconocido: {identifier}")
    return cls()
__all__ = ['Regularizer','L1','L2','L1L2','get']
