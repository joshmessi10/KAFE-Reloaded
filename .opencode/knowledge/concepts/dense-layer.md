# Dense Layer (Fully Connected Layer)

## Category

Deep learning — neural-network component

## Description

A Dense layer (also called a fully connected layer) is a fundamental building block of artificial neural networks. Every neuron receives all inputs and produces an output by applying a linear transformation followed by a nonlinear activation function.

For unit $j$, the layer computes a weighted sum of all inputs $x_i$, adds a bias $b_j$, and applies an activation function $\sigma$:

$$z_j = \sum_{i=1}^{n} w_{ij} \cdot x_i + b_j$$

$$a_j = \sigma(z_j)$$

Where:
- $w_{ij}$ is the weight connecting input $i$ to unit $j$.
- $b_j$ is the bias of unit $j$.
- $\sigma$ is the activation function.
- $z_j$ is the pre-activation value (the linear input).
- $a_j$ is the activated output.

**Dimensions**: For a layer with $n$ inputs and $m$ units:
- Weights: matrix $W \in \mathbb{R}^{n \times m}$.
- Biases: vector $b \in \mathbb{R}^{m}$.
- Output: vector $a \in \mathbb{R}^{m}$.

**Complexity**:
- Forward pass: $O(n \cdot m)$ multiplications.
- Backward pass: $O(n \cdot m)$ for gradients and $O(n \cdot m)$ for updates.
- Space: $O(n \cdot m)$ for weights and $O(m)$ for biases.

## Mathematical Foundation

### Forward Pass

For input $x \in \mathbb{R}^n$, weights $W \in \mathbb{R}^{n \times m}$, and bias $b \in \mathbb{R}^m$:

$$z = W^T x + b \in \mathbb{R}^m$$

$$a = \sigma(z) \in \mathbb{R}^m$$

### Backward Pass

Given the loss gradient with respect to the output $\frac{\partial L}{\partial a}$, compute:

1. **Pre-activation gradient**:
$$\frac{\partial L}{\partial z_j} = \frac{\partial L}{\partial a_j} \cdot \sigma'(z_j)$$

2. **Weight gradient**:
$$\frac{\partial L}{\partial w_{ij}} = x_i \cdot \frac{\partial L}{\partial z_j}$$

3. **Bias gradient**:
$$\frac{\partial L}{\partial b_j} = \frac{\partial L}{\partial z_j}$$

4. **Gradient for the previous layer**:
$$\frac{\partial L}{\partial x_i} = \sum_{j=1}^{m} w_{ij} \cdot \frac{\partial L}{\partial z_j}$$

### Weight Update

Using learning rate $\eta$:

$$w_{ij} \leftarrow w_{ij} - \eta \cdot \frac{\partial L}{\partial w_{ij}}$$

$$b_j \leftarrow b_j - \eta \cdot \frac{\partial L}{\partial b_j}$$

### L2 Regularization (Weight Decay)

The regularization term adds a penalty to the weight gradient:

$$\frac{\partial L}{\partial w_{ij}} = \frac{\partial L}{\partial w_{ij}} + \lambda \cdot w_{ij}$$

Here, $\lambda$ is the regularization hyperparameter.

## Step-by-Step Algorithm

### Initialization

1. Choose the number of units $m$ and input dimension $n$.
2. Initialize weights $W$ with random values in $[-0.5, 0.5]$ (an optional seed makes initialization reproducible).
3. Initialize biases $b$ to zero.

### Forward Pass

4. Receive input vector $x$.
5. If weights are not initialized, call `build(len(x))`.
6. For each unit $j = 1, \ldots, m$, compute $z_j = \sum_{i=1}^{n} x_i \cdot w_{ij} + b_j$.
7. Apply activation function $\sigma$ to each $z_j$.
8. For Softmax, apply the activation to the complete vector $\mathbf{z}$.
9. Return output vector $a$.

### Backward Pass

10. Receive output gradient $\frac{\partial L}{\partial a}$.
11. Compute the pre-activation gradient. For Softmax, the layer uses the supplied gradient directly; for other activations, compute $\frac{\partial L}{\partial z_j} = \frac{\partial L}{\partial a_j} \cdot \sigma'(z_j)$.
12. Compute weight gradients: $\frac{\partial L}{\partial w_{ij}} = x_i \cdot \frac{\partial L}{\partial z_j}$.
13. Compute bias gradients: $\frac{\partial L}{\partial b_j} = \frac{\partial L}{\partial z_j}$.
14. If L2 regularization is enabled, add $\lambda \cdot w_{ij}$ to the weight gradients.
15. Update weights: $w_{ij} \leftarrow w_{ij} - \eta \cdot \frac{\partial L}{\partial w_{ij}}$.
16. Update biases: $b_j \leftarrow b_j - \eta \cdot \frac{\partial L}{\partial b_j}$.
17. Compute and return the gradient for the previous layer: $\frac{\partial L}{\partial x_i} = \sum_{j=1}^{m} w_{ij} \cdot \frac{\partial L}{\partial z_j}$.

## Motivation

