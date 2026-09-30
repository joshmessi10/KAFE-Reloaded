"""Pérdidas escalares y gradientes respecto a las predicciones.

NUMK recorre las listas; cada pérdida define su fórmula y reducción.
compute/derivative conservan el orden histórico (real, predicho).
"""
from abc import ABC, abstractmethod
from math import prod

from lib.KafeMATH.funciones import log
from lib.KafeNUMK import funciones as numk


def _prediction_shape(y_true, y_pred):
    shape = numk.shape(y_pred)
    if len(shape) not in (1, 2) or 0 in shape or numk.shape(y_true) != shape:
        raise ValueError("Loss requiere predicciones y etiquetas de igual forma no vacia")
    return shape


class LossFunction(ABC):
    @abstractmethod
    def compute(self, y_true, y_pred):
        pass

    @abstractmethod
    def derivative(self, y_true, y_pred):
        pass

    def forward(self, y_pred, y_true):
        value = self.compute(y_true, y_pred)
        self._y_true = numk.tensor(y_true)
        self._y_pred = numk.tensor(y_pred)
        return value

    def backward(self):
        if not hasattr(self, "_y_true"):
            raise RuntimeError("Loss.backward requiere forward")
        return self.derivative(self._y_true, self._y_pred)


class MeanSquaredError(LossFunction):
    def compute(self, y_true, y_pred):
        count = prod(_prediction_shape(y_true, y_pred))
        errors = numk.map_elements(lambda yt, yp: (yt - yp) ** 2, y_true, y_pred)
        return numk.sum_all(errors) / count

    def derivative(self, y_true, y_pred):
        count = prod(_prediction_shape(y_true, y_pred))
        return numk.map_elements(lambda yt, yp: 2 * (yp - yt) / count, y_true, y_pred)


class MeanAbsoluteError(LossFunction):
    def compute(self, y_true, y_pred):
        count = prod(_prediction_shape(y_true, y_pred))
        return numk.sum_all(numk.abs_tensor(numk.broadcast_sub(y_pred, y_true))) / count

    def derivative(self, y_true, y_pred):
        count = prod(_prediction_shape(y_true, y_pred))
        return numk.map_elements(
            lambda yt, yp: (0.0 if yp == yt else (1.0 if yp > yt else -1.0)) / count,
            y_true, y_pred)


class BinaryCrossEntropy(LossFunction):
    def __init__(self, epsilon=1e-8):
        self.epsilon = epsilon

    def _clip(self, value):
        return max(self.epsilon, min(1.0 - self.epsilon, value))

    def compute(self, y_true, y_pred):
        count = prod(_prediction_shape(y_true, y_pred))
        probabilities = numk.map_elements(self._clip, y_pred)
        errors = numk.map_elements(
            lambda yt, p: -(yt * log(p) + (1 - yt) * log(1 - p)), y_true, probabilities)
        return numk.sum_all(errors) / count

    def derivative(self, y_true, y_pred):
        count = prod(_prediction_shape(y_true, y_pred))
        probabilities = numk.map_elements(self._clip, y_pred)
        # Estabilización histórica: conserva los fixtures binarios deterministas.
        return numk.map_elements(
            lambda yt, p: (p - yt) / (p * (1 - p) + self.epsilon) / count,
            y_true, probabilities)


class CategoricalCrossEntropy(LossFunction):
    """Promedio por muestra; backward devuelve dL/dP, nunca dL/dZ."""

    def __init__(self, epsilon=1e-8):
        self.epsilon = epsilon

    def compute(self, y_true, y_pred):
        shape = _prediction_shape(y_true, y_pred)
        samples = shape[0] if len(shape) == 2 else 1
        terms = numk.map_elements(lambda yt, p: -yt * log(p + self.epsilon), y_true, y_pred)
        return numk.sum_all(terms) / samples

    def derivative(self, y_true, y_pred):
        shape = _prediction_shape(y_true, y_pred)
        samples = shape[0] if len(shape) == 2 else 1
        return numk.map_elements(
            lambda yt, p: -yt / (p + self.epsilon) / samples, y_true, y_pred)


class SparseCategoricalCrossEntropy(CategoricalCrossEntropy):
    """Adapta índices de clase a etiquetas one-hot y reutiliza CCE."""

    def _one_hot(self, labels, predictions):
        shape = numk.shape(predictions)
        if len(shape) not in (1, 2) or 0 in shape:
            raise ValueError("Sparse CCE requiere predicciones no vacias")
        samples, classes = (1, shape[0]) if len(shape) == 1 else shape
        labels = labels if isinstance(labels, list) else [labels]
        if len(labels) != samples:
            raise ValueError("Sparse CCE: numero de etiquetas incompatible")
        targets = numk.zeros_nd([samples, classes])
        for row, label in zip(targets, labels):
            if type(label) is not int or not 0 <= label < classes:
                raise ValueError("Sparse CCE: indice de clase invalido")
            row[label] = 1.0
        return targets[0] if len(shape) == 1 else targets

    def compute(self, y_true, y_pred):
        return super().compute(self._one_hot(y_true, y_pred), y_pred)

    def derivative(self, y_true, y_pred):
        return super().derivative(self._one_hot(y_true, y_pred), y_pred)


Loss = LossFunction
