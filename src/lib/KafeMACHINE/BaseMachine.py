from typing import Any, TypeAlias, cast

from lib.KafePARDOS.DataFrame import DataFrame

Number: TypeAlias = int | float
Vector: TypeAlias = list[Number]
Matrix: TypeAlias = list[Vector]


class BaseMachine:
    """Base class for all KAFE Machine components.

    Provides common infrastructure:
    - Fitted state tracking (_is_fitted, _check_fitted)
    - DataFrame unwrapping (_unwrap_data)
    - Matrix shape validation (_validate_matrix_shape)

    The `fit()` contract is semantic, not syntactic:
    - Supervised models: fit(X, y)
    - Unsupervised models: fit(X)
    - Transformers: fit(data) — may be DataFrame or matrix
    - Encoders: fit(df, columns) — DataFrame-specific

    Each category defines its own fit signature. BaseMachine.fit()
    only sets _is_fitted = True and returns self.
    """

    def __init__(self):
        self._is_fitted = False

    def _check_fitted(self, method_name):
        """Verify that fit() has been called before the given method."""
        if not getattr(self, '_is_fitted', False):
            raise Exception(f"{type(self).__name__}: Must call fit before {method_name}")

    def _unwrap_data(self, data: Any) -> tuple[Any, list[str], bool]:
        """Extract raw data from a DataFrame or return data as-is.

        Returns:
            tuple: (matrix, columns, is_dataframe)
                - matrix: list[list] with the data rows
                - columns: list[str] with column names (empty if not DataFrame)
                - is_dataframe: bool indicating whether input was a DataFrame
        """
        if isinstance(data, DataFrame):
            return data.data, data.columns, True
        return data, [], False

    def _validate_matrix_shape(
        self, X: Any, expected_features: int | None = None
    ) -> Matrix:
        """Validate that X is a well-formed 2D matrix.

        - Converts 1D input to 2D (each element becomes a single-feature sample)
        - Verifies all rows have the same number of features
        - Optionally verifies the expected number of features

        Returns:
            list[list]: The validated 2D matrix

        Raises:
            Exception: If input is empty, inconsistent, or has wrong dimensions
        """
        if not X:
            raise Exception(f"{type(self).__name__}: Empty input data")

        # Convert 1D to 2D
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        n_features = len(X[0])
        if n_features == 0:
            raise Exception(f"{type(self).__name__}: Empty feature vector")

        for i, row in enumerate(X):
            if len(row) != n_features:
                raise Exception(
                    f"{type(self).__name__}: Inconsistent feature dimensions "
                    f"(row 0 has {n_features}, row {i} has {len(row)})"
                )

        if expected_features is not None and n_features != expected_features:
            raise Exception(
                f"{type(self).__name__}: Expected {expected_features} features, got {n_features}"
            )

        return cast(Matrix, X)

    def fit(self, X, y=None):
        """Fit the component to data.

        The fit contract is semantic — each category defines its own signature:
        - Supervised models: fit(X, y)
        - Unsupervised models: fit(X)
        - Transformers: fit(data)
        - Encoders: fit(df, columns)

        This base implementation only marks the component as fitted.
        """
        self._is_fitted = True
        return self

    def predict(self, X):
        raise NotImplementedError(
            f"'{type(self).__name__}' does not support predict()"
        )

    def transform(self, X):
        raise NotImplementedError(
            f"'{type(self).__name__}' does not support transform()"
        )

    def inverse_transform(self, X):
        raise NotImplementedError(
            f"'{type(self).__name__}' does not support inverse_transform()"
        )

    def score(self, X, y, metric=None):
        """Score the model using the given metric.

        Args:
            X: Features (list or DataFrame)
            y: True target values
            metric: Optional metric function (y_true, y_pred) -> float.
                    If None, uses the model's default metric.

        Returns:
            float: The metric score
        """
        raise NotImplementedError(
            f"'{type(self).__name__}' does not support score()"
        )
