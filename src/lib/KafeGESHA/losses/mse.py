"""Funciones de pérdida MSE y MAE."""
from lib.KafeMATH.funciones import math_abs
from lib.KafeGESHA.losses.loss import LossFunction


class MeanSquaredError(LossFunction):
    def compute(self, y_true, y_pred):
        errors = [(yt - yp) * (yt - yp) for yt, yp in zip(y_true, y_pred)]
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