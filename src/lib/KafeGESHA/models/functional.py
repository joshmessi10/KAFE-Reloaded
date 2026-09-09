"""API Funcional para modelos complejos."""
from lib.KafeGESHA.core.model import GeshaDeep
from global_utils import check_sig
from TypeUtils import gesha_t, vector_numeros_t, matriz_numeros_t


class Functional:
    """
    API Funcional para modelos con múltiples entradas/salidas y arquitecturas complejas.
    Permite definir modelos como grafos dirigidos acíclicos (DAG).
    """
    
    def __init__(self, inputs=None, outputs=None):
        """
        Inicializa un modelo funcional.
        
        Args:
            inputs: Lista de tensores de entrada
            outputs: Tensor de salida
        """
        self.inputs = inputs or []
        self.outputs = outputs
        self._layers = []
        self._compiled = False
    
    def add_layer(self, layer):
        """Añade una capa al modelo."""
        self._layers.append(layer)
        return self
    
    def get_layer(self, name=None, index=None):
        """Obtiene una capa por nombre o índice."""
        if index is not None:
            return self._layers[index]
        if name is not None:
            for layer in self._layers:
                if getattr(layer, 'name', None) == name:
                    return layer
        raise ValueError("Capa no encontrada")
    
    def summary(self):
        """Imprime el resumen del modelo."""
        print("=== Functional Model ===")
        for i, layer in enumerate(self._layers, 1):
            print(f"Layer {i}: {layer.__class__.__name__}")
    
    def __repr__(self):
        """Representación del modelo."""
        return f"Functional(layers={len(self._layers)})"