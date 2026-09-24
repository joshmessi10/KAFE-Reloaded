import random
from lib.KafeMATH.functions import log, exp
from global_utils import check_sig
from TypeUtils import numeric_vector_types, numeric_matrix_types, pardos_type
from ..metrics import accuracy_score, r2_score
from ..BaseMachine import BaseMachine


class GradientBoostingClassifier(BaseMachine):
    """
    Gradient Boosting Classifier — Ensemble of weak classifiers using gradient descent.

    Build decision trees sequentially, where each tree corrects
    the errors of the previous one using gradient descent on the loss function.

    Mathematical foundation:
        1. Initialize base prediction: F_0(x) = 0.5 * ln((1-p)/p)
        2. For each iteration t = 1, ..., T:
           a. Calculate probabilities: p_i = sigmoid(F_{t-1}(x_i))
           b. Calculate residuals: r_i = y_i - p_i
           c. Train tree h_t to predict residuals r_i
           d. Update: F_t(x) = F_{t-1}(x) + η * h_t(x)
        3. Final prediction: class = classes_[0] if sigmoid(F_T(x)) >= 0.5

        For classification with log-loss:
            F_0(x) = 0.5 * ln((1-p)/p), where p = prop. negative class

    Parameters:
        n_estimators: number of trees (default 100)
        learning_rate: learning rate (default 0.1)
        max_depth: maximum depth per tree (default 3)
        subsample: ratio of samples per tree (default 1.0)
        random_state: seed for reproducibility (0 = random, default 0)

    Attributes (after fit):
        estimators_: trained tree list
        initial_prediction_: initial prediction
        classes_: unique classes
    """

    def __init__(self, n_estimators=100, learning_rate=0.1, max_depth=3,
                 subsample=1.0, random_state=0):
        super().__init__()
        if n_estimators <= 0:
            raise Exception("GradientBoostingClassifier: n_estimators must be positive")
        if learning_rate <= 0:
            raise Exception("GradientBoostingClassifier: learning_rate must be positive")
        if max_depth <= 0:
            raise Exception("GradientBoostingClassifier: max_depth must be positive")
        if subsample <= 0 or subsample > 1:
            raise Exception("GradientBoostingClassifier: subsample must be between 0 and 1")

        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.max_depth = max_depth
        self.subsample = subsample
        self.random_state = random_state
        self.estimators_ = []
        self.initial_prediction_ = 0.0
        self.classes_ = []

    def _sigmoid(self, x):
        """Numerically stable sigmoid function."""
        if x >= 0:
            return 1.0 / (1.0 + exp(-x))
        else:
            ex = exp(x)
            return ex / (1.0 + ex)

    def _build_tree(self, X, y, depth):
        """Build a regression tree to predict residuals."""
        n = len(y)

        if depth >= self.max_depth or n < 2:
            mean = sum(y) / n if n > 0 else 0.0
            return {"value": mean}

        best_gain = -1
        best_feature = None
        best_threshold = None
        best_y_left = None
        best_y_right = None

        for feature_idx in range(len(X[0])):
            values = [X[i][feature_idx] for i in range(n)]
            unique_values = sorted(set(values))

            if len(unique_values) <= 1:
                continue

            thresholds = [
                (unique_values[i] + unique_values[i + 1]) / 2.0
                for i in range(len(unique_values) - 1)
            ]

            for threshold in thresholds:
                y_left = [y[i] for i in range(n) if X[i][feature_idx] <= threshold]
                y_right = [y[i] for i in range(n) if X[i][feature_idx] > threshold]

                if len(y_left) < 1 or len(y_right) < 1:
                    continue

                mean_parent = sum(y) / n
                var_parent = sum((yi - mean_parent) ** 2 for yi in y) / n

                mean_left = sum(y_left) / len(y_left)
                var_left = sum((yi - mean_left) ** 2 for yi in y_left) / len(y_left)

                mean_right = sum(y_right) / len(y_right)
                var_right = sum((yi - mean_right) ** 2 for yi in y_right) / len(y_right)

                weighted_var = (len(y_left) / n) * var_left + (len(y_right) / n) * var_right
                gain = var_parent - weighted_var

                if gain > best_gain:
                    best_gain = gain
                    best_feature = feature_idx
                    best_threshold = threshold
                    best_y_left = y_left
                    best_y_right = y_right

        if best_feature is None:
            mean = sum(y) / n if n > 0 else 0.0
            return {"value": mean}

        X_left = [X[i] for i in range(n) if X[i][best_feature] <= best_threshold]
        X_right = [X[i] for i in range(n) if X[i][best_feature] > best_threshold]

        left_subtree = self._build_tree(X_left, best_y_left, depth + 1)
        right_subtree = self._build_tree(X_right, best_y_right, depth + 1)

        return {
            "feature": best_feature,
            "threshold": best_threshold,
            "left": left_subtree,
            "right": right_subtree,
        }

    def _predict_tree(self, sample, node):
        """Predict using a tree."""
        if "value" in node:
            return node["value"]
        if sample[node["feature"]] <= node["threshold"]:
            return self._predict_tree(sample, node["left"])
        return self._predict_tree(sample, node["right"])

    @check_sig([3], [pardos_type] + numeric_vector_types + numeric_matrix_types, numeric_vector_types, is_method=True)
    def fit(self, X, y):
        """Fit GradientBoostingClassifier."""
        matrix, cols, is_df = self._unwrap_data(X)
        matrix = self._validate_matrix_shape(matrix)

        n = len(matrix)
        if len(y) != n:
            raise Exception("GradientBoostingClassifier: X and y must have the same number of samples")

        self.classes_ = sorted(set(y))
        if len(self.classes_) != 2:
            raise Exception("GradientBoostingClassifier: only supports binary classification")

        y_binary = [1.0 if yi == self.classes_[0] else -1.0 for yi in y]

        pos_count = sum(1 for yi in y if yi == self.classes_[0])
        neg_count = n - pos_count
        if pos_count == 0 or neg_count == 0:
            self.initial_prediction_ = 0.0
        else:
            self.initial_prediction_ = 0.5 * log(neg_count / pos_count)

        F = [self.initial_prediction_] * n

        self.estimators_ = []

        rng = random.Random(self.random_state if self.random_state != 0 else None)

        for t in range(self.n_estimators):
            probs = [self._sigmoid(fi) for fi in F]

            residuals = [y_binary[i] - probs[i] for i in range(n)]

            if self.subsample < 1.0:
                sample_size = max(1, int(n * self.subsample))
                indices = [rng.randint(0, n - 1) for _ in range(sample_size)]
                X_sub = [matrix[i] for i in indices]
                r_sub = [residuals[i] for i in indices]
            else:
                X_sub = matrix
                r_sub = residuals

            tree = self._build_tree(X_sub, r_sub, 0)
            self.estimators_.append(tree)

            for i in range(n):
                pred = self._predict_tree(matrix[i], tree)
                F[i] += self.learning_rate * pred

        self._is_fitted = True
        return self

    @check_sig([2], numeric_vector_types + numeric_matrix_types, is_method=True)
    def predict(self, X):
        """Predict using the combination of trees."""
        self._check_fitted("predict")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        predictions = []
        for row in X:
            score = self.initial_prediction_
            for tree in self.estimators_:
                pred = self._predict_tree(row, tree)
                score += self.learning_rate * pred

            prob = self._sigmoid(score)
            predictions.append(self.classes_[0] if prob >= 0.5 else self.classes_[1])

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
            f"GradientBoostingClassifier(n_estimators={self.n_estimators}, "
            f"learning_rate={self.learning_rate}, max_depth={self.max_depth})"
        )


