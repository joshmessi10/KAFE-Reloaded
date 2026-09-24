from typing import cast

from ..BaseMachine import BaseMachine


class AgglomerativeClustering(BaseMachine):
    """
    Agglomerative Clustering — Agglomerative hierarchical clustering.

    Bottom-up algorithm that starts each point as a separate cluster
    and merge the closest clusters iteratively until reaching
    the desired number of clusters.

    Mathematical foundation:
        1. Start: each point is a cluster (n clusters)
        2. Calculate distance matrix between all pairs
        3. Find the two closest clusters
        4. Merge those two clusters
        5. Repeat until you have n_clusters

    Link criteria (linkage):
        - 'single': minimum distance between points of different clusters
        - 'complete': maximum distance between points of different clusters
        - 'average': average distance between points of different clusters
        - 'ward': minimize intra-cluster variance when merging

    Parameters:
        n_clusters: number of clusters (default 2)
        linkage: link criteria ('single', 'complete', 'average', 'ward') (default 'ward')

    Attributes (after fit):
        labels_: cluster assignment for each point
        n_clusters_: number of clusters
        children_: merge history (pair of clusters merged in each step)
        distances_: distances of each merge
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
        """Euclidean distance between two points."""
        return sum((x - y) ** 2 for x, y in zip(a, b, strict=False)) ** 0.5

    def _compute_distance_matrix(self, X):
        """Calculates the distance matrix between all points."""
        n = len(X)
        dist_matrix = [[0.0] * n for _ in range(n)]
        for i in range(n):
            for j in range(i + 1, n):
                d = self._euclidean_distance(X[i], X[j])
                dist_matrix[i][j] = d
                dist_matrix[j][i] = d
        return dist_matrix

    def _compute_linkage_distance(self, cluster_i, cluster_j, dist_matrix, X):
        """Calculate the distance between two clusters according to the link criterion."""
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
        """Adjusts AgglomerativeClustering using the agglomerative algorithm."""
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
                    d = cast(
                        float,
                        self._compute_linkage_distance(
                            clusters[i], clusters[j], dist_matrix, matrix
                        ),
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
        """Fit and return labels in one step."""
        self.fit(X)
        return self.labels_

    def __repr__(self):
        return f"AgglomerativeClustering(n_clusters={self.n_clusters}, linkage='{self.linkage}')"
