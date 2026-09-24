# Gradient Descent Optimizers

## Category

Deep learning — neural-network component

## Description

Optimizers define **how** model parameters are updated using gradients from backpropagation. The choice of optimizer can affect whether training converges, diverges, or stalls at a suboptimal point.

KafeGESHA implements four optimizers:

| Optimizer | Type | Update rule |
|---|---|---|
| SGD | Basic gradient descent | $\theta \leftarrow \theta - \eta \cdot g$ |
| RMSprop | Adaptive learning rate | $\theta \leftarrow \theta - \eta \cdot \frac{g}{\sqrt{v} + \epsilon}$ |
| Adam | Momentum and adaptive learning rate | $\theta \leftarrow \theta - \eta \cdot \frac{\hat{m}}{\sqrt{\hat{v}} + \epsilon}$ |
| AdamW | Adam with weight decay | $\theta \leftarrow \theta - \eta \cdot \frac{\hat{m}}{\sqrt{\hat{v}} + \epsilon} - \eta \lambda \theta$ |

## Mathematical Foundation

### SGD (Stochastic Gradient Descent)

The simplest optimizer. It updates each parameter in the direction opposite to its gradient:

$$\theta_{t+1} = \theta_t - \eta \cdot g_t$$

Where:
- $\theta_t$ is the parameter at step $t$.
- $\eta$ is the learning rate.
- $g_t = \frac{\partial L}{\partial \theta}$ is the gradient.

**Properties**:
- Simple, efficient, and stateless.
- Sensitive to learning rate: too large can diverge; too small can be slow.
- Can oscillate in directions with high curvature.
- Can stall at local minima or saddle points.

### RMSprop (Root Mean Square Propagation)

Maintains an exponential moving average of squared gradients to adapt the learning rate per parameter:

$$v_t = \rho \cdot v_{t-1} + (1 - \rho) \cdot g_t^2$$

$$\theta_{t+1} = \theta_t - \eta \cdot \frac{g_t}{\sqrt{v_t} + \epsilon}$$

Where:
- $v_t$ is the cache (moving average of $g^2$).
- $\rho$ is the decay factor (typically 0.9).
- $\epsilon$ prevents division by zero (typically $10^{-8}$).

**Intuition**: If a parameter consistently has large gradients, $v_t$ grows and its updates become smaller. If its gradients are small and variable, $v_t$ stays smaller and its updates become larger.

**Properties**:
- Adapts the learning rate per dimension.
- Works well when curvature differs across dimensions.
- Requires the additional hyperparameter $\rho$.

### Adam (Adaptive Moment Estimation)

Combines **momentum** (a moving average of gradients) and **RMSprop** (a moving average of squared gradients).

**First moment** (moving average of gradients):
$$m_t = \beta_1 \cdot m_{t-1} + (1 - \beta_1) \cdot g_t$$

**Second moment** (moving average of $g^2$):
$$v_t = \beta_2 \cdot v_{t-1} + (1 - \beta_2) \cdot g_t^2$$

**Bias correction** (for zero initialization):
$$\hat{m}_t = \frac{m_t}{1 - \beta_1^t}, \quad \hat{v}_t = \frac{v_t}{1 - \beta_2^t}$$

**Update**:
$$\theta_{t+1} = \theta_t - \eta \cdot \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon}$$

**Typical hyperparameters**: $\beta_1 = 0.9$, $\beta_2 = 0.999$, and $\epsilon = 10^{-8}$.

**Properties**:
- Widely used for deep learning.
- Combines momentum with adaptive updates.
- Bias correction compensates for initializing $m_0$ and $v_0$ to zero.
- Relatively robust to the choice of learning rate.

### AdamW (Adam with Weight Decay)

Adam with explicit, decoupled weight decay:

$$\theta_{t+1} = \theta_t - \eta \cdot \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon} - \eta \cdot \lambda \cdot \theta_t$$

Here $\lambda$ is the weight-decay coefficient.

