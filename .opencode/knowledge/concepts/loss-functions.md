# Loss Functions

## Category

Deep learning — neural-network component

## Description

Loss functions quantify how far model predictions $\hat{y}$ are from the true values $y$. Training aims to **minimize** the selected loss.

KafeGESHA implements five loss functions:

| Function | Formula | Main use |
|---|---|---|
| MSE | $\frac{1}{n}\sum(y_i - \hat{y}_i)^2$ | Regression |
| MAE | $\frac{1}{n}\sum|y_i - \hat{y}_i|$ | Regression (robust) |
| Binary Cross-Entropy | $-\frac{1}{n}\sum[y_i\log(\hat{y}_i) + (1-y_i)\log(1-\hat{y}_i)]$ | Binary classification |
| Categorical Cross-Entropy | $-\frac{1}{n}\sum\sum y_{ij}\log(\hat{y}_{ij})$ | Multiclass classification |
| Sparse Categorical Cross-Entropy | $-\frac{1}{n}\sum\log(\hat{y}_{y_i})$ | Multiclass classification with integer labels |

Each loss implements two methods:
- `compute(y_true, y_pred)` returns a scalar loss value.
- `derivative(y_true, y_pred)` returns the gradient $\frac{\partial L}{\partial \hat{y}}$.

## Mathematical Foundation

### Mean Squared Error (MSE)

$$L_{\text{MSE}} = \frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2$$

**Derivative**:

$$\frac{\partial L}{\partial \hat{y}_i} = \frac{2(\hat{y}_i - y_i)}{n}$$

**Properties**:
- Penalizes large errors quadratically and is sensitive to outliers.
- Its derivative is linear, so gradients are proportional to the error.
- The minimum occurs at $\hat{y} = y$.
- It corresponds to assuming normally distributed errors.

### Mean Absolute Error (MAE)

$$L_{\text{MAE}} = \frac{1}{n} \sum_{i=1}^{n} |y_i - \hat{y}_i|$$

**Derivative**:

$$\frac{\partial L}{\partial \hat{y}_i} = \frac{1}{n} \cdot \frac{\hat{y}_i - y_i}{|\hat{y}_i - y_i|} = \begin{cases} \frac{1}{n} & \text{if } \hat{y}_i > y_i \\ -\frac{1}{n} & \text{if } \hat{y}_i < y_i \\ 0 & \text{if } \hat{y}_i = y_i \end{cases}$$

**Properties**:
- Robust to outliers because its penalty grows linearly.
- The derivative is the sign of the error, so it does not distinguish between large and small errors.
- It corresponds to assuming Laplace-distributed errors.

### Binary Cross-Entropy (BCE)

$$L_{\text{BCE}} = -\frac{1}{n} \sum_{i=1}^{n} \left[ y_i \log(\hat{y}_i) + (1 - y_i) \log(1 - \hat{y}_i) \right]$$

**Derivative**:

$$\frac{\partial L}{\partial \hat{y}_i} = \frac{\hat{y}_i - y_i}{\hat{y}_i(1 - \hat{y}_i) + \epsilon}$$

**Properties**:
- Assumes predicted probabilities $\hat{y}_i \in (0, 1)$.
- Strongly penalizes confident, incorrect predictions.
- Epsilon-based clipping helps keep the derivative numerically stable.
- Corresponds to maximum likelihood for a Bernoulli distribution.

### Categorical Cross-Entropy (CCE)

$$L_{\text{CCE}} = -\frac{1}{n} \sum_{i=1}^{n} \sum_{j=1}^{k} y_{ij} \log(\hat{y}_{ij})$$

**Derivative**:

$$\frac{\partial L}{\partial \hat{y}_{ij}} = \hat{y}_{ij} - y_{ij}$$

**Properties**:
- $y$ is one-hot encoded (exactly one $y_{ij} = 1$ for each sample).
- In the Softmax combination, the derivative simplifies to $\hat{y} - y$.
- Epsilon helps maintain numerical stability.

### Sparse Categorical Cross-Entropy

$$L_{\text{SCCE}} = -\frac{1}{n} \sum_{i=1}^{n} \log(\hat{y}_{y_i})$$

**Derivative**:

