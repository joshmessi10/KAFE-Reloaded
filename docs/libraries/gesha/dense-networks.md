# Dense networks and activations

A dense unit computes a weighted sum `z = w·x + b` and then an activation `a = f(z)`. One sigmoid unit can learn linearly separable gates such as AND and OR. XOR needs a hidden layer because no single linear boundary separates its positive cases.

## Dense and activation factories


| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.create_dense` | `(units, activation, input_shape, regularization_lambda, seed, kernel_initializer, kernel_regularizer) -> GESHA` | Dense layer; `input_shape=[]` infers features at the first forward pass |
| `gesha.dropout_layer` | `(rate, seed) -> GESHA` | Dropout regularization |
| `gesha.flatten_layer` | `(input_shape) -> GESHA` | Flattens spatial inputs to a 1-D vector |
| `gesha.batch_normalization` | `(epsilon, momentum) -> GESHA` | Batch normalization |


## Standalone activation layers

| Factory | Effect |
|---|---|
| `gesha.relu_layer()` | Applies ReLU. |
| `gesha.sigmoid_layer()` | Applies sigmoid. |
| `gesha.tanh_layer()` | Applies tanh. |
| `gesha.softmax_layer()` | Applies softmax. |
| `gesha.linear_layer()` | Leaves numeric values unchanged. |

These factories create activation layers for explicit layer stacks. For a simple dense network, supplying the activation directly to `gesha.create_dense` is shorter and easier to read.

Legacy `gesha.ReLULayer()`, `SigmoidLayer()`, `TanhLayer()`, `SoftmaxLayer()` and `LinearLayer()` remain compatibility aliases. Use the snake_case factories in new programs. The pinned runtime has an important direct-output restriction: ReLU maps a negative float to the integer `0`, so a direct result such as `[0, 2.0]` fails KAFE's homogeneous-list check. `tests/TutorLibraries/gesha-relu-mixed-output.error.kf` records that limitation; the activation fixture uses homogeneous outputs. A model's internal numerical computation is distinct from returning such a list through a KAFE expression.

## Activation functions


- `"sigmoid"` — Returns a value between 0 and 1
- `"relu"` — Rectified Linear Unit
- `"tanh"` — Hyperbolic tangent (range -1 to 1)
- `"softmax"` — Probability distribution
- `"linear"` — No transformation


Choose sigmoid for a binary probability, softmax for a vector of class probabilities, and linear for an unrestricted numeric prediction. ReLU is a common hidden activation; tanh can be useful when negative hidden values matter.

The loader also recognizes identity and step activation names and historical Spanish aliases. Step has zero derivative and is unsuitable for ordinary gradient-based learning. An unknown name emits a warning and falls back to identity; warnings are errors in validation, so use a recognized name rather than rely on fallback behavior.

## Losses and optimizers

### Loss functions

- `"binary_crossentropy"` (or `"bce"`) — For binary classification
- `"categorical_crossentropy"` (or `"cce"`) — For multiclass classification
- `"sparse_categorical_crossentropy"` (or `"scce"`) — For multiclass classification with integer labels
- `"mse"` (or `"mean_squared_error"`) — Mean squared error (regression)
- `"mae"` (or `"mean_absolute_error"`) — Mean absolute error (regression)


### Optimizers

- `"sgd"` — Stochastic Gradient Descent
- `"adam"` — Adaptive Moment Estimation
- `"rmsprop"` — Root Mean Square Propagation
- `"adamw"` — Adam with Weight Decay


### Metrics

- `"accuracy"` — Classification accuracy

---


For squared-error regression, the mean loss is `MSE = (1/n) × Σ(prediction − target)²`. Binary cross-entropy penalizes confident wrong binary predictions. Categorical cross-entropy does the same for class distributions. SGD follows the gradient; Adam and RMSprop adapt update sizes. Small educational datasets can overfit, so compare held-out predictions rather than training loss alone.

## Worked examples

- [Single perceptron: AND](../../ejemplos/gesha/perceptron-and.md)
- [Single perceptron: OR](../../ejemplos/gesha/perceptron-or.md)
- [Multilayer perceptron: XOR](../../ejemplos/gesha/mlp-xor.md)
- [Nonlinear function approximation](../../ejemplos/gesha/function-approximation.md)

## From perceptron to multilayer network

A single dense sigmoid unit computes `p = sigmoid(w·x + b)`. Thresholding `p` at 0.5 gives a binary label. AND and OR are linearly separable: one boundary can put their positive truth-table rows on one side. XOR has positive rows at `(0,1)` and `(1,0)`; no single line separates both from `(0,0)` and `(1,1)`. A hidden layer transforms the two inputs before the output unit, allowing a nonlinear boundary.

For a dense network, each layer applies `a_next = activation(W × a + b)`. During training, the chain rule passes the loss gradient backward through every activation and matrix product. A saturated sigmoid can produce small gradients; ReLU often helps deeper hidden stacks, while tanh remains useful for centered hidden outputs.

## Match the output layer to the target

| Task | Last activation | Loss | Target form | Prediction to inspect |
|---|---|---|---|---|
| Binary classification | `sigmoid`, one unit | `binary_crossentropy` | `0` or `1` | Probability and thresholded label. |
| Multiclass classification | `softmax`, one unit per class | `sparse_categorical_crossentropy` | Integer class index | Probability vector and argmax label. |
| Multiclass one-hot labels | `softmax` | `categorical_crossentropy` | One-hot vector | Probability vector. |
| Regression | `linear`, one unit | `mse` or `mae` | Continuous value | Predicted value and absolute error. |

Softmax outputs sum to one, but a score is not automatically a well-calibrated probability. Compare held-out predictions and use a representative evaluation set. The tiny truth-table examples exercise learning behavior; they are not estimates of performance on real-world data.

## Positional construction and introspection

The intended `create_dense` wrapper requires `units`, `activation` and `input_shape`; use `[]` to defer the feature count until the first forward pass. Python's `name` and `bias_initializer` constructor options are not arguments of this KAFE wrapper. Optional initializer and regularizer objects occupy the sixth and seventh positions.

After construction, `layer.weights` and `layer.biases` expose numeric parameter lists. `layer.d_weights` and `layer.d_biases` require a matching backward pass; `layer.input_cache` is the most recent forward input. Before lazy construction or gradient computation, the corresponding property can be `VOID`. These mutable numerical properties support explanation and diagnostics; raw `model.parameters()` handles are backend Python objects and cannot be assigned as `List[GESHA]`.

`tests/TutorLibraries/gesha-merge-training.kf` demonstrates a bounded training workflow, properties, low-level forward/backward and explicit build calls. `tests/TutorLibraries/gesha-parameter-handles.error.kf` records the raw-handle boundary.

## Parameter count

With `n` inputs and `m` units, a dense layer has `n × m` weights plus `m` biases, excluding optimizer state. For MNIST's first `784 → 128` layer, this is 100,352 weights and 128 biases. Flattening an image loses explicit spatial neighborhood structure; a CNN can exploit that structure more directly.

[Back to Gesha overview](../gesha.md)
