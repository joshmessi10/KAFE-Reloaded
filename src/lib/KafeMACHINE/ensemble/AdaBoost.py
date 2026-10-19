from lib.KafeMATH.funciones import log, exp
from global_utils import check_sig
from TypeUtils import vector_numeros_t, matriz_numeros_t, pardos_t
from ..metrics import accuracy_score
from ..BaseMachine import BaseMachine


class AdaBoostClassifier(BaseMachine):
    """
    AdaBoost (Adaptive Boosting) — Ensemble de weak classifiers.

    Combina múltiples weak classifiers (decision stumps) de forma secuencial,
    donde cada clasificador enfatiza los errores del anterior.

    Fundamento matemático:
        1. Inicializar pesos uniformes: w_i = 1/n
        2. Para cada iteración t:
           a. Entrenar weak classifier h_t con pesos w_i
           b. Calcular error: ε_t = Σ w_i * I(h_t(x_i) ≠ y_i)
           c. Calcular peso del clasificador: α_t = 0.5 * ln((1 - ε_t) / ε_t)
           d. Actualizar pesos: w_i *= exp(-α_t * y_i * h_t(x_i))
           e. Normalizar pesos
        3. Predicción final: H(x) = sign(Σ α_t * h_t(x))

    Parámetros:
        n_estimators: número de weak classifiers (default 50)
        learning_rate: tasa de aprendizaje (default 1.0)
        random_state: semilla para reproducibilidad (0 = aleatorio, default 0)

    Atributos (después de fit):
        estimators_: lista de weak classifiers entrenados
        estimator_weights_: pesos de cada clasificador
        estimator_errors_: error de cada clasificador
        classes_: clases únicas
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
        Entrena un decision stump (árbol de profundidad 1).
        Retorna: (feature_idx, threshold, prediction_left, prediction_right)
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
        """Predice usando un decision stump."""
        feature_idx, threshold, pred_left, pred_right = stump
        return [pred_left if row[feature_idx] <= threshold else pred_right
                for row in X]

    @check_sig([3], [pardos_t] + vector_numeros_t + matriz_numeros_t, vector_numeros_t, is_method=True)
    def fit(self, X, y):
        """Ajusta AdaBoost."""
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

    @check_sig([2], vector_numeros_t + matriz_numeros_t, is_method=True)
    def predict(self, X):
        """Predice usando la combinación ponderada de weak classifiers."""
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
        """Evalúa usando accuracy (default) o una métrica personalizada."""
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
