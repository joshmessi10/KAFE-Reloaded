# Gesha — Deep Learning

Gesha is KAFE's deep learning library. It implements neural networks from scratch (MLP, CNN, and RNN architectures) with manual backpropagation over NUMK tensors — no TensorFlow or PyTorch.

**Import:**

```kafe
import gesha;
```

`gesha` is the single public import key (ADR-0016). The old keys `geshaDeep` and `geshaV2` remain registered as deprecated aliases that resolve to the same backend, but new programs should use `gesha`.

> **Supported architectures:** Gesha currently supports **MLP** (dense networks), **CNN** (convolutional networks), and **RNN** (SimpleRNN, LSTM, GRU, Embedding, Bidirectional) models. The Functional API (`input_layer` + `functional`) exists in the backend, but a complete, documented Functional training path is **FUTURE WORK**; use `sequential` models for now.

---

## Workflow overview

1. Build layers with the factory functions (`create_dense`, `create_conv2d`, `create_rnn`, ...).
2. Assemble them into a model with `gesha.sequential([...])`.
3. Configure training with `gesha.compile(model, optimizer, loss, metrics)`.
4. Train with `model.fit(x_train, y_train, epochs, batch_size)`.
5. Inspect with `model.predict(...)`, `model.predict_label(...)`, `model.summary()`.

---

## Model assembly

| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.sequential` | `(layers) -> GESHA` | Stacks layers in the given order |
| `gesha.functional` | `(inputs, outputs) -> GESHA` | DAG model (FUTURE WORK for training) |
| `gesha.input_layer` | `(shape) -> GESHA` | Symbolic input node for the graph |

Layers can also be added after assembly with `model.add(layer)` (`Sequential` only).

---

## Layer factories

### Dense and activations

| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.create_dense` | `(units, activation, input_shape, regularization_lambda, seed, kernel_initializer, kernel_regularizer) -> GESHA` | Dense layer; `input_shape=[]` infers features at the first forward pass |
| `gesha.dropout_layer` | `(rate, seed) -> GESHA` | Dropout regularization |
| `gesha.flatten_layer` | `(input_shape) -> GESHA` | Flattens spatial inputs to a 1-D vector |
| `gesha.batch_normalization` | `(epsilon, momentum) -> GESHA` | Batch normalization |

### Convolutional

| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.create_conv1d` | `(filters, kernel_size, activation, input_shape, stride, padding, seed) -> GESHA` | 1-D convolution for `[timesteps, features]` inputs |
| `gesha.create_conv2d` | `(filters, kernel_size, activation, input_shape, stride, padding, seed, kernel_initializer, kernel_regularizer) -> GESHA` | 2-D convolution for `[channels, height, width]` inputs |
| `gesha.create_conv2d_transpose` | `(filters, kernel_size, activation, input_shape, stride, padding, seed) -> GESHA` | Transposed 2-D convolution (upsampling) |
| `gesha.create_depthwise_conv2d` | `(kernel_size, depth_multiplier, activation, input_shape, stride, padding, seed) -> GESHA` | Depthwise 2-D convolution |

### Pooling and spatial

| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.max_pooling1d` | `(pool_size, stride) -> GESHA` | Max pooling over 1-D inputs |
| `gesha.max_pooling2d` | `(pool_size, stride) -> GESHA` | Max pooling (default `[2, 2]`) |
| `gesha.average_pooling2d` | `(pool_size, stride) -> GESHA` | Average pooling (default `[2, 2]`) |
| `gesha.global_average_pooling2d` | `() -> GESHA` | Global average pooling |
| `gesha.global_max_pooling2d` | `() -> GESHA` | Global max pooling |
| `gesha.zero_padding2d` | `(padding) -> GESHA` | Zero padding (default `[1, 1]`) |
| `gesha.up_sampling2d` | `(size) -> GESHA` | Upsampling (default `[2, 2]`) |
| `gesha.reshape_layer` | `(target_shape) -> GESHA` | Reshapes its input |
| `gesha.permute_layer` | `(dims) -> GESHA` | Reorders the input dimensions |

### Recurrent

| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.create_rnn` | `(units, activation, input_shape, return_sequences, seed) -> GESHA` | SimpleRNN for `[timesteps, features]` inputs |
| `gesha.create_lstm` | `(units, input_shape, return_sequences, seed) -> GESHA` | Long Short-Term Memory layer |
| `gesha.create_gru` | `(units, input_shape, return_sequences, seed) -> GESHA` | Gated Recurrent Unit layer |
| `gesha.embedding` | `(input_dim, output_dim, seed) -> GESHA` | Learns a dense vector per token index |
| `gesha.bidirectional` | `(layer) -> GESHA` | Wraps a recurrent layer to run in both directions |

### Merge

| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.add_layer` | `() -> GESHA` | Element-wise sum (skip connections) |
| `gesha.concatenate_layer` | `(axis) -> GESHA` | Concatenates multiple inputs |
| `gesha.multiply_layer` | `() -> GESHA` | Element-wise product |

---

## Initializers

| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.zeros_initializer` | `() -> initializer` | All zeros |
| `gesha.ones_initializer` | `() -> initializer` | All ones |
| `gesha.constant_initializer` | `(value) -> initializer` | Constant value |
| `gesha.random_uniform` | `(minval, maxval, seed) -> initializer` | Uniform random |
| `gesha.random_normal` | `(mean, stddev, seed) -> initializer` | Gaussian random |
| `gesha.glorot_uniform` | `(seed) -> initializer` | Glorot/Xavier uniform |
| `gesha.glorot_normal` | `(seed) -> initializer` | Glorot/Xavier normal |
| `gesha.he_uniform` | `(seed) -> initializer` | He uniform (ReLU networks) |
| `gesha.he_normal` | `(seed) -> initializer` | He normal (ReLU networks) |
| `gesha.orthogonal` | `(gain, seed) -> initializer` | Orthogonal matrix (recurrent weights) |

Initializers are passed to layer factories through the `kernel_initializer` argument, e.g. `gesha.create_dense(16, "relu", [8], 0.0, 42, gesha.he_normal(42))`.

## Regularizers

| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.l1_regularizer` | `(value) -> regularizer` | L1 penalty |
| `gesha.l2_regularizer` | `(value) -> regularizer` | L2 penalty |
| `gesha.l1_l2_regularizer` | `(l1, l2) -> regularizer` | Combined L1 + L2 penalty |

Regularizers are passed to layer factories through the `kernel_regularizer` argument. The scalar `regularization_lambda` argument of `create_dense`/`create_conv2d` is a simpler per-layer L2 penalty.

## Callbacks

| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.early_stopping` | `(monitor, patience, min_delta, mode, restore_best_weights) -> callback` | Stops training when the monitored metric stops improving |
| `gesha.model_checkpoint` | `(filepath, monitor, save_best_only, mode) -> callback` | Saves weights at epoch end |
| `gesha.add_callback` | `(model, callback) -> VOID` | Attaches a callback to a model |

Callbacks can also be passed directly to `model.fit(..., callbacks=[...])`.

## Tensor helpers

| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.tensor` | `(data) -> List` | Validated numeric copy of a nested list |
| `gesha.tensor_zeros` | `(shape) -> List` | Zero-filled tensor |
| `gesha.tensor_ones` | `(shape) -> List` | One-filled tensor |
| `gesha.tensor_random` | `(shape) -> List` | Random-filled tensor |

These return NUMK numeric lists; Gesha does not define a separate Tensor type.

---

## Model methods

| Method | Signature | Description |
|--------|-------|-------------|
| `model.compile` | `(optimizer, loss, metrics) -> VOID` | Configures the optimizer, loss, and metrics (required before `fit`) |
| `model.fit` | `(x_train, y_train, epochs, batch_size, x_val, y_val, regularization_lambda, callbacks) -> VOID` | Trains the model; pass `y_train = []` for unsupervised (clustering) training |
| `model.predict` | `(input) -> List[FLOAT]` or `List[List[FLOAT]]` | Output for one sample or a batch |
| `model.predict_proba` | `(input) -> List[FLOAT]` or `List[List[FLOAT]]` | Class probabilities (same as `predict`) |
| `model.predict_label` | `(input) -> INT` or `List[INT]` | Thresholded label (binary) or argmax class/cluster index |
| `model.summary` | `() -> VOID` | Prints the model architecture |
| `model.set_lr` | `(new_lr) -> VOID` | Updates the learning rate (after `compile`) |
| `model.add` | `(layer) -> VOID` | Appends a layer (`Sequential` only) |
| `model.add_callback` | `(callback) -> VOID` | Attaches a callback |
| `model.save_weights` | `(filepath) -> VOID` | Saves all parameters as JSON |
| `model.load_weights` | `(filepath) -> VOID` | Loads parameters saved with `save_weights` |