**Difference from L2 regularization**:
- L2 adds $\lambda \cdot \theta$ to the gradient: $g' = g + \lambda \cdot \theta$. Adam's adaptive scaling also affects this term.
- AdamW applies weight decay after the Adam update, without scaling it by $\sqrt{\hat{v}_t}$.

**Properties**:
- Often generalizes better than Adam on some tasks.
- Weight decay acts as implicit regularization.
- Can be more stable during long training runs.

## Step-by-Step Algorithm

### SGD

1. Receive parameters $\theta$ and gradients $g$.
2. For each parameter $i$, compute $\theta_i \leftarrow \theta_i - \eta \cdot g_i$.
3. Return the updated parameter list.

### RMSprop

4. Initialize cache $v = 0$ on the first call.
5. For each parameter $i$:
   - Update the cache: $v_i \leftarrow \rho \cdot v_i + (1 - \rho) \cdot g_i^2$.
   - Compute the update: $\Delta_i = \eta \cdot \frac{g_i}{\sqrt{v_i} + \epsilon}$.
   - Update the parameter: $\theta_i \leftarrow \theta_i - \Delta_i$.
6. Return the updated parameter list.

### Adam

7. On the first call, initialize moments $m = 0$, $v = 0$, and step counter $t = 0$.
8. Increment $t \leftarrow t + 1$.
9. For each parameter $i$:
   - Update first moment: $m_i \leftarrow \beta_1 \cdot m_i + (1 - \beta_1) \cdot g_i$.
   - Update second moment: $v_i \leftarrow \beta_2 \cdot v_i + (1 - \beta_2) \cdot g_i^2$.
   - Correct the bias: $\hat{m}_i = \frac{m_i}{1 - \beta_1^t}$, $\hat{v}_i = \frac{v_i}{1 - \beta_2^t}$.
   - Compute the update: $\Delta_i = \eta \cdot \frac{\hat{m}_i}{\sqrt{\hat{v}_i} + \epsilon}$.
   - Update the parameter: $\theta_i \leftarrow \theta_i - \Delta_i$.
10. Return the updated parameter list.

### AdamW

11. Run the Adam steps to obtain updated parameters $\theta_{adam}$.
12. For each parameter $i$, apply weight decay: $\theta_i \leftarrow \theta_{adam,i} - \eta \cdot \lambda \cdot \theta_{adam,i}$.
13. Return the updated parameter list.

## Motivation

Deep networks can be difficult to train with basic gradient descent alone. SGD can oscillate or converge slowly. RMSprop and Adam adapt updates by parameter, and AdamW applies decoupled weight decay. KafeGESHA implements each optimizer directly so learners can inspect its internal state and bias correction.

## Advantages

- **Educational progression**: The four optimizers show a progression from SGD to RMSprop, Adam, and AdamW.
- **Explicit internal state**: Each stateful optimizer stores values such as $m$, $v$, or the RMSprop cache as attributes.
- **Adam bias correction**: Correctly compensates for zero initialization during early steps.
- **Decoupled weight decay**: AdamW applies weight decay separately from the adaptive gradient update.

## Limitations

- **SGD without momentum**: Can oscillate in high-curvature directions and converge slowly.
- **Hyperparameters**: RMSprop, Adam, and AdamW require choices for decay parameters, $\epsilon$, and the learning rate.
- **Memory**: Adam and AdamW store two moments per parameter, using roughly twice the optimizer state of SGD.
- **Generalization trade-offs**: On some problems, SGD with momentum may generalize better than Adam.

## When to Use

- **SGD**: Simple problems, quick prototyping, or studying the effect of learning rate.
- **RMSprop**: RNNs or problems where gradient magnitudes differ substantially by dimension.
- **Adam**: A general starting point for many deep-learning problems.
- **AdamW**: When decoupled weight decay is desired, such as with large models or limited data.

## When NOT to Use

