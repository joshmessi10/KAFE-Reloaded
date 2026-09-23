from lib.KafeMATH.functions import log, exp
from global_utils import check_sig
from TypeUtils import numeric_vector_types, numeric_matrix_types, pardos_type
from ..metrics import accuracy_score
from ..BaseMachine import BaseMachine


class AdaBoostClassifier(BaseMachine):
    """
    AdaBoost (Adaptive Boosting) — Ensemble of weak classifiers.

    Combine multiple weak classifiers (decision stumps) sequentially,
    where each classifier emphasizes the errors of the previous one.

    Mathematical foundation:
        1. Initialize uniform weights: w_i = 1/n
        2. For each iteration t:
           to. Train weak classifier h_t with weights w_i
           b. Calculate error: ε_t = Σ w_i * I(h_t(x_i) ≠ y_i)
           c. Calculate classifier weight: α_t = 0.5 * ln((1 - ε_t) / ε_t)
           d. Update weights: w_i *= exp(-α_t * y_i * h_t(x_i))
           e. Normalize weights
        3. Final prediction: H(x) = sign(Σ α_t * h_t(x))

    Parameters:
        n_estimators: number of weak classifiers (default 50)
        learning_rate: learning rate (default 1.0)
        random_state: seed for reproducibility (0 = random, default 0)

    Attributes (after fit):
        estimators_: list of trained weak classifiers
        estimator_weights_: weights of each classifier
        estimator_errors_: error of each classifier
        classes_: unique classes
    """

    def __init__(self, n_estimators=50, learning_rate=1.0, random_state=0):
        super().__init__()
        if n_estimators <= 0:
            raise Exception("AdaBoostClassifier: n_estimators must be positive")
        if learning_rate <= 0:
            raise Exception("AdaBoostClassifier: learning_rate must be positive")

        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.random_state = random_state
        self.estimators_ = []
        self.estimator_weights_ = []
        self.estimator_errors_ = []
        self.classes_ = []

    def _decision_stump(self, X, y, weights):
        """
        Train a decision stump (tree depth 1).
        Returns: (feature_idx, threshold, prediction_left, prediction_right)
        """
        n_samples = len(y)
        n_features = len(X[0]) if n_samples > 0 else 0

        best_error = float('inf')
        best_stump = None

        for feature_idx in range(n_features):
            values = [X[i][feature_idx] for i in range(n_samples)]
            unique_values = sorted(set(values))

            if len(unique_values) <= 1:
                continue

            thresholds = [
                (unique_values[i] + unique_values[i + 1]) / 2.0
                for i in range(len(unique_values) - 1)
            ]

            for threshold in thresholds:
                predictions = [-1 if X[i][feature_idx] <= threshold else 1
                              for i in range(n_samples)]

                error = sum(weights[i] for i in range(n_samples)
                          if predictions[i] != y[i])

                if error < best_error:
                    best_error = error
                    best_stump = (feature_idx, threshold, -1, 1)

        return best_stump, best_error

    def _predict_stump(self, X, stump):
        """Predict using a decision stump."""
        feature_idx, threshold, pred_left, pred_right = stump
        return [pred_left if row[feature_idx] <= threshold else pred_right
                for row in X]

    @check_sig([3], [pardos_type] + numeric_vector_types + numeric_matrix_types, numeric_vector_types, is_method=True)
    def fit(self, X, y):
        """Fit AdaBoost."""
        matrix, cols, is_df = self._unwrap_data(X)
        matrix = self._validate_matrix_shape(matrix)

        n = len(matrix)
        if len(y) != n:
            raise Exception("AdaBoostClassifier: X and y must have the same number of samples")

        self.classes_ = sorted(set(y))
        if len(self.classes_) != 2:
            raise Exception("AdaBoostClassifier: only supports binary classification")

        y_binary = [-1.0 if yi == self.classes_[0] else 1.0 for yi in y]

        weights = [1.0 / n] * n

        self.estimators_ = []
        self.estimator_weights_ = []
        self.estimator_errors_ = []

        for t in range(self.n_estimators):
            stump, error = self._decision_stump(matrix, y_binary, weights)

            error = max(error, 1e-10)
            error = min(error, 1 - 1e-10)

            alpha = 0.5 * log((1 - error) / error, 2)
            alpha *= self.learning_rate

            predictions = self._predict_stump(matrix, stump)

            for i in range(n):
                weights[i] *= exp(-alpha * y_binary[i] * predictions[i])

            total_weight = sum(weights)
            weights = [w / total_weight for w in weights]

            self.estimators_.append(stump)
            self.estimator_weights_.append(alpha)
            self.estimator_errors_.append(error)

        self._is_fitted = True
        return self

    @check_sig([2], numeric_vector_types + numeric_matrix_types, is_method=True)
    def predict(self, X):
        """Predict using weighted combination of weak classifiers."""
        self._check_fitted("predict")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = len(X[0]) if X else 0
        if m == 0:
            return []

        predictions = []
        for row in X:
            score = 0.0
            for stump, alpha in zip(self.estimators_, self.estimator_weights_):
                feature_idx, threshold, pred_left, pred_right = stump
                pred = pred_left if row[feature_idx] <= threshold else pred_right
                score += alpha * pred

            predictions.append(self.classes_[1] if score >= 0 else self.classes_[0])

        return predictions

    def score(self, X, y, metric=None):
        """Evaluate using accuracy (default) or a custom metric."""
        self._check_fitted("score")
        preds = self.predict(X)
        if metric is None:
            return accuracy_score(y, preds)
        return metric(y, preds)

    def __repr__(self):
        return (
            f"AdaBoostClassifier(n_estimators={self.n_estimators}, "
            f"learning_rate={self.learning_rate})"
        )
