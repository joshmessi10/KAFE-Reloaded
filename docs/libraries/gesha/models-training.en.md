# GESHA: models and training

A **model** is an ordered list of layers. This page explains how to assemble one, how to choose **how it learns** (`compile`), how to train it (`fit`), how to ask it (`predict`) and how to tell whether it really learned.

If you haven't yet, read the [GESHA overview](../gesha.md) and [dense networks](dense-networks.md).

## Assembling the model { #assembly }

| Function | What it does |
|---|---|
| `gesha.sequential([layer1, layer2, ...])` | Stacks the layers in that order. Each one's output is the next one's input. |
| `model.add(layer)` | Adds a layer at the end (`sequential` only). |
| `gesha.functional(input, output)` | A graph with branches and merges. See the note at the end. |
| `gesha.input_layer(shape)` | The input node of a `functional` graph. |
| `model.summary()` | Prints the architecture. |

## Choosing how it learns: `compile` { #compile }

`model.compile(optimizer, loss, metrics)` chooses **the rule for taking steps** and **how to measure the error**. It's required before `fit`. Afterwards, `model.set_lr(rate)` changes the step size.

### Losses { #losses }

| Loss (short name) | For | What it measures |
|---|---|---|
| `"binary_crossentropy"` (`"bce"`) | Yes/no, with a `"sigmoid"` output | Heavily punishes being very sure and wrong. |
| `"sparse_categorical_crossentropy"` (`"scce"`) | Several classes with `y` as a number, `"softmax"` output | The same, for several classes. |
| `"categorical_crossentropy"` (`"cce"`) | Several classes with `y` as a one-hot vector | The same, with one-hot answers. |
| `"mse"` (`"mean_squared_error"`) | A number, `"linear"` output | The average of the squared errors. |
| `"mae"` (`"mean_absolute_error"`) | A number | The average of the errors without sign. |

### Optimizers { #optimizers }

They all move the weights **against the gradient**; they differ in **how** they choose each step's size.

| Optimizer | Idea |
|---|---|
| `"sgd"` | The step is always `rate × gradient`. Simple and predictable. |
| `"adam"` | Remembers previous gradients (a "momentum") and adjusts each weight's step separately. |
| `"rmsprop"` | Shrinks the step of weights whose gradients are large. |
| `"adamw"` | Adam that also shrinks the weights a little at each step. |

A comparison on the regression $y = 2x + 1$ (for $x = 4$ the exact answer is 9), with the same rate and 6 epochs:

```kafe
--8<-- "tests/DocsExamples/gesha/training-optimizers.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/training-optimizers.expec"
```

!!! tip "What happened here?"
    On such a small problem, `"sgd"` got closest (`9.03`). Adam and RMSprop take more cautious steps at first and need more epochs. **No optimizer always wins**: it depends on the data, the rate and the epochs.

??? info "For the curious 🤓"
    SGD: $w \leftarrow w - \eta\,g$. Adam keeps an average of the gradients $m$ and of their squares $v$: $m \leftarrow \beta_1 m + (1-\beta_1)g$, $v \leftarrow \beta_2 v + (1-\beta_2)g^2$, and steps $w \leftarrow w - \eta\,\hat{m}/(\sqrt{\hat{v}} + \varepsilon)$. RMSprop uses only $v$. The optimizers live in `src/lib/KafeGESHA/optimizers/`.

## Training: `fit` { #fit }

`model.fit(X, y, epochs, batch_size, X_val, y_val, lambda, callbacks)`. Arguments are **positional**.

| Argument | What it means |
|---|---|
| `X`, `y` | The examples and their answers. With an empty `y` (`[]`) it uses [soft clustering](soft-clustering.md). |
| `epochs` | How many passes over all the examples. |
| `batch_size` | How many examples it looks at before adjusting the weights (positive integer). |
| `X_val`, `y_val` | Separate data to **monitor** training (optional). |
| `lambda` | Extra penalty on large weights (optional). |
| `callbacks` | Tools such as [early stopping](training-tools.md) (optional). |

