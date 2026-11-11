# GESHA: neural networks in KAFE

The **GESHA** library is for building and training **neural networks**: the kind of model behind image recognition, translators and voice assistants. This is called ***deep learning***. It's inspired by *Keras*, but every layer, loss function and optimizer is written from scratch inside KAFE so you can see how they work.

If you've never heard of artificial neurons, read the lesson [What is a neuron?](../aprende/neuronas.md) first.

## The idea: many small neurons { #idea }

An **artificial neuron** does a very simple calculation: it multiplies each input by a **weight**, adds everything up, adds a fixed number (the **bias**) and passes the result through an **activation function** that "bends" it. On its own it isn't very clever. But if you put **many** of them in **layers**, one after another, the network can learn very complicated shapes.

Learning means **adjusting the weights**. The network tries, measures how wrong it was and moves each weight a little in the direction that reduces the error. It repeats that many times.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-neuron.svg"
<figcaption>Two inputs, both 1, travel along their weights to the sum (Σ) and through the S-shaped activation. With every weight at 0 the output is 0.5. After one training step the weights and the bias become 0.05, the inputs travel again and the output rises to 0.537, closer to the correct answer, 1.</figcaption>
</figure>

## Your first network { #first-network }

Let's teach a neuron the **AND** logic gate: it gives `1` only when both inputs are `1`.

```kafe
--8<-- "tests/DocsExamples/gesha/overview-first-network.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/overview-first-network.expec"
```

!!! tip "What happened here?"
    1. `import gesha;` brought in the library. Networks have the type `GESHA`.
    2. `gesha.create_dense(1, "sigmoid", [2], 0.0, 42)` created a **layer** with **1** neuron, `"sigmoid"` activation, receiving **2** inputs, with no regularization (`0.0`) and seed `42`.
    3. `gesha.sequential([layer])` assembled the **network** from that layer.
    4. `compile` chose how to learn: the `"sgd"` **optimizer** and the `"binary_crossentropy"` **loss**, the one used for yes/no answers.
    5. `set_lr(2.0)` set the **learning rate**: how big each step is.
    6. `fit(X, y, 10, 1)` trained for **10 epochs** (10 passes over all the examples), **1** example at a time. Each epoch, the **loss** drops: from `1.0468` to `0.1705`.
    7. `predict_label` gives the final answer: it got all four rows right.

## Words you'll see { #words }

| Word | What it means |
|---|---|
| **Neuron** | A weighted sum plus an activation. |
| **Layer** | A group of neurons that receive the same inputs. |
| **Weight** and **bias** | The numbers the network learns. |
| **Activation** | The function that "bends" the sum: `"sigmoid"`, `"relu"`, `"tanh"`, `"softmax"`, `"linear"`. |
| **Loss** | A number that measures how wrong the network was. Lower is better. |
| **Epoch** | One full pass over all the examples. |
| **Learning rate** | How big each step is when adjusting the weights. |
| **Optimizer** | The rule for taking those steps: `"sgd"`, `"adam"`, `"rmsprop"`, `"adamw"`. |

## How it learns inside { #inside }

Each example goes through four steps, in a loop:

1. **Predict** (*forward*): the inputs go through the layers, from first to last.
2. **Measure**: the loss compares the prediction with the correct answer.
3. **Blame** (*backward* or **backpropagation**): the network works out, from the last layer to the first, how much **blame** each weight has for the error. That number is the **gradient**.
4. **Adjust**: the optimizer moves each weight a little **against** its gradient.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-training-loop.svg"
<figcaption>A dot goes round the four steps: predict (ŷ), measure the loss (L), compute the gradient that blames each weight (∂L/∂w) and move it against it (w ← w − η·∂L/∂w). Next to it, the real loss of the AND network draws itself over its 10 epochs: it falls from 1.05 to 0.17.</figcaption>
</figure>

This program takes **a single step** with every weight starting at 0, as in the neuron picture:

```kafe
--8<-- "tests/DocsExamples/gesha/overview-one-step.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/overview-one-step.expec"
```

The calculation by hand:

- **Predict:** $z = 0 \cdot 1 + 0 \cdot 1 + 0 = 0$ and $\text{sigmoid}(0) = 0.5$.
- **Measure:** the loss is $-\ln(0.5) = 0.6931$.
- **Blame:** with sigmoid and this loss, the gradient is very simple: $(\text{prediction} - \text{answer}) \times \text{input} = (0.5 - 1) \times 1 = -0.5$, for each weight and for the bias.
- **Adjust:** $w = 0 - 0.1 \times (-0.5) = 0.05$.

With the new weights, the prediction rises to $\text{sigmoid}(0.15) = 0.5374$. A small step in the right direction.

??? info "For the curious 🤓"
    Backpropagation is calculus's **chain rule**, applied layer by layer. If $L$ depends on the output $a = f(z)$ and $z = w \cdot x + b$, then $\frac{\partial L}{\partial w} = \frac{\partial L}{\partial a}\cdot f'(z)\cdot x$. Each layer receives the gradient from the next layer, computes its weights' gradient and passes the previous layer the gradient with respect to its input. In KAFE, each layer has its own `forward` and `backward` methods (in `src/lib/KafeGESHA/layers/`), and the model calls them in order inside `fit` (in `src/lib/KafeGESHA/models_v2.py`).

## Library map { #map }

| Page | What you'll find |
|---|---|
| [Dense networks](gesha/dense-networks.md) | The basic layer, activations, the perceptron, XOR and how to choose the last layer. |
| [Models and training](gesha/models-training.md) | `sequential`, `compile`, `fit`, `predict`, optimizers, losses and metrics. |
| [Convolutional networks](gesha/convolutional-networks.md) | Images, filters, pooling and spatial layers. |
| [Recurrent networks](gesha/recurrent-networks.md) | Sequences, SimpleRNN, LSTM, GRU and embeddings. |
| [Training tools](gesha/training-tools.md) | Initializers, regularizers, callbacks and tensors. |
| [Soft clustering](gesha/soft-clustering.md) | Grouping without labels with a network (experimental). |
| [API coverage and limits](gesha/api-coverage.md) | What is available from KAFE and what isn't. |
| [Complete examples](../ejemplos/gesha-examples.md) | End-to-end programs for each kind of network. |

## Common mistakes { #errors }

??? warning "Forgetting `import gesha;`"
    ```kafe
    --8<-- "tests/DocsExamples/gesha/overview-no-import.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/gesha/overview-no-import.error.stderr.expec"
    ```

??? warning "Training without `compile`"
    The network doesn't know how to measure the error or how to take steps until you call `compile`:

    ```kafe
    --8<-- "tests/DocsExamples/gesha/overview-no-compile.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/gesha/overview-no-compile.error.stderr.expec"
    ```

!!! note "One line per epoch"
    `fit` always prints one line per epoch with the loss (and the accuracy, for classification). That's why the examples on these pages train for few epochs with big steps. With real data you use more epochs and smaller steps.

!!! tip "What did you learn?"
    - A neuron computes a weighted sum and passes it through an activation.
    - A network is a stack of layers of neurons, assembled with `gesha.sequential`.
    - Learning means repeating: predict, measure the loss, blame each weight and adjust it.
    - `compile` chooses the optimizer and the loss; `fit` trains by epochs; `predict` and `predict_label` answer.
