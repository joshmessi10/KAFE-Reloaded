from global_utils import check_sig
from TypeUtils import pardos_t, matriz_numeros_t, flotante_t
from lib.KafePARDOS.DataFrame import DataFrame
from ..BaseMachine import BaseMachine


class VarianceThreshold(BaseMachine):
    """
    Elimina features con varianza por debajo de un umbral.

    Fundamento matematico:
        Para cada feature j:
            Var(j) = (1/n) * Sum(x_ij - mean_j)^2

        Si Var(j) < threshold, la feature se elimina.

        Un feature con varianza 0 es constante (no aporta informacion).
        Un feature con baja varianza tiene poca capacidad discriminatoria.

    Parametros:
        threshold: umbral de varianza minimo (default 0.0)

    Atributos (despues de fit):
        variances_: varianza de cada feature
        selected_indices_: indices de features seleccionadas
        n_features_in_: numero de features de entrada
        n_features_out_: numero de features de salida
    """

    def __init__(self, threshold=0.0):
        super().__init__()
        if threshold < 0:
            raise Exception("VarianceThreshold: threshold must be non-negative")
        self.threshold = threshold
        self.variances_ = []
        self.selected_indices_ = []
        self.n_features_in_ = 0
        self.n_features_out_ = 0

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def fit(self, data):
        """Ajusta VarianceThreshold (calcula varianzas y selecciona features)."""
        matrix, cols, is_df = self._unwrap_data(data)

        if not matrix or not matrix[0]:
            raise Exception("VarianceThreshold: Empty input data")

        n_samples = len(matrix)
        n_features = len(matrix[0])
        self.n_features_in_ = n_features

        self.variances_ = []
        for j in range(n_features):
            mean = sum(row[j] for row in matrix) / n_samples
            var = sum((row[j] - mean) ** 2 for row in matrix) / n_samples
            self.variances_.append(var)

        self.selected_indices_ = [j for j in range(n_features) if self.variances_[j] > self.threshold]
        self.n_features_out_ = len(self.selected_indices_)

        self._is_fitted = True
        return self

    def fit_transform(self, data):
        """Fit y transform en un solo paso."""
        return self.fit(data).transform(data)

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def transform(self, data):
        """Transforma eliminando features con baja varianza."""
        self._check_fitted("transform")
        matrix, cols, is_df = self._unwrap_data(data)

        if not matrix or not matrix[0]:
            raise Exception("VarianceThreshold: Empty input data")

        if len(matrix[0]) != self.n_features_in_:
            raise Exception(
                f"VarianceThreshold: Expected {self.n_features_in_} features, got {len(matrix[0])}"
            )

        result = [[row[j] for j in self.selected_indices_] for row in matrix]

        new_cols = [cols[j] for j in self.selected_indices_] if cols and is_df else None
        return DataFrame(new_cols, result) if is_df else result

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def inverse_transform(self, data):
        """No implementado (transformacion no es invertible)."""
        raise Exception("VarianceThreshold: inverse_transform not implemented")

    def __repr__(self):
        return f"VarianceThreshold(threshold={self.threshold}, n_features_out={self.n_features_out_})"
