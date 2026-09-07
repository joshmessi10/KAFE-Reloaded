import warnings
from lib.KafeGESHA.Gesha import Gesha
from lib.KafeGESHA.LossFunction import (
    MeanSquaredError, MeanAbsoluteError,
    BinaryCrossEntropy, CategoricalCrossEntropy,
    SparseCategoricalCrossEntropy,
)
from lib.KafeGESHA.Optimizer import SGD, RMSprop, Adam, AdamW
from lib.KafeMATH.funciones import log, exp
from global_utils import check_sig
from TypeUtils import (
    cadena_t, flotante_t, entero_t, booleano_t, vector_numeros_t, 
    matriz_numeros_t, gesha_t, void_t, lista_cadenas_t, pardos_t
)

class GeshaDeep(Gesha):
    def __init__(self, model_type: str = "classification"):
        super().__init__()
        self._model_type = model_type
        self._loss_fn = None
        self._optimizer_obj = None
        self._metrics = []

    @check_sig([2], [gesha_t], is_method=True)
    def add(self, layer):
        if self.layers and hasattr(layer, "input_shape") and not layer.input_shape:
            layer.input_shape = (self.layers[-1].units,)
        self.layers.append(layer)

    @check_sig([1, 2, 3, 4], [cadena_t, void_t], [cadena_t, void_t], [lista_cadenas_t, void_t], is_method=True)
    def compile(self, optimizer=None, loss=None, metrics=None):
        if loss == "mse":
            self._loss_fn = MeanSquaredError()
        elif loss == "mae":
            self._loss_fn = MeanAbsoluteError()
        elif loss == "binary_crossentropy":
            self._loss_fn = BinaryCrossEntropy()
        elif loss == "categorical_crossentropy":
            self._loss_fn = CategoricalCrossEntropy()
        elif loss == "sparse_categorical_crossentropy":
            self._loss_fn = SparseCategoricalCrossEntropy()
        else:
            raise ValueError(f"Gesha: Loss '{loss}' not recognized")

        if optimizer == "sgd":
            self._optimizer_obj = SGD(lr=0.01)
        elif optimizer == "rmsprop":
            self._optimizer_obj = RMSprop(lr=0.001)
        elif optimizer == "adam":
            self._optimizer_obj = Adam(lr=0.001)
        elif optimizer == "adamw":
            self._optimizer_obj = AdamW(lr=0.001)
        else:
            raise ValueError(f"Gesha: Optimizer '{optimizer}' not recognized")

        self._metrics = metrics or []
        if self._model_type == "clustering" and len(self.layers) < 2:
            warnings.warn(
                "Advertencia: un modelo de clustering con menos de 2 capas puede no tener suficiente capacidad."
            )

    @check_sig([2], [flotante_t, entero_t], is_method=True)
    def set_lr(self, new_lr: float):
        if not self._optimizer_obj:
            raise AttributeError("Gesha: compile() must be called before set_lr()")
        self._optimizer_obj.lr = new_lr

    @check_sig([2], vector_numeros_t, is_method=True)
    def predict(self, x):
        out = x
        for layer in self.layers:
            out = layer.forward(out)
        return out

    @check_sig([2, 3, 4, 5, 6, 7], matriz_numeros_t, matriz_numeros_t + vector_numeros_t + [void_t], [entero_t], [entero_t], matriz_numeros_t + [void_t], matriz_numeros_t + vector_numeros_t + [void_t], is_method=True)
    def fit(self, x_train, y_train=None, epochs=1, batch_size=1, x_val=None, y_val=None):
        n_samples = len(x_train)
        has_val = x_val is not None and y_val is not None and len(x_val) > 0

        def _forward(xi):
            out = xi
            for layer in self.layers:
                out = layer.forward(out)
            return out

        def _backward(err):
            if not isinstance(err, list):
                err = [err]
            for layer in reversed(self.layers):
                err = layer.backward(err, learning_rate=self._optimizer_obj.lr)

        if self._model_type == "clustering":
            for epoch in range(1, epochs + 1):
                total = 0.0
                n_features = len(x_train[0])

                # Forward pass para todos los puntos
                all_outputs = [_forward(xi) for xi in x_train]
                k = len(all_outputs[0])

                # Calcular centros como medias ponderadas por asignaciones suaves
                centers = [[0.0] * n_features for _ in range(k)]
                weights = [0.0] * k
                for z, xi in zip(all_outputs, x_train):
                    for c in range(k):
                        w = z[c]
                        weights[c] += w
                        for f in range(n_features):
                            centers[c][f] += w * xi[f]
                for c in range(k):
                    if weights[c] > 1e-8:
                        for f in range(n_features):
                            centers[c][f] /= weights[c]

                # Para cada punto, generar objetivo basado en distancias a centros
                # Objetivo suave: puntos más cerca de un centro → mayor peso en ese centro
                for idx in range(n_samples):
                    xi = x_train[idx]
                    z = all_outputs[idx]

                    # Calcular distancias a cada centro
                    dist_sq = [0.0] * k
                    for c in range(k):
                        for f in range(n_features):
                            dist_sq[c] += (xi[f] - centers[c][f]) ** 2

                    # Objetivo: proporcional inversa a la distancia
                    raw = [0.0] * k
                    for c in range(k):
                        raw[c] = 1.0 / (dist_sq[c] + 1e-6)
                    s = sum(raw)
                    target = [raw[c] / s for c in range(k)]

                    # Pérdida: MSE entre z y target
                    sample_loss = 0.0
                    grad_z = [0.0] * k
                    for c in range(k):
                        diff = z[c] - target[c]
                        sample_loss += diff * diff
                        grad_z[c] = 2.0 * diff / k
                    total += sample_loss

                    # Propagar a través del softmax
                    weighted_sum = sum(grad_z[c] * z[c] for c in range(k))
                    grad_logit = [z[c] * (grad_z[c] - weighted_sum) for c in range(k)]

                    _backward(grad_logit)

                print(f"Epoch {epoch}/{epochs} — Loss (clustering): {total / n_samples:.6f}")
            return
        if self._model_type == "classification":
            for epoch in range(1, epochs + 1):
                total = 0.0
                for i in range(0, n_samples, batch_size):
                    bx = x_train[i:min(i + batch_size, n_samples)]
                    by = y_train[i:min(i + batch_size, n_samples)]
                    for xi, yi in zip(bx, by):
                        out = _forward(xi)
                        total += self._loss_fn.compute([yi], [out])
                        dg = self._loss_fn.derivative([yi], [out])
                        grad_out = dg[0] if isinstance(dg[0], list) else dg
                        _backward(grad_out)
                msg = f"Epoch {epoch}/{epochs} — Loss {total / n_samples:.6f}"
                if has_val:
                    correct = sum(
                        1 for xv, yv in zip(x_val, y_val)
                        if _forward(xv).index(max(_forward(xv))) ==
                           (yv.index(max(yv)) if isinstance(yv, list) else yv)
                    )
                    msg += f" — val_accuracy {correct/len(x_val):.4f}"
                print(msg)
            return

        if self._model_type == "binary":
            for epoch in range(1, epochs + 1):
                total = 0.0
                for i in range(0, n_samples, batch_size):
                    bx = x_train[i:min(i + batch_size, n_samples)]
                    by = y_train[i:min(i + batch_size, n_samples)]
                    for xi, yi in zip(bx, by):
                        p = _forward(xi)[0]
                        total += self._loss_fn.compute([yi], [p])
                        grad = self._loss_fn.derivative([yi], [p])
                        _backward(grad)
                msg = f"Epoch {epoch}/{epochs} — Loss {total / n_samples:.6f}"
                if has_val:
                    correct = sum(
                        1 for xv, yv in zip(x_val, y_val)
                        if (1 if _forward(xv)[0] >= 0.5 else 0) == yv
                    )
                    msg += f" — val_accuracy {correct/len(x_val):.4f}"
                print(msg)
            return

        if self._model_type == "regression":
            for epoch in range(1, epochs + 1):
                total = 0.0
                for i in range(0, n_samples, batch_size):
                    bx = x_train[i:min(i + batch_size, n_samples)]
                    by = y_train[i:min(i + batch_size, n_samples)]
                    for xi, yi in zip(bx, by):
                        p = _forward(xi)[0]
                        total += self._loss_fn.compute([yi], [p])
                        grad = self._loss_fn.derivative([yi], [p])
                        _backward(grad)
                msg = f"Epoch {epoch}/{epochs} — Loss {total / n_samples:.6f}"
                if has_val:
                    val_loss = sum(
                        self._loss_fn.compute([yv], [_forward(xv)[0]])
                        for xv, yv in zip(x_val, y_val)
                    )
                    msg += f" — val_mse {val_loss/len(x_val):.6f}"
                print(msg)
            return

        raise ValueError("Gesha: Model type not supported in fit()")

    @check_sig([2, 3, 4, 5, 6, 7], [pardos_t], [lista_cadenas_t, void_t], [entero_t], [entero_t], matriz_numeros_t + [void_t], matriz_numeros_t + vector_numeros_t + [void_t], is_method=True)
    def fit_from_df(self, df, y_columns=None, epochs=1, batch_size=1, x_val=None, y_val=None):
        """
        Entrena el modelo a partir de un DataFrame de PARDOS.

        Para clustering: df contiene solo columnas de características, y_columns es None.
        Para clasificación/binaria: df contiene características + columna(s) de etiqueta.
        Para regresión: df contiene características + columna de objetivo.

        y_columns: nombre(s) de columna(s) para el objetivo, o None para clustering.
        """
        from lib.KafeGESHA.utils import df_to_matrix

        matrix = df_to_matrix(df)

        if y_columns is None or (isinstance(y_columns, list) and len(y_columns) == 0):
            self.fit(matrix, [], epochs, batch_size, x_val, y_val)
        elif isinstance(y_columns, list) and len(y_columns) == 1:
            col_name = y_columns[0]
            dtypes = df.dtypes()
            col_idx = df.columns.index(col_name)
            y_data = df.col(col_name)

            _, tipo = dtypes[col_idx]
            if tipo in (entero_t, booleano_t):
                y_list = [int(v) for v in y_data]
                self.fit(matrix, y_list, epochs, batch_size, x_val, y_val)
            else:
                y_list = [float(v) for v in y_data]
                self.fit(matrix, y_list, epochs, batch_size, x_val, y_val)
        else:
            y_matrix = []
            for col_name in y_columns:
                y_matrix.append(df.col(col_name))
            n_rows = len(df.data)
            y_list = [[y_matrix[c][r] for c in range(len(y_columns))] for r in range(n_rows)]
            self.fit(matrix, y_list, epochs, batch_size, x_val, y_val)

    def summary(self):
        print(f"*** Resumen (tipo: {self._model_type}) ***")
        for i, layer in enumerate(self.layers, 1):
            act = layer.activation_name or "linear"
            reg = (
                f"L2={layer.regularization_lambda}"
                if hasattr(layer, "regularization_lambda")
                else "sin regularización"
            )
            print(f" Capa {i}: Dense(units={layer.units}, activation={act}, {reg})")

    @check_sig([3], matriz_numeros_t, matriz_numeros_t + vector_numeros_t, is_method=True)
    def evaluate(self, x_test, y_test):
        if self._model_type == "clustering":
            n_features = len(x_test[0])
            all_outputs = [self.predict(xi) for xi in x_test]
            k = len(all_outputs[0])

            centers = [[0.0] * n_features for _ in range(k)]
            weights = [0.0] * k
            for z, xi in zip(all_outputs, x_test):
                for c in range(k):
                    w = z[c]
                    weights[c] += w
                    for f in range(n_features):
                        centers[c][f] += w * xi[f]
            for c in range(k):
                if weights[c] > 1e-8:
                    for f in range(n_features):
                        centers[c][f] /= weights[c]

            total = 0.0
            for z, xi in zip(all_outputs, x_test):
                for c in range(k):
                    dist_sq = sum((xi[f] - centers[c][f]) ** 2 for f in range(n_features))
                    total += z[c] * dist_sq
            avg = total / len(x_test)
            print(f"Clustering loss (eval): {avg:.6f}")
            return avg

        if self._model_type == "binary":
            acc = sum(
                1 for xi, yi in zip(x_test, y_test)
                if (1 if self.predict(xi)[0] >= 0.5 else 0) == yi
            ) / len(x_test)
            print(f"Accuracy: {acc*100:.2f}%")
            return acc

        if self._model_type == "classification":
            acc = sum(
                1 for xi, yi in zip(x_test, y_test)
                if self.predict(xi).index(max(self.predict(xi))) ==
                   (yi.index(max(yi)) if isinstance(yi, list) else yi)
            ) / len(x_test)
            print(f"Accuracy: {acc*100:.2f}%")
            return acc

        if self._model_type == "regression":
            mse = sum(
                self._loss_fn.compute([yi], [self.predict(xi)[0]])
                for xi, yi in zip(x_test, y_test)
            ) / len(x_test)
            print(f"MSE promedio: {mse:.6f}")
            return mse

        raise ValueError("Gesha: Model type not supported in evaluate()")

    @check_sig([2], vector_numeros_t, is_method=True)
    def predict_proba(self, x):
        out = self.predict(x)
        if self._model_type in ("binary", "regression"):
            return out[0] if isinstance(out, list) else out
        return out

    @check_sig([2], vector_numeros_t, is_method=True)
    def predict_label(self, x):
        if self._model_type == "regression":
            raise ValueError("Gesha: predict_label() does not apply to regression models")
        if self._model_type == "binary":
            return 1 if self.predict_proba(x) >= 0.5 else 0
        return self.predict_proba(x).index(max(self.predict_proba(x)))
