"""Modelos para KafeGESHA."""

import json
import os
from abc import ABC, abstractmethod
from typing import Any

from lib.KafeGESHA.losses import (
    BinaryCrossEntropy,
    CategoricalCrossEntropy,
    MeanAbsoluteError,
    MeanSquaredError,
    SparseCategoricalCrossEntropy,
)
from lib.KafeGESHA.optimizers import SGD, Adam, AdamW, RMSprop
from lib.KafeNUMK import functions as numk

# Rutas sin validacion de tipos para el bucle de entrenamiento; la API
# publica envuelta por @check_sig expone la original en __wrapped__.
_shape = numk.shape.__wrapped__
_tensor = numk.tensor.__wrapped__
_broadcast_add = numk.broadcast_add.__wrapped__
_scalar_mul = numk.scalar_mul.__wrapped__
_map_elements = numk.map_elements


def _get_loss(name):
    losses = {
        "mse": MeanSquaredError,
        "mean_squared_error": MeanSquaredError,
        "mae": MeanAbsoluteError,
        "mean_absolute_error": MeanAbsoluteError,
        "bce": BinaryCrossEntropy,
        "binary_crossentropy": BinaryCrossEntropy,
        "cce": CategoricalCrossEntropy,
        "categorical_crossentropy": CategoricalCrossEntropy,
        "scce": SparseCategoricalCrossEntropy,
        "sparse_categorical_crossentropy": SparseCategoricalCrossEntropy,
    }
    key = name.lower()
    if key not in losses:
        raise ValueError(
            f"Model: loss '{name}' was not recognized. Available: {list(losses)}"
        )
    return losses[key]()


def _get_optimizer(name):
    opts = {"sgd": SGD, "rmsprop": RMSprop, "adam": Adam, "adamw": AdamW}
    key = name.lower()
    if key not in opts:
        raise ValueError(
            f"Model: optimizer '{name}' was not recognized. Available: {list(opts)}"
        )
    return opts[key]()


def _is_classification_loss(loss):
    return isinstance(
        loss,
        (
            BinaryCrossEntropy,
            CategoricalCrossEntropy,
            SparseCategoricalCrossEntropy,
        ),
    )


def _prediction_label(prediction):
    """Convierte una salida binaria o multiclase en su etiqueta predicha."""
    if len(prediction) == 1:
        return 1 if prediction[0] >= 0.5 else 0
    return prediction.index(max(prediction))


def _target_label(target, loss):
    """Convierte etiquetas binarias, one-hot o sparse a un índice de clase."""
    if isinstance(loss, SparseCategoricalCrossEntropy):
        return target[0]
    if len(target) == 1:
        return 1 if target[0] >= 0.5 else 0
    return target.index(max(target))


def _accumulate_into(target, source):
    """Suma `source` sobre `target` in-place (listas anidadas de float)."""
    for indice in range(len(target)):
        valor = target[indice]
        if isinstance(valor, list):
            _accumulate_into(valor, source[indice])
        else:
            target[indice] = valor + source[indice]


