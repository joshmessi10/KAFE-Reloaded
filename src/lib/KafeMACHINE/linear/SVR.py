from global_utils import check_sig
from TypeUtils import vector_numeros_t, matriz_numeros_t, pardos_t
from ..metrics import r2_score
from ..BaseMachine import BaseMachine


class SVR(BaseMachine):
    """
    Support Vector Regression (SVR) — Regresión con pérdida epsilon-insensitive.

    SVR busca un hiperplano que ajuste los datos dentro de un margen epsilon (ε).
    Solo los puntos fuera del margen ε contribuyen a la pérdida (vectores de soporte).

    Fundamento matemático:
        Minimiza: (1/2)||w||² + C * Σ(max(0, |y_i - f(x_i)| - ε))

        Donde:
        - w = pesos del modelo
        - C = parámetro de regularización (trade-off entre flatness y tolerancia)
        - ε = ancho del tubo epsilon-insensitive
        - f(x) = w·x + b

    Optimización: Coordinate Descent con epsilon-insensitive loss.

    Parámetros:
        C: parámetro de regularización (default 1.0)
        epsilon: ancho del tubo epsilon-insensitive (default 0.1)
        kernel: tipo de kernel ('linear', 'rbf', 'poly') (default 'linear')
        gamma: parámetro del kernel RBF (default 'scale')
        degree: grado del kernel polinomial (default 3)
        tol: tolerancia para convergencia (default 1e-3)
        max_iter: máximo de iteraciones (default 1000)

    Atributos (después de fit):
        coef_: coeficientes del modelo (para kernel lineal)
        intercept_: intercepto del modelo
        support_vectors_: vectores de soporte
        support_vector_labels_: valores objetivo de los vectores de soporte
        n_support_: número de vectores de soporte
    """

    def __init__(self, C=1.0, epsilon=0.1, kernel='linear', gamma='scale',
                 degree=3, tol=1e-3, max_iter=1000):
        super().__init__()
        if C <= 0:
            raise Exception("SVR: C must be positive")
        if epsilon < 0:
            raise Exception("SVR: epsilon must be non-negative")
        if kernel not in ('linear', 'rbf', 'poly'):
            raise Exception("SVR: kernel must be 'linear', 'rbf', or 'poly'")
        if max_iter <= 0:
            raise Exception("SVR: max_iter must be positive")

        self.C = C
        self.epsilon = epsilon
        self.kernel = kernel
        self.gamma = gamma
        self.degree = degree
        self.tol = tol
        self.max_iter = max_iter
        self.coef_ = []
        self.intercept_ = 0.0
        self.support_vectors_ = []
        self.support_vector_labels_ = []
        self.n_support_ = 0
        self._X_train = []
        self._y_train = []
        self._dual_coefs = []

    def _compute_gamma(self, n_features):
        """Calcula el valor de gamma para el kernel RBF."""
        if self.gamma == 'scale':
            if not self._X_train:
                return 1.0 / n_features
            flat = [v for row in self._X_train for v in row]
            mean = sum(flat) / len(flat) if flat else 0.0
            var = sum((v - mean) ** 2 for v in flat) / len(flat) if flat else 0.0
            return 1.0 / (n_features * var) if var > 0 else 1.0 / n_features
        elif self.gamma == 'auto':
            return 1.0 / n_features
        return self.gamma

    def _kernel_function(self, x1, x2, gamma=None):
        """Calcula el kernel entre dos vectores."""
        if self.kernel == 'linear':
            return sum(a * b for a, b in zip(x1, x2))
        elif self.kernel == 'rbf':
            if gamma is None:
                gamma = self._compute_gamma(len(x1))
            dist = sum((a - b) ** 2 for a, b in zip(x1, x2))
            from math import exp as pyexp
            return pyexp(-gamma * dist)
        elif self.kernel == 'poly':
            dot = sum(a * b for a, b in zip(x1, x2))
            return (dot + 1) ** self.degree
        return 0

    def _compute_kernel_matrix(self, X):
        """Calcula la matriz de kernel K donde K[i][j] = kernel(X[i], X[j])."""
        n = len(X)
        K = [[0.0] * n for _ in range(n)]
        gamma = self._compute_gamma(len(X[0])) if self.kernel == 'rbf' else None
        for i in range(n):
            for j in range(i, n):
                k = self._kernel_function(X[i], X[j], gamma)
                K[i][j] = k
                K[j][i] = k
        return K

    def _epsilon_insensitive_loss(self, error):
        """Calcula la pérdida epsilon-insensitive: max(0, |error| - epsilon)."""
        abs_err = abs(error)
        if abs_err <= self.epsilon:
            return 0.0
        return abs_err - self.epsilon

    def _fit_linear(self, X, y):
        """Ajusta SVR con kernel lineal usando Coordinate Descent."""
        n = len(X)
        m = len(X[0])

        self.coef_ = [0.0] * m
        self.intercept_ = 0.0

        for iteration in range(self.max_iter):
            preds = [self.intercept_ + sum(self.coef_[j] * X[i][j] for j in range(m))
                     for i in range(n)]

            errors = [preds[i] - y[i] for i in range(n)]

            grad_intercept = 0.0
            for i in range(n):
                if errors[i] > self.epsilon:
                    grad_intercept += 1.0
                elif errors[i] < -self.epsilon:
                    grad_intercept -= 1.0
            self.intercept_ -= 0.01 * grad_intercept

            for j in range(m):
                grad = 0.0
                for i in range(n):
                    if errors[i] > self.epsilon:
                        grad += X[i][j]
                    elif errors[i] < -self.epsilon:
                        grad -= X[i][j]
                grad /= n
                grad += self.coef_[j] / self.C
                self.coef_[j] -= 0.01 * grad

            if iteration > 0 and iteration % 100 == 0:
                total_loss = sum(self._epsilon_insensitive_loss(errors[i]) for i in range(n))
                reg_loss = 0.5 * sum(c ** 2 for c in self.coef_)
                if total_loss + reg_loss < self.tol:
                    break

        self.support_vectors_ = []
        self.support_vector_labels_ = []
        self._dual_coefs = []
        for i in range(n):
            error = abs(errors[i])
            if error >= self.epsilon * 0.9:
                self.support_vectors_.append(X[i])
                self.support_vector_labels_.append(y[i])
                self._dual_coefs.append(errors[i])
        self.n_support_ = len(self.support_vectors_)

    def _fit_kernel(self, X, y):
        """Ajusta SVR con kernel usando aproximación SMO simplificada."""
        n = len(X)

        K = self._compute_kernel_matrix(X)

        self._dual_coefs = [0.0] * n
        self.intercept_ = 0.0

        for iteration in range(self.max_iter):
            for i in range(n):
                pred = self.intercept_ + sum(
                    self._dual_coefs[j] * K[i][j] for j in range(n)
                )
                error = pred - y[i]

                if error > self.epsilon:
                    self._dual_coefs[i] -= 0.01
                    self._dual_coefs[i] = max(-self.C, min(self.C, self._dual_coefs[i]))
                elif error < -self.epsilon:
                    self._dual_coefs[i] += 0.01
                    self._dual_coefs[i] = max(-self.C, min(self.C, self._dual_coefs[i]))

            errors = []
            for i in range(n):
                pred = self.intercept_ + sum(
                    self._dual_coefs[j] * K[i][j] for j in range(n)
                )
                errors.append(pred - y[i])

            pos_sv = [i for i in range(n) if self._dual_coefs[i] > 0.01]
            neg_sv = [i for i in range(n) if self._dual_coefs[i] < -0.01]

            if pos_sv and neg_sv:
                avg_pos = sum(errors[i] for i in pos_sv) / len(pos_sv)
                avg_neg = sum(errors[i] for i in neg_sv) / len(neg_sv)
                self.intercept_ -= 0.01 * (avg_pos + avg_neg) / 2

        self.support_vectors_ = []
        self.support_vector_labels_ = []
        self.n_support_ = 0
        for i in range(n):
            if abs(self._dual_coefs[i]) > 0.01:
                self.support_vectors_.append(X[i])
                self.support_vector_labels_.append(y[i])
                self.n_support_ += 1

    @check_sig([3], [pardos_t] + vector_numeros_t + matriz_numeros_t, vector_numeros_t, is_method=True)
    def fit(self, X, y):
        """Ajusta el modelo SVR."""
        matrix, cols, is_df = self._unwrap_data(X)
        matrix = self._validate_matrix_shape(matrix)

        n = len(matrix)
        if len(y) != n:
            raise Exception("SVR: X and y must have the same number of samples")

        self._X_train = [row[:] for row in matrix]
        self._y_train = list(y)

        if self.kernel == 'linear':
            self._fit_linear(matrix, y)
        else:
            self._fit_kernel(matrix, y)

        self._is_fitted = True
        return self

    @check_sig([2], vector_numeros_t + matriz_numeros_t, is_method=True)
    def predict(self, X):
        """Predice usando SVR."""
        self._check_fitted("predict")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = len(self._X_train[0]) if self._X_train else 0
        for i, row in enumerate(X):
            if len(row) != m:
                raise Exception(
                    f"SVR: Expected {m} features, got {len(row)} at sample {i}"
                )

        if self.kernel == 'linear':
            return [
                self.intercept_ + sum(self.coef_[j] * row[j] for j in range(m))
                for row in X
            ]
        else:
            gamma = self._compute_gamma(m) if self.kernel == 'rbf' else None
            predictions = []
            for row in X:
                pred = self.intercept_
                for i, sv in enumerate(self.support_vectors_):
                    k = self._kernel_function(row, sv, gamma)
                    pred += self._dual_coefs[i] * k
                predictions.append(pred)
            return predictions

    def score(self, X, y, metric=None):
        """Evalúa usando R² (default) o una métrica personalizada."""
        self._check_fitted("score")
        preds = self.predict(X)
        if metric is None:
            return r2_score(y, preds)
        return metric(y, preds)

    def __repr__(self):
        return (
            f"SVR(C={self.C}, epsilon={self.epsilon}, kernel='{self.kernel}', "
            f"n_support={self.n_support_})"
        )
