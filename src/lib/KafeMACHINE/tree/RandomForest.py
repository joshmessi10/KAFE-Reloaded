import random

from global_utils import check_sig
from lib.KafeMATH.functions import log, sqrt
from TypeUtils import numeric_matrix_types, numeric_vector_types, pardos_type

from ..BaseMachine import BaseMachine
from ..metrics import accuracy_score, r2_score


class RandomForestClassifier(BaseMachine):
    """
    Random Forest Classifier — Ensemble of decision trees.

    Train multiple decision trees on bootstrap samples with
    random subsets of features, adding predictions by majority vote.

    Mathematical foundation:
        - Bootstrap: sampling with replacement of n points from the training set
        - Randomization of features: in each split, consider sqrt(n_features) random features
        - Aggregation: majority vote among all trees

    Parameters:
        n_estimators: number of trees (default 10)
        max_depth: maximum depth per tree (0 = no limit, default 0)
        min_samples_split: minimum number of samples to split a node (default 2)
        min_samples_leaf: minimum number of samples on a sheet (default 1)
        max_features: number of features to consider in each split
                      (None = sqrt(n_features), default None)
        random_state: seed for reproducibility (0 = random, default 0)

    Attributes (after fit):
        trees_: trained tree list
        classes_: unique class tags
        n_features_: number of features
    """

    def __init__(self, n_estimators=10, max_depth=0, min_samples_split=2,
                 min_samples_leaf=1, max_features=None, random_state=0):
        super().__init__()
        if n_estimators <= 0:
            raise Exception("RandomForestClassifier: n_estimators must be positive")
        if max_depth < 0:
            raise Exception("RandomForestClassifier: max_depth must be non-negative")
        if min_samples_split <= 0:
            raise Exception("RandomForestClassifier: min_samples_split must be positive")
        if min_samples_leaf <= 0:
            raise Exception("RandomForestClassifier: min_samples_leaf must be positive")

        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.max_features = max_features
        self.random_state = random_state
        self.trees_ = []
        self.classes_ = []
        self.n_features_ = 0
        self._feature_indices_ = []

    def _majority_class(self, y):
        counts = {}
        for label in y:
            counts[label] = counts.get(label, 0) + 1
        max_count = max(counts.values())
        candidates = sorted([lbl for lbl, cnt in counts.items() if cnt == max_count])
        return candidates[0]

    def _gini(self, y):
        n = len(y)
        if n == 0:
            return 0.0
        counts = {}
        for label in y:
            counts[label] = counts.get(label, 0) + 1
        impurity = 1.0
        for cnt in counts.values():
            p = cnt / n
            impurity -= p * p
        return impurity

    def _entropy(self, y):
        n = len(y)
        if n == 0:
            return 0.0
        counts = {}
        for label in y:
            counts[label] = counts.get(label, 0) + 1
        ent = 0.0
        for cnt in counts.values():
            if cnt > 0:
                p = cnt / n
                ent -= p * log(p, 2)
        return ent

    def _information_gain(self, y, y_left, y_right):
        n = len(y)
        parent_imp = self._gini(y)
        left_imp = self._gini(y_left) if len(y_left) > 0 else 0.0
        right_imp = self._gini(y_right) if len(y_right) > 0 else 0.0
        weighted_imp = (len(y_left) / n) * left_imp + (len(y_right) / n) * right_imp
        return parent_imp - weighted_imp

    def _best_split(self, X, y, feature_indices):
        """Find the best split considering only a subset of features."""
        n_samples = len(y)
        best_gain = -1
        best_feature = None
        best_threshold = None
        best_y_left = None
        best_y_right = None
        best_X_left = None
        best_X_right = None

        for feature_idx in feature_indices:
            values = [X[i][feature_idx] for i in range(n_samples)]
            unique_values = sorted(set(values))

            if len(unique_values) <= 1:
                continue

            thresholds = [
                (unique_values[i] + unique_values[i + 1]) / 2.0
                for i in range(len(unique_values) - 1)
            ]

            for threshold in thresholds:
                X_left, y_left = [], []
                X_right, y_right = [], []
                for i in range(n_samples):
                    if X[i][feature_idx] <= threshold:
                        X_left.append(X[i])
                        y_left.append(y[i])
                    else:
                        X_right.append(X[i])
                        y_right.append(y[i])

                if len(y_left) < self.min_samples_leaf or len(y_right) < self.min_samples_leaf:
                    continue

                gain = self._information_gain(y, y_left, y_right)
                if gain > best_gain:
                    best_gain = gain
                    best_feature = feature_idx
                    best_threshold = threshold
                    best_y_left = y_left
                    best_y_right = y_right
                    best_X_left = X_left
                    best_X_right = X_right

        if best_feature is None:
            return None, None, None, None, None, None
        return best_feature, best_threshold, best_y_left, best_y_right, best_X_left, best_X_right

    def _build_tree(self, X, y, depth, feature_indices):
        """Build a tree with random subsets of features."""
        n_classes = len(set(y))

        if n_classes == 1:
            return {"class": y[0]}

        if self.max_depth > 0 and depth >= self.max_depth:
            return {"class": self._majority_class(y)}

        if len(y) < self.min_samples_split:
            return {"class": self._majority_class(y)}

        feature, threshold, y_left, y_right, X_left, X_right = self._best_split(
            X, y, feature_indices
        )

        if feature is None:
            return {"class": self._majority_class(y)}

        left_subtree = self._build_tree(X_left, y_left, depth + 1, feature_indices)
        right_subtree = self._build_tree(X_right, y_right, depth + 1, feature_indices)

        return {
            "feature": feature,
            "threshold": threshold,
            "left": left_subtree,
            "right": right_subtree,
        }

    def _predict_one(self, sample, node):
        if "class" in node:
            return node["class"]
        if sample[node["feature"]] <= node["threshold"]:
            return self._predict_one(sample, node["left"])
        return self._predict_one(sample, node["right"])

    def _bootstrap_sample(self, X, y, rng):
        """Create a bootstrap sample (sampling with replacement)."""
        n = len(X)
        indices = [rng.randint(0, n - 1) for _ in range(n)]
        X_sample = [X[i] for i in indices]
        y_sample = [y[i] for i in indices]
        return X_sample, y_sample

    @check_sig([3], [pardos_type] + numeric_vector_types + numeric_matrix_types, numeric_vector_types, is_method=True)
    def fit(self, X, y):
        """Adjust the Random Forest classifier."""
        matrix, cols, is_df = self._unwrap_data(X)
        matrix = self._validate_matrix_shape(matrix)

        n = len(matrix)
        if len(y) != n:
            raise Exception("RandomForestClassifier: X and y must have the same number of samples")

        m = len(matrix[0])
        self.n_features_ = m
        self.classes_ = sorted(set(y))

        if self.max_features is None:
            max_feat = int(sqrt(m))
            if max_feat < 1:
                max_feat = 1
        else:
            max_feat = min(self.max_features, m)

        rng = random.Random(self.random_state if self.random_state != 0 else None)

        self.trees_ = []
        self._feature_indices_ = []

        for _ in range(self.n_estimators):
            X_boot, y_boot = self._bootstrap_sample(matrix, y, rng)
            feature_indices = sorted(rng.sample(range(m), max_feat))
            self._feature_indices_.append(feature_indices)
            tree = self._build_tree(X_boot, y_boot, 0, feature_indices)
            self.trees_.append(tree)

        self._is_fitted = True
        return self

    @check_sig([2], numeric_vector_types + numeric_matrix_types, is_method=True)
    def predict(self, X):
        """Predict class labels using majority voting."""
        self._check_fitted("predict")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = self.n_features_
        for i, row in enumerate(X):
            if len(row) != m:
                raise Exception(
                    f"RandomForestClassifier: Expected {m} features, got {len(row)} at sample {i}"
                )

        return [self._predict_one_sample(x) for x in X]

    def _predict_one_sample(self, x):
        """Predict the class for a single sample using majority voting."""
        votes: dict[int | float | str | bool, int] = {}
        for tree in self.trees_:
            pred = self._predict_one(x, tree)
            votes[pred] = votes.get(pred, 0) + 1

        best_class = max(votes, key=lambda label: votes[label])
        return best_class

    def score(self, X, y, metric=None):
        """Evaluate using accuracy (default) or a custom metric."""
        self._check_fitted("score")
        preds = self.predict(X)
        if metric is None:
            return accuracy_score(y, preds)
        return metric(y, preds)

    def __repr__(self):
        return (
            f"RandomForestClassifier(n_estimators={self.n_estimators}, "
            f"max_depth={self.max_depth}, max_features={self.max_features})"
        )


