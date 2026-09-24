from global_utils import check_sig
from lib.KafePARDOS.DataFrame import DataFrame
from TypeUtils import numeric_matrix_types, pardos_type

from ..BaseMachine import BaseMachine


class RobustScaler(BaseMachine):
    """
    Robust Scaler — Robust scaling using the median and IQR.

    Scale features using outlier-robust statistics:
    - Median (Q2) instead of mean
    - IQR (Q3 - Q1) instead of standard deviation

    Mathematical foundation:
        X_scaled = (X - median) / IQR

        Where:
            median = Q2 (50th percentile)
            IQR = Q3 - Q1 (75th percentile - 25th percentile)

    Parameters:
        with_centering: if True, centers using median (default True)
        with_scaling: if True, scales using IQR (default True)
        quantile_range: quantile range for IQR (default (25.0, 75.0))

    Attributes (after fit):
        center_: median by feature (if with_centering=True)
        scale_: IQR per feature (if with_scaling=True)
    """

    def __init__(self, with_centering=True, with_scaling=True, quantile_range=(25.0, 75.0)):
        super().__init__()
        if not with_centering and not with_scaling:
            raise Exception("RobustScaler: at least one of with_centering or with_scaling must be True")

        self.with_centering = with_centering
        self.with_scaling = with_scaling
        self.quantile_range = quantile_range
        self.center_ = []
        self.scale_ = []

    def _percentile(self, sorted_data, p):
        """Calculates the p percentile of ordered data."""
        n = len(sorted_data)
        if n == 0:
            return 0.0
        if n == 1:
            return sorted_data[0]

        k = (p / 100.0) * (n - 1)
        f = int(k)
        c = k - f

        if f + 1 < n:
            return sorted_data[f] + c * (sorted_data[f + 1] - sorted_data[f])
        return sorted_data[f]

    @check_sig([2], [pardos_type] + numeric_matrix_types, is_method=True)
    def fit(self, data):
        """Fit RobustScaler by calculating the median and IQR."""
        matrix, cols, is_df = self._unwrap_data(data)

        if not matrix or not matrix[0]:
            raise Exception("RobustScaler: Empty input data")

        n_samples = len(matrix)
        n_features = len(matrix[0])

        q_min, q_max = self.quantile_range

        self.center_ = []
        self.scale_ = []

        for j in range(n_features):
            values = sorted([matrix[i][j] for i in range(n_samples)])

            median = self._percentile(values, 50.0)
            q1 = self._percentile(values, q_min)
            q3 = self._percentile(values, q_max)
            iqr = q3 - q1

            self.center_.append(median)
            self.scale_.append(iqr)

        self._is_fitted = True
        return self

    def fit_transform(self, data):
        return self.fit(data).transform(data)

    @check_sig([2], [pardos_type] + numeric_matrix_types, is_method=True)
    def transform(self, data):
        """Transforms data using adjusted median and IQR."""
        self._check_fitted("transform")
        matrix, cols, is_df = self._unwrap_data(data)

        if len(matrix[0]) != len(self.center_):
            raise Exception("RobustScaler: Input dimension does not match fitted model")

        result = []
        for row in matrix:
            new_row = []
            for j in range(len(self.center_)):
                val = row[j]

                if self.with_centering:
                    val -= self.center_[j]

                if self.with_scaling:
                    if self.scale_[j] != 0:
                        val /= self.scale_[j]

                new_row.append(val)
            result.append(new_row)

        return DataFrame(cols, result) if is_df else result

    @check_sig([2], [pardos_type] + numeric_matrix_types, is_method=True)
    def inverse_transform(self, data):
        """Reverse the transformation."""
        self._check_fitted("inverse_transform")
        matrix, cols, is_df = self._unwrap_data(data)

        if len(matrix[0]) != len(self.center_):
            raise Exception("RobustScaler: Input dimension does not match fitted model")

        result = []
        for row in matrix:
            new_row = []
            for j in range(len(self.center_)):
                val = row[j]

                if self.with_scaling:
                    val *= self.scale_[j]

                if self.with_centering:
                    val += self.center_[j]

                new_row.append(val)
            result.append(new_row)

        return DataFrame(cols, result) if is_df else result

    def __repr__(self):
        return (
            f"RobustScaler(with_centering={self.with_centering}, "
            f"with_scaling={self.with_scaling})"
        )
