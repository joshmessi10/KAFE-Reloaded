from ..BaseMachine import BaseMachine


class AgglomerativeClustering(BaseMachine):
    """
    Agglomerative Clustering — Clustering jerárquico aglomerativo.

    Algoritmo bottom-up que inicia cada punto como un cluster separado
    y merge los clusters más cercanos iterativamente hasta alcanzar
    el número deseado de clusters.

    Fundamento matemático:
        1. Iniciar: cada punto es un cluster (n clusters)
        2. Calcular matriz de distancias entre todos los pares
        3. Encontrar los dos clusters más cercanos
        4. Merge esos dos clusters
        5. Repetir hasta tener n_clusters

    Criterios de enlace (linkage):
        - 'single': distancia mínima entre puntos de diferentes clusters
        - 'complete': distancia máxima entre puntos de diferentes clusters
        - 'average': distancia promedio entre puntos de diferentes clusters
        - 'ward': minimiza la varianza intra-cluster al mergear

    Parámetros:
        n_clusters: número de clusters (default 2)
        linkage: criterio de enlace ('single', 'complete', 'average', 'ward') (default 'ward')

    Atributos (después de fit):
        labels_: asignación de cluster para cada punto
        n_clusters_: número de clusters
        children_: historial de merges (par de clusters mergeados en cada paso)
        distances_: distancias de cada merge
    """

    def __init__(self, n_clusters=2, linkage='ward'):
        super().__init__()
        if n_clusters <= 0:
            raise Exception("AgglomerativeClustering: n_clusters must be positive")
        if linkage not in ('single', 'complete', 'average', 'ward'):
            raise Exception(
                "AgglomerativeClustering: linkage must be 'single', 'complete', 'average', or 'ward'"
            )

        self.n_clusters = n_clusters
        self.linkage = linkage
        self.labels_ = []
        self.n_clusters_ = n_clusters
        self.children_ = []
        self.distances_ = []

    def _euclidean_distance(self, a, b):
        """Distancia euclidiana entre dos puntos."""
        return sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5

    def _compute_distance_matrix(self, X):
        """Calcula la matriz de distancias entre todos los puntos."""
        n = len(X)
        dist_matrix = [[0.0] * n for _ in range(n)]
        for i in range(n):
            for j in range(i + 1, n):
                d = self._euclidean_distance(X[i], X[j])
                dist_matrix[i][j] = d
                dist_matrix[j][i] = d
        return dist_matrix

    def _compute_linkage_distance(self, cluster_i, cluster_j, dist_matrix, X):
        """Calcula la distancia entre dos clusters según el criterio de enlace."""
        if self.linkage == 'single':
            min_dist = float('inf')
            for i in cluster_i:
                for j in cluster_j:
                    if dist_matrix[i][j] < min_dist:
                        min_dist = dist_matrix[i][j]
            return min_dist

        elif self.linkage == 'complete':
            max_dist = 0.0
            for i in cluster_i:
                for j in cluster_j:
                    if dist_matrix[i][j] > max_dist:
                        max_dist = dist_matrix[i][j]
            return max_dist

        elif self.linkage == 'average':
            total_dist = 0.0
            count = 0
            for i in cluster_i:
                for j in cluster_j:
                    total_dist += dist_matrix[i][j]
                    count += 1
            return total_dist / count if count > 0 else 0.0

        elif self.linkage == 'ward':
            n_i = len(cluster_i)
            n_j = len(cluster_j)
            n_features = len(X[0])

            centroid_i = [sum(X[k][d] for k in cluster_i) / n_i for d in range(n_features)]
            centroid_j = [sum(X[k][d] for k in cluster_j) / n_j for d in range(n_features)]

            dist_sq = sum((centroid_i[d] - centroid_j[d]) ** 2 for d in range(n_features))
            return (n_i * n_j / (n_i + n_j)) * dist_sq

    def fit(self, X):
        """Ajusta AgglomerativeClustering usando el algoritmo aglomerativo."""
        matrix, cols, is_df = self._unwrap_data(X)
        matrix = self._validate_matrix_shape(matrix)

        n = len(matrix)
        if self.n_clusters >= n:
            self.labels_ = list(range(n))
            self.children_ = []
            self.distances_ = []
            self._is_fitted = True
            return self

        clusters = [[i] for i in range(n)]
        dist_matrix = self._compute_distance_matrix(matrix)

        self.children_ = []
        self.distances_ = []

        while len(clusters) > self.n_clusters:
            min_dist = float('inf')
            merge_i, merge_j = 0, 1

            for i in range(len(clusters)):
                for j in range(i + 1, len(clusters)):
                    d = self._compute_linkage_distance(
                        clusters[i], clusters[j], dist_matrix, matrix
                    )
                    if d < min_dist:
                        min_dist = d
                        merge_i, merge_j = i, j

            self.children_.append([clusters[merge_i][0], clusters[merge_j][0]])
            self.distances_.append(min_dist)

            new_cluster = clusters[merge_i] + clusters[merge_j]
            clusters.pop(merge_j)
            clusters.pop(merge_i)
            clusters.append(new_cluster)

        self.labels_ = [0] * n
        for cluster_idx, cluster in enumerate(clusters):
            for point_idx in cluster:
                self.labels_[point_idx] = cluster_idx

        self.n_clusters_ = len(clusters)
        self._is_fitted = True
        return self

    def fit_predict(self, X):
        """Fit y retorna labels en un solo paso."""
        self.fit(X)
        return self.labels_

    def __repr__(self):
        return f"AgglomerativeClustering(n_clusters={self.n_clusters}, linkage='{self.linkage}')"
