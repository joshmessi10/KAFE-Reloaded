"""Modelos para KafeGESHA."""
from abc import ABC, abstractmethod
import json
import os
from lib.KafeGESHA.losses import MeanSquaredError, MeanAbsoluteError, BinaryCrossEntropy, CategoricalCrossEntropy, SparseCategoricalCrossEntropy
from lib.KafeGESHA.optimizers import SGD, RMSprop, Adam, AdamW
from lib.KafeNUMK import funciones as numk

def _get_loss(name):
    losses = {
        "mse": MeanSquaredError, "mean_squared_error": MeanSquaredError,
        "mae": MeanAbsoluteError, "mean_absolute_error": MeanAbsoluteError,
        "bce": BinaryCrossEntropy, "binary_crossentropy": BinaryCrossEntropy,
        "cce": CategoricalCrossEntropy, "categorical_crossentropy": CategoricalCrossEntropy,
        "scce": SparseCategoricalCrossEntropy, "sparse_categorical_crossentropy": SparseCategoricalCrossEntropy,
    }
    return losses.get(name.lower(), MeanSquaredError)()

def _get_optimizer(name):
    opts = {"sgd": SGD, "rmsprop": RMSprop, "adam": Adam, "adamw": AdamW}
    return opts.get(name.lower(), SGD)()


