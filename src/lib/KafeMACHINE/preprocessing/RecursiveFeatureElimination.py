from global_utils import check_sig
from TypeUtils import pardos_t, matriz_numeros_t, vector_numeros_t, entero_t
from lib.KafePARDOS.DataFrame import DataFrame
from ..BaseMachine import BaseMachine
from ..LinearRegression import LinearRegression


class RecursiveFeatureElimination(BaseMachine):
    """
    Recursive Feature Elimination (RFE) - Seleccion de features por eliminacion recursiva.

    Fundamento matematico:
        1. Entrenar modelo con todas las features
        2. Calcular importancia de cada feature (coeficientes o feature importance)
        3. Eliminar la feature menos importante
        4. Repetir hasta tener n_features

        La importancia se calcula como |coeficiente| para modelos lineales.

    Parametros:
        estimator: modelo con coef_ o feature_importances_ (default LinearRegression)
        n_features: numero de features a seleccionar (default 1)

    Atributos (despues de fit):
        selected_indices_: indices de features seleccionadas
        ranking_: ranking de importancia (1 = mas importante)
        support_: mascara booleana de features seleccionadas
        n_features_in_: numero de features de entrada
    """

    def __init__(self, estimator=None, n_features=1):
        super().__init__()
        if n_features <= 0:
            raise Exception("RecursiveFeatureElimination: n_features must be positive")

        self.estimator = estimator if estimator is not None else LinearRegression()
        self.n_features = n_features
        self.selected_indices_ = []
        self.ranking_ = []
        self.support_ = []
        self.n_features_in_ = 0

    def _get_feature_importance(self, X, y):
        """Entrena el modelo y retorna importancia de features."""
        self.estimator.fit(X, y)

        if hasattr(self.estimator, 'coef_'):
            importances = [abs(c) for c in self.estimator.coef_]
        elif hasattr(self.estimator, 'feature_importances_'):
            importances = list(self.estimator.feature_importances_)
        else:
            n = len(X)
            importances = []
            for j in range(len(X[0])):
                mean = sum(X[i][j] for i in range(n)) / n
                var = sum((X[i][j] - mean) ** 2 for i in range(n)) / n
                importances.append(var)

        return importances

    @check_sig([3], [pardos_t] + matriz_numeros_t, vector_numeros_t, is_method=True)
    def fit(self, X, y):
        """Ajusta RFE eliminando recursivamente las features menos importantes."""
        matrix, cols, is_df = self._unwrap_data(X)

        if not matrix or not matrix[0]:
            raise Exception("RecursiveFeatureElimination: Empty input data")

        n_samples = len(matrix)
        n_features = len(matrix[0])
        self.n_features_in_ = n_features

        if self.n_features > n_features:
            raise Exception(
                f"RecursiveFeatureElimination: n_features ({self.n_features}) > n_features_in ({n_features})"
            )

        active_indices = list(range(n_features))
        self.ranking_ = [0] * n_features

        current_rank = n_features

        while len(active_indices) > self.n_features:
            X_active = [[row[j] for j in active_indices] for row in matrix]

            importances = self._get_feature_importance(X_active, y)

            min_imp_idx = 0
            for i in range(1, len(importances)):
                if importances[i] < importances[min_imp_idx]:
                    min_imp_idx = i

            removed_feature = active_indices[min_imp_idx]
            self.ranking_[removed_feature] = current_rank
            current_rank -= 1

            active_indices.pop(min_imp_idx)

        for idx in active_indices:
            self.ranking_[idx] = 1

        self.selected_indices_ = sorted(active_indices)
        self.support_ = [i in self.selected_indices_ for i in range(n_features)]

        self._is_fitted = True
        return self

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def transform(self, data):
        """Transforma seleccionando solo las features elegidas."""
        self._check_fitted("transform")
        matrix, cols, is_df = self._unwrap_data(data)

        if not matrix or not matrix[0]:
            raise Exception("RecursiveFeatureElimination: Empty input data")

        if len(matrix[0]) != self.n_features_in_:
            raise Exception(
                f"RecursiveFeatureElimination: Expected {self.n_features_in_} features, got {len(matrix[0])}"
            )

        result = [[row[j] for j in self.selected_indices_] for row in matrix]

        new_cols = [cols[j] for j in self.selected_indices_] if cols and is_df else None
        return DataFrame(new_cols, result) if is_df else result

    def fit_transform(self, X, y):
        """Fit y transform en un solo paso."""
        self.fit(X, y)
        return self.transform(X)

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def inverse_transform(self, data):
        """No implementado (transformacion no es invertible)."""
        raise Exception("RecursiveFeatureElimination: inverse_transform not implemented")

    def __repr__(self):
        return f"RecursiveFeatureElimination(n_features={self.n_features})"
