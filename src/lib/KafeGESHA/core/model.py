"""Model abstract base class and resolution utilities for KafeGESHA.

Model hierarchy:

    Model (abstract — common interface)
     ├── Sequential (linear graph)
     └── Functional (DAG graph)

The design follows the established Keras pattern:
- The model does NOT know if the data is binary, multiclass or regression.
- The difference is defined by the combination (final activation, loss function).
- fit() is generic; supports supervised (y != None) and unsupervised (y=None).

Compatibility:
- Gesha remains the runtime model type recognized by TypeUtils.py.
- GeshaDeep is removed; Sequential replaces it.
"""
from abc import ABC, abstractmethod
from global_utils import check_sig
from TypeUtils import (
    gesha_type, numeric_vector_types, numeric_matrix_types,
    integer_type, string_type, string_list_type, void_t, float_type
)
from lib.KafeGESHA.losses.loss import LossFunction
from lib.KafeGESHA.losses.mse import MeanSquaredError, MeanAbsoluteError
from lib.KafeGESHA.losses.binary_crossentropy import BinaryCrossEntropy
from lib.KafeGESHA.losses.categorical_crossentropy import CategoricalCrossEntropy, SparseCategoricalCrossEntropy
from lib.KafeGESHA.optimizers.optimizer import Optimizer
from lib.KafeGESHA.optimizers.sgd import SGD, RMSprop
from lib.KafeGESHA.optimizers.adam import Adam, AdamW


# --------------------------------------------------------------------------
# Resolution of loss and optimizer by name
# --------------------------------------------------------------------------

_LOSSES = {
    "mse":                           MeanSquaredError,
    "mae":                           MeanAbsoluteError,
    "binary_crossentropy":           BinaryCrossEntropy,
    "categorical_crossentropy":      CategoricalCrossEntropy,
    "sparse_categorical_crossentropy": SparseCategoricalCrossEntropy,
}

_OPTIMIZERS = {
    "sgd":     lambda: SGD(lr=0.01),
    "rmsprop": lambda: RMSprop(lr=0.001),
    "adam":    lambda: Adam(lr=0.001),
    "adamw":   lambda: AdamW(lr=0.001),
}


def _resolve_loss(name):
    if name is None:
        raise ValueError("Model: compile() requires a loss function")
    key = name.lower()
    if key not in _LOSSES:
        raise ValueError(f"Model: loss '{name}' was not recognized. Available: {list(_LOSSES)}")
    return _LOSSES[key]()


def _resolve_optimizer(name):
    if name is None:
        raise ValueError("Model: compile() requires an optimizer")
    key = name.lower()
    if key not in _OPTIMIZERS:
        raise ValueError(f"Model: optimizer '{name}' was not recognized. Available: {list(_OPTIMIZERS)}")
    return _OPTIMIZERS[key]()


# --------------------------------------------------------------------------
# Abstract base class Model
# --------------------------------------------------------------------------

