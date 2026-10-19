from lib.KafeMATH.funciones import log
from global_utils import check_sig
from TypeUtils import vector_numeros_t, matriz_numeros_t, pardos_t
from ..metrics import accuracy_score, r2_score
from ..BaseMachine import BaseMachine


class DecisionTreeClassifier(BaseMachine):
    def __init__(self, criterion="gini", max_depth=0, min_samples_split=2, min_samples_leaf=1):
        super().__init__()
        if criterion not in ("gini", "entropy"):
            raise Exception("DecisionTreeClassifier: criterion must be 'gini' or 'entropy'")
        self.criterion = criterion
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.tree_ = None
        self.classes_ = []
        self.n_features_ = 0

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

    def _impurity(self, y):
        if self.criterion == "gini":
            return self._gini(y)
        return self._entropy(y)

    def _information_gain(self, y, y_left, y_right):
        n = len(y)
        parent_imp = self._impurity(y)
        left_imp = self._impurity(y_left) if len(y_left) > 0 else 0.0
        right_imp = self._impurity(y_right) if len(y_right) > 0 else 0.0
        weighted_imp = (len(y_left) / n) * left_imp + (len(y_right) / n) * right_imp
        return parent_imp - weighted_imp

    def _best_split(self, X, y):
        n_samples = len(y)
        n_features = len(X[0]) if n_samples > 0 else 0
        best_gain = -1
        best_feature = None
        best_threshold = None
        best_y_left = None
        best_y_right = None
        best_X_left = None
        best_X_right = None

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

    def _build_tree(self, X, y, depth):
        n_classes = len(set(y))

        if n_classes == 1:
            return {"class": y[0]}

        if self.max_depth > 0 and depth >= self.max_depth:
            return {"class": self._majority_class(y)}

        if len(y) < self.min_samples_split:
            return {"class": self._majority_class(y)}

        feature, threshold, y_left, y_right, X_left, X_right = self._best_split(X, y)

        if feature is None:
            return {"class": self._majority_class(y)}

        left_subtree = self._build_tree(X_left, y_left, depth + 1)
        right_subtree = self._build_tree(X_right, y_right, depth + 1)

        return {
            "feature": feature,
            "threshold": threshold,
            "left": left_subtree,
            "right": right_subtree,
        }

    @check_sig([3], [pardos_t] + vector_numeros_t + matriz_numeros_t, vector_numeros_t, is_method=True)
    def fit(self, X, y):
        matrix, cols, is_df = self._unwrap_data(X)
        matrix = self._validate_matrix_shape(matrix)

        n = len(matrix)
        if len(y) != n:
            raise Exception("DecisionTreeClassifier: X and y must have the same number of samples")

        m = len(matrix[0])
        self.n_features_ = m
        self.classes_ = sorted(set(y))
        self.tree_ = self._build_tree(matrix, y, 0)
        self._is_fitted = True
        return self

    def _predict_one(self, sample, node):
        if "class" in node:
            return node["class"]
        if sample[node["feature"]] <= node["threshold"]:
            return self._predict_one(sample, node["left"])
        return self._predict_one(sample, node["right"])

    @check_sig([2], vector_numeros_t + matriz_numeros_t, is_method=True)
    def predict(self, X):
        self._check_fitted("predict")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = self.n_features_
        for i, row in enumerate(X):
            if len(row) != m:
                raise Exception(
                    f"DecisionTreeClassifier: Expected {m} features, got {len(row)} at sample {i}"
                )
        return [self._predict_one(x, self.tree_) for x in X]

    def score(self, X, y, metric=None):
        """Score using accuracy (default) or a custom metric.

        Default metric: accuracy_score
        """
        self._check_fitted("score")
        preds = self.predict(X)
        if metric is None:
            return accuracy_score(y, preds)
        return metric(y, preds)

    def __repr__(self):
        return (
            f"DecisionTreeClassifier(criterion='{self.criterion}', "
            f"max_depth={self.max_depth}, min_samples_split={self.min_samples_split}, "
            f"min_samples_leaf={self.min_samples_leaf})"
        )


