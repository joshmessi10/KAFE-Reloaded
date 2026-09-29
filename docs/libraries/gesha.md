# GeshaDeep — Deep Learning

GeshaDeep is KAFE's deep learning library. It supports binary and multiclass classification, regression, and clustering through a unified API based on models and dense layers.

**Import:**

```kafe
import geshaDeep;
```

---

## Model types

| Function | Model type | Typical activation | Recommended loss |
|---------|---------------|-------------------|---------------------|
| `geshaDeep.binary()` | Binary classification | `sigmoid` | `binary_crossentropy` |
| `geshaDeep.categorical()` | Multiclass classification | `softmax` (output), `relu` (hidden layers) | `categorical_crossentropy` |
| `geshaDeep.regression()` | Regression | `linear` | `mse` |
| `geshaDeep.clustering()` | Unsupervised clustering | `relu` + `softmax` | `categorical_crossentropy` |

---

## Function reference

### Creating models

| Function | Signature | Description |
|---------|-------|-------------|
| `geshaDeep.binary()` | `() -> GESHA` | Creates a binary classification model |
| `geshaDeep.categorical()` | `() -> GESHA` | Creates a multiclass classification model |
| `geshaDeep.regression()` | `() -> GESHA` | Creates a regression model |
| `geshaDeep.clustering()` | `() -> GESHA` | Creates a clustering model |

### Dense layers

| Function | Signature | Description |
|---------|-------|-------------|
| `geshaDeep.create_dense` | `(neurons, activation, input_shape, bias, seed) -> GESHA` | Creates a dense layer |

**`create_dense` parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `neurons` | INT | Number of neurons |
| `activation` | STR | Activation function |
| `input_shape` | List[INT] | Input shape |
| `bias` | FLOAT | Bias value |
| `seed` | INT | Random seed |

### Model methods

| Method | Signature | Description |
|--------|-------|-------------|
| `model.add` | `(GESHA) -> VOID` | Adds a layer |
| `model.compile` | `(optimizer, loss, metrics) -> VOID` | Configures the optimizer and loss |
| `model.fit` | `(x_train, y_train, epochs, batch_size, ...) -> VOID` | Trains the model |
| `model.evaluate` | `(x_test, y_test) -> FLOAT` | Evaluates the model on test data |
| `model.predict` | `(input) -> List[FLOAT]` | Returns model outputs or probabilities |
| `model.predict_proba` | `(input) -> FLOAT` | Returns the positive-class probability |
| `model.predict_label` | `(input) -> INT` | Returns the predicted label (binary threshold or class/cluster index) |
| `model.summary` | `() -> VOID` | Prints the model architecture |

### Configuration

| Function | Signature | Description |
|---------|-------|-------------|
| `geshaDeep.set_lr` | `(model, lr) -> VOID` | Sets the learning rate (after compilation) |

### Training from PARDOS

| Function | Signature | Description |
|---------|-------|-------------|
| `geshaDeep.fit_from_df` | `(model, df, y_columns, epochs, batch_size, ...) -> VOID` | Trains the model from a PARDOS DataFrame |

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

- `"binary_crossentropy"` — For binary classification
- `"categorical_crossentropy"` — For multiclass classification
- `"sparse_categorical_crossentropy"` — For multiclass classification with integer labels
- `"mse"` — Mean squared error (for regression)
- `"mae"` — Mean absolute error (for regression)

### Metrics

- `"accuracy"` — Classification accuracy

---

## Example: Binary AND classification

```kafe
import geshaDeep;

List[List[INT]] x_train = [[0,0],[0,1],[1,0],[1,1]];
List[INT] y_train = [0, 0, 0, 1];

GESHA model = geshaDeep.binary();
GESHA layer = geshaDeep.create_dense(1, "sigmoid", [2], 0.0, 42);
model.add(layer);

model.compile("sgd", "binary_crossentropy", ["accuracy"]);
model.fit(x_train, y_train, 1000, 1, [], []);

for (p in x_train):
    FLOAT prob = model.predict_proba(p);
    INT lbl = model.predict_label(p);
    show(str(p) + " -> prob=" + str(prob) + ", label=" + str(lbl));
;
```

## Example: Regression

```kafe
import geshaDeep;

List[List[FLOAT]] X_train = [[1.0], [2.0], [3.0], [4.0]];
List[FLOAT] y_train = [2.0, 4.0, 6.0, 8.0];

GESHA model = geshaDeep.regression();
GESHA layer = geshaDeep.create_dense(1, "linear", [1], 0.0, 42);
model.add(layer);

model.compile("sgd", "mse", []);
model.fit(X_train, y_train, 50, 1, [], []);

List[FLOAT] pred = model.predict([5.0]);
show("Prediction for [5.0]: " + str(pred[0]));
```

## Example: Clustering

```kafe
import geshaDeep;

List[List[FLOAT]] X_train = [
    [1.0, 1.0], [1.5, 2.0], [5.0, 8.0],
    [8.0, 8.0], [1.0, 0.6], [9.0, 11.0]
];

GESHA model = geshaDeep.clustering();
GESHA layer1 = geshaDeep.create_dense(4, "relu", [2], 0.0, 42);
GESHA layer2 = geshaDeep.create_dense(2, "softmax", [], 0.0, 42);
model.add(layer1);
model.add(layer2);

model.compile("adam", "mse", []);
model.fit(X_train, [], 20, 1);

List[FLOAT] probs = model.predict([1.0, 1.0]);
show("Cluster probabilities: " + str(probs));
INT cluster = model.predict_label([1.0, 1.0]);
show("Assigned cluster: " + str(cluster));
```

## Example: Clustering from a PARDOS DataFrame

```kafe
import geshaDeep;
import pardos;

PARDOS df = pardos.read_csv("data.csv");

GESHA model = geshaDeep.clustering();
GESHA layer1 = geshaDeep.create_dense(4, "relu", [2], 0.0, 42);
GESHA layer2 = geshaDeep.create_dense(2, "softmax", [], 0.0, 42);
model.add(layer1);
model.add(layer2);

model.compile("adam", "mse", []);
geshaDeep.fit_from_df(model, df, [], 20, 1);
```

---

## Error handling

| Error | Cause |
|-------|-------|
| **Architecture** | The first layer's `input_shape` does not match the data |
| **Compilation** | Unsupported optimizer or loss function |
| **Training** | `x_train` and `y_train` have different numbers of samples |
| **set_lr before compile** | Learning rate is set before the model is compiled |
