from lib.KafeMATH.funciones import exp
from global_utils import check_sig
from TypeUtils import vector_numeros_t, matriz_numeros_t
from .BaseMachine import BaseMachine


class LogisticRegression(BaseMachine):
    def __init__(self, learning_rate=0.01, max_iter=1000):
        super().__init__()
        self.coef_ = []
        self.intercept_ = 0.0
        self.learning_rate = learning_rate
        self.max_iter = max_iter

    @check_sig([3], vector_numeros_t + matriz_numeros_t, vector_numeros_t, is_method=True)
    def fit(self, X, y):
        n = len(X)
        if n == 0:
            raise Exception("LogisticRegression: Empty input data")

        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = len(X[0])
        if m == 0:
            raise Exception("LogisticRegression: Empty feature vector")

        self.coef_ = [0.0] * m
        self.intercept_ = 0.0

        for yi in y:
            if yi not in (0, 1):
                raise Exception("LogisticRegression: y must contain only 0 and 1")

        for _ in range(self.max_iter):
            z = [
                self.intercept_ + sum(self.coef_[j] * row[j] for j in range(m))
                for row in X
            ]
            y_pred = [
                1.0 / (1.0 + exp(-max(-100, min(100, zi)))) for zi in z
            ]

            dw = [0.0] * m
            db = 0.0
            for i in range(n):
                err = y_pred[i] - y[i]
                db += err
                for j in range(m):
                    dw[j] += err * X[i][j]

            for j in range(m):
                self.coef_[j] -= self.learning_rate * dw[j] / n
            self.intercept_ -= self.learning_rate * db / n

        self._is_fitted = True
        return self

    @check_sig([2], vector_numeros_t + matriz_numeros_t, is_method=True)
    def predict(self, X):
        self._check_fitted("predict")
        if not X:
            return []
        probs = self.predict_proba(X)
        return [0 if p[0] >= 0.5 else 1 for p in probs]

    @check_sig([2], vector_numeros_t + matriz_numeros_t, is_method=True)
    def predict_proba(self, X):
        self._check_fitted("predict_proba")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = len(self.coef_)
        if m == 0:
            raise Exception("LogisticRegression: Model not fitted")

        res = []
        for row in X:
            if len(row) != m:
                raise Exception(f"LogisticRegression: Expected {m} features, got {len(row)}")
            z = self.intercept_ + sum(self.coef_[j] * row[j] for j in range(m))
            p = 1.0 / (1.0 + exp(-max(-100, min(100, z))))
            res.append([1.0 - p, p])
        return res

    @check_sig([3], vector_numeros_t + matriz_numeros_t, vector_numeros_t, is_method=True)
    def score(self, X, y):
        self._check_fitted("score")
        preds = self.predict(X)
        correct = sum(1 for p, t in zip(preds, y) if p == t)
        return correct / len(X) if len(X) > 0 else 0.0

    def __repr__(self):
        return f"LogisticRegression(coef={self.coef_}, intercept={self.intercept_:.4f})"