class RandomForestRegressor(BaseMachine):
    """
    Random Forest Regressor — Ensemble of regression trees.

    Train multiple regression trees on bootstrap samples with
    random subsets of features, adding predictions by averaging.

    Mathematical foundation:
        - Bootstrap: sampling with replacement of n points from the training set
        - Randomization of features: in each split, consider sqrt(n_features) random features
        - Aggregation: average of predictions of all trees

    Parameters:
        n_estimators: number of trees (default 10)
        max_depth: maximum depth per tree (0 = no limit, default 0)
        min_samples_split: minimum number of samples to split a node (default 2)
        min_samples_leaf: minimum number of samples on a sheet (default 1)
        max_features: number of features to consider in each split
                      (None = sqrt(n_features), default None)
        random_state: seed for reproducibility (0 = random, default 0)

    Attributes (after fit):
        trees_: trained tree list
        n_features_: number of features
    """

    def __init__(self, n_estimators=10, max_depth=0, min_samples_split=2,
                 min_samples_leaf=1, max_features=None, random_state=0):
        super().__init__()
        if n_estimators <= 0:
            raise Exception("RandomForestRegressor: n_estimators must be positive")
        if max_depth < 0:
            raise Exception("RandomForestRegressor: max_depth must be non-negative")
        if min_samples_split <= 0:
            raise Exception("RandomForestRegressor: min_samples_split must be positive")
        if min_samples_leaf <= 0:
            raise Exception("RandomForestRegressor: min_samples_leaf must be positive")

        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.max_features = max_features
        self.random_state = random_state
        self.trees_ = []
        self.n_features_ = 0
        self._feature_indices_ = []

    def _mean(self, y):
        if len(y) == 0:
            return 0.0
        return sum(y) / len(y)

    def _variance_reduction(self, y, y_left, y_right):
        n = len(y)
        if n == 0:
            return 0.0

        mean_parent = self._mean(y)
        var_parent = sum((yi - mean_parent) ** 2 for yi in y) / n

        n_left = len(y_left)
        if n_left == 0:
            var_left = 0.0
        else:
            mean_left = self._mean(y_left)
            var_left = sum((yi - mean_left) ** 2 for yi in y_left) / n_left

        n_right = len(y_right)
        if n_right == 0:
            var_right = 0.0
        else:
            mean_right = self._mean(y_right)
            var_right = sum((yi - mean_right) ** 2 for yi in y_right) / n_right

        weighted_var = (n_left / n) * var_left + (n_right / n) * var_right

        return var_parent - weighted_var

    def _best_split(self, X, y, feature_indices):
        n_samples = len(y)
        best_gain = -1
        best_feature = None
        best_threshold = None
        best_y_left = None
        best_y_right = None
        best_X_left = None
        best_X_right = None

        for feature_idx in feature_indices:
            values = [X[i][feature_idx] for i in range(n_samples)]
            unique_values = sorted(set(values))

            if len(unique_values) <= 1:
                continue

            thresholds = [
                (unique_values[i] + unique_values[i + 1]) / 2.0
                for i in range(len(unique_values) - 1)
            ]

            for threshold in thresholds:
                X_left, y_left = [], []
                X_right, y_right = [], []
                for i in range(n_samples):
                    if X[i][feature_idx] <= threshold:
                        X_left.append(X[i])
                        y_left.append(y[i])
                    else:
                        X_right.append(X[i])
                        y_right.append(y[i])

                if len(y_left) < self.min_samples_leaf or len(y_right) < self.min_samples_leaf:
                    continue

                gain = self._variance_reduction(y, y_left, y_right)
                if gain > best_gain:
                    best_gain = gain
                    best_feature = feature_idx
                    best_threshold = threshold
                    best_y_left = y_left
                    best_y_right = y_right
                    best_X_left = X_left
                    best_X_right = X_right

        if best_feature is None:
            return None, None, None, None, None, None
        return best_feature, best_threshold, best_y_left, best_y_right, best_X_left, best_X_right

    def _build_tree(self, X, y, depth, feature_indices):
        if self.max_depth > 0 and depth >= self.max_depth:
            return {"value": self._mean(y)}

        if len(y) < self.min_samples_split:
            return {"value": self._mean(y)}

        feature, threshold, y_left, y_right, X_left, X_right = self._best_split(
            X, y, feature_indices
        )

        if feature is None:
            return {"value": self._mean(y)}

        left_subtree = self._build_tree(X_left, y_left, depth + 1, feature_indices)
        right_subtree = self._build_tree(X_right, y_right, depth + 1, feature_indices)

        return {
            "feature": feature,
            "threshold": threshold,
            "left": left_subtree,
            "right": right_subtree,
        }

    def _predict_one(self, sample, node):
        if "value" in node:
            return node["value"]
        if sample[node["feature"]] <= node["threshold"]:
            return self._predict_one(sample, node["left"])
        return self._predict_one(sample, node["right"])

    def _bootstrap_sample(self, X, y, rng):
        n = len(X)
        indices = [rng.randint(0, n - 1) for _ in range(n)]
        X_sample = [X[i] for i in indices]
        y_sample = [y[i] for i in indices]
        return X_sample, y_sample

    @check_sig([3], [pardos_type] + numeric_vector_types + numeric_matrix_types, numeric_vector_types, is_method=True)
    def fit(self, X, y):
        """Adjust the Random Forest regressor."""
        matrix, cols, is_df = self._unwrap_data(X)
        matrix = self._validate_matrix_shape(matrix)

        n = len(matrix)
        if len(y) != n:
            raise Exception("RandomForestRegressor: X and y must have the same number of samples")

        m = len(matrix[0])
        self.n_features_ = m

        if self.max_features is None:
            max_feat = int(sqrt(m))
            if max_feat < 1:
                max_feat = 1
        else:
            max_feat = min(self.max_features, m)

        rng = random.Random(self.random_state if self.random_state != 0 else 42)

        self.trees_ = []
        self._feature_indices_ = []

        for _ in range(self.n_estimators):
            X_boot, y_boot = self._bootstrap_sample(matrix, y, rng)
            feature_indices = sorted(rng.sample(range(m), max_feat))
            self._feature_indices_.append(feature_indices)
            tree = self._build_tree(X_boot, y_boot, 0, feature_indices)
            self.trees_.append(tree)

        self._is_fitted = True
        return self

    @check_sig([2], numeric_vector_types + numeric_matrix_types, is_method=True)
    def predict(self, X):
        """Predict values ​​using tree averaging."""
        self._check_fitted("predict")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = self.n_features_
        for i, row in enumerate(X):
            if len(row) != m:
                raise Exception(
                    f"RandomForestRegressor: Expected {m} features, got {len(row)} at sample {i}"
                )

        return [self._predict_one_sample(x) for x in X]

    def _predict_one_sample(self, x):
        predictions = []
        for tree in self.trees_:
            pred = self._predict_one(x, tree)
            predictions.append(pred)
        return self._mean(predictions)

    def score(self, X, y, metric=None):
        """Evaluate using R² (default) or a custom metric."""
        self._check_fitted("score")
        preds = self.predict(X)
        if metric is None:
            return r2_score(y, preds)
        return metric(y, preds)

    def __repr__(self):
        return (
            f"RandomForestRegressor(n_estimators={self.n_estimators}, "
            f"max_depth={self.max_depth}, max_features={self.max_features})"
        )
