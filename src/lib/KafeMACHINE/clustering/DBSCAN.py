from global_utils import check_sig
from TypeUtils import numeric_matrix_types, pardos_type
from lib.KafeMATH.functions import sqrt
from ..BaseMachine import BaseMachine


class DBSCAN(BaseMachine):
    """
    DBSCAN: Density-Based Spatial Clustering of Applications with Noise.

    Clustering algorithm that groups densely packed points,
    marking outliers as noise. Unlike KMeans, DBSCAN can
    find clusters arbitrarily and does not require specifying the
    number of clusters.

    Mathematical foundation:
        Key concept: reachability by density
        - A point p is a core point if at least min_samples
          points are within distance eps (including p itself)
        - A point q is directly reachable by density from p if q
          is within distance eps of p and p is a central point
        - A point q is reachable by density from p if a chain exists
          of points p1, ..., pn where each is directly reachable
          since the previous
        - A cluster is a set of densely connected points

    Parameters:
        eps: maximum distance between two points to be considered neighbors
        min_samples: minimum number of points to form a dense region

    Attributes (after fit):
        labels_: cluster labels for each point (-1 = noise)
        n_clusters_: number of clusters found (excluding noise)
        core_sample_indices_: center point indices
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
        """Find all points within distance eps of point_idx."""
        neighbors = []
        for i, point in enumerate(X):
            if self._euclidean_distance(X[point_idx], point) <= self.eps:
                neighbors.append(i)
        return neighbors

    def _expand_cluster(self, X, labels, point_idx, neighbors, cluster_id):
        """Expand a cluster from a central point."""
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

    @check_sig([2], [pardos_type] + numeric_matrix_types, is_method=True)
    def fit(self, X):
        """
        Performs DBSCAN clustering.

        Args:
            X: Features (list or DataFrame)
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
        """Fits the model and returns the cluster labels."""
        self.fit(X)
        return self.labels_

    def labels(self):
        """Returns the cluster labels after fit."""
        self._check_fitted("labels")
        return self.labels_

    def n_clusters(self):
        """Returns the number of clusters found after fit."""
        self._check_fitted("n_clusters")
        return self.n_clusters_

    def core_sample_indices(self):
        """Returns the indices of the center points after fit."""
        self._check_fitted("core_sample_indices")
        return self.core_sample_indices_

    def __repr__(self):
        return f"DBSCAN(eps={self.eps}, min_samples={self.min_samples})"
