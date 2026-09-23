from global_utils import check_sig
from TypeUtils import pardos_type, numeric_matrix_types, float_type
from lib.KafePARDOS.DataFrame import DataFrame
from ..BaseMachine import BaseMachine


class VarianceThreshold(BaseMachine):
    """
    Eliminates features with variance below a threshold.

    Fundamento matematico:
        For each feature j:
            Var(j) = (1/n) * Sum(x_ij - mean_j)^2

        If Var(j) < threshold, the feature is removed.

        A feature with variance 0 is constant (it does not provide information).
        A feature with low variance has little discriminatory capacity.

    Parametros:
        threshold: minimum variance threshold (default 0.0)

    Attributes (after fit):
        variances_: variance of each feature
        selected_indices_: indices of selected features
        n_features_in_: number of input features
        n_features_out_: number of output features
    """

    def __init__(self, threshold=0.0):
        super().__init__()
        if threshold < 0:
            raise Exception("VarianceThreshold: threshold must be non-negative")
        self.threshold = threshold
        self.variances_ = []
        self.selected_indices_ = []
        self.n_features_in_ = 0
        self.n_features_out_ = 0

    @check_sig([2], [pardos_type] + numeric_matrix_types, is_method=True)
    def fit(self, data):
        """Set VarianceThreshold (calculate variances and select features)."""
        matrix, cols, is_df = self._unwrap_data(data)

        if not matrix or not matrix[0]:
            raise Exception("VarianceThreshold: Empty input data")

        n_samples = len(matrix)
        n_features = len(matrix[0])
        self.n_features_in_ = n_features

        self.variances_ = []
        for j in range(n_features):
            mean = sum(row[j] for row in matrix) / n_samples
            var = sum((row[j] - mean) ** 2 for row in matrix) / n_samples
            self.variances_.append(var)

        self.selected_indices_ = [j for j in range(n_features) if self.variances_[j] > self.threshold]
        self.n_features_out_ = len(self.selected_indices_)

        self._is_fitted = True
        return self

    def fit_transform(self, data):
        """Fit and transform in one step."""
        return self.fit(data).transform(data)

    @check_sig([2], [pardos_type] + numeric_matrix_types, is_method=True)
    def transform(self, data):
        """Transform by eliminating features with low variance."""
        self._check_fitted("transform")
        matrix, cols, is_df = self._unwrap_data(data)

        if not matrix or not matrix[0]:
            raise Exception("VarianceThreshold: Empty input data")

        if len(matrix[0]) != self.n_features_in_:
            raise Exception(
                f"VarianceThreshold: Expected {self.n_features_in_} features, got {len(matrix[0])}"
            )

        result = [[row[j] for j in self.selected_indices_] for row in matrix]

        new_cols = [cols[j] for j in self.selected_indices_] if cols and is_df else None
        return DataFrame(new_cols, result) if is_df else result

    @check_sig([2], [pardos_type] + numeric_matrix_types, is_method=True)
    def inverse_transform(self, data):
        """Not implemented (transformation is not invertible)."""
        raise Exception("VarianceThreshold: inverse_transform not implemented")

    def __repr__(self):
        return f"VarianceThreshold(threshold={self.threshold}, n_features_out={self.n_features_out_})"
