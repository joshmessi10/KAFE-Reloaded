# Models and training

A model is an ordered collection of layers. During training, the forward pass computes predictions; the loss compares predictions with targets; backpropagation applies the chain rule to obtain gradients; the optimizer updates parameters. Fit preprocessing on training data only, then evaluate on held-out data.

## Model assembly


| Function | Signature | Description |
|---------|-------|-------------|
| `gesha.sequential` | `(layers) -> GESHA` | Stacks layers in the given order |
| `gesha.functional` | `(inputs, outputs) -> GESHA` | DAG model (FUTURE WORK for training) |
| `gesha.input_layer` | `(shape) -> GESHA` | Symbolic input node for the graph |

Layers can also be added after assembly with `model.add(layer)` (`Sequential` only).

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
