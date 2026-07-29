import math
from global_utils import check_sig
from TypeUtils import pardos_t, entero_t, matriz_numeros_t
from lib.KafePARDOS.DataFrame import DataFrame
from .BaseMachine import BaseMachine


class PCA(BaseMachine):
    def __init__(self, n_components):
        super().__init__()
        if n_components <= 0:
            raise Exception("PCA: n_components must be positive")
        self.n_components = n_components
        self.components_ = []
        self.mean_ = []
        self.explained_variance_ = []

    @staticmethod
    def _jacobi_eigenvalues(cov_matrix, n_features):
        if n_features == 1:
            return [cov_matrix[0][0]], [[1.0]]

        eigenvectors = [[1.0 if i == j else 0.0 for j in range(n_features)] for i in range(n_features)]

        max_iterations = 100
        epsilon = 1e-10

        for _ in range(max_iterations):
            p, q = 0, 1
            max_val = abs(cov_matrix[0][1])
            for i in range(n_features):
                for j in range(i + 1, n_features):
                    if abs(cov_matrix[i][j]) > max_val:
                        max_val = abs(cov_matrix[i][j])
                        p, q = i, j

            if max_val < epsilon:
                break

            phi = (cov_matrix[q][q] - cov_matrix[p][p]) / (2.0 * cov_matrix[p][q])
            t = (1.0 if phi >= 0 else -1.0) / (abs(phi) + math.sqrt(1.0 + math.pow(phi, 2)))
            c = 1.0 / math.sqrt(1.0 + math.pow(t, 2))
            s = t * c
            tau = s / (1.0 + c)

            app = cov_matrix[p][p]
            aqq = cov_matrix[q][q]
            apq = cov_matrix[p][q]

            cov_matrix[p][p] = app - t * apq
            cov_matrix[q][q] = aqq + t * apq
            cov_matrix[p][q] = 0.0
            cov_matrix[q][p] = 0.0

            for i in range(n_features):
                if i != p and i != q:
                    api = cov_matrix[p][i]
                    aqi = cov_matrix[q][i]
                    cov_matrix[p][i] = api - s * (aqi + tau * api)
                    cov_matrix[i][p] = cov_matrix[p][i]
                    cov_matrix[q][i] = aqi + s * (api - tau * aqi)
                    cov_matrix[i][q] = cov_matrix[q][i]

                v_ip = eigenvectors[i][p]
                v_iq = eigenvectors[i][q]
                eigenvectors[i][p] = v_ip - s * (v_iq + tau * v_ip)
                eigenvectors[i][q] = v_iq + s * (v_ip - tau * v_iq)

        eigenvalues = [cov_matrix[i][i] for i in range(n_features)]
        components = [[eigenvectors[i][j] for i in range(n_features)] for j in range(n_features)]
        return eigenvalues, components

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def fit(self, data):
        if isinstance(data, DataFrame):
            matrix = data.data
        else:
            matrix = data

        if not matrix or not matrix[0]:
            raise Exception("PCA: Empty input data")

        n_samples = len(matrix)
        n_features = len(matrix[0])

        if n_samples == 1:
            raise Exception("PCA: Need at least 2 samples to compute covariance")

        # 1. Mean Centering
        self.mean_ = [sum(row[j] for row in matrix) / n_samples for j in range(n_features)]
        centered_matrix = [[matrix[i][j] - self.mean_[j] for j in range(n_features)] for i in range(n_samples)]

        # 2. Covariance Matrix: C = (X^T * X) / (n - 1)
        cov_matrix = [[0.0 for _ in range(n_features)] for _ in range(n_features)]
        for i in range(n_features):
            for j in range(i, n_features):
                val = sum(centered_matrix[k][i] * centered_matrix[k][j] for k in range(n_samples)) / (n_samples - 1)
                cov_matrix[i][j] = val
                cov_matrix[j][i] = val

        # 3. Jacobi Eigenvalue Algorithm
        eigenvalues, components = self._jacobi_eigenvalues(cov_matrix, n_features)

        # 4. Sort by eigenvalue descending, keep top n_components
        sorted_indices = sorted(range(n_features), key=lambda i: eigenvalues[i], reverse=True)
        self.explained_variance_ = [eigenvalues[i] for i in sorted_indices[:self.n_components]]
        self.components_ = [components[i] for i in sorted_indices[:self.n_components]]

        self._is_fitted = True
        return self

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def transform(self, data):
        self._check_fitted("transform")
        matrix, cols, is_df = self._unwrap_data(data)

        n_samples = len(matrix)
        n_features = len(matrix[0])

        if n_features != len(self.mean_):
             raise Exception("PCA: Input dimension does not match fitted model")

        transformed_data = []
        for i in range(n_samples):
            centered_row = [matrix[i][j] - self.mean_[j] for j in range(n_features)]
            projected_row = []
            for k in range(self.n_components):
                val = sum(centered_row[j] * self.components_[k][j] for j in range(n_features))
                projected_row.append(val)
            transformed_data.append(projected_row)

        if is_df:
            out_cols = [f"PC{i+1}" for i in range(self.n_components)]
            return DataFrame(out_cols, transformed_data)
        return transformed_data

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def inverse_transform(self, data):
        self._check_fitted("inverse_transform")
        matrix, _, is_df = self._unwrap_data(data)

        if len(matrix[0]) != len(self.components_):
            raise Exception("PCA: Input dimension does not match fitted model (n_components)")

        result = []
        for row in matrix:
            original = [
                sum(row[k] * self.components_[k][j] for k in range(len(self.components_)))
                for j in range(len(self.mean_))
            ]
            original = [original[j] + self.mean_[j] for j in range(len(self.mean_))]
            result.append(original)

        if is_df:
            cols = [f"original_dim_{j+1}" for j in range(len(self.mean_))]
            return DataFrame(cols, result)
        return result

    def round(self, decimals=4):
        from lib.KafeMATH.funciones import math_round

        if self.mean_:
            self.mean_ = [math_round(x, decimals) for x in self.mean_]

        if self.explained_variance_:
            self.explained_variance_ = [math_round(x, decimals) for x in self.explained_variance_]

        if self.components_:
            self.components_ = [[math_round(x, decimals) for x in row] for row in self.components_]

        return self

    def __repr__(self):
        return f"PCA(n_components={self.n_components}, explained_variance={self.explained_variance_})"
