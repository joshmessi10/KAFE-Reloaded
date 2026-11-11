# GESHA: dense networks and activations

The **dense layer** is the basic piece of almost every network: each of its neurons receives **all** the inputs. With dense layers and the right **activation functions** you can classify, predict numbers and solve problems a single neuron can't.

If you haven't yet, read the [GESHA overview](../gesha.md) first: it has your first network and how it learns inside.

## The dense layer { #dense }

### The idea in one sentence

A **dense layer** of `m` neurons with `n` inputs computes `m` weighted sums at once, one per neuron, and passes each through the same activation.

### An everyday comparison

Think of a panel of 3 judges looking at the same 4 scores of a contestant. Each judge gives each score their own importance (their **weights**) and has their own strictness (their **bias**). Each one hands in their own mark.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-dense-layer.svg"
<figcaption>Four inputs on the left and three neurons on the right. Each neuron's connections light up in turn: every neuron receives all four inputs. The count gives 4 × 3 = 12 weights, plus 3 biases: 15 parameters.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/gesha/dense-parameters.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/dense-parameters.expec"
```

`layer.weights` is a table of **4 rows** (one per input) and **3 columns** (one per neuron), and `layer.biases` has **3** numbers. In total, 15 numbers to learn.

??? info "For the curious 🤓"
    In matrix form, a dense layer computes $a = f(xW + b)$, with $x$ of size $1 \times n$, $W$ of size $n \times m$ and $b$ of size $1 \times m$. It costs on the order of $n \cdot m$ multiplications per example. The first layer of a network for 28 × 28 pixel images (784 inputs) with 128 neurons already has $784 \times 128 + 128 = 100\,480$ parameters.

### Creating the layer: `gesha.create_dense` { #create_dense }

| Position | Parameter | What it means |
|---|---|---|
| 1 | `units` (`INT`) | How many neurons the layer has. |
| 2 | `activation` (`STR`) | The activation: `"sigmoid"`, `"relu"`, `"tanh"`, `"softmax"` or `"linear"`. |
| 3 | `input_shape` (`List[INT]`) | How many inputs it receives, for example `[2]`. With `[]` it finds out at the first prediction. |
| 4 | `regularization_lambda` (`FLOAT`, optional) | How much large weights are penalised. `0.0` = none. |
| 5 | `seed` (`INT`, optional) | The seed for the initial weights: same seed, same result. |
| 6 | `kernel_initializer` (optional) | How the initial weights are chosen. See [tools](training-tools.md). |
| 7 | `kernel_regularizer` (optional) | A regularizer. See [tools](training-tools.md). |

Properties: `layer.weights` and `layer.biases` (the learned numbers), and `layer.d_weights`, `layer.d_biases` (the gradients from the last step).

## Why hidden layers are needed: XOR { #xor }

### The idea in one sentence

A single neuron can only separate data with **a straight line**. Some problems, like the **XOR** ("exclusive or") gate, need a border that bends, and that takes a **hidden layer**: neurons between the input and the output.

### An everyday comparison

XOR is the rule of a two-way staircase switch: the light turns on if **only one** of the two switches is up, but not if both are up or both are down. No straight line separates those four cases.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-xor.svg"
<figcaption>The four XOR points: squares at (0, 1) and (1, 0), circles at (0, 0) and (1, 1). A dashed line tries several angles and always leaves some point on the wrong side. Then two lines from a hidden layer appear and fence the squares into a diagonal band.</figcaption>
</figure>

With **a single neuron**, the network can't learn XOR however hard it tries. The loss stays at 0.72:

```kafe
--8<-- "tests/DocsExamples/gesha/dense-xor-one-neuron.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/dense-xor-one-neuron.expec"
```

With a **hidden layer** of 4 `"tanh"` neurons, the loss drops to 0.07 and it gets all four right:

```kafe
--8<-- "tests/DocsExamples/gesha/dense-xor.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/dense-xor.expec"
```

!!! tip "What happened here?"
    1. The hidden layer `hidden` has 4 neurons looking at the 2 inputs. Each one draws **its own line**.
    2. The output layer `output` has 1 neuron looking at the hidden layer's 4 outputs (that's why its `input_shape` is `[4]`) and **combines** those lines.
    3. With `"adam"`, the optimizer adjusts each step's size by itself. In epoch 2 the loss goes up before going down: it's normal for the path not to be straight.

## Activation functions { #activations }

### The idea in one sentence

The activation **bends** the result of the sum. Without it, stacking layers would be pointless: a sum of sums is still a sum, and the whole network would still only draw straight lines.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-activations.svg"
<figcaption>Three curves: sigmoid, an S between 0 and 1; tanh, an S between −1 and 1; and ReLU, flat at 0 for negatives and straight for positives. Dots mark sigmoid and tanh at −2, 0 and 2.</figcaption>
</figure>

| Activation | Formula | Range | Used in |
|---|---|---|---|
| `"sigmoid"` | $\frac{1}{1 + e^{-z}}$ | 0 to 1 | The output of a yes/no. |
| `"tanh"` | $\frac{e^{z} - e^{-z}}{e^{z} + e^{-z}}$ | −1 to 1 | Hidden layers. |
| `"relu"` | $\max(0, z)$ | 0 to ∞ | Hidden layers (the most common). |
| `"softmax"` | $\frac{e^{z_i}}{\sum_j e^{z_j}}$ | 0 to 1, add up to 1 | The output of several classes. |
| `"linear"` | $z$ | any | The output of a number. |

Activations also exist as standalone layers, and you can try them directly:

```kafe
--8<-- "tests/DocsExamples/gesha/dense-activations.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/dense-activations.expec"
```

!!! tip "What happened here?"
    1. Sigmoid takes −2, 0 and 2 to `0.12`, `0.5` and `0.88`: always between 0 and 1.
    2. Tanh takes them to `-0.96`, `0.0` and `0.96`: between −1 and 1, centred on 0.
    3. ReLU lets positives through unchanged.
    4. Softmax turns `[1, 2, 3]` into `[0.09, 0.24, 0.67]`: probabilities that add up to 1.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-softmax.svg"
<figcaption>Three bars with scores 1, 2 and 3 reshape into probabilities 0.09, 0.24 and 0.67: the highest score takes the largest share, and all three add up to 1.</figcaption>
</figure>

??? warning "Known limit: ReLU with negatives outside a dense layer"
    A standalone ReLU layer turns a negative into the **integer** `0`. If the output list mixes that `0` with decimals, KAFE rejects it because its lists must have a single type. Inside a network (for example, with `create_dense(..., "relu", ...)`) this doesn't happen.

    ```kafe
    --8<-- "tests/DocsExamples/gesha/dense-relu-negative.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/gesha/dense-relu-negative.error.stderr.expec"
    ```

??? info "For the curious 🤓"
    To learn, each activation needs its **derivative**: sigmoid $\sigma'(z) = \sigma(z)(1 - \sigma(z))$, tanh $1 - \tanh^2(z)$ and ReLU $1$ if $z > 0$ and $0$ otherwise. Sigmoid's derivative is at most 0.25: with many sigmoid layers, gradients shrink layer after layer (the **vanishing gradient**). That's why hidden layers usually use ReLU or tanh. Activations live in `src/lib/KafeGESHA/activations/`. An unknown name produces a warning and KAFE uses identity instead, so always write one from the table.

## Choosing the last layer { #output }

The last layer and the loss depend on **what you want to predict**:

| Task | Last layer | Loss in `compile` | Answers `y` |
|---|---|---|---|
| Yes or no | 1 `"sigmoid"` neuron | `"binary_crossentropy"` | `0` or `1` |
| Several classes | 1 neuron per class, `"softmax"` | `"sparse_categorical_crossentropy"` | The class number |
| A number | 1 `"linear"` neuron | `"mse"` or `"mae"` | A number |

### Several classes with softmax { #softmax-example }

Points in three areas, classes `0`, `1` and `2`:

```kafe
--8<-- "tests/DocsExamples/gesha/dense-softmax.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/dense-softmax.expec"
```

The output layer has **3** neurons, one per class. `predict_label` returns the class with the highest probability. It got all 6 training points and the 3 new ones right.

### A number with a linear output { #regression-example }

The hidden rule is $y = 2x + 1$:

```kafe
--8<-- "tests/DocsExamples/gesha/dense-regression.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/dense-regression.expec"
```

One `"linear"` neuron with `"mse"` loss is a [linear regression](../machine/linear.md#linearregression) that learns **step by step**. After 10 epochs it found a weight of `1.98` and a bias of `1.07`, very close to 2 and 1, and predicts `8.98` for $x = 4$ (the exact value is 9). Since regression has no classes, `fit` shows the loss but no accuracy.

## Other layers for dense networks { #more-layers }

| Function | What it does |
|---|---|
| `gesha.dropout_layer(rate, seed)` | While training, **randomly switches off** a fraction `rate` of the neurons at each step. It forces the network not to rely on a few. When predicting, it switches nothing off. |
| `gesha.flatten_layer(input_shape)` | Flattens a table or image into a single list. Used between [convolutional](convolutional-networks.md) and dense layers. |
| `gesha.batch_normalization(epsilon, momentum)` | Normalizes a layer's outputs (average 0, deviation 1), like a [StandardScaler](../machine/preprocessing.md#standardscaler) inside the network. |
| `gesha.relu_layer()`, `sigmoid_layer()`, `tanh_layer()`, `softmax_layer()`, `linear_layer()` | Activations as standalone layers. For a simple dense network it's shorter to pass the activation to `create_dense`. |

The old names `gesha.ReLULayer()`, `SigmoidLayer()`, `TanhLayer()`, `SoftmaxLayer()` and `LinearLayer()` still work, but use the ones in the table in new programs.

| 👍 Strengths | 👎 Limits |
|---|---|
| With enough neurons, they can approximate almost any relationship. | Many parameters: they need data and time. |
| The same piece works for classifying and for predicting numbers. | They ignore the shape of the data: they treat an image as a loose list of pixels. That's what [convolutional networks](convolutional-networks.md) are for. |

!!! tip "What did you learn on this page?"
    - A dense layer connects every input with every neuron: `n × m` weights and `m` biases.
    - A single neuron draws a straight line; hidden layers allow borders that bend, as in XOR.
    - The activation bends the sum: ReLU or tanh in hidden layers; sigmoid, softmax or linear at the output, depending on the task.
