import copy
from lib.KafeMATH.funciones import sqrt
from global_utils import check_sig
from TypeUtils import vector_numeros_t, matriz_numeros_t, entero_t, pardos_t
from .metrics import accuracy_score
from .BaseMachine import BaseMachine


class KNN(BaseMachine):
    def __init__(self, k=3):
        super().__init__()
        self.k = k
        self.X_train = []
        self.y_train = []

    def _validate_k(self, n_samples):
        if self.k <= 0:
            raise Exception("KNN: k must be positive")
        if self.k > n_samples:
            raise Exception("KNN: k cannot be greater than number of training samples")

    def _euclidean_distance(self, a, b):
        return sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))

    @check_sig([3], [pardos_t] + vector_numeros_t + matriz_numeros_t, vector_numeros_t, is_method=True)
    def fit(self, X, y):
        matrix, cols, is_df = self._unwrap_data(X)
        matrix = self._validate_matrix_shape(matrix)

        n = len(matrix)
        if len(y) != n:
            raise Exception("KNN: X and y must have the same number of samples")
        self._validate_k(n)

        self.X_train = copy.deepcopy(matrix)
        self.y_train = copy.deepcopy(y)
        self._is_fitted = True
        return self

    @check_sig([2], vector_numeros_t + matriz_numeros_t, is_method=True)
    def predict(self, X):
        self._check_fitted("predict")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = len(self.X_train[0])
        for i, row in enumerate(X):
            if len(row) != m:
                raise Exception(
                    f"KNN: Expected {m} features, got {len(row)} at sample {i}"
                )
        return [self._predict_one(x) for x in X]

    def _predict_one(self, x):
        distances = [
            (self._euclidean_distance(x, x_train), i)
            for i, x_train in enumerate(self.X_train)
        ]
        distances.sort(key=lambda d: d[0])
        k_nearest = distances[: self.k]

        k_labels = [self.y_train[i] for _, i in k_nearest]
        counts = {}
        for lbl in k_labels:
            counts[lbl] = counts.get(lbl, 0) + 1
        max_count = max(counts.values())
        tied = [lbl for lbl in sorted(set(k_labels)) if counts[lbl] == max_count]
        if len(tied) == 1:
            return tied[0]
        for _, i in k_nearest:
            if self.y_train[i] in tied:
                return self.y_train[i]
        return tied[0]

    @check_sig([2], vector_numeros_t + matriz_numeros_t, is_method=True)
    def predict_proba(self, X):
        self._check_fitted("predict_proba")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = len(self.X_train[0])
        for i, row in enumerate(X):
            if len(row) != m:
                raise Exception(
                    f"KNN: Expected {m} features, got {len(row)} at sample {i}"
                )

        classes = sorted(set(self.y_train))
        result = []
        for x in X:
            distances = [
                (self._euclidean_distance(x, x_train), i)
                for i, x_train in enumerate(self.X_train)
            ]
            distances.sort(key=lambda d: d[0])
            k_nearest = distances[: self.k]
            k_labels = [self.y_train[i] for _, i in k_nearest]

            probas = [k_labels.count(c) / self.k for c in classes]
            result.append(probas)
        return result

    def score(self, X, y, metric=None):
        """Score using accuracy (default) or a custom metric.

        Default metric: accuracy_score
        """
        self._check_fitted("score")
        preds = self.predict(X)
        if metric is None:
            return accuracy_score(y, preds)
        return metric(y, preds)

    def __repr__(self):
        return f"KNN(k={self.k})"
