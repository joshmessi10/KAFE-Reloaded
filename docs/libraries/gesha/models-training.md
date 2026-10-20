# Models and training

A model is an ordered collection of layers. The architectures supported for training today are MLP, CNN, and RNN (assembled with `gesha.sequential`); Functional graph training has a tested branching example, while soft clustering remains experimental. During training, the forward pass computes predictions; the loss compares predictions with targets; backpropagation applies the chain rule to obtain gradients; the optimizer updates parameters. Fit preprocessing on training data only, then evaluate on held-out data.

## Model assembly


| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.sequential` | `(layers) -> GESHA` | Stacks layers in the given order |
| `gesha.functional` | `(inputs, outputs) -> GESHA` | Directed graph model for explicit branches and merges; see the tested Functional fixture |
| `gesha.input_layer` | `(shape) -> GESHA` | Symbolic input node for the graph |

Layers can also be added after assembly with `model.add(layer)` (`Sequential` only). A Functional graph may expose several outputs and accepts one gradient per output in `backward`; the current `fit` training loop supports a single output and a single loss.

---


## Training workflow

```kafe
GESHA output_layer = gesha.create_dense(1, "sigmoid", [2], 0.0, 42);
GESHA model = gesha.sequential([output_layer]);
model.compile("sgd", "binary_crossentropy", ["accuracy"]);
model.set_lr(0.1);
model.fit([[0.0, 0.0], [1.0, 1.0]], [0, 1], 100, 1);
show(model.predict_label([1.0, 1.0]));
```

The example uses binary cross-entropy because the output is a sigmoid probability. Use `mse` with a linear output for regression and sparse categorical cross-entropy with softmax for integer multiclass labels.

## Epoch output and shared metrics

Every supervised classification epoch using binary, categorical, or sparse categorical cross-entropy prints `Loss <value> — Accuracy <percent>%`, including when `metrics` is `[]`. Loss is the mean value of the configured loss function, not a percentage. Accuracy is the fraction of training samples whose predicted class matches the target, multiplied by 100 for display. The model also records fractions from 0 to 1 in `history["accuracy"]` for Python callers. The `metrics` argument remains accepted by `compile`, but passing `[]` does not suppress this built-in classification report. The epoch statistic uses predictions made while training proceeds; use a held-out test set for final evaluation. When L2 regularization is configured for Dense, Conv2D, or SimpleRNN, the reported training loss includes its $\lambda\lVert W\rVert_2^2/2$ penalty; validation loss measures the configured data loss without that penalty.

Regression (`mse`, `mae`), reconstruction with an autoencoder, and unsupervised soft clustering print loss but no accuracy: those tasks do not have class labels to count. Models used only for `predict` without `fit` do not print epochs. A classifier trained with `mse` is treated as regression for epoch reporting; the synthetic XOR fixture `tests/KafeGESHA/logic_gates/neural_network_xor_gate.kf` is one such case. Use binary cross-entropy with sigmoid or categorical cross-entropy with softmax when classification accuracy should be tracked. The `neural_network_multiclass.kf` fixture uses empty targets and is therefore unsupervised despite its filename. For a test-set metric, import `machine` alongside `gesha` and call the same `machine.*` functions used by classical models.

```kafe
import gesha;
import machine;

List[List[FLOAT]] X = [[0.0, 0.0], [0.0, 1.0], [1.0, 0.0], [1.0, 1.0]];
List[INT] y = [0, 0, 0, 1];
GESHA layer = gesha.create_dense(1, "sigmoid", [2], 0.0, 42);
GESHA model = gesha.sequential([layer]);
model.compile("sgd", "binary_crossentropy", []);
model.fit(X, y, 10, 1);
List[INT] predicted = model.predict_label(X);
FLOAT accuracy = machine.accuracy_score(y, predicted);
show("Accuracy: " + str(accuracy * 100.0) + "%");
```

For binary ROC AUC, pass sigmoid scores from `model.predict(X)` to `machine.roc_auc_score(y, scores)`, not thresholded labels. Regression metrics such as `machine.mean_squared_error(y, model.predict(X))` accept Gesha batch predictions with one output per sample. Multiclass accuracy uses `predict_label`; multi-output regression matrices need a metric per output. See [the complete metric reference](../machine/metrics.md) for formulas and other options.

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


## Common errors


| Error | Cause |
|-------|-------|
| **Architecture** | The first layer's `input_shape` does not match the data |
| **Compilation** | Unsupported optimizer or loss function name |
| **Training** | `x_train` and `y_train` have different numbers of samples |
| **Uncompiled model** | `fit` or `set_lr` is called before `compile` |

The input shape of the first layer must match each sample. `fit` needs a compiled model, positive batch size, and compatible training inputs and labels. `predict_label` returns a binary label at a 0.5 threshold for a one-unit output and an argmax class for multi-unit outputs. Use raw `predict` outputs when confidence or regression values matter.

## Fit arguments and validation

| Argument | Purpose | Practical check |
|---|---|---|
| `x_train` | Input samples, each with the shape expected by the first layer. | Inspect the first sample before building the model. |
| `y_train` | Targets for supervised learning; `[]` selects the unsupervised branch. | Match the number of inputs for supervised tasks. |
| `epochs` | Number of passes over training samples. | More epochs may overfit; inspect held-out results. |
| `batch_size` | Number of samples per parameter update. | Must be a positive integer. |
| Validation data | Optional inputs and labels for monitoring training. | Keep the final test set separate from tuning. |
| `callbacks` | Early stopping and checkpoint behavior. | Monitor only metrics actually computed by the run. |

The model does not automatically split data. For tabular classification, use a stratified split if class frequencies matter. Fit any scaler on `X_train` and transform `X_test` with that fitted scaler. Evaluate a trained model by printing several held-out predictions alongside targets and computing a task-appropriate metric.

### Prediction forms

`predict` returns numeric outputs, such as a sigmoid value, a softmax vector, or a continuous regression estimate. `predict_label` converts a one-unit output with a 0.5 threshold or chooses the largest component in a multi-unit output. The returned label is convenient for accuracy, but it discards confidence information.

### Saving weights

`save_weights` writes model parameters to JSON and `load_weights` reads them back. Construct the same architecture before loading. Save after training, and load before predicting with the restored model. The file contains parameters, not the input preprocessing pipeline, so keep the feature order and scaler settings alongside it.

### Computational cost

For each sample, a dense layer with `n` inputs and `m` outputs uses `O(nm)` multiply-add work. Backpropagation has the same order and stores activations and gradients in addition to weights. A minibatch delays the optimizer update until its samples have contributed gradients; very large batches increase memory use.

[Back to Gesha overview](../gesha.md)
