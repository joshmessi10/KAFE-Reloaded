"""Funciones de pérdida para KafeGESHA.

    LossFunction  — clase base abstracta
    MeanSquaredError, MeanAbsoluteError
    BinaryCrossEntropy, CategoricalCrossEntropy, SparseCategoricalCrossEntropy
"""
from abc import ABC, abstractmethod
from lib.KafeMATH.funciones import log, math_abs


class LossFunction(ABC):
    @abstractmethod
    def compute(self, y_true, y_pred):
        pass

    @abstractmethod
    def derivative(self, y_true, y_pred):
        pass


class MeanSquaredError(LossFunction):
    def compute(self, y_true, y_pred):
        errors = [(yt - yp) ** 2 for yt, yp in zip(y_true, y_pred)]
        return sum(errors) / len(errors)

    def derivative(self, y_true, y_pred):
        n = len(y_true)
        return [2 * (yp - yt) / n for yt, yp in zip(y_true, y_pred)]


class MeanAbsoluteError(LossFunction):
    def compute(self, y_true, y_pred):
        errors = [math_abs(yt - yp) for yt, yp in zip(y_true, y_pred)]
        return sum(errors) / len(errors)

    def derivative(self, y_true, y_pred):
        n = len(y_true)
        return [
            ((yp - yt) / math_abs(yp - yt)) / n if yp != yt else 0
            for yt, yp in zip(y_true, y_pred)
        ]


class BinaryCrossEntropy(LossFunction):
    def __init__(self, epsilon=1e-8):
        self.epsilon = epsilon

    def _clip(self, p):
        p = p[0] if isinstance(p, list) and len(p) == 1 else p
        return max(self.epsilon, min(1.0 - self.epsilon, p))

    def compute(self, y_true, y_pred):
        loss = []
        for yt, yp in zip(y_true, y_pred):
            yp_c = self._clip(yp)
            loss.append(-(yt * log(yp_c) + (1 - yt) * log(1 - yp_c)))
        return sum(loss) / len(loss)

    def derivative(self, y_true, y_pred):
        grads = []
        for yt, yp in zip(y_true, y_pred):
            yp_c = self._clip(yp)
            grads.append((yp_c - yt) / (yp_c * (1 - yp_c) + self.epsilon))
        return grads


class CategoricalCrossEntropy(LossFunction):
    def __init__(self, epsilon=1e-8):
        self.epsilon = epsilon

    def compute(self, y_true, y_pred):
        loss = [
            -sum(yt_i * log(yp_i + self.epsilon) for yt_i, yp_i in zip(yt, yp))
            for yt, yp in zip(y_true, y_pred)
        ]
        return sum(loss) / len(loss)

    def derivative(self, y_true, y_pred):
        return [
            [yp_i - yt_i for yt_i, yp_i in zip(yt, yp)]
            for yt, yp in zip(y_true, y_pred)
        ]


class SparseCategoricalCrossEntropy(LossFunction):
    def __init__(self, epsilon=1e-8):
        self.epsilon = epsilon

    def compute(self, y_true, y_pred):
        loss = [-log(yp[int(yt)] + self.epsilon) for yt, yp in zip(y_true, y_pred)]
        return sum(loss) / len(loss)

    def derivative(self, y_true, y_pred):
        grads = []
        for yt, yp in zip(y_true, y_pred):
            grad = [yp_i for yp_i in yp]
            grad[int(yt)] -= 1
            grads.append(grad)
        return grads