class Model(ABC):
    def __init__(self):
        self._optimizer = None
        self._loss = None
        self._metrics = []
        self._is_compiled = False
        self.callbacks = []
        self.stop_training = False

    def compile(self, optimizer="sgd", loss="mse", metrics=None):
        self._optimizer = _get_optimizer(optimizer) if isinstance(optimizer, str) else optimizer
        self._loss = _get_loss(loss) if isinstance(loss, str) else loss
        self._metrics = metrics or []
        self._is_compiled = True

    def set_lr(self, new_lr):
        if self._optimizer and hasattr(self._optimizer, "lr"):
            self._optimizer.lr = new_lr

    def add_callback(self, callback):
        if not hasattr(callback, 'set_model'):
            raise TypeError("add_callback requiere un Callback")
        self.callbacks.append(callback)

    def save_weights(self, filepath):
        parameters = list(dict.fromkeys(self.parameters()))
        if not parameters: raise RuntimeError("save_weights requiere un modelo construido")
        directory = os.path.dirname(os.path.abspath(filepath))
        os.makedirs(directory, exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as stream:
            json.dump([{'name': p.name, 'data': p.data} for p in parameters], stream)

    def load_weights(self, filepath):
        parameters = list(dict.fromkeys(self.parameters()))
        if not parameters: raise RuntimeError("load_weights requiere un modelo construido")
        with open(filepath, encoding='utf-8') as stream: stored = json.load(stream)
        if len(stored) != len(parameters): raise ValueError("Pesos incompatibles con el modelo")
        for parameter, record in zip(parameters, stored):
            if numk.shape(parameter.data) != numk.shape(record['data']):
                raise ValueError("Forma de pesos incompatible")
            parameter.data = numk.tensor(record['data'])

    @abstractmethod
    def forward(self, x): pass

    @abstractmethod
    def backward(self, grad_output): pass

    @abstractmethod
    def parameters(self): pass

    def _set_training(self, mode):
        pass # Implemented in subclasses

    def predict(self, X):
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
        samples = output if (isinstance(output, list) and output and isinstance(output[0], list)) else [output]
        labels = []
        for o in samples:
            if len(o) == 1:
                labels.append(1 if o[0] >= 0.5 else 0)
            else:
                labels.append(o.index(max(o)))
        return labels if isinstance(X[0], list) else labels[0]

    def fit(self, X, Y, epochs=1, batch_size=1, val_data=None, regularization_lambda=0.0, callbacks=None):
        if not self._is_compiled: raise RuntimeError("Modelo no compilado.")
        if not X or len(X) != len(Y):
            raise ValueError("fit requiere X e Y no vacios con igual numero de muestras")
        if type(batch_size) is not int or batch_size <= 0:
            raise ValueError("batch_size debe ser entero positivo")
        if type(epochs) is not int or epochs < 0:
            raise ValueError("epochs debe ser entero no negativo")
        
        active_callbacks = self.callbacks + list(callbacks or [])
        self.stop_training = False
        for callback in active_callbacks:
            callback.set_model(self); callback.on_train_begin({})
        history = {'loss': [], 'val_loss': []}
        for epoch in range(epochs):
            for callback in active_callbacks: callback.on_epoch_begin(epoch, {})
            self._set_training(True)
            total_loss = 0.0
            for batch_start in range(0, len(X), batch_size):
                batch_end = min(batch_start + batch_size, len(X))
                accumulated = {}
                for i in range(batch_start, batch_end):
                    x, y = X[i], Y[i]
                    y_pred = self.forward(x)
                    if not isinstance(y, list):
                        y = [y]
                    if not isinstance(y_pred, list):
                        y_pred = [y_pred]
                    total_loss += self._loss.forward(y_pred, y)
                    self.backward(self._loss.backward(), regularization_lambda)
                    # El forward construye las capas lazy antes de recoger parámetros.
                    batch_parameters = list(dict.fromkeys(self.parameters()))
                    for parameter in batch_parameters:
                        if parameter.grad is not None:
                            if parameter.regularizer is not None:
                                parameter.grad = numk.broadcast_add(parameter.grad, parameter.regularizer.gradient(parameter.data))
                                total_loss += parameter.regularizer.penalty(parameter.data)
                            accumulated[parameter] = (
                                numk.tensor(parameter.grad) if parameter not in accumulated
                                else numk.map_elements(lambda a, b: a + b,
                                                       accumulated[parameter], parameter.grad))

                # El optimizador se aplica una vez por minibatch.
                for parameter, gradient in accumulated.items():
                    parameter.grad = numk.scalar_mul(1.0 / (batch_end - batch_start), gradient)
                self._optimizer.step(batch_parameters)
            
            avg_loss = total_loss / len(X)
            history['loss'].append(avg_loss)
            loss_pct = avg_loss * 100.0
            msg = f"Epoch {epoch+1}/{epochs} — Loss {loss_pct:.2f}%"
            
            if val_data:
                val_x, val_y = val_data
                if not val_x or len(val_x) != len(val_y):
                    raise ValueError("val_data requiere X e Y no vacios de igual longitud")
                val_preds = self.predict(val_x)
                val_loss = sum(self._loss.compute(y if isinstance(y, list) else [y], p)
                               for y, p in zip(val_y, val_preds)) / len(val_x)
                self._set_training(True)
                msg += f" - val_loss: {val_loss:.4f}"
                history['val_loss'].append(val_loss)
                
            print(msg)
            logs = {'loss': avg_loss}
            if val_data: logs['val_loss'] = val_loss
            for callback in active_callbacks: callback.on_epoch_end(epoch, logs)
            if self.stop_training: break
        for callback in active_callbacks: callback.on_train_end(logs if epochs else {})
        return history


class Sequential(Model):
    def __init__(self, layers=None):
        super().__init__()
        self.layers = layers or []

    def add(self, layer):
        self.layers.append(layer)

    def _set_training(self, mode):
        for layer in self.layers:
            if hasattr(layer, 'train') and hasattr(layer, 'eval'):
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
        for layer in self.layers: layer.summary()
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
            if node in in_degree: return
            in_degree[node] = len(node.inbound_nodes)
            nodes_list.append(node)
            for parent in node.inbound_nodes:
                if parent not in graph: graph[parent] = []
                graph[parent].append(node)
                explore(parent)
                
        for out_node in self.outputs: explore(out_node)
        
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
            if node.layer and hasattr(node.layer, 'train') and hasattr(node.layer, 'eval'):
                node.layer.train() if mode else node.layer.eval()

    def forward(self, x):
        if len(self.inputs) == 1:
            self.inputs[0]._output_cache = x[:]
        else:
            for i_node, x_val in zip(self.inputs, x):
                i_node._output_cache = x_val[:]
                
        for node in self._nodes:
            if node in self.inputs: continue
            inbound_data = [n._output_cache for n in node.inbound_nodes]
            if len(inbound_data) == 1:
                node._output_cache = node.layer.forward(inbound_data[0])
            else:
                node._output_cache = node.layer.forward(inbound_data)
                
        results = [out_node._output_cache for out_node in self.outputs]
        for node in self._nodes: node.clear_cache()
        return results[0] if len(self.outputs) == 1 else results

    def backward(self, grad_output, regularization_lambda=0.0):
        grads = {out_node: grad_output[:] for out_node in self.outputs}
        
        for node in reversed(self._nodes):
            if node in self.inputs: continue
            current_grad = grads[node]
            local_grad = node.layer.backward(current_grad, regularization_lambda)
            
            if len(node.inbound_nodes) == 1:
                in_node = node.inbound_nodes[0]
                grads[in_node] = (local_grad if in_node not in grads else
                                  numk.map_elements(lambda a, b: a + b, grads[in_node], local_grad))
            else:
                for in_node, g in zip(node.inbound_nodes, local_grad):
                    grads[in_node] = (g if in_node not in grads else
                                      numk.map_elements(lambda a, b: a + b, grads[in_node], g))

    def parameters(self):
        params = []
        for node in self._nodes:
            if node.layer: params.extend(node.layer.parameters())
        return params

    def summary(self):
        print("=" * 60)
        print("Model: Functional")
        print("-" * 60)
        for node in self._nodes:
            if node.layer: node.layer.summary()
        print("=" * 60)
