"""Modelo Sequential — grafo lineal de capas.

Un modelo Sequential representa una pila de capas donde la salida
de cada capa es la entrada de la siguiente:

    Input → Layer 1 → Layer 2 → ... → Layer N → Output

Uso:

    model = Sequential([
        Dense(128, activation="relu"),
        Dense(64, activation="relu"),
        Dense(10, activation="softmax")
    ])
    model.compile("adam", "categorical_crossentropy", ["accuracy"])
    model.fit(X_train, y_train, epochs=10, batch_size=32)

También se puede construir capa a capa:

    model = Sequential()
    model.add(Dense(128, activation="relu"))
    model.add(Dense(10, activation="softmax"))

O con capas de activación separadas (útil para visualizar el grafo):

    model = Sequential([
        Dense(128),
        ReLULayer(),
        Dense(10),
        SoftmaxLayer()
    ])
"""
from lib.KafeGESHA.core.model import Model
from global_utils import check_sig
from TypeUtils import gesha_t


class Sequential(Model):
    """Modelo de grafo lineal.

    Implementa forward como recorrido directo de las capas y backward
    como recorrido inverso.

    Attributes:
        layers: Lista de capas en orden de ejecución.
    """

    def __init__(self, layers=None):
        """Inicializa el modelo Sequential.

        Args:
            layers: Lista inicial de capas (opcional). Se pueden añadir
                    más capas con add().
        """
        super().__init__()
        self.layers = []
        if layers:
            for layer in layers:
                self.add(layer)

    @check_sig([2], [gesha_t], is_method=True)
    def add(self, layer):
        """Añade una capa al final del grafo lineal.

        Si la capa tiene input_shape vacío y ya hay capas en el modelo,
        infiere el input_shape desde la capa anterior (si tiene .units).

        Args:
            layer: Instancia de Layer.

        Returns:
            self (para encadenamiento fluent: model.add(l1).add(l2)).
        """
        if self.layers and hasattr(layer, "input_shape") and not layer.input_shape:
            prev = self.layers[-1]
            if hasattr(prev, "units"):
                layer.input_shape = (prev.units,)
        self.layers.append(layer)
        return self

    # ------------------------------------------------------------------
    # Interfaz abstracta Model
    # ------------------------------------------------------------------

    def forward(self, x):
        """Propagación hacia adelante: recorre todas las capas en orden."""
        out = x
        for layer in self.layers:
            out = layer.forward(out)
        return out

    def backward(self, grad):
        """Propagación hacia atrás: recorre las capas en orden inverso.

        Aplica el backward de cada capa pasando learning_rate del optimizador.
        """
        if not isinstance(grad, list):
            grad = [grad]
        for layer in reversed(self.layers):
            grad = layer.backward(grad, learning_rate=self._optimizer_obj.lr)
        return grad

    def parameters(self):
        """Devuelve lista plana de todos los parámetros entrenables."""
        params = []
        for layer in self.layers:
            params.extend(layer.parameters())
        return params

    def get_layers(self):
        """Devuelve la lista de capas en orden de ejecución."""
        return self.layers

    # ------------------------------------------------------------------
    # summary
    # ------------------------------------------------------------------

    def summary(self):
        """Imprime un resumen de la arquitectura Sequential."""
        print("=== Sequential ===")
        for i, layer in enumerate(self.layers, 1):
            print(f"  [{i}] ", end="")
            layer.summary()
        total = len(self.parameters())
        print(f"  Parámetros totales: {total}")
        print("==================")

    def __repr__(self):
        names = [layer.__class__.__name__ for layer in self.layers]
        return f"Sequential(layers={names})"