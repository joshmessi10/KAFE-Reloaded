import random
from global_utils import check_sig
from TypeUtils import matriz_numeros_t, entero_t, pardos_t
from lib.KafeMATH.funciones import sqrt, exp, pow_, log
from ..BaseMachine import BaseMachine


class GaussianMixture(BaseMachine):
    """
    Gaussian Mixture Model (GMM) — Modelo de mezcla de Gaussianas.

    Modelo probabilístico que asume que los datos son generados por
    una mezcla de distribuciones Gaussianas. Usa el algoritmo EM
    (Expectation-Maximization) para estimar los parámetros.

    Fundamento matemático:
        P(x) = Σ_{k=1}^{K} π_k * N(x | μ_k, Σ_k)

        Donde:
            π_k = peso de la componente k (Σ π_k = 1)
            μ_k = media de la componente k
            Σ_k = covarianza de la componente k
            N(x | μ, Σ) = Gaussiana multivariante

        Algoritmo EM:
            E-step: γ(z_k) = π_k * N(x_n | μ_k, Σ_k) / Σ_j π_j * N(x_n | μ_j, Σ_j)
            M-step: μ_k = Σ_n γ(z_kn) * x_n / N_k
                    Σ_k = Σ_n γ(z_kn) * (x_n - μ_k)(x_n - μ_k)^T / N_k
                    π_k = N_k / N

    Parámetros:
        n_components: número de componentes Gaussianas (default 3)
        max_iter: máximo de iteraciones EM (default 100)
        tol: tolerancia para convergencia (default 1e-3)
        random_state: semilla para reproducibilidad (0 = aleatorio)

    Atributos (después de fit):
        weights_: pesos de cada componente (π_k)
        means_: medias de cada componente (μ_k)
        covariances_: covarianzas de cada componente (Σ_k)
        converged_: si el modelo convergió
        n_iter_: número de iteraciones realizadas
    """

    def __init__(self, n_components=3, max_iter=100, tol=1e-3, random_state=0):
        super().__init__()
        if n_components <= 0:
            raise Exception("GaussianMixture: n_components must be positive")
        if max_iter <= 0:
            raise Exception("GaussianMixture: max_iter must be positive")
        if tol <= 0:
            raise Exception("GaussianMixture: tol must be positive")

        self.n_components = n_components
        self.max_iter = max_iter
        self.tol = tol
        self.random_state = random_state
        self.weights_ = []
        self.means_ = []
        self.covariances_ = []
        self.converged_ = False
        self.n_iter_ = 0

    def _init_params(self, X, rng):
        """Inicializa parámetros usando selección aleatoria de puntos."""
        n_samples = len(X)
        n_features = len(X[0])

        indices = [rng.randint(0, n_samples - 1) for _ in range(self.n_components)]
        self.means_ = [list(X[i]) for i in indices]

        self.weights_ = [1.0 / self.n_components] * self.n_components

        self.covariances_ = [
            [1.0] * n_features for _ in range(self.n_components)
        ]

    def _gaussian_pdf(self, x, mean, cov):
        """Calcula la densidad de probabilidad Gaussiana multivariante (diagonal)."""
        n = len(x)
        det = 1.0
        for j in range(n):
            det *= cov[j]

        if det <= 0:
            return 1e-300

        exponent = 0.0
        for j in range(n):
            diff = x[j] - mean[j]
            exponent += (diff * diff) / cov[j]

        exponent = -0.5 * exponent

        norm = 1.0
        for j in range(n):
            norm *= sqrt(2.0 * 3.141592653589793 * cov[j])

        return (1.0 / norm) * exp(exponent)

    def _e_step(self, X):
        """E-step: calcula responsabilidades γ(z_kn)."""
        n_samples = len(X)
        n_components = self.n_components

        responsibilities = []
        for i in range(n_samples):
            probs = []
            for k in range(n_components):
                pdf = self._gaussian_pdf(X[i], self.means_[k], self.covariances_[k])
                probs.append(self.weights_[k] * pdf)

            total = sum(probs)
            if total > 0:
                responsibilities.append([p / total for p in probs])
            else:
                responsibilities.append([1.0 / n_components] * n_components)

        return responsibilities

    def _m_step(self, X, responsibilities):
        """M-step: actualiza parámetros usando responsabilidades."""
        n_samples = len(X)
        n_features = len(X[0])
        n_components = self.n_components

        N_k = [sum(responsibilities[i][k] for i in range(n_samples))
               for k in range(n_components)]

        self.weights_ = [N_k[k] / n_samples for k in range(n_components)]

        self.means_ = []
        for k in range(n_components):
            if N_k[k] > 0:
                mean_k = [
                    sum(responsibilities[i][k] * X[i][j] for i in range(n_samples)) / N_k[k]
                    for j in range(n_features)
                ]
                self.means_.append(mean_k)
            else:
                self.means_.append([0.0] * n_features)

        self.covariances_ = []
        for k in range(n_components):
            if N_k[k] > 0:
                cov_k = []
                for j in range(n_features):
                    var_kj = sum(
                        responsibilities[i][k] * (X[i][j] - self.means_[k][j]) ** 2
                        for i in range(n_samples)
                    ) / N_k[k]
                    var_kj = max(var_kj, 1e-6)
                    cov_k.append(var_kj)
                self.covariances_.append(cov_k)
            else:
                self.covariances_.append([1.0] * n_features)

    def _compute_log_likelihood(self, X):
        """Calcula el log-verosimilitud."""
        n_samples = len(X)
        log_likelihood = 0.0

        for i in range(n_samples):
            total = 0.0
            for k in range(self.n_components):
                pdf = self._gaussian_pdf(X[i], self.means_[k], self.covariances_[k])
                total += self.weights_[k] * pdf
            if total > 0:
                log_likelihood += log(total)

        return log_likelihood

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def fit(self, X):
        """Ajusta GaussianMixture usando EM."""
        matrix, cols, is_df = self._unwrap_data(X)
        matrix = self._validate_matrix_shape(matrix)

        n_samples = len(matrix)
        if self.n_components > n_samples:
            raise Exception("GaussianMixture: n_components cannot be greater than number of samples")

        rng = random.Random(self.random_state if self.random_state != 0 else None)
        self._init_params(matrix, rng)

        prev_log_likelihood = float('-inf')

        for iteration in range(self.max_iter):
            responsibilities = self._e_step(matrix)
            self._m_step(matrix, responsibilities)
            log_likelihood = self._compute_log_likelihood(matrix)

            if abs(log_likelihood - prev_log_likelihood) < self.tol:
                self.converged_ = True
                self.n_iter_ = iteration + 1
                break

            prev_log_likelihood = log_likelihood

        if not self.converged_:
            self.n_iter_ = self.max_iter

        self._is_fitted = True
        return self

    @check_sig([2], matriz_numeros_t, is_method=True)
    def predict(self, X):
        """Asigna cada punto al componente más probable."""
        self._check_fitted("predict")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = len(self.means_[0])
        for i, row in enumerate(X):
            if len(row) != m:
                raise Exception(
                    f"GaussianMixture: Expected {m} features, got {len(row)} at sample {i}"
                )

        labels = []
        for x in X:
            probs = []
            for k in range(self.n_components):
                pdf = self._gaussian_pdf(x, self.means_[k], self.covariances_[k])
                probs.append(self.weights_[k] * pdf)
            labels.append(probs.index(max(probs)))

        return labels

    @check_sig([2], matriz_numeros_t, is_method=True)
    def predict_proba(self, X):
        """Predice probabilidades de pertenecer a cada componente."""
        self._check_fitted("predict_proba")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = len(self.means_[0])
        for i, row in enumerate(X):
            if len(row) != m:
                raise Exception(
                    f"GaussianMixture: Expected {m} features, got {len(row)} at sample {i}"
                )

        responsibilities = self._e_step(X)
        return responsibilities

    def fit_predict(self, X):
        """Ajusta el modelo y devuelve las etiquetas."""
        self.fit(X)
        return self.predict(X)

    def score(self, X):
        """Retorna el log-verosimilitud negativa (menor es mejor)."""
        self._check_fitted("score")
        if not X:
            return 0.0
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        return -self._compute_log_likelihood(X)

    def aic(self, X):
        """Criterio de Información de Akaike (AIC)."""
        n_samples = len(X)
        n_features = len(X[0])
        log_likelihood = self._compute_log_likelihood(X)

        n_params = (self.n_components - 1) + self.n_components * n_features + self.n_components * n_features

        return 2 * n_params - 2 * log_likelihood

    def bic(self, X):
        """Criterio de Información Bayesiano (BIC)."""
        n_samples = len(X)
        n_features = len(X[0])
        log_likelihood = self._compute_log_likelihood(X)

        n_params = (self.n_components - 1) + self.n_components * n_features + self.n_components * n_features

        return n_params * log(n_samples, 2) - 2 * log_likelihood

    def __repr__(self):
        return (
            f"GaussianMixture(n_components={self.n_components}, "
            f"max_iter={self.max_iter}, tol={self.tol})"
        )
