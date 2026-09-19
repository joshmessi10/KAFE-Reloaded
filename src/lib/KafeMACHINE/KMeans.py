import random
from global_utils import check_sig
from TypeUtils import matriz_numeros_t, entero_t, pardos_t
from .BaseMachine import BaseMachine


class KMeans(BaseMachine):
    """
    K-Means: algoritmo de clustering no supervisado.

    Agrupa n puntos en k clusters, donde cada punto pertenece al cluster
    con el centroide más cercano. Utiliza inicialización K-Means++ para
    mejorar la convergencia.

    Fundamento matemático:
        Minimiza la inercia (within-cluster sum of squares):
            J = Σ_{j=1}^{k} Σ_{x_i ∈ C_j} ||x_i - μ_j||²
        donde μ_j es el centroide del cluster C_j.

    Complejidad: O(n · k · d · i), donde n=puntos, k=clusters,
        d=dimensiones, i=iteraciones.

    Parámetros:
        n_clusters: número de clusters (k), default 3
        max_iter: máximo de iteraciones, default 100
        random_state: semilla para reproducibilidad (0 = aleatorio)

    Atributos (después de fit):
        cluster_centers_: centroides de cada cluster
        labels_: asignación de cluster para cada punto
        inertia_: suma de cuadrados de distancias a centroides
    """

    def __init__(self, n_clusters=3, max_iter=100, random_state=0):
        super().__init__()
        if n_clusters <= 0:
            raise Exception("KMeans: n_clusters must be positive")
        if max_iter <= 0:
            raise Exception("KMeans: max_iter must be positive")
        self.n_clusters = n_clusters
        self.max_iter = max_iter
        self.random_state = random_state
        self.cluster_centers_ = []
        self.labels_ = []
        self.inertia_ = 0.0

    def _euclidean_distance_sq(self, a, b):
        """Distancia euclidiana al cuadrado entre dos puntos."""
        return sum((x - y) ** 2 for x, y in zip(a, b))

    def _euclidean_distance(self, a, b):
        """Distancia euclidiana entre dos puntos."""
        return self._euclidean_distance_sq(a, b) ** 0.5

    def _init_centroids_kmeans_pp(self, X):
        """
        Inicialización K-Means++ (Arthur & Vassilvitskii, 2007).

        1. Selecciona el primer centroide aleatoriamente.
        2. Para cada punto, calcula D(x)^2 = distancia al cuadrado
           al centroide más cercano.
        3. Selecciona el siguiente centroide con probabilidad
           proporcional a D(x)^2.
        4. Repite hasta elegir k centroides.

        Garantiza centroides inicializados de forma dispersa,
        reduciendo la probabilidad de convergencia a óptimos locales.
        """
        n_samples = len(X)
        rng = random.Random(self.random_state if self.random_state != 0 else None)

        centroids = []

        idx = rng.randint(0, n_samples - 1)
        centroids.append(list(X[idx]))

        for _ in range(1, self.n_clusters):
            distances_sq = []
            for point in X:
                min_dist_sq = min(
                    self._euclidean_distance_sq(point, c) for c in centroids
                )
                distances_sq.append(min_dist_sq)

            total = sum(distances_sq)
            if total == 0:
                # All remaining points are identical to existing centroids
                # Pick a random point to avoid duplicate centroids
                idx = rng.randint(0, n_samples - 1)
                centroids.append(list(X[idx]))
                continue

            probs = [d / total for d in distances_sq]

            r = rng.random()
            cumulative = 0.0
            for i, p in enumerate(probs):
                cumulative += p
                if r <= cumulative:
                    centroids.append(list(X[i]))
                    break
            else:
                centroids.append(list(X[-1]))

        return centroids

    def _assign_clusters(self, X, centroids):
        """Asigna cada punto al centroide más cercano (paso E)."""
        labels = []
        for point in X:
            min_dist = float("inf")
            min_idx = 0
            for j, centroid in enumerate(centroids):
                d = self._euclidean_distance_sq(point, centroid)
                if d < min_dist:
                    min_dist = d
                    min_idx = j
            labels.append(min_idx)
        return labels

    def _update_centroids(self, X, labels):
        """Recalcula centroides como promedio de puntos asignados (paso M)."""
        k = self.n_clusters
        n_features = len(X[0])
        new_centroids = []

        for j in range(k):
            members = [X[i] for i in range(len(X)) if labels[i] == j]
            if members:
                centroid = [
                    sum(m[f] for m in members) / len(members)
                    for f in range(n_features)
                ]
                new_centroids.append(centroid)
            else:
                new_centroids.append(
                    new_centroids[-1] if new_centroids else [0.0] * n_features
                )

        return new_centroids

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def fit(self, X):
        """
        Ajusta el modelo K-Means a los datos X.

        Algoritmo:
            1. Inicializar centroides con K-Means++
            2. Repetir hasta convergencia o max_iter:
               a. Asignar cada punto al centroide más cercano (E)
               b. Recalcular centroides como promedio (M)
            3. Calcular inercia final
        """
        matrix, cols, is_df = self._unwrap_data(X)
        matrix = self._validate_matrix_shape(matrix)

        n_samples = len(matrix)
        if self.n_clusters > n_samples:
            raise Exception(
                "KMeans: n_clusters cannot be greater than number of samples"
            )

        self.cluster_centers_ = self._init_centroids_kmeans_pp(matrix)

        for _ in range(self.max_iter):
            self.labels_ = self._assign_clusters(matrix, self.cluster_centers_)
            new_centroids = self._update_centroids(matrix, self.labels_)

            converged = True
            for old, new in zip(self.cluster_centers_, new_centroids):
                if self._euclidean_distance(old, new) > 1e-6:
                    converged = False
                    break

            self.cluster_centers_ = new_centroids

            if converged:
                break

        self.inertia_ = sum(
            self._euclidean_distance_sq(
                matrix[i], self.cluster_centers_[self.labels_[i]]
            )
            for i in range(n_samples)
        )

        self._is_fitted = True
        return self

    def fit_predict(self, X):
        """Ajusta el modelo y devuelve las etiquetas de cluster."""
        self.fit(X)
        return self.labels_

    @check_sig([2], matriz_numeros_t, is_method=True)
    def predict(self, X):
        """Asigna cada punto de X al cluster más cercano."""
        self._check_fitted("predict")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        m = len(self.cluster_centers_[0])
        for i, row in enumerate(X):
            if len(row) != m:
                raise Exception(
                    f"KMeans: Expected {m} features, got {len(row)} at sample {i}"
                )
        return self._assign_clusters(X, self.cluster_centers_)

    def labels(self):
        """Devuelve las etiquetas de cluster después de fit."""
        self._check_fitted("labels")
        return self.labels_

    def cluster_centers(self):
        """Devuelve los centroides después de fit."""
        self._check_fitted("cluster_centers")
        return self.cluster_centers_

    def inertia(self):
        """Devuelve la inercia después de fit."""
        self._check_fitted("inertia")
        return self.inertia_

    def score(self, X):
        """Retorna la inercia negativa (compatibilidad con API scikit-learn).

        Menor (más negativo) es mejor.
        """
        self._check_fitted("score")
        if not X:
            return 0.0
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        labels = self._assign_clusters(X, self.cluster_centers_)
        inertia = sum(
            self._euclidean_distance_sq(X[i], self.cluster_centers_[labels[i]])
            for i in range(len(X))
        )
        return -inertia

    def __repr__(self):
        return f"KMeans(n_clusters={self.n_clusters}, max_iter={self.max_iter})"
