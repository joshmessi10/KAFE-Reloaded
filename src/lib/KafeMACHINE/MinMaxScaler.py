from global_utils import check_sig
from TypeUtils import pardos_t, matriz_numeros_t
from lib.KafePARDOS.DataFrame import DataFrame


class MinMaxScaler:
    def __init__(self):
        self.data_min_ = []
        self.data_max_ = []
        self.scale_ = []

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def fit(self, data):
        matrix = data.data if isinstance(data, DataFrame) else data

        if not matrix or not matrix[0]:
            raise Exception("MinMaxScaler: Empty input data")

        n_features = len(matrix[0])

        self.data_min_ = [min(row[j] for row in matrix) for j in range(n_features)]
        self.data_max_ = [max(row[j] for row in matrix) for j in range(n_features)]
        self.scale_ = [
            0.0 if (self.data_max_[j] - self.data_min_[j]) == 0
            else 1.0 / (self.data_max_[j] - self.data_min_[j])
            for j in range(n_features)
        ]
        return self

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def transform(self, data):
        if not self.data_min_:
            raise Exception("MinMaxScaler: Must call fit before transform")

        if isinstance(data, DataFrame):
            matrix, cols, is_df = data.data, data.columns, True
        else:
            matrix, cols, is_df = data, [], False

        if len(matrix[0]) != len(self.data_min_):
            raise Exception("MinMaxScaler: Input dimension does not match fitted model")

        result = [
            [
                (row[j] - self.data_min_[j]) * self.scale_[j]
                for j in range(len(self.data_min_))
            ]
            for row in matrix
        ]

        return DataFrame(cols, result) if is_df else result

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def fit_transform(self, data):
        return self.fit(data).transform(data)

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def inverse_transform(self, data):
        if not self.data_min_:
            raise Exception("MinMaxScaler: Must call fit before inverse_transform")

        if isinstance(data, DataFrame):
            matrix, cols, is_df = data.data, data.columns, True
        else:
            matrix, cols, is_df = data, [], False

        if len(matrix[0]) != len(self.data_min_):
            raise Exception("MinMaxScaler: Input dimension does not match fitted model")

        result = [
            [
                self.data_min_[j] if self.scale_[j] == 0
                else row[j] / self.scale_[j] + self.data_min_[j]
                for j in range(len(self.data_min_))
            ]
            for row in matrix
        ]

        return DataFrame(cols, result) if is_df else result

    def __repr__(self):
        return f"MinMaxScaler(data_min={self.data_min_}, data_max={self.data_max_})"
