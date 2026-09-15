from global_utils import check_sig
from TypeUtils import vector_numeros_t, matriz_numeros_t, pardos_t
from lib.KafeMATH.funciones import sqrt, pow_, exp, log
from .BaseMachine import BaseMachine


class GaussianNB(BaseMachine):
    """
    Gaussian Naive Bayes classifier.

    Clasificador probabilístico basado en el teorema de Bayes con la asunción
    naive de independencia condicional entre features.

    Fundamento matemático:
        P(y|X) = P(X|y) * P(y) / P(X)

        Para clasificación, computamos para cada clase c:
            P(y=c|X) ∝ P(y=c) * ∏ P(x_i|y=c)

        Donde P(x_i|y=c) se modela como Gaussiana:
            P(x_i|y=c) = (1 / sqrt(2π * σ²_c)) * exp(-(x_i - μ_c)² / (2 * σ²_c))

    Parámetros:
        Ninguno (no hay hiperparámetros)

    Atributos (después de fit):
        classes_: etiquetas únicas de clase
        class_prior_: probabilidad a priori de cada clase
        theta_: media de cada feature por clase (n_classes, n_features)
        var_: varianza de cada feature por clase (n_classes, n_features)
        n_features_in_: número de features
    """

    def __init__(self):
        super().__init__()
        self.classes_ = []
        self.class_prior_ = []
        self.theta_ = []
        self.var_ = []
        self.n_features_in_ = 0

    @check_sig([3], [pardos_t] + vector_numeros_t + matriz_numeros_t, vector_numeros_t, is_method=True)
    def fit(self, X, y):
        """Ajusta Gaussian Naive Bayes con X, y."""
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

            mean_c = [
                sum(X_c[i][j] for i in range(n_c)) / n_c
                for j in range(m)
            ]
            self.theta_.append(mean_c)

            var_c = [
                sum((X_c[i][j] - mean_c[j]) ** 2 for i in range(n_c)) / n_c
                for j in range(m)
            ]
            self.var_.append(var_c)

        self._is_fitted = True
        return self

    def _gaussian_pdf(self, x, mean, var):
        """Calcula la función de densidad de probabilidad Gaussiana."""
        if var == 0:
            return 1.0 if x == mean else 0.0
        two_pi_var = 2.0 * 3.141592653589793 * var
        return (1.0 / sqrt(two_pi_var)) * exp(-pow_(x - mean, 2) / (2.0 * var))

    @check_sig([2], vector_numeros_t + matriz_numeros_t, is_method=True)
    def predict(self, X):
        """Predice etiquetas de clase para X."""
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
        """Predice la clase para una sola muestra."""
        log_posteriors = []

        for idx in range(len(self.classes_)):
            if self.class_prior_[idx] > 0:
                log_prior = log(self.class_prior_[idx])
            else:
                log_prior = float('-inf')

            log_likelihood = 0.0
            pdf_zero = False
            for j in range(len(x)):
                pdf = self._gaussian_pdf(x[j], self.theta_[idx][j], self.var_[idx][j])
                if pdf > 0:
                    log_likelihood += log(pdf)
                else:
                    pdf_zero = True
                    break

            if pdf_zero:
                log_posteriors.append(float('-inf'))
            else:
                log_posteriors.append(log_prior + log_likelihood)

        best_idx = 0
        for i in range(1, len(log_posteriors)):
            if log_posteriors[i] > log_posteriors[best_idx]:
                best_idx = i

        return self.classes_[best_idx]

    @check_sig([2], vector_numeros_t + matriz_numeros_t, is_method=True)
    def predict_proba(self, X):
        """Predice probabilidades de clase para X."""
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
        """Predice probabilidades para una sola muestra."""
        log_posteriors = []

        for idx in range(len(self.classes_)):
            if self.class_prior_[idx] > 0:
                log_prior = log(self.class_prior_[idx])
            else:
                log_prior = float('-inf')

            log_likelihood = 0.0
            pdf_zero = False
            for j in range(len(x)):
                pdf = self._gaussian_pdf(x[j], self.theta_[idx][j], self.var_[idx][j])
                if pdf > 0:
                    log_likelihood += log(pdf)
                else:
                    pdf_zero = True
                    break

            if pdf_zero:
                log_posteriors.append(float('-inf'))
            else:
                log_posteriors.append(log_prior + log_likelihood)

        max_log = log_posteriors[0]
        for i in range(1, len(log_posteriors)):
            if log_posteriors[i] > max_log:
                max_log = log_posteriors[i]

        exps = [0.0] * len(self.classes_)
        for i in range(len(exps)):
            if log_posteriors[i] != float('-inf'):
                exps[i] = exp(log_posteriors[i] - max_log)

        total = 0.0
        for e in exps:
            total += e
        if total == 0:
            return [1.0 / len(self.classes_)] * len(self.classes_)

        return [e / total for e in exps]

    def score(self, X, y, metric=None):
        """Score usando accuracy (por defecto) o una métrica personalizada."""
        from .metrics import accuracy_score
        self._check_fitted("score")
        preds = self.predict(X)
        if metric is None:
            return accuracy_score(y, preds)
        return metric(y, preds)

    def __repr__(self):
        return f"GaussianNB(n_classes={len(self.classes_)}, n_features={self.n_features_in_})"
