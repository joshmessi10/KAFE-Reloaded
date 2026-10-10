"""API pública de pérdidas GESHA."""
from .base import LossFunction,Loss
from .mean_squared_error import MeanSquaredError
from .mean_absolute_error import MeanAbsoluteError
from .binary_cross_entropy import BinaryCrossEntropy
from .categorical_cross_entropy import CategoricalCrossEntropy
from .sparse_categorical_cross_entropy import SparseCategoricalCrossEntropy
__all__=['LossFunction','Loss','MeanSquaredError','MeanAbsoluteError','BinaryCrossEntropy','CategoricalCrossEntropy','SparseCategoricalCrossEntropy']