class GradientBoostingRegressor(BaseMachine):
    """
    Gradient Boosting Regressor — Ensemble of regressors using gradient descent.

    Build regression trees sequentially, where each tree corrects
    the errors of the previous one using gradient descent on the loss function.

    Mathematical foundation:
        1. Initialize: F_0(x) = mean(y)
        2. For each iteration t:
           a. Calculate residuals: r_i = y_i - F_{t-1}(x_i)
           b. Train tree h_t to predict residuals r_i
           c. Update: F_t(x) = F_{t-1}(x) + η * h_t(x)

    Parameters:
        n_estimators: number of trees (default 100)
        learning_rate: learning rate (default 0.1)
        max_depth: maximum depth per tree (default 3)
        subsample: ratio of samples per tree (default 1.0)
        random_state: seed for reproducibility (0 = random, default 0)

    Attributes (after fit):
        estimators_: trained tree list
        initial_prediction_: initial prediction (mean)
    """

    def __init__(self, n_estimators=100, learning_rate=0.1, max_depth=3,
                 subsample=1.0, random_state=0):
        super().__init__()
        if n_estimators <= 0:
            raise Exception("GradientBoostingRegressor: n_estimators must be positive")
        if learning_rate <= 0:
            raise Exception("GradientBoostingRegressor: learning_rate must be positive")
        if max_depth <= 0:
            raise Exception("GradientBoostingRegressor: max_depth must be positive")
        if subsample <= 0 or subsample > 1:
            raise Exception("GradientBoostingRegressor: subsample must be between 0 and 1")

        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.max_depth = max_depth
        self.subsample = subsample
        self.random_state = random_state
        self.estimators_ = []
        self.initial_prediction_ = 0.0

    def _build_tree(self, X, y, depth):
        """Build a regression tree to predict residuals."""
        n = len(y)

        if depth >= self.max_depth or n < 2:
            mean = sum(y) / n if n > 0 else 0.0
            return {"value": mean}

        best_gain = -1
        best_feature = None
        best_threshold = None
        best_y_left = None
        best_y_right = None

        for feature_idx in range(len(X[0])):
            values = [X[i][feature_idx] for i in range(n)]
            unique_values = sorted(set(values))

            if len(unique_values) <= 1:
                continue

            thresholds = [
                (unique_values[i] + unique_values[i + 1]) / 2.0
                for i in range(len(unique_values) - 1)
            ]

            for threshold in thresholds:
                y_left = [y[i] for i in range(n) if X[i][feature_idx] <= threshold]
                y_right = [y[i] for i in range(n) if X[i][feature_idx] > threshold]

                if len(y_left) < 1 or len(y_right) < 1:
                    continue

                mean_parent = sum(y) / n
                var_parent = sum((yi - mean_parent) ** 2 for yi in y) / n

                mean_left = sum(y_left) / len(y_left)
                var_left = sum((yi - mean_left) ** 2 for yi in y_left) / len(y_left)

                mean_right = sum(y_right) / len(y_right)
                var_right = sum((yi - mean_right) ** 2 for yi in y_right) / len(y_right)

                weighted_var = (len(y_left) / n) * var_left + (len(y_right) / n) * var_right
                gain = var_parent - weighted_var

                if gain > best_gain:
                    best_gain = gain
                    best_feature = feature_idx
                    best_threshold = threshold
                    best_y_left = y_left
                    best_y_right = y_right

        if best_feature is None:
            mean = sum(y) / n if n > 0 else 0.0
            return {"value": mean}

        X_left = [X[i] for i in range(n) if X[i][best_feature] <= best_threshold]
        X_right = [X[i] for i in range(n) if X[i][best_feature] > best_threshold]

        left_subtree = self._build_tree(X_left, best_y_left, depth + 1)
        right_subtree = self._build_tree(X_right, best_y_right, depth + 1)

        return {
            "feature": best_feature,
            "threshold": best_threshold,
            "left": left_subtree,
            "right": right_subtree,
        }

    def _predict_tree(self, sample, node):
        """Predict using a tree."""
        if "value" in node:
            return node["value"]
        if sample[node["feature"]] <= node["threshold"]:
            return self._predict_tree(sample, node["left"])
        return self._predict_tree(sample, node["right"])

    @check_sig([3], [pardos_type] + numeric_vector_types + numeric_matrix_types, numeric_vector_types, is_method=True)
    def fit(self, X, y):
        """Fit GradientBoostingRegressor."""
        matrix, cols, is_df = self._unwrap_data(X)
        matrix = self._validate_matrix_shape(matrix)

        n = len(matrix)
        if len(y) != n:
            raise Exception("GradientBoostingRegressor: X and y must have the same number of samples")

        self.initial_prediction_ = sum(y) / n if n > 0 else 0.0

        F = [self.initial_prediction_] * n

        self.estimators_ = []

        rng = random.Random(self.random_state if self.random_state != 0 else None)

        for t in range(self.n_estimators):
            residuals = [y[i] - F[i] for i in range(n)]

            if self.subsample < 1.0:
                sample_size = max(1, int(n * self.subsample))
                indices = [rng.randint(0, n - 1) for _ in range(sample_size)]
                X_sub = [matrix[i] for i in indices]
                r_sub = [residuals[i] for i in indices]
            else:
                X_sub = matrix
                r_sub = residuals

            tree = self._build_tree(X_sub, r_sub, 0)
            self.estimators_.append(tree)

            for i in range(n):
                pred = self._predict_tree(matrix[i], tree)
                F[i] += self.learning_rate * pred

        self._is_fitted = True
        return self

    @check_sig([2], numeric_vector_types + numeric_matrix_types, is_method=True)
    def predict(self, X):
        """Predict using the combination of trees."""
        self._check_fitted("predict")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        predictions = []
        for row in X:
            score = self.initial_prediction_
            for tree in self.estimators_:
                pred = self._predict_tree(row, tree)
                score += self.learning_rate * pred
            predictions.append(score)

        return predictions

    def score(self, X, y, metric=None):
        """Score using R² (default) or a custom metric."""
        self._check_fitted("score")
        preds = self.predict(X)
        if metric is None:
            return r2_score(y, preds)
        return metric(y, preds)

    def __repr__(self):
        return (
            f"GradientBoostingRegressor(n_estimators={self.n_estimators}, "
            f"learning_rate={self.learning_rate}, max_depth={self.max_depth})"
        )