Dense layers are essential building blocks in deep neural networks. KafeGESHA implements them directly so students can inspect matrix multiplications, gradient calculations, and weight updates without abstractions hiding the learning mechanics.

## Advantages

- **Universal approximation**: A network with at least one hidden Dense layer and enough units can approximate any continuous function (Cybenko's universal approximation theorem).
- **Conceptual simplicity**: The operation is a linear combination followed by a nonlinear activation, which is easy to understand and differentiate.
- **Composability**: Stacking layers creates deep networks with greater representational capacity.
- **Flexibility**: Supports different activation functions and input/output dimensions.

## Limitations

- **Quadratic parameter growth**: A layer with $n$ inputs and $m$ outputs has $n \cdot m + m$ parameters. Very wide layers create large models.
- **No spatial inductive bias**: Unlike convolutional layers, Dense layers do not exploit the spatial structure of images or sequences.
- **Initialization sensitivity**: Poor initialization can cause vanishing or exploding gradients.
- **Overfitting without regularization**: With many parameters, a layer can memorize rather than generalize.

## When to Use

- Classification and regression with tabular data.
- Output layers of convolutional networks used for classification.
- Small neural networks for education and prototyping.
- When inspecting individual weights is useful.

## When NOT to Use

- Spatial data such as images, where convolutional layers are usually preferable.
- Long sequences, where RNNs, LSTMs, or Transformers may be preferable.
- Extremely large inputs, where the number of parameters may be prohibitive.

## Dependencies

- `lib.KafeGESHA.layers.layer` — base class for neural-network layers.
- `lib.KafeGESHA.activations.ActivationFunctionLoader` — loads activation functions.
- `lib.KafeGESHA.layers.utils` — regularization utilities.

## Related Concepts

- `activation-functions.md` — Activation functions applied after a linear transformation.
- `loss-functions.md` — Loss functions that generate gradients for backpropagation.
- `optimizers.md` — Optimizers that control parameter updates.
- `soft-kmeans-clustering.md` — Clustering approach that uses Dense layers internally.

## Relationship with KAFE

### Implementation in `layers/dense.py`

The `Dense` class extends `Layer` and stores:

| Component | Attribute | Description |
|---|---|---|
| Weights | `self.weights` | $n \times m$ matrix initialized uniformly in $[-0.5, 0.5]$ |
| Biases | `self.bias` | Zero-initialized vector |
| Activation | `self.activation` | Object loaded through `ActivationFunctionLoader` |
| Forward-pass state | `self.last_input`, `self.last_z` | Input and pre-activation values used by `backward` |
| Regularization | `self.regularization_lambda` | L2 coefficient validated by `check_regularization()` |
| Seed | `self._rng` | Random-number generator; an optional seed makes initialization reproducible |

### Design: Uniform initialization in $[-0.5, 0.5]$

Weights are initialized with `(rng.random() - 0.5)`, producing values in $[-0.5, 0.5]$. This is a simplified approach; practical initializers such as Xavier/Glorot or He scale values by the number of inputs and outputs. Uniform initialization is easier to explain in an educational implementation.

### Design: Softmax is a special case

When the selected activation is `"softmax"`, the layer applies it to the full vector of pre-activation values rather than element by element. Softmax depends on all elements in the vector.

### Design: Inline SGD update

`Dense.backward()` accepts a `learning_rate` value and updates its own weights and biases. It does not receive an optimizer object.

## Usage Examples

```kafe
import geshaDeep;

GESHA hidden = geshaDeep.create_dense(32, "relu", [4], 0.0);
GESHA output = geshaDeep.create_dense(3, "softmax", [], 0.0);
GESHA model = geshaDeep.sequential([hidden, output]);
geshaDeep.compile(model, "adam", "categorical_crossentropy", []);
model.fit(x_train, y_train, 100, 32);
```

## Implementation Location

- `src/lib/KafeGESHA/layers/dense.py` — `Dense(Layer)`.
- `src/lib/KafeGESHA/activations/ActivationFunctionLoader.py` — activation loading.
- `src/lib/KafeGESHA/layers/utils.py` — `check_regularization()`.

## Public API

- Constructor: `Dense(units, activation=None, input_shape=None, regularization_lambda=0.0, seed=None)`.
- Interpreter factory: `geshaDeep.create_dense(units, activation, input_shape, regularization_lambda, seed=None)`.
- Layer methods: `build(input_dim)`, `forward(x)`, `backward(output_error, learning_rate, regularization_lambda=None)`, `parameters()`, `summary()`.
- `Dense` extends `Layer`.

## References

- Rumelhart, D. E., Hinton, G. E., & Williams, R. J. (1986). Learning representations by back-propagating errors. *Nature*, 323(6088), 533-536.
- Goodfellow, I., Bengio, Y., & Courville, A. (2016). *Deep Learning*, Chapter 6: Deep Feedforward Networks. MIT Press.
- Cybenko, G. (1989). Approximation by superpositions of a sigmoidal function. *Mathematics of Control, Signals and Systems*, 2(4), 303-314.
