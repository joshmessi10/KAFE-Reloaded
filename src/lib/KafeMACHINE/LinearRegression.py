from global_utils import check_sig
from TypeUtils import vector_numeros_t, matriz_numeros_t
from .BaseMachine import BaseMachine


class LinearRegression(BaseMachine):
    def __init__(self):
        super().__init__()
        self.coef_ = []
        self.intercept_ = 0.0

    def _solve(self, A, b):
        n = len(A)
        aug = [row[:] + [b[i]] for i, row in enumerate(A)]

        for col in range(n):
            pivot = max(range(col, n), key=lambda r: abs(aug[r][col]))
            if abs(aug[pivot][col]) < 1e-12:
                raise Exception("LinearRegression: Singular matrix")
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

    @check_sig([3], vector_numeros_t + matriz_numeros_t, vector_numeros_t, is_method=True)
    def fit(self, X, y):
        n = len(X)
        if n == 0:
            raise Exception("LinearRegression: Empty input data")

        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = len(X[0])
        if m == 0:
            raise Exception("LinearRegression: Empty feature vector")

        if len(y) != n:
            raise Exception("LinearRegression: X and y must have the same number of samples")

        X_design = [[1.0] + row for row in X]
        y_vals = list(y)

        Xt = list(zip(*X_design))
        XtX = [
            [sum(a * b for a, b in zip(Xt[i], Xt[j])) for j in range(m + 1)]
            for i in range(m + 1)
        ]
        Xty = [sum(Xt[i][j] * y_vals[j] for j in range(n)) for i in range(m + 1)]

        theta = self._solve(XtX, Xty)

        self.intercept_ = theta[0]
        self.coef_ = theta[1:]
        self._is_fitted = True
        return self

    @check_sig([2], vector_numeros_t + matriz_numeros_t, is_method=True)
    def predict(self, X):
        self._check_fitted("predict")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = len(self.coef_)
        return [
            self.intercept_ + sum(self.coef_[j] * row[j] for j in range(m))
            for row in X
        ]

    @check_sig([3], vector_numeros_t + matriz_numeros_t, vector_numeros_t, is_method=True)
    def score(self, X, y):
        self._check_fitted("score")
        preds = self.predict(X)
        y_mean = sum(y) / len(y)
        ss_res = sum((yi - pi) ** 2 for yi, pi in zip(y, preds))
        ss_tot = sum((yi - y_mean) ** 2 for yi in y)
        if ss_tot == 0:
            return 1.0 if ss_res == 0 else 0.0
        return 1.0 - ss_res / ss_tot

    def __repr__(self):
        return f"LinearRegression(coef={self.coef_}, intercept={self.intercept_:.4f})"
