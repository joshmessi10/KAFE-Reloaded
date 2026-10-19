import random
from lib.KafeMATH.funciones import log, sqrt
from global_utils import check_sig
from TypeUtils import vector_numeros_t, matriz_numeros_t, pardos_t
from ..metrics import accuracy_score, r2_score
from ..BaseMachine import BaseMachine


class RandomForestClassifier(BaseMachine):
    """
    Random Forest Classifier — Ensemble of decision trees.

    Entrena múltiples árboles de decisión sobre muestras bootstrap con
    subconjuntos aleatorios de features, agregando predicciones por voto mayoritario.

    Fundamento matemático:
        - Bootstrap: muestreo con reemplazo de n puntos del conjunto de entrenamiento
        - Aleatorización de features: en cada split, considerar sqrt(n_features) features aleatorios
        - Agregación: voto mayoritario entre todos los árboles

    Parámetros:
        n_estimators: número de árboles (default 10)
        max_depth: profundidad máxima por árbol (0 = sin límite, default 0)
        min_samples_split: mínimo de muestras para dividir un nodo (default 2)
        min_samples_leaf: mínimo de muestras en una hoja (default 1)
        max_features: número de features a considerar en cada split
                      (None = sqrt(n_features), default None)
        random_state: semilla para reproducibilidad (0 = aleatorio, default 0)

    Atributos (después de fit):
        trees_: lista de árboles entrenados
        classes_: etiquetas de clase únicas
        n_features_: número de features
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
        """Encuentra el mejor split considerando solo un subconjunto de features."""
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
        """Construye un árbol con subconjuntos aleatorios de features."""
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
        """Crea una muestra bootstrap (muestreo con reemplazo)."""
        n = len(X)
        indices = [rng.randint(0, n - 1) for _ in range(n)]
        X_sample = [X[i] for i in indices]
        y_sample = [y[i] for i in indices]
        return X_sample, y_sample

    @check_sig([3], [pardos_t] + vector_numeros_t + matriz_numeros_t, vector_numeros_t, is_method=True)
    def fit(self, X, y):
        """Ajusta el Random Forest classifier."""
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

    @check_sig([2], vector_numeros_t + matriz_numeros_t, is_method=True)
    def predict(self, X):
        """Predice etiquetas de clase usando voto mayoritario."""
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
        """Predice la clase para una sola muestra usando voto mayoritario."""
        votes = {}
        for tree in self.trees_:
            pred = self._predict_one(x, tree)
            votes[pred] = votes.get(pred, 0) + 1

        best_class = max(votes, key=votes.get)
        return best_class

    def score(self, X, y, metric=None):
        """Evalúa usando accuracy (default) o una métrica personalizada."""
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

    Entrena múltiples árboles de regresión sobre muestras bootstrap con
    subconjuntos aleatorios de features, agregando predicciones por promedio.

    Fundamento matemático:
        - Bootstrap: muestreo con reemplazo de n puntos del conjunto de entrenamiento
        - Aleatorización de features: en cada split, considerar sqrt(n_features) features aleatorios
        - Agregación: promedio de predicciones de todos los árboles

    Parámetros:
        n_estimators: número de árboles (default 10)
        max_depth: profundidad máxima por árbol (0 = sin límite, default 0)
        min_samples_split: mínimo de muestras para dividir un nodo (default 2)
        min_samples_leaf: mínimo de muestras en una hoja (default 1)
        max_features: número de features a considerar en cada split
                      (None = sqrt(n_features), default None)
        random_state: semilla para reproducibilidad (0 = aleatorio, default 0)

    Atributos (después de fit):
        trees_: lista de árboles entrenados
        n_features_: número de features
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

    @check_sig([3], [pardos_t] + vector_numeros_t + matriz_numeros_t, vector_numeros_t, is_method=True)
    def fit(self, X, y):
        """Ajusta el Random Forest regressor."""
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

    @check_sig([2], vector_numeros_t + matriz_numeros_t, is_method=True)
    def predict(self, X):
        """Predice valores usando promedio de árboles."""
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
        """Evalúa usando R² (default) o una métrica personalizada."""
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