$$\frac{\partial L}{\partial \hat{y}_{ij}} = \begin{cases} \hat{y}_{ij} - 1 & \text{if } j = y_i \\ \hat{y}_{ij} & \text{if } j \neq y_i \end{cases}$$

**Properties**:
- Like CCE, but accepts integer labels instead of one-hot vectors.
- Uses less memory when there are many classes.
- Its derivative matches CCE when combined with Softmax.

## Step-by-Step Algorithm

### MSE — Forward

1. Receive vectors $y_{\text{true}}$ and $y_{\text{pred}}$, each of length $n$.
2. For each pair $(y_i, \hat{y}_i)$, compute squared error: $(y_i - \hat{y}_i)^2$.
3. Average: $L = \frac{1}{n} \sum (y_i - \hat{y}_i)^2$.

### MSE — Backward

4. For each pair, compute the gradient: $\frac{2(\hat{y}_i - y_i)}{n}$.
5. Return the gradient vector.

### Binary Cross-Entropy — Forward

6. Receive $y_{\text{true}}$ and $y_{\text{pred}}$.
7. For each pair:
   - Clip $\hat{y}_i$ to $(\epsilon, 1 - \epsilon)$.
   - Compute $-(y_i \log(\hat{y}_i) + (1 - y_i) \log(1 - \hat{y}_i))$.
8. Average over $n$ samples.

### Binary Cross-Entropy — Backward

9. For each pair, clip $\hat{y}_i$ and compute $\frac{\hat{y}_i - y_i}{\hat{y}_i(1 - \hat{y}_i) + \epsilon}$.
10. Return the gradient vector.

### Categorical Cross-Entropy — Forward

11. Receive one-hot matrices $Y_{\text{true}}$ and $Y_{\text{pred}}$.
12. For each sample $i$, compute $-\sum_j y_{ij} \log(\hat{y}_{ij} + \epsilon)$.
13. Average over $n$ samples.

### Categorical Cross-Entropy — Backward

14. For each sample $i$ and class $j$, compute $\hat{y}_{ij} - y_{ij}$.
15. Return the gradient matrix.

## Motivation

The loss function determines how well a model learns a particular task. MSE is useful for regression but usually unsuitable for classification because its quadratic penalty does not align with accuracy. Cross-entropy is standard for classification because its gradients are informative and stable. KafeGESHA implements each loss directly to show why different tasks use different loss functions.

## Advantages

- **Numerical clipping**: BCE and CCE use epsilon to avoid $\log(0)$ and help stabilize training.
- **Simplified derivatives**: CCE combined with Softmax yields the derivative $\hat{y} - y$.
- **Sparse-label support**: SparseCCE accepts integer labels instead of one-hot vectors, saving memory.
- **Educational comparison**: MSE and MAE can be compared side by side, including their behavior on outliers.

## Limitations

- **MSE is sensitive to outliers**: One point with a large error can dominate the loss.
- **MAE is not differentiable at zero**: $|x|$ has no derivative at $x=0$; KafeGESHA uses zero by convention.
- **BCE requires probabilities**: Predictions outside $(0,1)$ must be clipped.
- **No built-in regularization**: KafeGESHA loss functions do not include L1/L2 regularization terms; the Dense layer handles its own L2 regularization.

## When to Use

- **MSE**: Regression when large errors are substantially worse than small ones.
- **MAE**: Regression with outliers when robustness is needed.
- **BCE**: Binary classification with a sigmoid probability output.
- **CCE**: Multiclass classification with a Softmax output and one-hot labels.
- **SparseCCE**: Multiclass classification with integer labels to save memory.

## When NOT to Use

- **MSE for classification**: Its gradients can be inefficient for probabilities and may saturate far from the optimum.
- **BCE for regression**: BCE assumes a Bernoulli distribution and is not suitable for continuous targets.
- **CCE without Softmax**: The derivative $\hat{y} - y$ applies to the combined CCE and Softmax setup.

## Dependencies

- `lib.KafeMATH.functions` — `log()` (natural logarithm) and `math_abs()` (absolute value).

## Related Concepts

