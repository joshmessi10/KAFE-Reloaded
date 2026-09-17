from global_utils import check_sig
from TypeUtils import vector_numeros_t, matriz_numeros_t, pardos_t
from .metrics import r2_score
from .BaseMachine import BaseMachine


class LassoRegression(BaseMachine):
    """
    Lasso Regression — Regresión lineal regularizada con penalización L1.

    Minimiza: ||y - Xθ||² + α||θ||₁

    El término de regularización L1 (α||θ||₁) puede eliminar features
    completamente (coeficientes = 0), actuando como selección de features.

    Solución: Coordinate Descent (no hay solución cerrada para L1).

    Parámetros:
        alpha: fuerza de regularización (default 1.0)
        fit_intercept: si se ajusta intercepto (default True)
        max_iter: máximo de iteraciones (default 1000)
        tol: tolerancia para convergencia (default 1e-4)

    Atributos (después de fit):
        coef_: coeficientes del modelo
        intercept_: intercepto del modelo
    """

    def __init__(self, alpha=1.0, fit_intercept=True, max_iter=1000, tol=1e-4):
        super().__init__()
        if alpha < 0:
            raise Exception("LassoRegression: alpha must be non-negative")
        if max_iter <= 0:
            raise Exception("LassoRegression: max_iter must be positive")

        self.alpha = alpha
        self.fit_intercept = fit_intercept
        self.max_iter = max_iter
        self.tol = tol
        self.coef_ = []
        self.intercept_ = 0.0

    def _soft_threshold(self, x, threshold):
        """Operador de umbral suave: sign(x) * max(|x| - threshold, 0)"""
        if x > threshold:
            return x - threshold
        elif x < -threshold:
            return x + threshold
        else:
            return 0.0

    def _coordinate_descent(self, X, y):
        """Ajusta Lasso usando Coordinate Descent."""
        n = len(X)
        m = len(X[0])

        beta = [0.0] * m

        Xt = list(zip(*X))
        XtX = [
            [sum(Xt[i][k] * Xt[j][k] for k in range(n)) for j in range(m)]
            for i in range(m)
        ]
        Xty = [sum(Xt[i][k] * y[k] for k in range(n)) for i in range(m)]

        col_norms = [XtX[j][j] for j in range(m)]

        for iteration in range(self.max_iter):
            beta_old = beta[:]

            for j in range(m):
                if col_norms[j] < 1e-12:
                    continue

                r_j = Xty[j] - sum(XtX[j][k] * beta[k] for k in range(m) if k != j)

                beta[j] = self._soft_threshold(r_j / col_norms[j], self.alpha / col_norms[j])

            max_change = max(abs(beta[j] - beta_old[j]) for j in range(m))
            if max_change < self.tol:
                break

        return beta

    @check_sig([3], [pardos_t] + vector_numeros_t + matriz_numeros_t, vector_numeros_t, is_method=True)
    def fit(self, X, y):
        """Ajusta el modelo Lasso regression."""
        matrix, cols, is_df = self._unwrap_data(X)
        matrix = self._validate_matrix_shape(matrix)

        n = len(matrix)
        if len(y) != n:
            raise Exception("LassoRegression: X and y must have the same number of samples")

        if self.fit_intercept:
            mean_X = [sum(matrix[i][j] for i in range(n)) / n for j in range(len(matrix[0]))]
            mean_y = sum(y) / n
            X_centered = [[matrix[i][j] - mean_X[j] for j in range(len(matrix[0]))]
                          for i in range(n)]
            y_centered = [y[i] - mean_y for i in range(n)]

            beta = self._coordinate_descent(X_centered, y_centered)
            self.coef_ = beta
            self.intercept_ = mean_y - sum(mean_X[j] * self.coef_[j] for j in range(len(mean_X)))
        else:
            beta = self._coordinate_descent(matrix, y)
            self.coef_ = beta
            self.intercept_ = 0.0

        self._is_fitted = True
        return self

    @check_sig([2], vector_numeros_t + matriz_numeros_t, is_method=True)
    def predict(self, X):
        """Predice usando Lasso regression."""
        self._check_fitted("predict")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = len(self.coef_)
        for i, row in enumerate(X):
            if len(row) != m:
                raise Exception(
                    f"LassoRegression: Expected {m} features, got {len(row)} at sample {i}"
                )

        return [
            self.intercept_ + sum(self.coef_[j] * row[j] for j in range(m))
            for row in X
        ]

    def score(self, X, y, metric=None):
        """Evalúa usando R² (default) o una métrica personalizada."""
        self._check_fitted("score")
        preds = self.predict(X)
        if metric is None:
            return r2_score(y, preds)
        return metric(y, preds)

    def __repr__(self):
        return f"LassoRegression(alpha={self.alpha}, coef={self.coef_}, intercept={self.intercept_:.4f})"
