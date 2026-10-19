"""API pública de pérdidas GESHA."""

from .base import Loss, LossFunction
from .binary_cross_entropy import BinaryCrossEntropy
from .categorical_cross_entropy import CategoricalCrossEntropy
from .mean_absolute_error import MeanAbsoluteError
from .mean_squared_error import MeanSquaredError
from .sparse_categorical_cross_entropy import SparseCategoricalCrossEntropy

__all__ = [
    "LossFunction",
    "Loss",
    "MeanSquaredError",
    "MeanAbsoluteError",
    "BinaryCrossEntropy",
    "CategoricalCrossEntropy",
    "SparseCategoricalCrossEntropy",
]
