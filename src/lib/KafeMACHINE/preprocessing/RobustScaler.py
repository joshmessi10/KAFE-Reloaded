from global_utils import check_sig
from TypeUtils import pardos_t, matriz_numeros_t
from lib.KafePARDOS.DataFrame import DataFrame
from ..BaseMachine import BaseMachine


class RobustScaler(BaseMachine):
    """
    Robust Scaler — Escalamiento robusto usando mediana e IQR.

    Escala features usando estadísticos robustos a outliers:
    - Mediana (Q2) en vez de media
    - IQR (Q3 - Q1) en vez de desviación estándar

    Fundamento matemático:
        X_scaled = (X - median) / IQR

        Donde:
            median = Q2 (percentil 50)
            IQR = Q3 - Q1 (percentil 75 - percentil 25)

    Parámetros:
        with_centering: si True, centra usando mediana (default True)
        with_scaling: si True, escala usando IQR (default True)
        quantile_range: rango de quantiles para IQR (default (25.0, 75.0))

    Atributos (después de fit):
        center_: mediana por feature (si with_centering=True)
        scale_: IQR por feature (si with_scaling=True)
    """

    def __init__(self, with_centering=True, with_scaling=True, quantile_range=(25.0, 75.0)):
        super().__init__()
        if not with_centering and not with_scaling:
            raise Exception("RobustScaler: at least one of with_centering or with_scaling must be True")

        self.with_centering = with_centering
        self.with_scaling = with_scaling
        self.quantile_range = quantile_range
        self.center_ = []
        self.scale_ = []

    def _percentile(self, sorted_data, p):
        """Calcula el percentil p de datos ordenados."""
        n = len(sorted_data)
        if n == 0:
            return 0.0
        if n == 1:
            return sorted_data[0]

        k = (p / 100.0) * (n - 1)
        f = int(k)
        c = k - f

        if f + 1 < n:
            return sorted_data[f] + c * (sorted_data[f + 1] - sorted_data[f])
        return sorted_data[f]

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def fit(self, data):
        """Ajusta RobustScaler calculando mediana e IQR."""
        matrix, cols, is_df = self._unwrap_data(data)

        if not matrix or not matrix[0]:
            raise Exception("RobustScaler: Empty input data")

        n_samples = len(matrix)
        n_features = len(matrix[0])

        q_min, q_max = self.quantile_range

        self.center_ = []
        self.scale_ = []

        for j in range(n_features):
            values = sorted([matrix[i][j] for i in range(n_samples)])

            median = self._percentile(values, 50.0)
            q1 = self._percentile(values, q_min)
            q3 = self._percentile(values, q_max)
            iqr = q3 - q1

            self.center_.append(median)
            self.scale_.append(iqr)

        self._is_fitted = True
        return self

    def fit_transform(self, data):
        return self.fit(data).transform(data)

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def transform(self, data):
        """Transforma datos usando mediana e IQR ajustados."""
        self._check_fitted("transform")
        matrix, cols, is_df = self._unwrap_data(data)

        if len(matrix[0]) != len(self.center_):
            raise Exception("RobustScaler: Input dimension does not match fitted model")

        result = []
        for row in matrix:
            new_row = []
            for j in range(len(self.center_)):
                val = row[j]

                if self.with_centering:
                    val -= self.center_[j]

                if self.with_scaling:
                    if self.scale_[j] != 0:
                        val /= self.scale_[j]

                new_row.append(val)
            result.append(new_row)

        return DataFrame(cols, result) if is_df else result

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def inverse_transform(self, data):
        """Invierte la transformación."""
        self._check_fitted("inverse_transform")
        matrix, cols, is_df = self._unwrap_data(data)

        if len(matrix[0]) != len(self.center_):
            raise Exception("RobustScaler: Input dimension does not match fitted model")

        result = []
        for row in matrix:
            new_row = []
            for j in range(len(self.center_)):
                val = row[j]

                if self.with_scaling:
                    val *= self.scale_[j]

                if self.with_centering:
                    val += self.center_[j]

                new_row.append(val)
            result.append(new_row)

        return DataFrame(cols, result) if is_df else result

    def __repr__(self):
        return (
            f"RobustScaler(with_centering={self.with_centering}, "
            f"with_scaling={self.with_scaling})"
        )
