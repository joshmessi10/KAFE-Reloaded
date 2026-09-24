from math import exp as pyexp
from typing import cast

from global_utils import check_sig
from TypeUtils import numeric_matrix_types, numeric_vector_types, pardos_type

from ..BaseMachine import BaseMachine
from ..metrics import accuracy_score


class SVM(BaseMachine):
    """Support Vector Machine for binary classification.

    SVM searches for the hyperplane of maximum margin that separates the classes.
    Only points within the range or misclassified contribute
    to the loss (support vectors).

    Mathematical foundation:
        Primary formulation:
            Minimizes: (1/2)||w||² + C * Σ(max(0, 1 - y_i * f(x_i)))

            Where:
            - w = model weights
            - C = regularization parameter (trade-off between margin and errors)
            - y_i ∈ {-1, +1} = class labels
            - f(x_i) = w·x_i + b

        Dual formulation:
            max Σ α_i - (1/2) Σ_i Σ_j α_i α_j y_i y_j K(x_i, x_j)
            s.t. 0 ≤ α_i ≤ C, Σ α_i y_i = 0

            f(x) = Σ α_i y_i K(x_i, x) + b

    Optimization: SGD for primal (linear kernel), simplified SMO for dual.

    Parameters:
        C: regularization parameter (default 1.0)
        kernel: kernel type ('linear', 'rbf', 'poly') (default 'linear')
        gamma: kernel parameter RBF (default 'scale')
        degree: polynomial kernel degree (default 3)
        tol: tolerance for convergence (default 1e-3)
        max_iter: maximum iterations (default 1000)

    Attributes (after fit):
        coef_: model coefficients (for linear kernel)
        intercept_: model intercept
        support_vectors_: support vectors
        support_vector_labels_: support vector labels
        n_support_: number of support vectors
        classes_: unique classes
    """

    def __init__(self, C=1.0, kernel='linear', gamma='scale', degree=3,
                 tol=1e-3, max_iter=1000):
        super().__init__()
        if C <= 0:
            raise Exception("SVM: C must be positive")
        if kernel not in ('linear', 'rbf', 'poly'):
            raise Exception("SVM: kernel must be 'linear', 'rbf', or 'poly'")
        if max_iter <= 0:
            raise Exception("SVM: max_iter must be positive")

        self.C = C
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
        self.classes_ = []
        self._X_train = []
        self._y_train = []
        self._dual_coefs = []
        self._sv_indices = []

    def _compute_gamma(self, n_features) -> float:
        """Calculates the gamma value for the RBF kernel."""
        if self.gamma == 'scale':
            if not self._X_train:
                return 1.0 / n_features
            flat = [v for row in self._X_train for v in row]
            mean = sum(flat) / len(flat) if flat else 0.0
            var = sum((v - mean) ** 2 for v in flat) / len(flat) if flat else 0.0
            return 1.0 / (n_features * var) if var > 0 else 1.0 / n_features
        elif self.gamma == 'auto':
            return 1.0 / n_features
        return cast(float, self.gamma)

    def _kernel_function(self, x1, x2, gamma=None):
        """Calculates the kernel between two vectors."""
        if self.kernel == 'linear':
            return sum(a * b for a, b in zip(x1, x2, strict=False))
        elif self.kernel == 'rbf':
            if gamma is None:
                gamma = self._compute_gamma(len(x1))
            dist = sum((a - b) ** 2 for a, b in zip(x1, x2, strict=False))
            return pyexp(-cast(float, gamma) * dist)
        elif self.kernel == 'poly':
            dot = sum(a * b for a, b in zip(x1, x2, strict=False))
            return (dot + 1) ** self.degree
        return 0

    def _compute_kernel_matrix(self, X):
        """Computes the kernel matrix K where K[i][j] = kernel(X[i], X[j])."""
        n = len(X)
        K = [[0.0] * n for _ in range(n)]
        gamma = self._compute_gamma(len(X[0])) if self.kernel == 'rbf' else None
        for i in range(n):
            for j in range(i, n):
                k = self._kernel_function(X[i], X[j], gamma)
                K[i][j] = k
                K[j][i] = k
        return K

    def _hinge_loss(self, y_true, y_pred):
        """Calculate the hinge loss: max(0, 1 - y_true * y_pred)."""
        return max(0.0, 1.0 - y_true * y_pred)

    def _fit_primal(self, X, y):
        """Fits SVM with linear kernel using SGD over hinge + L2 loss."""
        n = len(X)
        m = len(X[0])

        y_binary = [1.0 if yi == self.classes_[0] else -1.0 for yi in y]

        self.coef_ = [0.0] * m
        self.intercept_ = 0.0
        lr0 = 1.0

        for iteration in range(self.max_iter):
            lr = lr0 / (1.0 + iteration * 0.01)

            preds = [self.intercept_ + sum(self.coef_[j] * X[i][j] for j in range(m))
                     for i in range(n)]

            grad_b = 0.0
            grad_w = [0.0] * m

            for i in range(n):
                margin = y_binary[i] * preds[i]
                if margin < 1.0:
                    grad_b -= y_binary[i]
                    for j in range(m):
                        grad_w[j] -= y_binary[i] * X[i][j]

            grad_b /= n
            for j in range(m):
                grad_w[j] = grad_w[j] / n + self.coef_[j] / self.C

            self.intercept_ -= lr * grad_b
            for j in range(m):
                self.coef_[j] -= lr * grad_w[j]

        preds = [self.intercept_ + sum(self.coef_[j] * X[i][j] for j in range(m))
                 for i in range(n)]
        self.support_vectors_ = []
        self.support_vector_labels_ = []
        self._dual_coefs = []
        for i in range(n):
            margin = y_binary[i] * preds[i]
            if margin <= 1.01:
                self.support_vectors_.append(X[i])
                self.support_vector_labels_.append(y[i])
                self._dual_coefs.append(y_binary[i] * max(0.0, 1.0 - margin))
        self.n_support_ = len(self.support_vectors_)

    def _fit_dual(self, X, y):
        """Fine-tune SVM with kernel using simplified SMO over dual formulation."""
        n = len(X)

        y_binary = [1.0 if yi == self.classes_[0] else -1.0 for yi in y]

        K = self._compute_kernel_matrix(X)

        self._dual_coefs = [0.0] * n
        self.intercept_ = 0.0
        eta = 0.01

        for _iteration in range(self.max_iter):
            for i in range(n):
                pred = self.intercept_ + sum(
                    self._dual_coefs[j] * y_binary[j] * K[i][j] for j in range(n)
                )
                margin = y_binary[i] * pred

                if margin < 1.0 and self._dual_coefs[i] < self.C:
                    self._dual_coefs[i] = min(self.C, self._dual_coefs[i] + eta)
                elif margin > 1.0 and self._dual_coefs[i] > 0:
                    self._dual_coefs[i] = max(0.0, self._dual_coefs[i] - eta)

            sv_idx = [i for i in range(n) if 0.01 < self._dual_coefs[i] < self.C - 0.01]
            if sv_idx:
                errors = []
                for i in sv_idx:
                    pred = sum(
                        self._dual_coefs[j] * y_binary[j] * K[i][j] for j in range(n)
                    )
                    errors.append(y_binary[i] - pred)
                self.intercept_ = sum(errors) / len(errors)

        self.support_vectors_ = []
        self.support_vector_labels_ = []
        self._sv_indices = []
        for i in range(n):
            if self._dual_coefs[i] > 0.01:
                self.support_vectors_.append(X[i])
                self.support_vector_labels_.append(y[i])
                self._sv_indices.append(i)
        self.n_support_ = len(self.support_vectors_)

    @check_sig([3], [pardos_type] + numeric_vector_types + numeric_matrix_types, numeric_vector_types, is_method=True)
    def fit(self, X, y):
        """Adjust the SVM model."""
        matrix, cols, is_df = self._unwrap_data(X)
        matrix = self._validate_matrix_shape(matrix)

        n = len(matrix)
        if len(y) != n:
            raise Exception("SVM: X and y must have the same number of samples")

        self._X_train = [row[:] for row in matrix]
        self._y_train = list(y)
        self.classes_ = sorted(set(y))

        if len(self.classes_) != 2:
            raise Exception("SVM: only supports binary classification")

        if self.kernel == 'linear':
            self._fit_primal(matrix, y)
        else:
            self._fit_dual(matrix, y)

        self._is_fitted = True
        return self

    def _decision_function(self, X):
        """Calculates the decision function (value before the sign)."""
        m = len(self._X_train[0]) if self._X_train else 0

        if self.kernel == 'linear':
            return [
                self.intercept_ + sum(self.coef_[j] * row[j] for j in range(m))
                for row in X
            ]
        else:
            gamma = self._compute_gamma(m) if self.kernel == 'rbf' else None
            y_binary = [1.0 if yi == self.classes_[0] else -1.0 for yi in self._y_train]
            predictions = []
            for row in X:
                pred = self.intercept_
                for i in self._sv_indices:
                    k = self._kernel_function(row, self._X_train[i], gamma)
                    pred += self._dual_coefs[i] * y_binary[i] * k
                predictions.append(pred)
            return predictions

    @check_sig([2], numeric_vector_types + numeric_matrix_types, is_method=True)
    def predict(self, X):
        """Predict class labels using SVM."""
        self._check_fitted("predict")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = len(self._X_train[0]) if self._X_train else 0
        for i, row in enumerate(X):
            if len(row) != m:
                raise Exception(
                    f"SVM: Expected {m} features, got {len(row)} at sample {i}"
                )

        decisions = self._decision_function(X)
        return [self.classes_[0] if d >= 0 else self.classes_[1] for d in decisions]

    @check_sig([2], numeric_vector_types + numeric_matrix_types, is_method=True)
    def predict_proba(self, X):
        """Predict probabilities using the distance to the hyperplane (sigmoid)."""
        self._check_fitted("predict_proba")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        decisions = self._decision_function(X)
        probs = []
        for d in decisions:
            prob_pos = 1.0 / (1.0 + pyexp(-d))
            probs.append([1.0 - prob_pos, prob_pos])
        return probs

    def score(self, X, y, metric=None):
        """Evaluate using accuracy (default) or a custom metric."""
        self._check_fitted("score")
        preds = self.predict(X)
        if metric is None:
            return accuracy_score(y, preds)
        return metric(y, preds)

    def __repr__(self):
        return (
            f"SVM(C={self.C}, kernel='{self.kernel}', "
            f"n_support={self.n_support_})"
        )