- **SGD for deep networks**: Without momentum, training may be prohibitively slow.
- **Adam for simple convex problems**: It may be unnecessary; SGD with learning-rate decay may suffice.
- **AdamW without weight decay**: With $\lambda = 0$, it is equivalent to Adam.

## Dependencies

- `lib.KafeMATH.functions` — `pow_()` and `sqrt()`.

## Related Concepts

- `dense-layer.md` — Dense layers apply parameter updates during backpropagation.
- `loss-functions.md` — Loss functions generate the gradients used by training.
- `activation-functions.md` — Activation derivatives contribute to gradients.

## Relationship with KAFE

### Implementation

The abstract `Optimizer` interface defines `step(params, grads)` and returns a parameter list.

| Optimizer | State | Description |
|---|---|---|
| `SGD` | — | No stored state |
| `RMSprop` | `self.cache` | Per-parameter moving average of $g^2$ |
| `Adam` | `self.m`, `self.v`, `self.t` | First moment, second moment, and step counter |
| `AdamW` | Inherits Adam state and adds `self.weight_decay` | Weight-decay coefficient $\lambda$ |

### Design: `step()` returns new parameters

The optimizer implementations return a new parameter list instead of mutating the input list. This makes before-and-after values inspectable.

### Training integration status

`Sequential` and `Functional` currently read the compiled optimizer's learning rate and pass it to layer backpropagation. `Dense.backward()` updates its own weights with that learning rate; the model training path does not call the optimizer's `step()` method. Thus, selecting an optimizer name configures the accepted learning-rate value, but the implemented training update is inline SGD. The standalone `step()` implementations can be called directly, but their RMSprop, Adam, and AdamW stateful update rules are not currently applied by model training.

### Optimizer name resolution

The model accepts these names in `compile()`:

```text
"sgd"     -> SGD(lr=0.01)
"rmsprop" -> RMSprop(lr=0.001)
"adam"    -> Adam(lr=0.001)
"adamw"   -> AdamW(lr=0.001)
```

The learning rate can be changed later with `geshaDeep.set_lr(model, new_lr)`.

## Usage Examples

```kafe
import geshaDeep;

GESHA layer = geshaDeep.create_dense(3, "softmax", [4], 0.0);
GESHA model = geshaDeep.sequential([layer]);

-- Compile with an accepted optimizer name and loss
geshaDeep.compile(model, "sgd", "categorical_crossentropy", []);

-- Update the compiled learning rate
geshaDeep.set_lr(model, 0.0001);
```

## Implementation Location

- `src/lib/KafeGESHA/optimizers/optimizer.py` — `Optimizer` interface.
- `src/lib/KafeGESHA/optimizers/sgd.py` — `SGD` and `RMSprop`.
- `src/lib/KafeGESHA/optimizers/adam.py` — `Adam` and `AdamW`.
- `src/lib/KafeGESHA/core/model.py` — resolves optimizer names during `compile()`.
- `src/lib/KafeGESHA/models/sequential.py` and `models/functional.py` — model training passes the configured learning rate to layers.

## Public API

- Optimizer names accepted by `compile()`: `"sgd"`, `"rmsprop"`, `"adam"`, and `"adamw"`.
- Optimizer method: `step(params, grads)` returns an updated parameter list.
- Interpreter helper: `geshaDeep.set_lr(model, new_lr)` updates the configured learning rate.

## References

- Robbins, H., & Monro, S. (1951). A stochastic approximation method. *The Annals of Mathematical Statistics*, 22(3), 400-407.
- Hinton, G. (2012). Lecture 6a: Overview of mini-batch gradient descent. Coursera/Neural Networks.
- Kingma, D. P., & Ba, J. (2014). Adam: A method for stochastic optimization. arXiv:1412.6980.
- Loshchilov, I., & Hutter, F. (2017). Decoupled weight decay regularization. arXiv:1711.05101.
- Ruder, S. (2016). An overview of gradient descent optimization algorithms. arXiv:1609.04747.