class Model(ABC):
    """Base class for all KafeGESHA models.

    Defines the common interface that Sequential and Functional implement.
    Users do not instantiate this class directly.

    Public methods:
        compile(optimizer, loss, metrics) — configures training.
        fit(X, y, epochs, batch_size, x_val, y_val) — generic training.
        predict(x) — inference on a single example.
        predict_proba(x) — exit probability(s).
        predict_label(x) — etiqueta predicha (argmax o threshold 0.5).
        evaluate(X, y) — calculates the loss on a data set.
        set_lr(new_lr) — updates the learning rate.
        summary() — prints the architecture.

    Abstract methods (must implement subclasses):
        forward(x)       — forward pass.
        backward(grad)   — backward pass.
        parameters()     — list of trainable parameters.
        get_layers()     — list of layers in order of execution.
    """

    def __init__(self):
        self._loss_fn = None
        self._optimizer_obj = None
        self._metrics = []
        self._compiled = False

    # ------------------------------------------------------------------
    # Abstract methods
    # ------------------------------------------------------------------

    @abstractmethod
    def forward(self, x):
        """Forward propagation. Returns the output of the model."""
        pass

    @abstractmethod
    def backward(self, grad):
        """Backward propagation. Receives the gradient of the loss."""
        pass

    @abstractmethod
    def parameters(self):
        """Returns a flat list of all trainable parameters."""
        pass

    @abstractmethod
    def get_layers(self):
        """Returns the model layers in execution order."""
        pass

    # ------------------------------------------------------------------
    # compile
    # ------------------------------------------------------------------

    @check_sig([1, 2, 3, 4], [string_type, void_t], [string_type, void_t], [string_list_type, void_t], is_method=True)
    def compile(self, optimizer=None, loss=None, metrics=None):
        """Configure the optimizer and loss function.

        Args:
            optimizer: Optimizer name ('sgd', 'adam', 'rmsprop', 'adamw').
            loss: Loss function name ('mse', 'mae',
                  'binary_crossentropy', 'categorical_crossentropy',
                  'sparse_categorical_crossentropy').
            metrics: List of metric names (informational).
        """
        self._loss_fn = _resolve_loss(loss)
        self._optimizer_obj = _resolve_optimizer(optimizer)
        self._metrics = metrics or []
        self._compiled = True

    # ------------------------------------------------------------------
    # fit — generic training
    # ------------------------------------------------------------------

    @check_sig([2, 3, 4, 5, 6, 7],
               numeric_matrix_types,
               numeric_matrix_types + numeric_vector_types + [void_t],
               [integer_type], [integer_type],
               numeric_matrix_types + [void_t],
               numeric_matrix_types + numeric_vector_types + [void_t],
               is_method=True)
    def fit(self, x_train, y_train=None, epochs=1, batch_size=1, x_val=None, y_val=None):
        """Train the model with ready-made data (NumPy-style lists).

        The method is completely generic. He doesn't know anything about the type of
        problem (binary, multiclass, regression, clustering). The difference
        it is encoded by the compiled loss function.

        Args:
            x_train: Input matrix (list of vectors).
            y_train: Tags/targets or None for unsupervised mode.
            epochs: Number of epochs.
            batch_size: Mini-batch size.
            x_val: Validation data (optional).
            y_val: Validation labels (optional).
        """
        if not self._compiled:
            raise RuntimeError("Model: compile() must be called before fit()")

        n_samples = len(x_train)
        is_unsupervised = y_train is None or (isinstance(y_train, list) and len(y_train) == 0)
        has_val = (
            x_val is not None and y_val is not None
            and isinstance(x_val, list) and len(x_val) > 0
        )

        self._set_training(True)

        for epoch in range(1, epochs + 1):
            total_loss = 0.0
            correct = 0

            # In unsupervised mode, calculate mu_k centroids as soft weighted means (Soft K-Means)
            centroids = None
            if is_unsupervised:
                z_all = [self.forward(xi) for xi in x_train]
                k_num = len(z_all[0])
                d_feat = len(x_train[0])
                weights = [sum(z_all[idx][c] for idx in range(n_samples)) for c in range(k_num)]
                centroids = []
                for c in range(k_num):
                    if weights[c] > 1e-6:
                        mu_c = [sum(z_all[idx][c] * x_train[idx][f] for idx in range(n_samples)) / weights[c] for f in range(d_feat)]
                    else:
                        mu_c = [0.0] * d_feat
                    centroids.append(mu_c)

            for i in range(0, n_samples, batch_size):
                end = min(i + batch_size, n_samples)
                bx = x_train[i:end]
                by = [] if is_unsupervised else y_train[i:end]

                for j, xi in enumerate(bx):
                    # Forward
                    out = self.forward(xi)

                    if is_unsupervised:
                        # Unsupervised mode: Centroid-based Soft K-Means
                        loss_val, grad = self._unsupervised_loss_and_grad(xi, out, centroids)
                    else:
                        yi = by[j]
                        loss_val, grad = self._compute_loss_and_grad(out, yi)
                        if self._metrics:
                            pred_lbl = self.predict_label(xi)
                            true_lbl = yi if isinstance(yi, int) else (yi.index(max(yi)) if isinstance(yi, list) and len(yi) > 1 else (1 if yi[0] >= 0.5 else 0))
                            if pred_lbl == true_lbl:
                                correct += 1

                    total_loss += loss_val
                    self.backward(grad)

            loss_pct = (total_loss / n_samples) * 100.0
            msg = f"Epoch {epoch}/{epochs} — Loss {loss_pct:.2f}%"

            if self._metrics and not is_unsupervised:
                acc_pct = (correct / n_samples) * 100.0
                msg += f" — Accuracy {acc_pct:.2f}%"

            if has_val:
                msg += self._validation_message(x_val, y_val)

            print(msg)

        self._set_training(False)

    # ------------------------------------------------------------------
    # predict / evaluate
    # ------------------------------------------------------------------

    @check_sig([2], numeric_vector_types, is_method=True)
    def predict(self, x):
        """Inference on a single example. Returns the output vector."""
        self._set_training(False)
        return self.forward(x)

    @check_sig([2], numeric_vector_types, is_method=True)
    def predict_proba(self, x):
        """Returns the exit probability.

        - 1D output (one element): returns the scalar.
        - Multi-dimensional output: returns the probability vector.
        """
        out = self.predict(x)
        if isinstance(out, list) and len(out) == 1:
            return out[0]
        return out

    @check_sig([2], numeric_vector_types, is_method=True)
    def predict_label(self, x):
        """Returns the predicted label.

        - 1D output: threshold at 0.5 → 0 or 1.
        - Multi-dimensional output: argmax.
        """
        out = self.predict(x)
        if isinstance(out, list) and len(out) == 1:
            return 1 if out[0] >= 0.5 else 0
        return out.index(max(out))

    @check_sig([3], numeric_matrix_types, numeric_matrix_types + numeric_vector_types, is_method=True)
    def evaluate(self, x_test, y_test):
        """Calculates the average loss on a set of data expressed as a percentage.

        Args:
            x_test: Input matrix.
            y_test: Labels/targets.

        Returns:
            Average loss in percentage (float).
        """
        self._set_training(False)
        total_loss = 0.0
        n = len(x_test)
        for xi, yi in zip(x_test, y_test):
            out = self.forward(xi)
            loss_val, _ = self._compute_loss_and_grad(out, yi)
            total_loss += loss_val
        avg_pct = (total_loss / n) * 100.0
        print(f"Loss: {avg_pct:.2f}%")
        return avg_pct

    # ------------------------------------------------------------------
    # Public utilities
    # ------------------------------------------------------------------

    @check_sig([2], [float_type, integer_type], is_method=True)
    def set_lr(self, new_lr):
        """Updates the learning rate of the optimizer."""
        if not self._compiled:
            raise AttributeError("Model: compile() must be called before set_lr()")
        self._optimizer_obj.lr = new_lr

    def add(self, layer):
        """Add a layer to the model. Only valid for Sequential."""
        raise NotImplementedError(
            "add() is available only in Sequential. "
            "For Functional, connect layers with layer(input_node)."
        )

    def summary(self):
        """Prints a summary of the model architecture."""
        print(f"=== {self.__class__.__name__} ===")
        layers = self.get_layers()
        for i, layer in enumerate(layers, 1):
            layer.summary()
        print("=" * 30)

    # ------------------------------------------------------------------
    # Internos
    # ------------------------------------------------------------------

    def _compute_loss_and_grad(self, out, yi):
        """Calculate the loss and its gradient for a single supervised example.

        Normalize the shape of yi and out so that the loss function receives
        lists, regardless of whether the problem is binary (scalar)
        or multiclass (vector).

        Returns:
            (loss_val: float, grad: list)
        """
        # Normalize to loss lists
        out_list = out if isinstance(out, list) else [out]
        yi_list  = yi  if isinstance(yi,  list) else [yi]

        loss_val = self._loss_fn.compute(yi_list, out_list)
        grad_raw = self._loss_fn.derivative(yi_list, out_list)

        # derivative can return list of lists or flat list
        if grad_raw and isinstance(grad_raw[0], list):
            grad = grad_raw[0]
        else:
            grad = grad_raw

        return loss_val, grad

    def _unsupervised_loss_and_grad(self, xi, out, centroids=None):
        """Loss and gradient for unsupervised mode (Soft K-Means Neural Clustering).

        Calculate the soft target t_ik based on the distance of xi to the centroids mu_k:
            d_ik = sum_f (xi_f - mu_kf)^2
            r_ik = 1 / (d_ik + eps)
            t_ik = r_ik / sum_j r_ij

        Args:
            xi: Entry example.
            out: Current output (softmax probabilities).
            centroids: List of mu_k cluster centroids.

        Returns:
            (loss_val: float, grad_logit: list)
        """
        k = len(out)
        eps = 1e-6
        p = [max(eps, min(1.0 - eps, v)) for v in out]

        if centroids and len(centroids) == k:
            dists = [sum((xi[f] - centroids[c][f]) ** 2 for f in range(len(xi))) for c in range(k)]
            raw = [1.0 / (d + eps) for d in dists]
            s_raw = sum(raw) + eps
            target = [r / s_raw for r in raw]
        else:
            p_sq = [v ** 2 for v in p]
            s_sq = sum(p_sq) + eps
            target = [v / s_sq for v in p_sq]

        # MSE entre asignaciones out (p) y targets t
        loss_val = sum((p[c] - target[c]) ** 2 for c in range(k))
        grad_z = [2.0 * (p[c] - target[c]) / k for c in range(k)]

        # Gradient via Softmax
        weighted = sum(grad_z[c] * p[c] for c in range(k))
        grad_logit = [p[c] * (grad_z[c] - weighted) for c in range(k)]

        return loss_val, grad_logit

    def _validation_message(self, x_val, y_val):
        """Generates the validation message by calculating the loss in percentage."""
        total = 0.0
        n = len(x_val)
        for xi, yi in zip(x_val, y_val):
            out = self.forward(xi)
            loss_val, _ = self._compute_loss_and_grad(out, yi)
            total += loss_val
        val_pct = (total / n) * 100.0
        return f" — val_loss {val_pct:.2f}%"

    def _set_training(self, mode):
        """Propagates the training/evaluation mode to all layers."""
        for layer in self.get_layers():
            if mode:
                layer.train()
            else:
                layer.eval()


# --------------------------------------------------------------------------
# Backwards compatibility aliases
# --------------------------------------------------------------------------

# Gesha is kept as an alias so that the GESHA type mapping and the code
# interpreter (base/functions.py line 51) continue to work without changes.
Gesha = Model

# GeshaDeep is no more; any code that uses it should be migrated to Sequential.