## Configuration functions

| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.compile` | `(model, optimizer, loss, metrics) -> VOID` | Functional form of `model.compile` |
| `gesha.set_lr` | `(model, new_lr) -> VOID` | Functional form of `model.set_lr` |

---

## Supported values

### Activation functions

- `"sigmoid"` — Returns a value between 0 and 1
- `"relu"` — Rectified Linear Unit
- `"tanh"` — Hyperbolic tangent (range -1 to 1)
- `"softmax"` — Probability distribution
- `"linear"` — No transformation

### Optimizers

- `"sgd"` — Stochastic Gradient Descent
- `"adam"` — Adaptive Moment Estimation
- `"rmsprop"` — Root Mean Square Propagation
- `"adamw"` — Adam with Weight Decay

### Loss functions

- `"binary_crossentropy"` (or `"bce"`) — For binary classification
- `"categorical_crossentropy"` (or `"cce"`) — For multiclass classification
- `"sparse_categorical_crossentropy"` (or `"scce"`) — For multiclass classification with integer labels
- `"mse"` (or `"mean_squared_error"`) — Mean squared error (regression)
- `"mae"` (or `"mean_absolute_error"`) — Mean absolute error (regression)

### Metrics

- `"accuracy"` — Classification accuracy

---

## Example: Binary AND classification

```kafe
import gesha;

List[List[INT]] x_train = [[0,0],[0,1],[1,0],[1,1]];
List[INT] y_train = [0, 0, 0, 1];

GESHA layer = gesha.create_dense(1, "sigmoid", [2], 0.0, 42);
GESHA model = gesha.sequential([layer]);

gesha.compile(model, "sgd", "binary_crossentropy", ["accuracy"]);
model.fit(x_train, y_train, 1000, 1);

for (p in x_train):
    List[FLOAT] prob = model.predict(p);
    INT lbl = model.predict_label(p);
    show(str(p) + " -> prob=" + str(prob[0]) + ", label=" + str(lbl));
;
```

## Example: Regression

```kafe
import gesha;

List[List[FLOAT]] X_train = [[1.0], [2.0], [3.0], [4.0]];
List[FLOAT] y_train = [2.0, 4.0, 6.0, 8.0];

GESHA reg_layer = gesha.create_dense(1, "linear", [1], 0.0, 42);
GESHA reg_model = gesha.sequential([reg_layer]);

gesha.compile(reg_model, "sgd", "mse", []);
reg_model.fit(X_train, y_train, 50, 1);

List[FLOAT] pred = reg_model.predict([5.0]);
show("Prediction for [5.0]: " + str(pred[0]));
```

## Example: Clustering (unsupervised)

```kafe
import gesha;

List[List[FLOAT]] X_train = [
    [1.0, 1.0], [1.5, 2.0], [5.0, 8.0],
    [8.0, 8.0], [1.0, 0.6], [9.0, 11.0]
];

GESHA layer1 = gesha.create_dense(2, "relu", [2], 0.0, 42);
GESHA layer2 = gesha.create_dense(2, "softmax", [], 0.0, 42);
GESHA model = gesha.sequential([layer1, layer2]);

gesha.compile(model, "adam", "mse", []);
model.fit(X_train, [], 20, 1);

List[FLOAT] probs = model.predict([1.0, 1.0]);
show("Cluster probabilities: " + str(probs));
INT cluster = model.predict_label([1.0, 1.0]);
show("Assigned cluster: " + str(cluster));
```

Passing an empty list as `y_train` selects unsupervised Soft K-Means training: the network's softmax output is interpreted as soft cluster assignments.

---

## Error handling

| Error | Cause |
|-------|-------|
| **Architecture** | The first layer's `input_shape` does not match the data |
| **Compilation** | Unsupported optimizer or loss function name |
| **Training** | `x_train` and `y_train` have different numbers of samples |
| **Uncompiled model** | `fit` or `set_lr` is called before `compile` |