Each epoch prints a line with the **loss** and, for classification, the **accuracy** on the training examples. `fit` doesn't shuffle the examples or split data for you.

### Monitoring with validation data { #validation }

The training loss almost always goes down. The important question is whether the model works on **data it hasn't seen**. That's what validation data is for:

```kafe
--8<-- "tests/DocsExamples/gesha/training-validation.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/training-validation.expec"
```

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-validation-loss.svg"
<figcaption>The two curves from this example. The training loss falls from 1.05 to 0.37. The validation loss falls from 0.45 to 0.06 and rises a little at epoch 6; the ring marks epoch 5, its lowest point.</figcaption>
</figure>

!!! tip "What happened here?"
    `val_loss` went down until epoch 5 and rose a little at epoch 6 (`0.0619` → `0.0651`). If it kept rising while the training loss falls, the model would be **memorising** instead of learning (*overfitting*). [Early stopping](training-tools.md) stops training right there.

## Asking: `predict` { #predict }

| Method | Returns |
|---|---|
| `model.predict(x)` | The output numbers: a probability, a softmax vector or a number. |
| `model.predict_label(x)` | The class: cuts at 0.5 if there's one output, or picks the largest if there are several. |
| `model.predict_proba(x)` | The same as `predict` (it doesn't turn a regression into a probability). |

You can pass one example or a list. For **a single image or sequence**, wrap it in a list: `model.predict([image])`.

## Measuring for real: MACHINE metrics { #metrics }

GESHA has no `evaluate`: to measure on test data, use the [MACHINE metrics](../machine/metrics.md).

```kafe
--8<-- "tests/DocsExamples/gesha/training-metrics.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/training-metrics.expec"
```

The network trained on 4 examples and got all 4 test examples right, which it never saw: accuracy `1.0` and a confusion matrix with no errors. For regression use, for example, `machine.mean_squared_error(y, model.predict(X))`.

## Saving and loading weights { #weights }

`model.save_weights("file.json")` saves the weights and `model.load_weights("file.json")` restores them. Before loading you need to build **the same architecture**. The file doesn't store the architecture, the optimizer state, `batch_normalization`'s internal mean and variance, or your preprocessing: keep the scaling you used on your data too.

## Common mistakes { #errors }

??? warning "`X` and `y` of different lengths"
    ```kafe
    --8<-- "tests/DocsExamples/gesha/training-mismatch.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/gesha/training-mismatch.error.stderr.expec"
    ```

| Symptom | Likely cause |
|---|---|
| Shape error in the first layer | The `input_shape` doesn't match each example. |
| "Modelo no compilado" (not compiled) | You called `fit` or `set_lr` before `compile`. |
| The loss doesn't go down | Rate too small, too few epochs, or unscaled data. |
| The loss jumps up and down | Rate too large. |

## Technical details { #details }

- `gesha.compile(model, opt, loss, metrics)` and `gesha.set_lr(model, rate)` are alternative forms of `model.compile` and `model.set_lr`; the first requires all four arguments.
- The `metrics` argument is accepted, but what is actually reported is the accuracy for cross-entropy losses and `val_loss` when there's validation.
- To pass callbacks without validation: `model.fit(X, y, epochs, batch, [], [], 0.0, [callback])`.
- With 0 epochs there's no learning: it only checks the configuration.
- `gesha.functional` accepts one input node and one output node; there's a tested example of a branch merged with `add_layer`. Other graph shapes are experimental.
- `model.forward`, `model.backward` and `model.parameters()` exist for advanced inspection; raw parameters are Python objects KAFE can't store as `List[GESHA]`.
- A batch accumulates its examples' gradients and adjusts once. A dense layer costs on the order of $n \cdot m$ operations per example, forward and backward.
- See [API coverage and limits](api-coverage.md) for everything supported.
