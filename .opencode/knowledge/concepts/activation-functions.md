# Activation Functions

## Category

Deep Learning — neural-network component

## Description

Activation functions introduce **nonlinearity** into neural networks. Without them, any composition of dense layers would still be a linear transformation and could not model complex relationships.

Each activation function $\sigma: \mathbb{R} \rightarrow \mathbb{R}$ (or $\sigma: \mathbb{R}^k \rightarrow \mathbb{R}^k$ for Softmax) transforms the pre-activation $z$ into an output $a = \sigma(z)$. The derivative $\sigma'(z)$ is essential for backpropagation.

KafeGESHA implements six activation functions from scratch:

| Function | Formula | Range | Primary Use |
|---|---|---|---|
| Sigmoid | $\sigma(x) = \frac{1}{1 + e^{-x}}$ | $(0, 1)$ | Probability outputs and binary classification |
| ReLU | $f(x) = \max(0, x)$ | $[0, \infty)$ | Hidden layers (standard choice) |
| Tanh | $\tanh(x) = \frac{e^x - e^{-x}}{e^x + e^{-x}}$ | $(-1, 1)$ | Hidden layers (zero-centered) |
| Softmax | $\text{softmax}(z_i) = \frac{e^{z_i}}{\sum_j e^{z_j}}$ | $(0, 1), \sum = 1$ | Multiclass-classification output |
| Identity | $f(x) = x$ | $(-\infty, \infty)$ | Linear regression |
| Step | $f(x) = \begin{cases} 1 & x \geq 0 \\ 0 & x < 0 \end{cases}$ | $\{0, 1\}$ | Binary perceptron |

## Mathematical Foundation

### Sigmoid

$$\sigma(x) = \frac{1}{1 + e^{-x}}$$

**Derivative** (using the identity $\sigma'(x) = \sigma(x)(1 - \sigma(x))$):

$$\sigma'(x) = \sigma(x) \cdot (1 - \sigma(x))$$

**Properties**:
- Range: $(0, 1)$ — can be interpreted as a probability.
- Monotonically increasing.
- $\sigma(0) = 0.5$
- $\lim_{x \to \infty} \sigma(x) = 1$, $\lim_{x \to -\infty} \sigma(x) = 0$
- **Limitation**: gradients become small for large $|x|$, causing the vanishing-gradient problem.

### ReLU (Rectified Linear Unit)

$$f(x) = \max(0, x) = \begin{cases} x & \text{if } x > 0 \\ 0 & \text{if } x \leq 0 \end{cases}$$

**Derivative**:

$$f'(x) = \begin{cases} 1 & \text{if } x > 0 \\ 0 & \text{if } x \leq 0 \end{cases}$$

**Properties**:
- Range: $[0, \infty)$.
- Does not bound positive gradients, which helps mitigate vanishing gradients.
- **Dead ReLU**: if $x < 0$ on every input, the neuron "dies" (its gradient is zero).
- The derivative at $x = 0$ is undefined; KafeGESHA uses $f'(0) = 0$.

### Tanh (Hyperbolic Tangent)

$$\tanh(x) = \frac{e^x - e^{-x}}{e^x + e^{-x}} = 2\sigma(2x) - 1$$

**Derivative**:

$$\tanh'(x) = 1 - \tanh^2(x)$$

**Properties**:
- Range: $(-1, 1)$ — zero-centered output.
- More stable than Sigmoid for hidden layers.
- Still suffers from vanishing gradients for large $|x|$.

### Softmax

$$\text{softmax}(z_i) = \frac{e^{z_i}}{\sum_{j=1}^{k} e^{z_j}}$$

**Jacobian Matrix**:

$$\frac{\partial \text{softmax}(z_i)}{\partial z_j} = \begin{cases} s_i(1 - s_i) & \text{if } i = j \\ -s_i \cdot s_j & \text{if } i \neq j \end{cases}$$

where $s_i = \text{softmax}(z_i)$.

**Properties**:
- Transforms a vector of logits into probabilities that sum to 1.
- Differentiable everywhere.
- Shift-invariant: $\text{softmax}(z) = \text{softmax}(z + c)$ for any constant $c$ added to every logit.

### Identity

$$f(x) = x, \quad f'(x) = 1$$

Used in regression output layers when predictions must be unrestricted continuous values.

### Step Function

$$f(x) = \begin{cases} 1 & x \geq 0 \\ 0 & x < 0 \end{cases}, \quad f'(x) = 0$$

The classic Rosenblatt perceptron. Its derivative is zero almost everywhere, so it is unsuitable for backpropagation. KafeGESHA includes it for educational purposes.

## Step-by-Step Algorithm

### Forward Pass Calculation (Sigmoid Example)

1. Receive the pre-activation $z$.
2. Calculate $e^{-z}$ using the exponential function.
3. Calculate $\sigma(z) = \frac{1}{1 + e^{-z}}$.
4. Store $\sigma(z)$ for the backward pass.
5. Return $\sigma(z)$.

### Backward Pass Calculation (Derivative)

6. If the output $\sigma(z)$ was stored during the forward pass:
   - Return $\sigma(z) \cdot (1 - \sigma(z))$, reusing the calculated value.
7. Otherwise:
   - Recalculate $\sigma(z)$ and return $\sigma(z) \cdot (1 - \sigma(z))$.

### Softmax Forward Pass

8. Receive vector $\mathbf{z} \in \mathbb{R}^k$.
9. Calculate $e^{z_i}$ for every component.
10. Sum $\sum_{j=1}^{k} e^{z_j}$.
11. Divide: $s_i = \frac{e^{z_i}}{\sum_j e^{z_j}}$.
12. Return vector $\mathbf{s}$.

### Softmax Derivative (Jacobian)

13. Calculate $\mathbf{s} = \text{softmax}(\mathbf{z})$.
14. For each pair $(i, j)$:
    - If $i = j$: $J_{ij} = s_i(1 - s_i)$.
    - If $i \neq j$: $J_{ij} = -s_i \cdot s_j$.
15. Return the Jacobian matrix $J \in \mathbb{R}^{k \times k}$.

## Motivation

Activation functions enable deep neural networks to learn complex representations. Without nonlinearity, a network of $L$ layers is equivalent to a single linear transformation $W_L \cdots W_1 x$. KafeGESHA implements each function from scratch so students can inspect every calculation in each forward and backward pass.

## Advantages

- **Value reuse**: Sigmoid and Tanh both store the forward output so the derivative can be computed without recalculating exponentials.
- **Analytical derivatives**: Every function except Step has a closed-form derivative that is efficient for backpropagation.
- **Softmax handling**: It is applied to the entire vector, not element by element, and is correctly implemented as a special case in Dense.
- **Different output ranges**: Each function produces a range suited to its use case.

## Limitations

- **Dead neurons (ReLU)**: If a ReLU neuron always receives a negative pre-activation, its gradient is zero and it is never updated.
- **Vanishing gradients (Sigmoid, Tanh)**: For inputs with large magnitude, gradients become very small and slow learning in deep layers.
- **Undefined at zero (ReLU)**: The derivative at exactly zero is undefined; KafeGESHA uses zero as a convention.
- **Step is not trainable**: Its derivative is always zero, making it unsuitable for gradient-based learning.

## When to Use

- **Sigmoid**: Output layer for binary classification, interpreted as a probability.
- **ReLU**: Hidden layers; the standard choice because of its simplicity and efficiency.
- **Tanh**: When zero-centered output is needed; an alternative to ReLU in RNNs.
- **Softmax**: Output layer for multiclass classification, producing a probability distribution.
- **Identity**: Output layer for regression.
- **Step**: Educational use only or a binary perceptron without backpropagation.

## When NOT to Use

- **Sigmoid in deep hidden layers**: Vanishing gradients can make training slow or impossible.
- **ReLU without monitoring**: A very high learning rate can cause dead neurons.
- **Softmax in hidden layers**: It is generally used only in the classification output layer.

## Dependencies

- `lib.KafeMATH.functions` — `exp()`, KAFE's exponential function.

## Related Concepts

- `dense-layer.md` — Dense applies activation functions after the linear transformation.
- `loss-functions.md` — Loss functions use activation outputs.
- `optimizers.md` — Optimizers use activation derivatives to calculate gradients.

## Relationship with KAFE

### Implementation in `activations/`

The abstract `ActivationFunction` class defines the interface:

```python
class ActivationFunction(ABC):
    def activate(self, x) -> float     # σ(x)
    def derivative(self, x) -> float   # σ'(x)
```

**Each implementation stores state for an efficient backward pass**:

| Function | Stored State | Benefit |
|---|---|---|
| `SigmoidActivation` | `self.last_output` | Avoids recalculating $e^{-x}$ for the derivative. |
| `ReLU` | `self.last_input` | Distinguishes $x > 0$ from $x \leq 0$ when calculating the derivative. |
| `Tanh` | `self.last_output` | Reuses $\tanh(x)$ to calculate $1 - \tanh^2(x)$. |
| `Softmax` | `self.last_output` | Reuses the probability vector. |
| `IdentityActivation` | — | No state needed (derivative = 1). |
| `StepActivation` | — | No state needed (derivative = 0). |

### Design Decision: Softmax Derivative as a Jacobian

The `Softmax` class returns the **full Jacobian matrix** from `derivative()`, not a vector. Softmax is a vector-valued function: each output depends on every input. The Dense layer uses this Jacobian to propagate gradients correctly.

### Design Decision: ReLU with $f'(0) = 0$

At $x = 0$, ReLU is not differentiable. KafeGESHA uses the convention $f'(0) = 0$ (not $f'(0) = 1$), which is standard in most frameworks.

