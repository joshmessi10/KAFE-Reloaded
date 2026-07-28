import math
from global_utils import check_sig
from TypeUtils import pardos_t, matriz_numeros_t
from lib.KafePARDOS.DataFrame import DataFrame


class StandardScaler:
    def __init__(self):
        self.mean_ = []
        self.scale_ = []

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def fit(self, data):
        matrix = data.data if isinstance(data, DataFrame) else data

        if not matrix or not matrix[0]:
            raise Exception("StandardScaler: Empty input data")

        n_samples = len(matrix)
        n_features = len(matrix[0])

        self.mean_ = [
            sum(row[j] for row in matrix) / n_samples
            for j in range(n_features)
        ]
        self.scale_ = [
            math.sqrt(
                sum((row[j] - self.mean_[j]) ** 2 for row in matrix) / n_samples
            )
            for j in range(n_features)
        ]
        return self

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def transform(self, data):
        if not self.mean_:
            raise Exception("StandardScaler: Must call fit before transform")

        if isinstance(data, DataFrame):
            matrix, cols, is_df = data.data, data.columns, True
        else:
            matrix, cols, is_df = data, [], False

        if len(matrix[0]) != len(self.mean_):
            raise Exception("StandardScaler: Input dimension does not match fitted model")

        result = [
            [
                0.0 if self.scale_[j] == 0 else (row[j] - self.mean_[j]) / self.scale_[j]
                for j in range(len(self.mean_))
            ]
            for row in matrix
        ]

        return DataFrame(cols, result) if is_df else result

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def fit_transform(self, data):
        return self.fit(data).transform(data)

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def inverse_transform(self, data):
        if not self.mean_:
            raise Exception("StandardScaler: Must call fit before inverse_transform")

        if isinstance(data, DataFrame):
            matrix, cols, is_df = data.data, data.columns, True
        else:
            matrix, cols, is_df = data, [], False

        if len(matrix[0]) != len(self.mean_):
            raise Exception("StandardScaler: Input dimension does not match fitted model")

        result = [
            [row[j] * self.scale_[j] + self.mean_[j] for j in range(len(self.mean_))]
            for row in matrix
        ]

        return DataFrame(cols, result) if is_df else result

    def __repr__(self):
        return f"StandardScaler(mean={self.mean_}, scale={self.scale_})"
