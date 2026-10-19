from global_utils import check_sig
from TypeUtils import pardos_t, matriz_numeros_t
from lib.KafePARDOS.DataFrame import DataFrame
from ..BaseMachine import BaseMachine


class PolynomialFeatures(BaseMachine):
    """
    Genera features polinomiales hasta un grado especificado.

    Transforma features [x1, x2] en:
    - degree=1: [1, x1, x2]
    - degree=2: [1, x1, x2, x1², x1*x2, x2²]
    - degree=3: [1, x1, x2, x1², x1*x2, x2², x1³, x1²*x2, x1*x2², x2³]

    Fundamento matemático:
        Para d features y grado n, genera todas las combinaciones
        de potencias p1, p2, ..., pd donde p1 + p2 + ... + pd <= n.

    Parámetros:
        degree: grado máximo del polinomio (default 2)
        include_bias: si se incluye el término de sesgo (columna de 1s) (default True)

    Atributos (después de fit):
        n_features_in_: número de features de entrada
        n_features_out_: número de features de salida
    """

    def __init__(self, degree=2, include_bias=True):
        super().__init__()
        if degree < 1:
            raise Exception("PolynomialFeatures: degree must be at least 1")
        self.degree = degree
        self.include_bias = include_bias
        self.n_features_in_ = 0
        self.n_features_out_ = 0
        self._feature_names = []

    def _generate_combinations(self, n_features, degree):
        """Genera todas las combinaciones de potencias para features polinomiales."""
        if n_features == 0:
            return []

        combinations = []

        def _helper(current, remaining_features, remaining_degree):
            if remaining_features == 0:
                combinations.append(current[:])
                return

            for d in range(remaining_degree + 1):
                current.append(d)
                _helper(current, remaining_features - 1, remaining_degree - d)
                current.pop()

        _helper([], n_features, degree)
        return combinations

    def _get_feature_names(self):
        """Genera nombres de features para el output."""
        names = []
        combinations = self._generate_combinations(self.n_features_in_, self.degree)

        for combo in combinations:
            if not self.include_bias and all(p == 0 for p in combo):
                continue

            parts = []
            for i, power in enumerate(combo):
                if power == 0:
                    continue
                elif power == 1:
                    parts.append(f"x{i}")
                else:
                    parts.append(f"x{i}^{power}")

            if not parts:
                names.append("1")
            else:
                names.append("*".join(parts))

        return names

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def fit(self, data):
        """Ajusta PolynomialFeatures (calcula dimensiones de salida)."""
        matrix, cols, is_df = self._unwrap_data(data)

        if not matrix or not matrix[0]:
            raise Exception("PolynomialFeatures: Empty input data")

        self.n_features_in_ = len(matrix[0])
        combinations = self._generate_combinations(self.n_features_in_, self.degree)

        if self.include_bias:
            self.n_features_out_ = len(combinations)
        else:
            self.n_features_out_ = len(combinations) - 1

        self._feature_names = self._get_feature_names()
        self._is_fitted = True
        return self

    def fit_transform(self, data):
        """Fit y transform en un solo paso."""
        return self.fit(data).transform(data)

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def transform(self, data):
        """Transforma features a features polinomiales."""
        self._check_fitted("transform")
        matrix, cols, is_df = self._unwrap_data(data)

        if not matrix or not matrix[0]:
            raise Exception("PolynomialFeatures: Empty input data")

        if len(matrix[0]) != self.n_features_in_:
            raise Exception(
                f"PolynomialFeatures: Expected {self.n_features_in_} features, got {len(matrix[0])}"
            )

        combinations = self._generate_combinations(self.n_features_in_, self.degree)

        result = []
        for row in matrix:
            new_row = []
            for combo in combinations:
                if not self.include_bias and all(p == 0 for p in combo):
                    continue

                value = 1.0
                for j, power in enumerate(combo):
                    if power > 0:
                        value *= row[j] ** power

                new_row.append(value)
            result.append(new_row)

        return DataFrame(self._feature_names, result) if is_df else result

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def inverse_transform(self, data):
        """No implementado para PolynomialFeatures (transformación no es invertible)."""
        raise Exception("PolynomialFeatures: inverse_transform not implemented (non-invertible)")

    def __repr__(self):
        return f"PolynomialFeatures(degree={self.degree}, include_bias={self.include_bias})"
