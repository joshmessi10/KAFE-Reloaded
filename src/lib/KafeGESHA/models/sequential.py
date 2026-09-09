"""Modelo Sequential para apilar capas."""
from lib.KafeGESHA.core.model import GeshaDeep
from global_utils import check_sig
from TypeUtils import gesha_t, cadena_t, lista_cadenas_t, void_t


class Sequential(GeshaDeep):
    """
    Modelo Sequential para apilar capas secuencialmente.
    Hereda de GeshaDeep y añade una interfaz simplificada.
    """
    
    def __init__(self, layers=None, model_type="classification"):
        """
        Inicializa un modelo Sequential.
        
        Args:
            layers: Lista de capas iniciales (opcional)
            model_type: Tipo de modelo (classification, regression, binary, clustering)
        """
        super().__init__(model_type=model_type)
        if layers:
            for layer in layers:
                self.add(layer)
    
    @check_sig([2], [gesha_t], is_method=True)
    def add(self, layer):
        """Añade una capa al modelo."""
        super().add(layer)
        return self
    
    def __repr__(self):
        """Representación del modelo."""
        layer_names = [layer.__class__.__name__ for layer in self.layers]
        return f"Sequential(layers={layer_names})"