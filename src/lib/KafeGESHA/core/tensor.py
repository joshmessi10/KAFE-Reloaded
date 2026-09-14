"""Representación de tensores N-dimensionales para KafeGESHA."""


class Tensor:
    """
    Representación de tensor N-dimensional como listas anidadas.
    Soporta任意 cantidad de dimensiones con validación de regularidad.
    """

    def __init__(self, data):
        """
        Inicializa un tensor con datos.

        Args:
            data: Estructura anidada de listas (1D, 2D, 3D, ...)

        Raises:
            ValueError: Si el tensor es irregular (sublistas de distinta longitud)
        """
        self.data = data
        self.shape = Tensor._compute_shape(data)
        self._validate_regular()

    @staticmethod
    def _compute_shape(data):
        """Calcula la forma del tensor recursivamente."""
        if not data:
            return (0,)
        if not isinstance(data[0], list):
            return (len(data),)
        inner_shape = Tensor._compute_shape(data[0])
        return (len(data),) + inner_shape

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


def _create_nd(fill_value, shape):
    """Crea una estructura ND anidada con el valor dado."""
    if len(shape) == 1:
        return [fill_value for _ in range(shape[0])]
    return [_create_nd(fill_value, shape[1:]) for _ in range(shape[0])]


def tensor_zeros(shape):
    """Crea un tensor de ceros con la forma dada."""
    return Tensor(_create_nd(0.0, shape))


def tensor_ones(shape):
    """Crea un tensor de unos con la forma dada."""
    return Tensor(_create_nd(1.0, shape))


def tensor_random(shape, low=-0.5, high=0.5):
    """Crea un tensor con valores aleatorios en el rango [low, high]."""
    import random

    def _random_nd(shape):
        if len(shape) == 1:
            return [random.uniform(low, high) for _ in range(shape[0])]
        return [_random_nd(shape[1:]) for _ in range(shape[0])]

    return Tensor(_random_nd(shape))