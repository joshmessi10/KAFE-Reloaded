import random

from global_utils import check_sig
from TypeUtils import integer_type, numeric_matrix_types, numeric_vector_types, pardos_type, string_type

from ..BaseMachine import BaseMachine


class DummyClassifier(BaseMachine):
    """Clasificador Dummy (línea base) para KAFE Machine.

    Un clasificador dummy no aprende ningún patrón de los datos de entrada;
    sirve como punto de referencia (baseline) para comparar el rendimiento de
    modelos más complejos. Si un modelo real no supera al dummy, probablemente
    hay un problema en el pipeline o los datos no son informativos.

    Fundamento matemático
    ---------------------
    Dado un conjunto de etiquetas de entrenamiento y con clases {c_1, ..., c_k}:

    - ``most_frequent``: siempre predice la clase con mayor frecuencia en y_train.
        y_hat = argmax_c |{i : y_i = c}|

    - ``stratified``: muestrea aleatoriamente respetando la distribución de y_train.
        P(y_hat = c) = |{i : y_i = c}| / n

    - ``uniform``: muestrea uniformemente entre todas las clases únicas.
        P(y_hat = c) = 1 / k

    Complejidad:
        fit     : O(n)  -- cuenta frecuencias
        predict : O(m)  -- m = número de muestras a predecir

    Parámetros
    ----------
    strategy : str
        Estrategia de predicción: 'most_frequent', 'stratified',
        o 'uniform'. Por defecto 'most_frequent'.
    random_state : int
        Semilla para reproducibilidad (solo usada en 'stratified' y
        'uniform'). 0 = sin semilla fija.

    Atributos (después de fit)
    --------------------------
    classes_ : list
        Clases únicas encontradas en y_train, ordenadas.
    class_prior_ : list[float]
        Frecuencia relativa de cada clase en y_train.
    most_frequent_class_ : object
        La clase más frecuente en y_train.
    """

    @check_sig(
        {
            1: [],
            2: [[string_type]],
            3: [[string_type], [integer_type]],
        },
        is_method=True,
    )
    def __init__(self, strategy="most_frequent", random_state=0):
        super().__init__()
        valid = {"most_frequent", "stratified", "uniform"}
        if strategy not in valid:
            raise Exception(
                f"DummyClassifier: strategy '{strategy}' no es válido. "
                f"Opciones: {sorted(valid)}"
            )
        self.strategy = strategy
        self.random_state = random_state
        self.classes_: list = []
        self.class_prior_: list[float] = []
        self.most_frequent_class_ = None
        self._rng = random.Random(random_state if random_state != 0 else None)

    @check_sig(
        [3],
        [pardos_type] + numeric_vector_types + numeric_matrix_types,
        numeric_vector_types,
        is_method=True,
    )
    def fit(self, X, y):
        """Ajusta el clasificador dummy contando frecuencias de clase en y.

        X se acepta por compatibilidad con la API, pero no se utiliza.
        Solo y determina el comportamiento del clasificador.
        """
        if not y:
            raise Exception("DummyClassifier: y no puede estar vacío")

        counts: dict = {}
        for label in y:
            counts[label] = counts.get(label, 0) + 1

        n = len(y)
        self.classes_ = sorted(counts.keys(), key=lambda c: str(c))
        self.class_prior_ = [counts[c] / n for c in self.classes_]
        self.most_frequent_class_ = max(counts, key=lambda c: counts[c])

        self._is_fitted = True
        return self

    @check_sig([2], numeric_vector_types + numeric_matrix_types, is_method=True)
    def predict(self, X):
        """Predice etiquetas para cada muestra de X según la estrategia elegida."""
        self._check_fitted("predict")
        if not X:
            return []

        n_samples = len(X)

        if self.strategy == "most_frequent":
            return [self.most_frequent_class_] * n_samples

        if self.strategy == "stratified":
            result = []
            for _ in range(n_samples):
                r = self._rng.random()
                cumulative = 0.0
                chosen = self.classes_[-1]
                for cls, prior in zip(self.classes_, self.class_prior_, strict=True):
                    cumulative += prior
                    if r < cumulative:
                        chosen = cls
                        break
                result.append(chosen)
            return result

        # uniform
        result = []
        for _ in range(n_samples):
            result.append(self._rng.choice(self.classes_))
        return result

    def score(self, X, y, metric=None):
        """Puntúa usando accuracy (por defecto) o una métrica personalizada."""
        from ..metrics import accuracy_score

        self._check_fitted("score")
        preds = self.predict(X)
        if metric is None:
            return accuracy_score(y, preds)
        return metric(y, preds)

    def __repr__(self):
        return (
            f"DummyClassifier(strategy='{self.strategy}', "
            f"classes={self.classes_}, "
            f"most_frequent={self.most_frequent_class_})"
        )
