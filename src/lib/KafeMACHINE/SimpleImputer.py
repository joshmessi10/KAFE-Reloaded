from lib.KafeMATH.funciones import isnan
from global_utils import check_sig
from TypeUtils import pardos_t, matriz_cualquiera_t
from lib.KafePARDOS.DataFrame import DataFrame
from .BaseMachine import BaseMachine


def _is_missing(v):
    if v is None:
        return True
    try:
        return isnan(v)
    except (TypeError, ValueError):
        return False


class SimpleImputer(BaseMachine):
    def __init__(self, strategy, fill_value=None):
        super().__init__()
        valid = ("mean", "median", "most_frequent", "constant")
        if strategy not in valid:
            raise Exception(f"SimpleImputer: strategy must be one of {valid}")
        if strategy == "constant" and fill_value is None:
            raise Exception("SimpleImputer: fill_value is required for strategy='constant'")
        self.strategy = strategy
        self.fill_value = fill_value
        self.statistics_ = []

    def _compute_statistic(self, col_values):
        non_null = [v for v in col_values if not _is_missing(v)]
        if not non_null:
            if self.strategy == "constant":
                return self.fill_value
            raise Exception(f"SimpleImputer: Cannot compute '{self.strategy}' on column with all missing values")
        if self.strategy == "mean":
            return sum(non_null) / len(non_null)
        elif self.strategy == "median":
            sorted_vals = sorted(non_null)
            n = len(sorted_vals)
            mid = n // 2
            return (sorted_vals[mid - 1] + sorted_vals[mid]) / 2 if n % 2 == 0 else sorted_vals[mid]
        elif self.strategy == "most_frequent":
            counts = {}
            for v in non_null:
                counts[v] = counts.get(v, 0) + 1
            return max(counts, key=lambda k: counts[k])
        else:
            return self.fill_value

    @check_sig([2], [pardos_t, matriz_cualquiera_t], is_method=True)
    def fit(self, data):
        if isinstance(data, DataFrame):
            matrix = data.data
            n_features = len(data.columns)
        else:
            matrix = data
            n_features = len(matrix[0]) if matrix else 0

        self.statistics_ = [
            self._compute_statistic([row[j] for row in matrix])
            for j in range(n_features)
        ]
        self._is_fitted = True
        return self

    @check_sig([2], [pardos_t, matriz_cualquiera_t], is_method=True)
    def transform(self, data):
        self._check_fitted("transform")
        matrix, cols, is_df = self._unwrap_data(data)

        if len(matrix[0]) != len(self.statistics_):
            raise Exception("SimpleImputer: Input dimension does not match fitted model")

        result = [
            [self.statistics_[j] if _is_missing(val) else val for j, val in enumerate(row)]
            for row in matrix
        ]

        return DataFrame(cols, result) if is_df else result

    def __repr__(self):
        return f"SimpleImputer(strategy='{self.strategy}', statistics={self.statistics_})"
