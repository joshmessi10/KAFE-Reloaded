"""Modelos para KafeGESHA."""
from abc import ABC, abstractmethod
from lib.KafeGESHA.losses import MeanSquaredError, MeanAbsoluteError, BinaryCrossEntropy, CategoricalCrossEntropy, SparseCategoricalCrossEntropy
from lib.KafeGESHA.optimizers import SGD, RMSprop, Adam, AdamW

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

    def compile(self, optimizer="sgd", loss="mse", metrics=None):
        self._optimizer = _get_optimizer(optimizer) if isinstance(optimizer, str) else optimizer
        self._loss = _get_loss(loss) if isinstance(loss, str) else loss
        self._metrics = metrics or []
        self._is_compiled = True

    def set_lr(self, new_lr):
        if self._optimizer and hasattr(self._optimizer, "lr"):
            self._optimizer.lr = new_lr

    @abstractmethod
    def forward(self, x): pass

    @abstractmethod
    def backward(self, grad_output): pass

    @abstractmethod
    def parameters(self): pass

    def _set_training(self, mode):
        pass # Implemented in subclasses

    def predict(self, X):
        self._set_training(False)
        if not isinstance(X[0], list): X = [X]
        return [self.forward(x) for x in X]

    def fit(self, X, Y, epochs=1, batch_size=1, val_data=None, regularization_lambda=0.0):
        if not self._is_compiled: raise RuntimeError("Modelo no compilado.")
        self._set_training(True)
        
        for epoch in range(epochs):
            total_loss = 0.0
            
            for i in range(len(X)):
                x, y = X[i], Y[i]
                
                # Forward
                y_pred = self.forward(x)
                
                # Loss
                if not isinstance(y, list): y = [y]
                if not isinstance(y_pred, list): y_pred = [y_pred]
                
                loss_val = self._loss.compute([y], [y_pred])
                total_loss += loss_val
                
                # Gradients
                loss_grad = self._loss.derivative([y], [y_pred])[0]
                self.backward(loss_grad)
                
                # Update (SGD estocástico o mini-batch 1)
                self._optimizer.step(self.parameters())
            
            avg_loss = total_loss / len(X)
            msg = f"Epoch {epoch+1}/{epochs} - loss: {avg_loss:.4f}"
            
            if val_data:
                val_x, val_y = val_data
                val_preds = self.predict(val_x)
                if not isinstance(val_y[0], list): val_y = [[y] for y in val_y]
                if not isinstance(val_preds[0], list): val_preds = [[p] for p in val_preds]
                val_loss = self._loss.compute(val_y, val_preds)
                msg += f" - val_loss: {val_loss:.4f}"
                
            print(msg)


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

    def backward(self, grad_output):
        grad = grad_output[:]
        for layer in reversed(self.layers):
            grad = layer.backward(grad)
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

    def backward(self, grad_output):
        grads = {out_node: grad_output[:] for out_node in self.outputs}
        
        for node in reversed(self._nodes):
            if node in self.inputs: continue
            current_grad = grads[node]
            local_grad = node.layer.backward(current_grad)
            
            if len(node.inbound_nodes) == 1:
                in_node = node.inbound_nodes[0]
                grads[in_node] = local_grad
            else:
                for in_node, g in zip(node.inbound_nodes, local_grad):
                    if in_node not in grads: grads[in_node] = [0.0]*len(g)
                    grads[in_node] = [grads[in_node][i] + g[i] for i in range(len(g))]

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
