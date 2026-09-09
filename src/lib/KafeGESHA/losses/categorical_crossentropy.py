"""Funciones de pérdida Categorical Cross Entropy."""
from lib.KafeMATH.funciones import log
from lib.KafeGESHA.losses.loss import LossFunction


class CategoricalCrossEntropy(LossFunction):
    def __init__(self, epsilon: float = 1e-8):
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
    def __init__(self, epsilon: float = 1e-8):
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