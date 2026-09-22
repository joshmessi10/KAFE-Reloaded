from global_utils import check_sig
from TypeUtils import matriz_numeros_t, pardos_t
from lib.KafeMATH.funciones import sqrt
from ..BaseMachine import BaseMachine


class DBSCAN(BaseMachine):
    """
    DBSCAN: Density-Based Spatial Clustering of Applications with Noise.

    Algoritmo de clustering que agrupa puntos densamente empaquetados,
    marcando los atípicos como ruido. A diferencia de KMeans, DBSCAN puede
    encontrar clusters de forma arbitraria y no requiere especificar el
    número de clusters.

    Fundamento matemático:
        Concepto clave: alcanzabilidad por densidad
        - Un punto p es punto central (core point) si al menos min_samples
          puntos están dentro de la distancia eps (incluyendo p mismo)
        - Un punto q es directamente alcanzable por densidad desde p si q
          está dentro de la distancia eps de p y p es un punto central
        - Un punto q es alcanzable por densidad desde p si existe una cadena
          de puntos p1, ..., pn donde cada uno es directamente alcanzable
          desde el anterior
        - Un cluster es un conjunto de puntos densamente conectados

    Parámetros:
        eps: distancia máxima entre dos puntos para ser considerados vecinos
        min_samples: mínimo de puntos para formar una región densa

    Atributos (después de fit):
        labels_: etiquetas de cluster para cada punto (-1 = ruido)
        n_clusters_: número de clusters encontrados (excluyendo ruido)
        core_sample_indices_: índices de los puntos centrales
    """

    def __init__(self, eps=0.5, min_samples=5):
        super().__init__()
        if eps <= 0:
            raise Exception("DBSCAN: eps must be positive")
        if min_samples <= 0:
            raise Exception("DBSCAN: min_samples must be positive")
        self.eps = eps
        self.min_samples = min_samples
        self.labels_ = []
        self.n_clusters_ = 0
        self.core_sample_indices_ = []

    def _euclidean_distance(self, a, b):
        """Distancia euclidiana entre dos puntos."""
        return sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))

    def _region_query(self, X, point_idx):
        """Encuentra todos los puntos dentro de la distancia eps de point_idx."""
        neighbors = []
        for i, point in enumerate(X):
            if self._euclidean_distance(X[point_idx], point) <= self.eps:
                neighbors.append(i)
        return neighbors

    def _expand_cluster(self, X, labels, point_idx, neighbors, cluster_id):
        """Expande un cluster desde un punto central."""
        labels[point_idx] = cluster_id
        i = 0
        while i < len(neighbors):
            neighbor_idx = neighbors[i]

            if labels[neighbor_idx] == -1:
                labels[neighbor_idx] = cluster_id

            elif labels[neighbor_idx] == 0:
                labels[neighbor_idx] = cluster_id
                new_neighbors = self._region_query(X, neighbor_idx)
                if len(new_neighbors) >= self.min_samples:
                    neighbors = neighbors + new_neighbors

            i += 1

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def fit(self, X):
        """
        Realiza el clustering DBSCAN.

        Args:
            X: Características (lista o DataFrame)
        """
        matrix, cols, is_df = self._unwrap_data(X)
        matrix = self._validate_matrix_shape(matrix)

        n_samples = len(matrix)

        self.labels_ = [0] * n_samples
        cluster_id = 0

        for i in range(n_samples):
            if self.labels_[i] != 0:
                continue

            neighbors = self._region_query(matrix, i)

            if len(neighbors) < self.min_samples:
                self.labels_[i] = -1
            else:
                cluster_id += 1
                self._expand_cluster(matrix, self.labels_, i, neighbors, cluster_id)

        self.n_clusters_ = cluster_id
        self.core_sample_indices_ = [
            i for i in range(n_samples)
            if len(self._region_query(matrix, i)) >= self.min_samples
        ]
        self._is_fitted = True
        return self

    def fit_predict(self, X):
        """Ajusta el modelo y devuelve las etiquetas de cluster."""
        self.fit(X)
        return self.labels_

    def labels(self):
        """Devuelve las etiquetas de cluster después de fit."""
        self._check_fitted("labels")
        return self.labels_

    def n_clusters(self):
        """Devuelve el número de clusters encontrados después de fit."""
        self._check_fitted("n_clusters")
        return self.n_clusters_

    def core_sample_indices(self):
        """Devuelve los índices de los puntos centrales después de fit."""
        self._check_fitted("core_sample_indices")
        return self.core_sample_indices_

    def __repr__(self):
        return f"DBSCAN(eps={self.eps}, min_samples={self.min_samples})"