- `activation-functions.md` — Activations produce outputs evaluated by loss functions.
- `dense-layer.md` — Dense layers propagate loss gradients during backpropagation.
- `optimizers.md` — Optimizers use gradients to update parameters.

## Relationship with KAFE

### Implementation

`LossFunction` defines the interface:

```python
class LossFunction(ABC):
    def compute(self, y_true, y_pred) -> float   # Average loss
    def derivative(self, y_true, y_pred) -> list  # Gradient ∂L/∂ŷ
```

### Design: BCE clipping

`BinaryCrossEntropy` uses a default epsilon of $10^{-8}$ and clips predictions to $(\epsilon, 1-\epsilon)$. This prevents $\log(0)$, which would produce $-\infty$. CCE and SparseCCE also add epsilon to predicted probabilities.

### Design: Simplified CCE derivative

Categorical Cross-Entropy returns $\hat{y}_{ij} - y_{ij}$. This derivative is intended for use with Softmax; the Dense layer treats Softmax as a special case and passes the gradient through directly.

### Design: SparseCCE accepts integer labels

`SparseCategoricalCrossEntropy` accepts `y_true` as a vector of integers (for example, `[0, 2, 1, 3]`) instead of one-hot vectors. It indexes $\hat{y}_{y_i}$ using each label, reducing memory use when there are many classes.

### Design: MSE and MAE for regression

MSE and MAE are the standard regression losses in KafeGESHA. Huber Loss, which combines MSE and MAE, is not included in the current implementation.

## Usage Examples

```kafe
import geshaDeep;

-- Regression with MSE
GESHA reg_layer = geshaDeep.create_dense(16, "relu", [3], 0.0);
GESHA reg_output = geshaDeep.create_dense(1, "linear", [], 0.0);
GESHA reg = geshaDeep.sequential([reg_layer, reg_output]);
geshaDeep.compile(reg, "sgd", "mse", []);
reg.fit(x_train, y_train, 50, 1);

-- Binary classification with Binary Cross-Entropy
GESHA bin_hidden = geshaDeep.create_dense(8, "relu", [4], 0.0);
GESHA bin_output = geshaDeep.create_dense(1, "sigmoid", [], 0.0);
GESHA bin_model = geshaDeep.sequential([bin_hidden, bin_output]);
geshaDeep.compile(bin_model, "adam", "binary_crossentropy", []);

-- Multiclass classification with Categorical Cross-Entropy
GESHA multi_hidden = geshaDeep.create_dense(32, "relu", [784], 0.0);
GESHA multi_output = geshaDeep.create_dense(10, "softmax", [], 0.0);
GESHA multi = geshaDeep.sequential([multi_hidden, multi_output]);
geshaDeep.compile(multi, "adam", "categorical_crossentropy", []);
```

## Implementation Location

- `src/lib/KafeGESHA/losses/loss.py` — abstract `LossFunction`.
- `src/lib/KafeGESHA/losses/mse.py` — `MeanSquaredError` and `MeanAbsoluteError`.
- `src/lib/KafeGESHA/losses/binary_crossentropy.py` — `BinaryCrossEntropy`.
- `src/lib/KafeGESHA/losses/categorical_crossentropy.py` — `CategoricalCrossEntropy` and `SparseCategoricalCrossEntropy`.
- `src/lib/KafeGESHA/core/model.py` — resolves loss names during `compile()`.

## Public API

- Loss names in `compile()`: `"mse"`, `"mae"`, `"binary_crossentropy"`, `"categorical_crossentropy"`, and `"sparse_categorical_crossentropy"`.
- `compute(y_true, y_pred)` returns a scalar average loss.
- `derivative(y_true, y_pred)` returns gradients.

## References

- Goodfellow, I., Bengio, Y., & Courville, A. (2016). *Deep Learning*, Chapter 5.5: Output Units. MIT Press.
- Bishop, C. M. (2006). *Pattern Recognition and Machine Learning*, Chapter 4.3: Bayesian Linear Regression.
- De Boer, P. T., et al. (2005). A tutorial on the cross-entropy method. *Annals of Operations Research*, 134(1), 19-67.
- Rubinstein, R. (1999). The cross-entropy method for combinatorial and continuous optimization. *Methodology and Computing in Applied Probability*, 1(2), 127-190.
