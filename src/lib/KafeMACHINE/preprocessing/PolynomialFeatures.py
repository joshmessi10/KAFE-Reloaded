from global_utils import check_sig
from lib.KafePARDOS.DataFrame import DataFrame
from TypeUtils import numeric_matrix_types, pardos_type

from ..BaseMachine import BaseMachine


class PolynomialFeatures(BaseMachine):
    """
    Generates polynomial features up to a specified degree.

    Transform features [x1, x2] into:
    - degree=1: [1, x1, x2]
    - degree=2: [1, x1, x2, x1², x1*x2, x2²]
    - degree=3: [1, x1, x2, x1², x1*x2, x2², x1³, x1²*x2, x1*x2², x2³]

    Mathematical foundation:
        For d features and degree n, generate all combinations
        of powers p1, p2, ..., pd where p1 + p2 + ... + pd <= n.

    Parameters:
        degree: maximum degree of the polynomial (default 2)
        include_bias: if the bias term is included (1s column) (default True)

    Attributes (after fit):
        n_features_in_: number of input features
        n_features_out_: number of output features
    """

    def __init__(self, degree=2, include_bias=True):
        super().__init__()
        if degree < 1:
            raise Exception("PolynomialFeatures: degree must be at least 1")
        self.degree = degree
        self.include_bias = include_bias
        self.n_features_in_ = 0
        self.n_features_out_ = 0
        self._feature_names = []

    def _generate_combinations(self, n_features, degree):
        """Generates all power combinations for polynomial features."""
        if n_features == 0:
            return []

        combinations = []

        def _helper(current, remaining_features, remaining_degree):
            if remaining_features == 0:
                combinations.append(current[:])
                return

            for d in range(remaining_degree + 1):
                current.append(d)
                _helper(current, remaining_features - 1, remaining_degree - d)
                current.pop()

        _helper([], n_features, degree)
        return combinations

    def _get_feature_names(self):
        """Generates feature names for the output."""
        names = []
        combinations = self._generate_combinations(self.n_features_in_, self.degree)

        for combo in combinations:
            if not self.include_bias and all(p == 0 for p in combo):
                continue

            parts = []
            for i, power in enumerate(combo):
                if power == 0:
                    continue
                elif power == 1:
                    parts.append(f"x{i}")
                else:
                    parts.append(f"x{i}^{power}")

            if not parts:
                names.append("1")
            else:
                names.append("*".join(parts))

        return names

    @check_sig([2], [pardos_type] + numeric_matrix_types, is_method=True)
    def fit(self, data):
        """Sets PolynomialFeatures (calculates output dimensions)."""
        matrix, cols, is_df = self._unwrap_data(data)

        if not matrix or not matrix[0]:
            raise Exception("PolynomialFeatures: Empty input data")

        self.n_features_in_ = len(matrix[0])
        combinations = self._generate_combinations(self.n_features_in_, self.degree)

        if self.include_bias:
            self.n_features_out_ = len(combinations)
        else:
            self.n_features_out_ = len(combinations) - 1

        self._feature_names = self._get_feature_names()
        self._is_fitted = True
        return self

    def fit_transform(self, data):
        """Fit and transform in one step."""
        return self.fit(data).transform(data)

    @check_sig([2], [pardos_type] + numeric_matrix_types, is_method=True)
    def transform(self, data):
        """Transform features into polynomial features."""
        self._check_fitted("transform")
        matrix, cols, is_df = self._unwrap_data(data)

        if not matrix or not matrix[0]:
            raise Exception("PolynomialFeatures: Empty input data")

        if len(matrix[0]) != self.n_features_in_:
            raise Exception(
                f"PolynomialFeatures: Expected {self.n_features_in_} features, got {len(matrix[0])}"
            )

        combinations = self._generate_combinations(self.n_features_in_, self.degree)

        result = []
        for row in matrix:
            new_row = []
            for combo in combinations:
                if not self.include_bias and all(p == 0 for p in combo):
                    continue

                value = 1.0
                for j, power in enumerate(combo):
                    if power > 0:
                        value *= row[j] ** power

                new_row.append(value)
            result.append(new_row)

        return DataFrame(self._feature_names, result) if is_df else result

    @check_sig([2], [pardos_type] + numeric_matrix_types, is_method=True)
    def inverse_transform(self, data):
        """Not implemented for PolynomialFeatures (transformation is not invertible)."""
        raise Exception("PolynomialFeatures: inverse_transform not implemented (non-invertible)")

    def __repr__(self):
        return f"PolynomialFeatures(degree={self.degree}, include_bias={self.include_bias})"
