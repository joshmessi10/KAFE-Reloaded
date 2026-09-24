from lib.KafeMATH.functions import sqrt, pow_
from global_utils import check_sig
from TypeUtils import numeric_vector_types, numeric_matrix_types, pardos_type
from ..metrics import accuracy_score
from ..BaseMachine import BaseMachine


class LinearDiscriminantAnalysis(BaseMachine):
    """
    Linear Discriminant Analysis (LDA) — Classification and dimensionality reduction.

    LDA projects the data into a space of lower dimensionality than
    maximizes the separation between classes (maximizes the ratio between variance
    inter-class and intra-class variance).

    Mathematical foundation:
        1. Calculate averages per class: μ_k
        2. Calculate the within-class scatter matrix: S_W = Σ_k Σ_{x∈C_k} (x - μ_k)(x - μ_k)^T
        3. Calculate the between-class scatter matrix: S_B = Σ_k n_k (μ_k - μ)(μ_k - μ)^T
        4. Solve the eigenproblem: S_W^{-1} S_B w = λ w
        5. Select the k eigenvectors with the highest eigenvalues

    Projection: y = W^T x

    Parameters:
        n_components: number of components (default None = min(n_classes-1, n_features))
        solver: solver for eigendecomposition (default "svd")
        store_covariance: if save the covariance (default False)

    Attributes (after fit):
        scalings_: eigenvectors (projection directions)
        explained_variance_ratio_: proportion of variance explained
        means_: averages per class
        classes_: unique classes
        prior_: prior probabilities
    """

    def __init__(self, n_components=None, solver="svd", store_covariance=False):
        super().__init__()
        if solver not in ("svd", "lsqr", "eigen"):
            raise Exception("LinearDiscriminantAnalysis: solver must be 'svd', 'lsqr', or 'eigen'")

        self.n_components = n_components
        self.solver = solver
        self.store_covariance = store_covariance
        self.scalings_ = []
        self.explained_variance_ratio_ = []
        self.means_ = []
        self.classes_ = []
        self.prior_ = []
        self.covariance_ = []

    def _matrix_multiply(self, A, B):
        """Multiply matrices A * B."""
        rows_a = len(A)
        cols_a = len(A[0])
        cols_b = len(B[0])

        result = [[0.0 for _ in range(cols_b)] for _ in range(rows_a)]
        for i in range(rows_a):
            for j in range(cols_b):
                for k in range(cols_a):
                    result[i][j] += A[i][k] * B[k][j]
        return result

    def _matrix_transpose(self, A):
        """Transposes a matrix."""
        rows = len(A)
        cols = len(A[0])
        return [[A[i][j] for i in range(rows)] for j in range(cols)]

    def _matrix_subtract(self, A, B):
        """Subtract matrices A - B."""
        return [[A[i][j] - B[i][j] for j in range(len(A[0]))] for i in range(len(A))]

    def _matrix_add(self, A, B):
        """Add matrices A + B."""
        return [[A[i][j] + B[i][j] for j in range(len(A[0]))] for i in range(len(A))]

    def _scalar_multiply(self, scalar, A):
        """Multiply scalar by matrix."""
        return [[scalar * A[i][j] for j in range(len(A[0]))] for i in range(len(A))]

    def _outer_product(self, a, b):
        """Exterior product of two vectors."""
        return [[a[i] * b[j] for j in range(len(b))] for i in range(len(a))]

    def _jacobi_eigen(self, matrix, n):
        """Calculate eigenvalues ​​and eigenvectors using Jacobi."""
        A = [row[:] for row in matrix]
        eigenvectors = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]

        max_iterations = 200
        epsilon = 1e-10

        for _ in range(max_iterations):
            p, q = 0, 1
            max_val = abs(A[0][1])
            for i in range(n):
                for j in range(i + 1, n):
                    if abs(A[i][j]) > max_val:
                        max_val = abs(A[i][j])
                        p, q = i, j

            if max_val < epsilon:
                break

            if abs(A[p][p] - A[q][q]) < 1e-10:
                theta = 3.141592653589793 / 4.0
            else:
                phi = (A[q][q] - A[p][p]) / (2.0 * A[p][q])
                t = (1.0 if phi >= 0 else -1.0) / (abs(phi) + sqrt(1.0 + phi * phi))
                theta = t

            c = 1.0 / sqrt(1.0 + theta * theta)
            s = theta * c
            tau = s / (1.0 + c)

            app, aqq, apq = A[p][p], A[q][q], A[p][q]
            A[p][p] = app - theta * apq
            A[q][q] = aqq + theta * apq
            A[p][q] = 0.0
            A[q][p] = 0.0

            for i in range(n):
                if i != p and i != q:
                    api, aqi = A[p][i], A[q][i]
                    A[p][i] = api - s * (aqi + tau * api)
                    A[i][p] = A[p][i]
                    A[q][i] = aqi + s * (api - tau * aqi)
                    A[i][q] = A[q][i]

                v_ip, v_iq = eigenvectors[i][p], eigenvectors[i][q]
                eigenvectors[i][p] = v_ip - s * (v_iq + tau * v_ip)
                eigenvectors[i][q] = v_iq + s * (v_ip - tau * v_iq)

        eigenvalues = [A[i][i] for i in range(n)]
        components = [[eigenvectors[i][j] for i in range(n)] for j in range(n)]
        return eigenvalues, components

    def _solve_eigen(self, S_W, S_B, n_features):
        """Solve S_W^{-1} S_B w = λ w using Jacobi."""
        S_W_inv = self._inverse_matrix(S_W, n_features)
        M = self._matrix_multiply(S_W_inv, S_B)
        M_T = self._matrix_transpose(M)
        M_sym = [[(M[i][j] + M_T[i][j]) / 2.0 for j in range(n_features)] for i in range(n_features)]

        eigenvalues, eigenvectors = self._jacobi_eigen(M_sym, n_features)
        return eigenvalues, eigenvectors

    def _inverse_matrix(self, matrix, n):
        """Calculates matrix inverse using Gauss-Jordan."""
        aug = [row[:] + [1.0 if i == j else 0.0 for j in range(n)] for i, row in enumerate(matrix)]

        for col in range(n):
            max_row = col
            for row in range(col + 1, n):
                if abs(aug[row][col]) > abs(aug[max_row][col]):
                    max_row = row
            aug[col], aug[max_row] = aug[max_row], aug[col]

            pivot = aug[col][col]
            if abs(pivot) < 1e-10:
                pivot = 1e-10

            for j in range(2 * n):
                aug[col][j] /= pivot

            for row in range(n):
                if row != col:
                    factor = aug[row][col]
                    for j in range(2 * n):
                        aug[row][j] -= factor * aug[col][j]

        return [[aug[i][j + n] for j in range(n)] for i in range(n)]

    @check_sig([3], [pardos_type] + numeric_vector_types + numeric_matrix_types, numeric_vector_types, is_method=True)
    def fit(self, X, y):
        """Adjusts LDA by calculating optimal projection."""
        matrix, cols, is_df = self._unwrap_data(X)
        matrix = self._validate_matrix_shape(matrix)

        n_samples = len(matrix)
        if len(y) != n_samples:
            raise Exception("LinearDiscriminantAnalysis: X and y must have the same number of samples")

        n_features = len(matrix[0])

        self.classes_ = sorted(set(y))
        n_classes = len(self.classes_)

        if n_classes < 2:
            raise Exception("LinearDiscriminantAnalysis: y must contain at least 2 classes")

        if self.n_components is None:
            self.n_components = min(n_classes - 1, n_features)

        if self.n_components > n_classes - 1:
            raise Exception(
                f"LinearDiscriminantAnalysis: n_components ({self.n_components}) cannot exceed "
                f"n_classes - 1 ({n_classes - 1})"
            )

        self.means_ = []
        class_counts = []
        for c in self.classes_:
            X_c = [matrix[i] for i in range(n_samples) if y[i] == c]
            n_c = len(X_c)
            class_counts.append(n_c)
            mean_c = [sum(X_c[i][j] for i in range(n_c)) / n_c for j in range(n_features)]
            self.means_.append(mean_c)

        overall_mean = [sum(matrix[i][j] for i in range(n_samples)) / n_samples for j in range(n_features)]

        S_W = [[0.0 for _ in range(n_features)] for _ in range(n_features)]
        for k, c in enumerate(self.classes_):
            X_c = [matrix[i] for i in range(n_samples) if y[i] == c]
            for x in X_c:
                diff = [x[j] - self.means_[k][j] for j in range(n_features)]
                for i in range(n_features):
                    for j in range(n_features):
                        S_W[i][j] += diff[i] * diff[j]

        S_B = [[0.0 for _ in range(n_features)] for _ in range(n_features)]
        for k in range(n_classes):
            n_k = class_counts[k]
            diff = [self.means_[k][j] - overall_mean[j] for j in range(n_features)]
            outer = self._outer_product(diff, diff)
            for i in range(n_features):
                for j in range(n_features):
                    S_B[i][j] += n_k * outer[i][j]

        eigenvalues, eigenvectors = self._solve_eigen(S_W, S_B, n_features)

        sorted_indices = sorted(range(n_features), key=lambda i: eigenvalues[i], reverse=True)

        self.scalings_ = [eigenvectors[i] for i in sorted_indices[:self.n_components]]

        total_var = sum(max(ev, 0) for ev in eigenvalues)
        self.explained_variance_ratio_ = [
            max(eigenvalues[i], 0) / total_var if total_var > 0 else 0.0
            for i in sorted_indices[:self.n_components]
        ]

        self.prior_ = [class_counts[k] / n_samples for k in range(n_classes)]

        if self.store_covariance:
            self.covariance_ = [[S_W[i][j] / n_samples for j in range(n_features)] for i in range(n_features)]

        self._is_fitted = True
        return self

    @check_sig([2], numeric_vector_types + numeric_matrix_types, is_method=True)
    def transform(self, X):
        """Transform X to the space of lower dimensionality."""
        self._check_fitted("transform")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        n_features = len(self.scalings_[0]) if self.scalings_ else 0
        for i, row in enumerate(X):
            if len(row) != n_features:
                raise Exception(
                    f"LinearDiscriminantAnalysis: Expected {n_features} features, got {len(row)} at sample {i}"
                )

        result = []
        for x in X:
            projected = []
            for k in range(len(self.scalings_)):
                val = sum(x[j] * self.scalings_[k][j] for j in range(n_features))
                projected.append(val)
            result.append(projected)

        return result

    def fit_transform(self, X, y):
        """Adjust and transform in one step."""
        return self.fit(X, y).transform(X)

    @check_sig([2], numeric_vector_types + numeric_matrix_types, is_method=True)
    def predict(self, X):
        """Predict classes using LDA as a classifier."""
        self._check_fitted("predict")
        if not X:
            return []
        if not isinstance(X[0], (list, tuple)):
            X = [[v] for v in X]

        n_features = len(self.scalings_[0]) if self.scalings_ else 0
        for i, row in enumerate(X):
            if len(row) != n_features:
                raise Exception(
                    f"LinearDiscriminantAnalysis: Expected {n_features} features, got {len(row)} at sample {i}"
                )

        projected = self.transform(X)

        means_projected = []
        for mean in self.means_:
            proj_mean = []
            for k in range(len(self.scalings_)):
                val = sum(mean[j] * self.scalings_[k][j] for j in range(n_features))
                proj_mean.append(val)
            means_projected.append(proj_mean)

        labels = []
        for x_proj in projected:
            best_class = 0
            best_score = float('inf')
            for k in range(len(self.classes_)):
                dist = sum((x_proj[j] - means_projected[k][j]) ** 2 for j in range(len(x_proj)))
                if dist < best_score:
                    best_score = dist
                    best_class = k
            labels.append(self.classes_[best_class])

        return labels

    def score(self, X, y, metric=None):
        """Score using accuracy (default) or a custom metric."""
        self._check_fitted("score")
        preds = self.predict(X)
        if metric is None:
            return accuracy_score(y, preds)
        return metric(y, preds)

    def __repr__(self):
        return (
            f"LinearDiscriminantAnalysis(n_components={self.n_components}, "
            f"solver='{self.solver}')"
        )
