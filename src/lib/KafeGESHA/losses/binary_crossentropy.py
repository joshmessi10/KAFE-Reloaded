"""Función de pérdida Binary Cross Entropy."""
from lib.KafeMATH.funciones import log
from lib.KafeGESHA.losses.loss import LossFunction


class BinaryCrossEntropy(LossFunction):
    """
    BCE robusta:
    • Clippea las predicciones al rango (ε, 1-ε).
    • Acepta probabilidad escalar o lista [probabilidad].
    """

    def __init__(self, epsilon: float = 1e-8):
        self.epsilon = epsilon

    def _as_scalar(self, yp):
        """
        Convierte yp a escalar si es [escala].
        Mantiene float si ya lo es.
        """
        return yp[0] if isinstance(yp, list) and len(yp) == 1 else yp

    def _clip(self, p):
        p = self._as_scalar(p)
        return max(self.epsilon, min(1.0 - self.epsilon, p))

    def compute(self, y_true, y_pred):
        loss = []
        for yt, yp in zip(y_true, y_pred):
            yp_c = self._clip(yp)
            term = -(yt * log(yp_c) + (1 - yt) * log(1 - yp_c))
            loss.append(term)
        return sum(loss) / len(loss)

    def derivative(self, y_true, y_pred):
        grads = []
        for yt, yp in zip(y_true, y_pred):
            yp_c = self._clip(yp)
            grad = (yp_c - yt) / (yp_c * (1 - yp_c) + self.epsilon)
            grads.append(grad)
        return grads