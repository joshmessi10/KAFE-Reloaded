from .base import Initializer
from .constant import Constant, Ones, Zeros
from .orthogonal import Orthogonal
from .random import (
    GlorotNormal,
    GlorotUniform,
    HeNormal,
    HeUniform,
    RandomNormal,
    RandomUniform,
)

_INITIALIZERS = {
    "zeros": Zeros,
    "ones": Ones,
    "random_uniform": RandomUniform,
    "random_normal": RandomNormal,
    "glorot_uniform": GlorotUniform,
    "glorot_normal": GlorotNormal,
    "he_uniform": HeUniform,
    "he_normal": HeNormal,
    "orthogonal": Orthogonal,
}


def get(identifier, seed=None):
    if isinstance(identifier, Initializer):
        return identifier
    if identifier is None:
        return GlorotUniform(seed)
    if isinstance(identifier, (int, float)):
        return Constant(identifier)
    cls = _INITIALIZERS.get(str(identifier).lower())
    if cls is None:
        raise ValueError(f"Inicializador desconocido: {identifier}")
    return cls(seed=seed) if cls not in (Zeros, Ones) else cls()


__all__ = [
    "Initializer",
    "Zeros",
    "Ones",
    "RandomUniform",
    "RandomNormal",
    "GlorotUniform",
    "GlorotNormal",
    "HeUniform",
    "HeNormal",
    "Orthogonal",
    "Constant",
    "get",
]