class DecisionTreeRegressor(BaseMachine):
    """
    Decision Tree Regressor — Árbol de decisión para regresión.

    Construye un árbol que predice valores continuos usando MSE (Mean Squared Error)
    como criterio de splits.

    Fundamento matemático:
        1. Para cada feature y umbral, calcular:
           MSE = (1/n) * Σ(y_i - ȳ)²
           MSE_left = (1/n_l) * Σ(y_i - ȳ_l)²
           MSE_right = (1/n_r) * Σ(y_i - ȳ_r)²
           MSE_reduction = MSE - (n_l/n * MSE_left + n_r/n * MSE_right)
        2. Seleccionar split con mayor reducción de MSE
        3. Hojas predicen la media de los valores en el nodo

    Parámetros:
        criterion: "mse" (default)
        max_depth: profundidad máxima (0 = sin límite, default 0)
        min_samples_split: mínimas muestras para dividir (default 2)
        min_samples_leaf: mínimas muestras por hoja (default 1)

    Atributos (después de fit):
        tree_: estructura del árbol
        n_features_: número de features
    """

    def __init__(self, criterion="mse", max_depth=0, min_samples_split=2, min_samples_leaf=1):
        super().__init__()
        if criterion != "mse":
            raise Exception("DecisionTreeRegressor: criterion must be 'mse'")
        self.criterion = criterion
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.tree_ = None
        self.n_features_ = 0

    def _mse(self, y):
        """Calcula el Mean Squared Error."""
        n = len(y)
        if n == 0:
            return 0.0
        mean = sum(y) / n
        return sum((yi - mean) ** 2 for yi in y) / n

    def _mean(self, y):
        """Calcula la media."""
        return sum(y) / len(y) if len(y) > 0 else 0.0

    def _information_gain(self, y, y_left, y_right):
        """Calcula la reducción de MSE."""
        n = len(y)
        parent_mse = self._mse(y)
        left_mse = self._mse(y_left) if len(y_left) > 0 else 0.0
        right_mse = self._mse(y_right) if len(y_right) > 0 else 0.0
        weighted_mse = (len(y_left) / n) * left_mse + (len(y_right) / n) * right_mse
        return parent_mse - weighted_mse

    def _best_split(self, X, y):
        """Encuentra el mejor split."""
        n_samples = len(y)
        n_features = len(X[0]) if n_samples > 0 else 0
        best_gain = -1
        best_feature = None
        best_threshold = None
        best_y_left = None
        best_y_right = None
        best_X_left = None
        best_X_right = None

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

    def _build_tree(self, X, y, depth):
        """Construye el árbol recursivamente."""
        if len(y) <= 1:
            return {"value": self._mean(y)}

        if self.max_depth > 0 and depth >= self.max_depth:
            return {"value": self._mean(y)}

        if len(y) < self.min_samples_split:
            return {"value": self._mean(y)}

        feature, threshold, y_left, y_right, X_left, X_right = self._best_split(X, y)

        if feature is None:
            return {"value": self._mean(y)}

        left_subtree = self._build_tree(X_left, y_left, depth + 1)
        right_subtree = self._build_tree(X_right, y_right, depth + 1)

        return {
            "feature": feature,
            "threshold": threshold,
            "left": left_subtree,
            "right": right_subtree,
        }

    @check_sig([3], [pardos_t] + vector_numeros_t + matriz_numeros_t, vector_numeros_t, is_method=True)
    def fit(self, X, y):
        """Ajusta DecisionTreeRegressor."""
        matrix, cols, is_df = self._unwrap_data(X)
        matrix = self._validate_matrix_shape(matrix)

        n = len(matrix)
        if len(y) != n:
            raise Exception("DecisionTreeRegressor: X and y must have the same number of samples")

        m = len(matrix[0])
        self.n_features_ = m
        self.tree_ = self._build_tree(matrix, y, 0)
        self._is_fitted = True
        return self

    def _predict_one(self, sample, node):
        """Predice para una sola muestra."""
        if "value" in node:
            return node["value"]
        if sample[node["feature"]] <= node["threshold"]:
            return self._predict_one(sample, node["left"])
        return self._predict_one(sample, node["right"])

    @check_sig([2], vector_numeros_t + matriz_numeros_t, is_method=True)
    def predict(self, X):
        """Predice valores continuos para X."""
        self._check_fitted("predict")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = self.n_features_
        for i, row in enumerate(X):
            if len(row) != m:
                raise Exception(
                    f"DecisionTreeRegressor: Expected {m} features, got {len(row)} at sample {i}"
                )
        return [self._predict_one(x, self.tree_) for x in X]

    def score(self, X, y, metric=None):
        """Score usando R² (default) o una métrica personalizada."""
        self._check_fitted("score")
        preds = self.predict(X)
        if metric is None:
            return r2_score(y, preds)
        return metric(y, preds)

    def __repr__(self):
        return (
            f"DecisionTreeRegressor(criterion='{self.criterion}', "
            f"max_depth={self.max_depth}, min_samples_split={self.min_samples_split}, "
            f"min_samples_leaf={self.min_samples_leaf})"
        )