### Design Decision: Softmax as a Special Case in Dense

The Dense layer detects `self.activation_name == "softmax"` and applies `self.activation.activate(z)` to the full vector instead of element by element, as it does for other activations. Softmax operates on the vector collectively.

## Usage Examples

```kafe
import geshaDeep;

-- ReLU in hidden layers (the standard choice)
GESHA hidden = geshaDeep.create_dense(64, "relu", [10], 0.0);

-- Softmax in the output layer (multiclass classification)
GESHA output = geshaDeep.create_dense(5, "softmax", [], 0.0);

-- Sigmoid for binary classification
GESHA binary = geshaDeep.sigmoid_layer();

-- No activation (linear regression)
GESHA regression = geshaDeep.create_dense(1, "linear", [3], 0.0);
```

## Implementation Location

- `src/lib/KafeGESHA/activations/` — activation classes and their implementations.
- `src/lib/KafeGESHA/activations/ActivationFunctionLoader.py` — factory that loads an activation by name.

## Public API

- Constructor by name: `"sigmoid"`, `"relu"`, `"tanh"`, `"softmax"`, `"identity"`, `"step"`.
- Method: `activate(x)` → function output.
- Method: `derivative(x)` → derivative at the given point.

## References

- Nair, V., & Hinton, G. E. (2010). Rectified linear units improve restricted Boltzmann machines. ICML.
- Goodfellow, I., Bengio, Y., & Courville, A. (2016). Deep Learning, Chapter 6.2: Automatic Differentiation.
- Clevert, D., Unterthiner, T., & Hochreiter, S. (2015). Fast and accurate deep network learning by exponential linear units (ELUs). arXiv:1511.07289.
- Bishop, C. M. (2006). Pattern Recognition and Machine Learning, Chapter 5: Neural Networks. Springer.
