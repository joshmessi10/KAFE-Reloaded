from math import exp, log, pi

from global_utils import check_sig
from TypeUtils import numeric_matrix_types, numeric_vector_types, pardos_type

from ..BaseMachine import BaseMachine


class GaussianNB(BaseMachine):
    """
    Gaussian Naive Bayes classifier.

    Probabilistic classifier based on Bayes' theorem with the assumption
    naive conditional independence between features.

    Mathematical foundation:
        P(y|X) = P(X|y) * P(y) / P(X)

        For classification, we compute for each class c:
            P(y=c|X) ∝ P(y=c) * ∏ P(x_i|y=c)

        Where P(x_i|y=c) is modeled as Gaussian:
            P(x_i|y=c) = (1 / sqrt(2π * σ²_c)) * exp(-(x_i - μ_c)² / (2 * σ²_c))

    Parameters:
        None (no hyperparameters)

    Attributes (after fit):
        classes_: unique class labels
        class_prior_: a priori probability of each class
        theta_: average of each feature per class (n_classes, n_features)
        var_: variance of each feature per class (n_classes, n_features)
        n_features_in_: number of features
    """

    def __init__(self):
        super().__init__()
        self.classes_ = []
        self.class_prior_ = []
        self.theta_ = []
        self.var_ = []
        self.n_features_in_ = 0

    @check_sig(
        [3],
        [pardos_type] + numeric_vector_types + numeric_matrix_types,
        numeric_vector_types,
        is_method=True,
    )
    def fit(self, X, y):
        """Fit Gaussian Naive Bayes with X, y."""
        matrix, cols, is_df = self._unwrap_data(X)
        matrix = self._validate_matrix_shape(matrix)

        n = len(matrix)
        if len(y) != n:
            raise Exception("GaussianNB: X and y must have the same number of samples")

        m = len(matrix[0])
        self.n_features_in_ = m

        self.classes_ = sorted(set(y))
        n_classes = len(self.classes_)

        if n_classes < 2:
            raise Exception("GaussianNB: y must contain at least 2 classes")

        self.class_prior_ = []
        self.theta_ = []
        self.var_ = []

        for c in self.classes_:
            X_c = [matrix[i] for i in range(n) if y[i] == c]
            n_c = len(X_c)

            self.class_prior_.append(n_c / n)

            mean_c = [sum(X_c[i][j] for i in range(n_c)) / n_c for j in range(m)]
            self.theta_.append(mean_c)

            var_c = [
                sum((X_c[i][j] - mean_c[j]) ** 2 for i in range(n_c)) / n_c
                for j in range(m)
            ]
            self.var_.append(var_c)

        self._is_fitted = True
        return self

    def _gaussian_log_pdf(self, x, mean, var):
        """Log density for one feature, including the zero-variance case."""
        if var == 0:
            return 0.0 if x == mean else float("-inf")
        return -0.5 * (log(2.0 * pi * var) + (x - mean) ** 2 / var)

    def _log_posteriors(self, x):
        values = []
        for prior, means, variances in zip(
            self.class_prior_, self.theta_, self.var_, strict=True
        ):
            score = log(prior) if prior > 0 else float("-inf")
            for value, mean, variance in zip(x, means, variances, strict=True):
                score += self._gaussian_log_pdf(value, mean, variance)
            values.append(score)
        return values

    @check_sig([2], numeric_vector_types + numeric_matrix_types, is_method=True)
    def predict(self, X):
        """Predict class labels for X."""
        self._check_fitted("predict")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = self.n_features_in_
        for i, row in enumerate(X):
            if len(row) != m:
                raise Exception(
                    f"GaussianNB: Expected {m} features, got {len(row)} at sample {i}"
                )

        return [self._predict_one(x) for x in X]

    def _predict_one(self, x):
        """Predict the class with the largest log posterior."""
        scores = self._log_posteriors(x)
        return self.classes_[scores.index(max(scores))]

    @check_sig([2], numeric_vector_types + numeric_matrix_types, is_method=True)
    def predict_proba(self, X):
        """Predict class probabilities for X."""
        self._check_fitted("predict_proba")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = self.n_features_in_
        for i, row in enumerate(X):
            if len(row) != m:
                raise Exception(
                    f"GaussianNB: Expected {m} features, got {len(row)} at sample {i}"
                )

        return [self._predict_proba_one(x) for x in X]

    def _predict_proba_one(self, x):
        """Normalize class log posteriors without underflow."""
        scores = self._log_posteriors(x)
        largest = max(scores)
        if largest == float("-inf"):
            return [1.0 / len(self.classes_)] * len(self.classes_)
        weights = [exp(score - largest) for score in scores]
        total = sum(weights)
        return [weight / total for weight in weights]

    def score(self, X, y, metric=None):
        """Score using accuracy (default) or a custom metric."""
        from ..metrics import accuracy_score

        self._check_fitted("score")
        preds = self.predict(X)
        if metric is None:
            return accuracy_score(y, preds)
        return metric(y, preds)

    def __repr__(self):
        return f"GaussianNB(n_classes={len(self.classes_)}, n_features={self.n_features_in_})"
