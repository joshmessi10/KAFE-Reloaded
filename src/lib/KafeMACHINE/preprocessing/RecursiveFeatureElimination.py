from global_utils import check_sig
from TypeUtils import pardos_type, numeric_matrix_types, numeric_vector_types, integer_type
from lib.KafePARDOS.DataFrame import DataFrame
from ..BaseMachine import BaseMachine
from ..linear.LinearRegression import LinearRegression


class RecursiveFeatureElimination(BaseMachine):
    """
    Recursive Feature Elimination (RFE) - Feature selection by recursive elimination.

    Mathematical basis:
        1. Train model with all the features
        2. Calculate the importance of each feature (coefficients or feature importance)
        3. Eliminate the least important feature
        4. Repeat until you have n_features

        Importance is calculated as |coefficient| for linear models.

    Parameters:
        estimator: model with coef_ or feature_importances_ (default LinearRegression)
        n_features: number of features to select (default 1)

    Attributes (after fit):
        selected_indices_: indices of selected features
        ranking_: importance ranking (1 = most important)
        support_: boolean mask of selected features
        n_features_in_: number of input features
    """

    def __init__(self, estimator=None, n_features=1):
        super().__init__()
        if n_features <= 0:
            raise Exception("RecursiveFeatureElimination: n_features must be positive")

        self.estimator = estimator if estimator is not None else LinearRegression()
        self.n_features = n_features
        self.selected_indices_ = []
        self.ranking_ = []
        self.support_ = []
        self.n_features_in_ = 0

    def _get_feature_importance(self, X, y):
        """Train the model and return importance of features."""
        self.estimator.fit(X, y)

        if hasattr(self.estimator, 'coef_'):
            importances = [abs(c) for c in self.estimator.coef_]
        elif hasattr(self.estimator, 'feature_importances_'):
            importances = list(self.estimator.feature_importances_)
        else:
            n = len(X)
            importances = []
            for j in range(len(X[0])):
                mean = sum(X[i][j] for i in range(n)) / n
                var = sum((X[i][j] - mean) ** 2 for i in range(n)) / n
                importances.append(var)

        return importances

    @check_sig([3], [pardos_type] + numeric_matrix_types, numeric_vector_types, is_method=True)
    def fit(self, X, y):
        """Adjusts RFE by recursively removing less important features."""
        matrix, cols, is_df = self._unwrap_data(X)

        if not matrix or not matrix[0]:
            raise Exception("RecursiveFeatureElimination: Empty input data")

        n_samples = len(matrix)
        n_features = len(matrix[0])
        self.n_features_in_ = n_features

        if self.n_features > n_features:
            raise Exception(
                f"RecursiveFeatureElimination: n_features ({self.n_features}) > n_features_in ({n_features})"
            )

        active_indices = list(range(n_features))
        self.ranking_ = [0] * n_features

        current_rank = n_features

        while len(active_indices) > self.n_features:
            X_active = [[row[j] for j in active_indices] for row in matrix]

            importances = self._get_feature_importance(X_active, y)

            min_imp_idx = 0
            for i in range(1, len(importances)):
                if importances[i] < importances[min_imp_idx]:
                    min_imp_idx = i

            removed_feature = active_indices[min_imp_idx]
            self.ranking_[removed_feature] = current_rank
            current_rank -= 1

            active_indices.pop(min_imp_idx)

        for idx in active_indices:
            self.ranking_[idx] = 1

        self.selected_indices_ = sorted(active_indices)
        self.support_ = [i in self.selected_indices_ for i in range(n_features)]

        self._is_fitted = True
        return self

    @check_sig([2], [pardos_type] + numeric_matrix_types, is_method=True)
    def transform(self, data):
        """Transform by selecting only the chosen features."""
        self._check_fitted("transform")
        matrix, cols, is_df = self._unwrap_data(data)

        if not matrix or not matrix[0]:
            raise Exception("RecursiveFeatureElimination: Empty input data")

        if len(matrix[0]) != self.n_features_in_:
            raise Exception(
                f"RecursiveFeatureElimination: Expected {self.n_features_in_} features, got {len(matrix[0])}"
            )

        result = [[row[j] for j in self.selected_indices_] for row in matrix]

        new_cols = [cols[j] for j in self.selected_indices_] if cols and is_df else None
        return DataFrame(new_cols, result) if is_df else result

    def fit_transform(self, X, y):
        """Fit and transform in one step."""
        self.fit(X, y)
        return self.transform(X)

    @check_sig([2], [pardos_type] + numeric_matrix_types, is_method=True)
    def inverse_transform(self, data):
        """Not implemented (transformation is not invertible)."""
        raise Exception("RecursiveFeatureElimination: inverse_transform not implemented")

    def __repr__(self):
        return f"RecursiveFeatureElimination(n_features={self.n_features})"
