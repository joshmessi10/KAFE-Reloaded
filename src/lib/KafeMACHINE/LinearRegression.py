from global_utils import check_sig
from TypeUtils import machine_t, vector_numeros_t
from .BaseMachine import BaseMachine


class LinearRegression(BaseMachine):
    def __init__(self):
        super().__init__()
        self.slope_ = 0.0
        self.intercept_ = 0.0

    @check_sig([3], vector_numeros_t, vector_numeros_t, is_method=True)
    def fit(self, X, y):
        n = len(X)
        if n == 0 or len(y) != n:
            raise Exception("LinearRegression: Input lengths must match and be > 0")

        sum_x = sum(X)
        sum_y = sum(y)
        sum_xy = sum(xi * yi for xi, yi in zip(X, y))
        sum_x2 = sum(xi**2 for xi in X)

        denominator = n * sum_x2 - sum_x**2
        if denominator == 0:
            self.slope_ = 0.0
            self.intercept_ = sum_y / n
        else:
            self.slope_ = (n * sum_xy - sum_x * sum_y) / denominator
            self.intercept_ = (sum_y - self.slope_ * sum_x) / n

        self._is_fitted = True
        return self

    @check_sig([2], vector_numeros_t, is_method=True)
    def predict(self, X):
        if not self._is_fitted:
            raise Exception("LinearRegression: Must call fit before predict")
        return [self.slope_ * val + self.intercept_ for val in X]

    def __repr__(self):
        return (
            f"LinearRegression(slope={self.slope_:.4f}, intercept={self.intercept_:.4f})"
        )
