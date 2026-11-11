# What is a neuron?

## The idea in one sentence

An **artificial neuron** is a tiny calculator: it takes several numbers, gives each one an importance (its **weight**), adds them up and decides whether it "lights up" or not.

## An everyday comparison

Imagine you are deciding whether to **go out to play**. You look at three things:

- Is it sunny? ☀️
- Did you finish your homework? 📚
- Are your friends outside? 👫

They do not all matter the same. Maybe homework weighs the most (if you did not finish it, you do not go out), friends matter quite a lot and the sun matters a little. You add everything up in your head and, if it goes over a certain limit, you go out to play!

A neuron does **exactly that** with numbers.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/neurona.svg"
<figcaption>The inputs x₁, x₂ and x₃ travel along lines of different thickness (their weights w). The neuron adds everything up (Σ) and, if it goes over the limit, it lights up and gives 1.</figcaption>
</figure>

## The parts of a neuron

| Part | What it is | In the playing example |
|---|---|---|
| **Inputs** ($x$) | The data it receives | Sunny, homework, friends (1 = yes, 0 = no) |
| **Weights** ($w$) | How much each input matters | Homework 0.9, friends 0.5, sunny 0.4 |
| **Sum** ($\Sigma$) | Inputs × weights, all added up | `sunny*0.4 + homework*0.9 + friends*0.5` |
| **Activation** | The rule that decides if it lights up | If the sum is over 1.0 → 1, otherwise → 0 |

## A handmade neuron in KAFE

With what you already know (variables, functions and `if`) you can build a neuron:

```kafe
--8<-- "tests/DocsExamples/aprende/neurona-a-mano.en.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/neurona-a-mano.en.expec"
```

!!! tip "What happened here?"
    1. **Sunny and homework done, no friends:** 0.4 + 0.9 = 1.3 → over 1.0 → **1** (go out to play!).
    2. **Sunny and friends, homework not done:** 0.4 + 0.5 = 0.9 → not over 1.0 → **0** (stay in and do the homework).
    3. **Homework done and friends, no sun:** 0.9 + 0.5 = 1.4 → **1**.

    The big weight of the homework means it almost always decides whether you go out or not.

## And how does it learn?

In the example, **we** chose the weights. The magic of Deep Learning is that the computer **finds them on its own**:

1. It starts with random weights and makes a prediction.
2. It compares its answer with the correct one and calculates **how wrong it was** (the **loss**).
3. It nudges each weight a little in the direction that reduces the error.
4. It repeats this thousands of times. Each full pass through the data is called an **epoch**.

Over time, the error goes down and the neuron learns.

## From one neuron to a network

A single neuron can learn simple rules, like the AND logic gate. If you connect many neurons in **layers**, using the output of some as the input of others, you get a **neural network** that can recognize handwritten digits, images or the feeling behind a sentence. In KAFE, networks are built with the [GESHA](../libraries/gesha.md) library.

!!! example "Keep learning with real examples"
    - [Perceptron: AND gate](../ejemplos/gesha/perceptron-and.md): a neuron that learns on its own.
    - [Multilayer perceptron: XOR](../ejemplos/gesha/mlp-xor.md): why you sometimes need more than one layer.
    - [MNIST digit classifier](../ejemplos/gesha/mnist-dense-classifier.md): a network that reads numbers.

## What did you learn?

- A neuron multiplies each input by its **weight**, adds everything up and applies an **activation**.
- **Training** means adjusting the weights little by little so the error goes down.
- Many neurons connected in layers form a **neural network**.

??? info "For the curious 🤓"
    The neuron computes

    $$
    y = f\!\left(\sum_{i=1}^{n} w_i\,x_i + b\right)
    $$

    where $b$ is the **bias** (in our example, the 1.0 limit plays that role: $b = -1.0$) and $f$ is the **activation function**. We used a step (0 or 1); modern networks use smooth functions like the **sigmoid** $\sigma(z) = \frac{1}{1 + e^{-z}}$ or **ReLU** $\max(0, z)$, because they let us calculate how to change each weight with **gradient descent**:

    $$
    w \leftarrow w - \eta\,\frac{\partial \text{loss}}{\partial w}
    $$

    where $\eta$ is the **learning rate** (how big each little step is).

[Continue with the Tutorial :material-arrow-right:](../getting-started/installation.md){ .md-button .md-button--primary }
