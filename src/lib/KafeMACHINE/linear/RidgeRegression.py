from global_utils import check_sig
from TypeUtils import numeric_vector_types, numeric_matrix_types, pardos_type
from ..metrics import r2_score
from ..BaseMachine import BaseMachine


class RidgeRegression(BaseMachine):
    """
    Ridge Regression — Regularized linear regression with L2 penalty.

    Minimiza: ||y - Xθ||² + α||θ||²

    The L2 regularization term (α||θ||²) penalizes large coefficients,
    reducing overfitting without removing features.

    Closed solution: θ = (X^T X + αI)^{-1} X^T y

    Parameters:
        alpha: regularization force (default 1.0)
        fit_intercept: if intercept is set (default True)
        max_iter: maximum iterations for gradient descent (default 1000)
        learning_rate: learning rate (default 0.01)
        tol: tolerance for convergence (default 1e-4)

    Attributes (after fit):
        coef_: model coefficients
        intercept_: model intercept
    """

    def __init__(self, alpha=1.0, fit_intercept=True, max_iter=1000,
                 learning_rate=0.01, tol=1e-4):
        super().__init__()
        if alpha < 0:
            raise Exception("RidgeRegression: alpha must be non-negative")
        if max_iter <= 0:
            raise Exception("RidgeRegression: max_iter must be positive")
        if learning_rate <= 0:
            raise Exception("RidgeRegression: learning_rate must be positive")

        self.alpha = alpha
        self.fit_intercept = fit_intercept
        self.max_iter = max_iter
        self.learning_rate = learning_rate
        self.tol = tol
        self.coef_ = []
        self.intercept_ = 0.0

    def _solve_ridge(self, X, y):
        """Solve Ridge regression using the closed solution: θ = (X^T X + αI)^{-1} X^T and"""
        n = len(X)
        m = len(X[0])

        Xt = list(zip(*X))
        XtX = [
            [sum(Xt[i][k] * Xt[j][k] for k in range(n)) for j in range(m)]
            for i in range(m)
        ]

        for i in range(m):
            XtX[i][i] += self.alpha

        Xty = [sum(Xt[i][k] * y[k] for k in range(n)) for i in range(m)]

        return self._gaussian_elimination(XtX, Xty)

    def _gaussian_elimination(self, A, b):
        """Solve Ax = b using Gaussian elimination with partial pivoting."""
        n = len(A)
        aug = [row[:] + [b[i]] for i, row in enumerate(A)]

        for col in range(n):
            pivot = max(range(col, n), key=lambda r: abs(aug[r][col]))
            if abs(aug[pivot][col]) < 1e-12:
                raise Exception("RidgeRegression: Singular matrix")
            aug[col], aug[pivot] = aug[pivot], aug[col]

            piv_val = aug[col][col]
            for j in range(col, n + 1):
                aug[col][j] /= piv_val

            for row in range(n):
                if row != col:
                    factor = aug[row][col]
                    for j in range(col, n + 1):
                        aug[row][j] -= factor * aug[col][j]

        return [aug[i][n] for i in range(n)]

    @check_sig([3], [pardos_type] + numeric_vector_types + numeric_matrix_types, numeric_vector_types, is_method=True)
    def fit(self, X, y):
        """Fit the Ridge regression model."""
        matrix, cols, is_df = self._unwrap_data(X)
        matrix = self._validate_matrix_shape(matrix)

        n = len(matrix)
        if len(y) != n:
            raise Exception("RidgeRegression: X and y must have the same number of samples")

        if self.fit_intercept:
            mean_X = [sum(matrix[i][j] for i in range(n)) / n for j in range(len(matrix[0]))]
            mean_y = sum(y) / n
            X_centered = [[matrix[i][j] - mean_X[j] for j in range(len(matrix[0]))]
                          for i in range(n)]
            y_centered = [y[i] - mean_y for i in range(n)]

            theta = self._solve_ridge(X_centered, y_centered)
            self.coef_ = theta
            self.intercept_ = mean_y - sum(mean_X[j] * self.coef_[j] for j in range(len(mean_X)))
        else:
            theta = self._solve_ridge(matrix, y)
            self.coef_ = theta
            self.intercept_ = 0.0

        self._is_fitted = True
        return self

    @check_sig([2], numeric_vector_types + numeric_matrix_types, is_method=True)
    def predict(self, X):
        """Predict using Ridge regression."""
        self._check_fitted("predict")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = len(self.coef_)
        for i, row in enumerate(X):
            if len(row) != m:
                raise Exception(
                    f"RidgeRegression: Expected {m} features, got {len(row)} at sample {i}"
                )

        return [
            self.intercept_ + sum(self.coef_[j] * row[j] for j in range(m))
            for row in X
        ]

    def score(self, X, y, metric=None):
        """Evaluate using R² (default) or a custom metric."""
        self._check_fitted("score")
        preds = self.predict(X)
        if metric is None:
            return r2_score(y, preds)
        return metric(y, preds)

    def __repr__(self):
        return f"RidgeRegression(alpha={self.alpha}, coef={self.coef_}, intercept={self.intercept_:.4f})"
