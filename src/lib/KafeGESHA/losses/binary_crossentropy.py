"""Binary Cross Entropy loss function."""
from lib.KafeGESHA.losses.loss import LossFunction
from lib.KafeMATH.functions import log


class BinaryCrossEntropy(LossFunction):
    """
    Robust BCE:
    • Clip the predictions to the range (ε, 1-ε).
    • Accepts scalar or list probability [probability].
    """

    def __init__(self, epsilon: float = 1e-8):
        self.epsilon = epsilon

    def _as_scalar(self, yp):
        """
        Convert yp to scalar if it is [scale].
        Maintains float if it already is.
        """
        return yp[0] if isinstance(yp, list) and len(yp) == 1 else yp

    def _clip(self, p):
        p = self._as_scalar(p)
        return max(self.epsilon, min(1.0 - self.epsilon, p))

    def compute(self, y_true, y_pred):
        loss = []
        for yt, yp in zip(y_true, y_pred, strict=False):
            yp_c = self._clip(yp)
            term = -(yt * log(yp_c) + (1 - yt) * log(1 - yp_c))
            loss.append(term)
        return sum(loss) / len(loss)

    def derivative(self, y_true, y_pred):
        grads = []
        for yt, yp in zip(y_true, y_pred, strict=False):
            yp_c = self._clip(yp)
            grad = (yp_c - yt) / (yp_c * (1 - yp_c) + self.epsilon)
            grads.append(grad)
        return grads