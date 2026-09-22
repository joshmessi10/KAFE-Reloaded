"""Representación de tensores N-dimensionales para KafeGESHA.

Tensor es un wrapper sobre las listas Python que Numk opera.
Añade semántica de Deep Learning: validación de regularidad, metadata de forma.
"""
from lib.KafeNUMK import funciones as numk


class Tensor:
    """
    Tensor N-dimensional para Deep Learning.
    
    Almacena datos como listas Python anidadas (la representación nativa de Numk).
    Numk opera sobre estos datos directamente.
    
    Propiedades:
        data: lista Python N-D (operada por Numk)
        shape: tupla de dimensiones (calculada por numk.shape)
        ndim: número de dimensiones
    """

    def __init__(self, data):
        """
        Inicializa un tensor con datos.

        Args:
            data: Estructura anidada de listas (1D, 2D, 3D, ...)

        Raises:
            ValueError: Si el tensor es irregular
        """
        self.data = data
        self.shape = numk.shape(data)
        self._validate_regular()

    def _validate_regular(self):
        """Valida que el tensor sea regular (rectangular)."""
        self._validate_recursive(self.data, self.shape, 0)

    def _validate_recursive(self, data, expected_shape, depth):
        """Valida recursivamente que todas las sublistas tengan la longitud esperada."""
        if depth == len(expected_shape) - 1:
            if len(data) != expected_shape[depth]:
                raise ValueError(
                    f"Tensor irregular: sublista en dimensión {depth} "
                    f"tiene longitud {len(data)}, se esperaba {expected_shape[depth]}"
                )
        else:
            if len(data) != expected_shape[depth]:
                raise ValueError(
                    f"Tensor irregular: dimensión {depth} "
                    f"tiene longitud {len(data)}, se esperaba {expected_shape[depth]}"
                )
            for i, sublist in enumerate(data):
                if not isinstance(sublist, list):
                    raise ValueError(
                        f"Tensor irregular: se esperaba sublista en dimensión {depth}, "
                        f"se encontró {type(sublist).__name__}"
                    )
                self._validate_recursive(sublist, expected_shape, depth + 1)

    @property
    def ndim(self):
        """Número de dimensiones del tensor."""
        return len(self.shape)

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        return self.data[idx]

    def __setitem__(self, idx, value):
        self.data[idx] = value

    def __repr__(self):
        return f"Tensor(shape={self.shape}, data={self.data})"


def tensor_zeros(shape):
    """Crea un tensor de ceros con la forma dada usando Numk."""
    return Tensor(numk.zeros_nd(shape))


def tensor_ones(shape):
    """Crea un tensor de unos con la forma dada usando Numk."""
    return Tensor(numk.ones(shape))


def tensor_random(shape, low=-0.5, high=0.5):
    """Crea un tensor con valores aleatorios usando Numk."""
    return Tensor(numk.random_tensor(shape, low, high))
