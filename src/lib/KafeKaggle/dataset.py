from typing import Any

from lib.KafeMACHINE.BaseMachine import BaseMachine


class ImageDataset(BaseMachine):
    """Contenedor indexable [X, y] de imágenes etiquetadas (tipo KAFE MACHINE).

    Empaqueta en un único valor accesible por índice las imágenes ya
    decodificadas y sus etiquetas, evitando que KAFE tenga que enlazar una
    lista heterogénea (rechazada por el lenguaje) y sin realizar ninguna
    división: ``datos[0]`` son las imágenes y ``datos[1]`` las etiquetas.
    Hereda de :class:`BaseMachine` para que el visitante lo reconozca como
    tipo KAFE ``MACHINE``.
    """

    def __init__(self, X, y):
        super().__init__()
        self._parts = (X, y)

    def __getitem__(self, index) -> Any:
        return self._parts[index]

    def __iter__(self):
        return iter(self._parts)

    def __len__(self):
        return len(self._parts)

    def __eq__(self, other):
        return isinstance(other, ImageDataset) and self._parts == other._parts