class Model(ABC):
    def __init__(self):
        self._optimizer: Any = None
        self._loss: Any = None
        self._metrics = []
        self._is_compiled = False
        self.callbacks = []
        self.stop_training = False

    def compile(self, optimizer: Any = "sgd", loss: Any = "mse", metrics=None):
        self._optimizer = (
            _get_optimizer(optimizer) if isinstance(optimizer, str) else optimizer
        )
        self._loss = _get_loss(loss) if isinstance(loss, str) else loss
        self._metrics = metrics or []
        self._is_compiled = True

    def set_lr(self, new_lr):
        if not self._is_compiled:
            raise AttributeError("Model: compile() must be called before set_lr()")
        if hasattr(self._optimizer, "lr"):
            self._optimizer.lr = new_lr

    def add_callback(self, callback):
        if not hasattr(callback, "set_model"):
            raise TypeError("add_callback requiere un Callback")
        self.callbacks.append(callback)

    def save_weights(self, filepath):
        parameters = list(dict.fromkeys(self.parameters()))
        if not parameters:
            raise RuntimeError("save_weights requiere un modelo construido")
        directory = os.path.dirname(os.path.abspath(filepath))
        os.makedirs(directory, exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as stream:
            json.dump([{"name": p.name, "data": p.data} for p in parameters], stream)

    def load_weights(self, filepath):
        parameters = list(dict.fromkeys(self.parameters()))
        if not parameters:
            raise RuntimeError("load_weights requiere un modelo construido")
        with open(filepath, encoding="utf-8") as stream:
            stored = json.load(stream)
        if len(stored) != len(parameters):
            raise ValueError("Pesos incompatibles con el modelo")
        for parameter, record in zip(parameters, stored, strict=False):
            if _shape(parameter.data) != _shape(record["data"]):
                raise ValueError("Forma de pesos incompatible")
            parameter.data = _tensor(record["data"])

    @abstractmethod
    def forward(self, x) -> Any:
        pass

    @abstractmethod
    def backward(self, grad_output, regularization_lambda=0.0):
        pass

    @abstractmethod
    def parameters(self) -> Any:
        pass

    @abstractmethod
    def _set_training(self, mode):
        pass  # Implemented in subclasses

    def predict(self, X) -> Any:
        if not X:
            raise ValueError("predict requiere datos no vacios")
        self._set_training(False)
        if isinstance(X[0], list):
            return [self.forward(x) for x in X]
        return self.forward(X)

    def predict_proba(self, X):
        return self.predict(X)

    def predict_label(self, X):
        output = self.predict(X)
        samples = (
            output
            if (isinstance(output, list) and output and isinstance(output[0], list))
            else [output]
        )
        labels = []
        for o in samples:
            if len(o) == 1:
                labels.append(1 if o[0] >= 0.5 else 0)
            else:
                labels.append(o.index(max(o)))
        return labels if isinstance(X[0], list) else labels[0]

    def fit(
        self,
        X,
        Y=None,
        epochs=1,
        batch_size=1,
        x_val=None,
        y_val=None,
        regularization_lambda=0.0,
        callbacks=None,
    ):
        if not self._is_compiled:
            raise RuntimeError("Modelo no compilado.")
        Y_list = Y if isinstance(Y, list) else []
        is_unsupervised = Y is None or len(Y_list) == 0
        if not X or (not is_unsupervised and len(X) != len(Y_list)):
            raise ValueError(
                "fit requiere X e Y no vacios con igual numero de muestras"
            )
        if type(batch_size) is not int or batch_size <= 0:
            raise ValueError("batch_size debe ser entero positivo")
        if type(epochs) is not int or epochs < 0:
            raise ValueError("epochs debe ser entero no negativo")
        has_val = (
            x_val is not None and y_val is not None
            and isinstance(x_val, list) and len(x_val) > 0
        )
        y_val_list = y_val if isinstance(y_val, list) else []
        if has_val and isinstance(x_val, list) and len(x_val) != len(y_val_list):
            raise ValueError(
                "x_val/y_val requieren X e Y no vacios de igual longitud"
            )

        active_callbacks = self.callbacks + list(callbacks or [])
        self.stop_training = False
        for callback in active_callbacks:
            callback.set_model(self)
            callback.on_train_begin({})
        is_classification = _is_classification_loss(self._loss)
        history = {"loss": [], "val_loss": []}
        if is_classification and not is_unsupervised:
            history["accuracy"] = []
        batch_parameters = None
        for epoch in range(epochs):
            for callback in active_callbacks:
                callback.on_epoch_begin(epoch, {})
            self._set_training(True)
            total_loss = 0.0
            correct_predictions = 0
            centroids = None
            if is_unsupervised:
        # Centroides mu_k como promedios ponderados de los destinos
        # (Soft K-Means) calculados con una pasada forward completa.
                z_all = [self.forward(xi) for xi in X]
                k_num = len(z_all[0])
                weights = [
                    sum(z_all[idx][c] for idx in range(len(X)))
                    for c in range(k_num)
                ]
                centroids = []
                for c in range(k_num):
                    if weights[c] > 1e-6:
                        mu_c = [
                            sum(
                                z_all[idx][c] * X[idx][f]
                                for idx in range(len(X))
                            )
                            / weights[c]
                            for f in range(len(X[0]))
                        ]
                    else:
                        mu_c = [0.0] * len(X[0])
                    centroids.append(mu_c)
            for batch_start in range(0, len(X), batch_size):
                batch_end = min(batch_start + batch_size, len(X))
                accumulated = {}
                for i in range(batch_start, batch_end):
                    x = X[i]
                    y_pred = self.forward(x)
                    if batch_parameters is None:
                        # Las capas lazy se construyen en el primer forward.
                        batch_parameters = list(dict.fromkeys(self.parameters()))
                    if is_unsupervised:
                        loss_val, grad_z = self._unsupervised_loss_and_grad(
                            x, y_pred, centroids
                        )
                        total_loss += loss_val
                        self.backward(grad_z, regularization_lambda)
                    else:
                        y = Y_list[i] if i < len(Y_list) else []
                        if not isinstance(y, list):
                            y = [y]
                        if not isinstance(y_pred, list):
                            y_pred = [y_pred]
                        total_loss += self._loss.forward(y_pred, y)
                        if is_classification:
                            correct_predictions += int(
                                _prediction_label(y_pred)
                                == _target_label(y, self._loss)
                            )
                        self.backward(
                            self._loss.backward(), regularization_lambda
                        )
                    for parameter in batch_parameters:
                        if parameter.grad is not None:
                            if parameter.regularizer is not None:
                                parameter.grad = _broadcast_add(
                                    parameter.grad,
                                    parameter.regularizer.gradient(parameter.data),
                                )
                                total_loss += parameter.regularizer.penalty(
                                    parameter.data
                                )
                            if parameter not in accumulated:
                                accumulated[parameter] = _tensor(parameter.grad)
                            else:
                                _accumulate_into(accumulated[parameter], parameter.grad)

                # El optimizador se aplica una vez por minibatch.
                for parameter, gradient in accumulated.items():
                     parameter.grad = _scalar_mul(
                         1.0 / (batch_end - batch_start), gradient
                     )
                self._optimizer.step(batch_parameters)

            avg_loss = total_loss / len(X)
            history["loss"].append(avg_loss)
            loss_pct = avg_loss * 100.0
            msg = f"Epoch {epoch + 1}/{epochs} — Loss {loss_pct:.2f}%"
            if is_classification and not is_unsupervised:
                accuracy = correct_predictions / len(X)
                history["accuracy"].append(accuracy)
                if "accuracy" in self._metrics:
                    msg += f" — Accuracy {accuracy * 100.0:.2f}%"

            if has_val and isinstance(x_val, list):
                val_preds = self.predict(x_val)
                val_loss = sum(
                    self._loss.compute(y if isinstance(y, list) else [y], p)
                    for y, p in zip(y_val_list, val_preds, strict=False)
                ) / len(x_val)
                self._set_training(True)
                msg += f" - val_loss: {val_loss:.4f}"
                history["val_loss"].append(val_loss)

            print(msg)
            logs = {"loss": avg_loss}
            if is_classification and not is_unsupervised:
                logs["accuracy"] = accuracy
            if has_val:
                logs["val_loss"] = val_loss
            for callback in active_callbacks:
                callback.on_epoch_end(epoch, logs)
            if self.stop_training:
                break
        for callback in active_callbacks:
            callback.on_train_end(logs if epochs else {})
        return history

    def _unsupervised_loss_and_grad(self, xi, out, centroids=None):
        """Pérdida y gradiente dL/d(salida) del modo no supervisado (Soft K-Means).

        Destino blando t_ik a partir de la distancia de xi a los centroides mu_k:
            d_ik = sum_f (xi_f - mu_kf)^2
            r_ik = 1 / (d_ik + eps)
            t_ik = r_ik / sum_j r_ij

        La pérdida es el MSE entre probabilidades p y destinos t. El gradiente
        devuelto es dL/dp; la jacobiana softmax la aplica la capa Dense.
        """
        k = len(out)
        eps = 1e-6
        p = [max(eps, min(1.0 - eps, v)) for v in out]

        if centroids and len(centroids) == k:
            dists = [
                sum((xi[f] - centroids[c][f]) ** 2 for f in range(len(xi)))
                for c in range(k)
            ]
            raw = [1.0 / (d + eps) for d in dists]
            s_raw = sum(raw) + eps
            target = [r / s_raw for r in raw]
        else:
            p_sq = [v ** 2 for v in p]
            s_sq = sum(p_sq) + eps
            target = [v / s_sq for v in p_sq]

        loss_val = sum((p[c] - target[c]) ** 2 for c in range(k))
        grad_z = [2.0 * (p[c] - target[c]) / k for c in range(k)]
        return loss_val, grad_z


class Sequential(Model):
    def __init__(self, layers=None):
        super().__init__()
        self.layers = layers or []

    def add(self, layer):
        self.layers.append(layer)

    def _set_training(self, mode):
        for layer in self.layers:
            if hasattr(layer, "train") and hasattr(layer, "eval"):
                layer.train() if mode else layer.eval()

    def forward(self, x):
        out = x[:]
        for layer in self.layers:
            out = layer.forward(out)
        return out

    def backward(self, grad_output, regularization_lambda=0.0):
        grad = grad_output[:]
        for layer in reversed(self.layers):
            grad = layer.backward(grad, regularization_lambda)
        return grad

    def parameters(self):
        params = []
        for layer in self.layers:
            params.extend(layer.parameters())
        return params

    def summary(self):
        print("=" * 60)
        print("Model: Sequential")
        print("-" * 60)
        for layer in self.layers:
            layer.summary()
        print("=" * 60)


class Functional(Model):
    def __init__(self, inputs, outputs):
        super().__init__()
        self.inputs = inputs if isinstance(inputs, list) else [inputs]
        self.outputs = outputs if isinstance(outputs, list) else [outputs]
        self._nodes = self._topological_sort()

    def _topological_sort(self):
        in_degree = {}
        graph = {}
        nodes_list = []

        def explore(node):
            if node in in_degree:
                return
            in_degree[node] = len(node.inbound_nodes)
            nodes_list.append(node)
            for parent in node.inbound_nodes:
                if parent not in graph:
                    graph[parent] = []
                graph[parent].append(node)
                explore(parent)

        for out_node in self.outputs:
            explore(out_node)

        queue = [n for n in nodes_list if in_degree[n] == 0]
        sorted_nodes = []

        while queue:
            current = queue.pop(0)
            sorted_nodes.append(current)
            if current in graph:
                for child in graph[current]:
                    in_degree[child] -= 1
                    if in_degree[child] == 0:
                        queue.append(child)

        return sorted_nodes

    def _set_training(self, mode):
        for node in self._nodes:
            if (
                node.layer
                and hasattr(node.layer, "train")
                and hasattr(node.layer, "eval")
            ):
                node.layer.train() if mode else node.layer.eval()

    def forward(self, x):
        if len(self.inputs) == 1:
            self.inputs[0]._output_cache = x[:]
        else:
            for i_node, x_val in zip(self.inputs, x, strict=False):
                i_node._output_cache = x_val[:]

        for node in self._nodes:
            if node in self.inputs:
                continue
            inbound_data = [n._output_cache for n in node.inbound_nodes]
            if len(inbound_data) == 1:
                node._output_cache = node.layer.forward(inbound_data[0])
            else:
                node._output_cache = node.layer.forward(inbound_data)

        results = [out_node._output_cache for out_node in self.outputs]
        for node in self._nodes:
            node.clear_cache()
        return results[0] if len(self.outputs) == 1 else results

    def backward(self, grad_output, regularization_lambda=0.0):
        grads = {out_node: grad_output[:] for out_node in self.outputs}

        for node in reversed(self._nodes):
            if node in self.inputs:
                continue
            current_grad = grads[node]
            local_grad = node.layer.backward(current_grad, regularization_lambda)

            if len(node.inbound_nodes) == 1:
                in_node = node.inbound_nodes[0]
                grads[in_node] = (
                    local_grad
                    if in_node not in grads
                    else _map_elements(
                        lambda a, b: a + b, grads[in_node], local_grad
                    )
                )
            else:
                for in_node, g in zip(node.inbound_nodes, local_grad, strict=False):
                    grads[in_node] = (
                        g
                        if in_node not in grads
                        else _map_elements(lambda a, b: a + b, grads[in_node], g)
                    )

    def parameters(self):
        params = []
        for node in self._nodes:
            if node.layer:
                params.extend(node.layer.parameters())
        return params

    def summary(self):
        print("=" * 60)
        print("Model: Functional")
        print("-" * 60)
        for node in self._nodes:
            if node.layer:
                node.layer.summary()
        print("=" * 60)


class GeshaPlaceholder(Model):
    """Sentinel de un `GESHA x;` declarado sin valor.

    Es concreto (no abstracto) y sigue siendo un Model del grafo disenado,
    de modo que una declaracion `GESHA x;` no instancia una clase abstracta.
    Cualquier uso antes de la asignacion produce un error de KAFE controlado
    en lugar de un traceback de Python.
    """

    _UNASSIGNED_MESSAGE = (
        "GESHA variable was used before being assigned"
    )

    def forward(self, x):
        raise RuntimeError(self._UNASSIGNED_MESSAGE)

    def backward(self, grad_output, regularization_lambda=0.0):
        raise RuntimeError(self._UNASSIGNED_MESSAGE)

    def parameters(self):
        raise RuntimeError(self._UNASSIGNED_MESSAGE)

    def _set_training(self, mode):
        raise RuntimeError(self._UNASSIGNED_MESSAGE)
