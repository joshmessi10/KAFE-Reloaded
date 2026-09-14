"""Clase base abstracta para capas de red neuronal."""
from abc import ABC, abstractmethod
from global_utils import check_sig
from TypeUtils import vector_numeros_t, flotante_t, void_t


class Layer(ABC):
    """Clase base para todas las capas de KafeGESHA.

    Contrato público:
    - forward(x)  → propagación hacia adelante
    - backward(error, learning_rate) → propagación hacia atrás
    - parameters() → lista de parámetros entrenables (vacía por defecto)
    - train() / eval() → modo entrenamiento / evaluación
    - __call__(input_node) → graph-building para la API Functional
    """

    def __init__(self):
        self._training = True
        self.name = None

    @abstractmethod
    @check_sig([2], vector_numeros_t, is_method=True)
    def forward(self, x):
        """Propagación hacia adelante."""
        pass

    @abstractmethod
    @check_sig([3, 4], vector_numeros_t + [flotante_t], [flotante_t], [flotante_t, void_t], is_method=True)
    def backward(self, output_error, learning_rate, regularization_lambda=None):
        """Propagación hacia atrás."""
        pass

    def parameters(self):
        """Devuelve lista plana de parámetros entrenables. Subcapas con pesos deben sobreescribir este método."""
        return []

    def train(self):
        """Activa el modo entrenamiento."""
        self._training = True

    def eval(self):
        """Activa el modo evaluación (inferencia)."""
        self._training = False

    def connect(self, input_node):
        """Conecta esta capa a un nodo simbólico para la API Functional.

        Nota: NO usar __call__ aquí para evitar conflicto con el sistema de
        tipos de KAFE (callable(layer) devolvería True, clasificando la capa
        como FUNC en lugar de GESHA).

        Args:
            input_node: Input, Node o lista de Nodes.

        Returns:
            Node simbólico de salida con esta capa registrada.
        """
        from lib.KafeGESHA.core.node import Node
        inbound = input_node if isinstance(input_node, list) else [input_node]
        output_node = Node(layer=self, inbound_nodes=inbound)
        self._output_node = output_node
        return output_node

    def summary(self):
        """Imprime información de la capa."""
        print(f"{self.__class__.__name__}")