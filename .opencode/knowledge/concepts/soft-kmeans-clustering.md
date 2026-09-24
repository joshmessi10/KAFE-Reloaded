# Soft K-Means Neural Clustering

## Category

Deep learning — clustering

## Description

Soft K-Means Neural Clustering reformulates clustering as an unsupervised neural-network task. Instead of assigning each point to exactly one cluster, the network produces a **soft assignment**: a probability for each cluster.

The approach works as follows:
1. A neural network with a Softmax output produces assignment vectors $z \in \mathbb{R}^k$, where $z_c$ represents the probability that a point belongs to cluster $c$.
2. Cluster centers are computed as **weighted means** using the soft assignments.
3. Distance-based targets give greater weight to clusters whose centers are closer to the point.
4. The network is trained to minimize the mean squared error between its soft assignments and the distance-based targets.

Unlike classic K-Means, this approach uses a neural network to learn representations and produces soft rather than discrete assignments.

## Mathematical Foundation

### Classic Hard K-Means

In classic K-Means, each point $x_i$ is assigned to one cluster:

$$c_i = \arg\min_{k} \|x_i - \mu_k\|^2$$

Centers are updated as:

$$\mu_k = \frac{1}{|C_k|} \sum_{x_i \in C_k} x_i$$

### Soft Clustering (Fuzzy C-Means)

In fuzzy clustering, each point has a membership degree $u_{ik} \in [0, 1]$ for each cluster $k$:

$$\sum_{k=1}^{K} u_{ik} = 1 \quad \forall i$$

The objective is:

$$J = \sum_{i=1}^{n} \sum_{k=1}^{K} u_{ik}^m \|x_i - \mu_k\|^2$$

Where $m > 1$ is the fuzziness parameter.

### Soft K-Means Neural

KafeGESHA implements a neural variant.

**Forward pass** (neural network):

$$z = \text{softmax}(\text{net}(x)) \in \mathbb{R}^k$$

**Center calculation** (soft weighted mean):

$$\mu_k = \frac{\sum_{i=1}^{n} z_{ik} \cdot x_i}{\sum_{i=1}^{n} z_{ik}}$$

**Per-point target** (inverse distance):

$$t_{ik} = \frac{1 / (\|x_i - \mu_k\|^2 + \epsilon)}{\sum_{j=1}^{k} 1 / (\|x_i - \mu_j\|^2 + \epsilon)}$$

Where:
- $t_{ik}$ is the soft target for point $i$ and cluster $k$.
- Points closer to center $\mu_k$ receive a larger $t_{ik}$.
- $\epsilon = 10^{-6}$ prevents division by zero.

**Loss** (MSE between assignments and targets):

$$L = \frac{1}{n} \sum_{i=1}^{n} \sum_{k=1}^{K} (z_{ik} - t_{ik})^2$$

**Pre-activation gradient** through Softmax:

$$\frac{\partial L}{\partial \text{logit}_{ik}} = z_{ik} \left( \frac{\partial L}{\partial z_{ik}} - \sum_{j=1}^{K} z_{ij} \cdot \frac{\partial L}{\partial z_{ij}} \right)$$

Given $\frac{\partial L}{\partial z}$, this computes $\frac{\partial L}{\partial \text{logit}}$ using the Softmax Jacobian.

## Step-by-Step Algorithm

### Training (one epoch)

1. Run a forward pass for each point $x_i$ through all network layers to obtain $z_i = \text{softmax}(\text{net}(x_i))$.
2. **Compute centers as weighted means**:
   - Initialize centers $\mu_k = [0, \ldots, 0]$ and weights $w_k = 0$ for each cluster $k$.
   - For each point $(z_i, x_i)$ and cluster $c$, accumulate $w_c \mathrel{+}= z_{ic}$ and $\mu_{c,f} \mathrel{+}= z_{ic} \cdot x_{i,f}$ for every feature $f$.
   - For each cluster $c$ with $w_c > \epsilon$, divide $\mu_c \leftarrow \mu_c / w_c$.
3. **Compute soft targets** for every point:
   - Compute squared distances $d_{ic} = \sum_f (x_{i,f} - \mu_{c,f})^2$.
   - Compute raw scores $r_{ic} = 1 / (d_{ic} + \epsilon)$.
   - Normalize $t_{ic} = r_{ic} / (\sum_j r_{ij} + \epsilon)$.
4. **Compute loss and gradients** for each point $x_i$ with assignment $z_i$ and target $t_i$:
   - Compute sample loss $\ell_i = \sum_k (z_{ik} - t_{ik})^2$.
   - Compute output gradient $\frac{\partial \ell_i}{\partial z_{ik}} = 2(z_{ik} - t_{ik}) / k$.
   - Propagate through Softmax using $\frac{\partial \ell_i}{\partial \text{logit}_{ik}} = z_{ik}(g_k - \sum_j z_{ij}g_j)$, where $g_k = \frac{\partial \ell_i}{\partial z_{ik}}$.
   - Run the backward pass with this gradient.
5. Print the average epoch loss.

### Evaluation

The current `Model.evaluate(x_test, y_test)` method evaluates a supervised loss and requires labels. There is no separate unsupervised clustering evaluation method in the current implementation. For an unlabeled dataset, use `predict()` to inspect soft assignments or compute a clustering metric externally.

## Motivation

The neural approach uses learned representations and allows a point to have partial membership in multiple clusters, which can be useful when clusters overlap. KafeGESHA implements this algorithm directly to demonstrate an unsupervised neural-network training path.

## Advantages

- **Learned representations**: A neural network can learn a nonlinear representation of cluster assignments.
- **Soft assignments**: Points can partially belong to multiple clusters, representing ambiguity.
- **Differentiable training path**: The implementation propagates gradients through the Softmax output.
- **Existing layer integration**: Reuses KafeGESHA Dense and Softmax components.

## Limitations

- **Initialization sensitivity**: Initial network parameters can affect the result; convergence is not guaranteed.
- **Fixed cluster count**: The user must choose $k$ in advance, as with classic K-Means.
- **More expensive than classic K-Means**: Each epoch performs neural-network forward and backward passes.
- **No automatic selection of $k$**: Metrics such as silhouette score or the elbow method are not built into this algorithm.
- **One center calculation per epoch**: Centers are recalculated per epoch rather than iteratively by the classic K-Means update loop.

## When to Use

- When soft membership probabilities are useful.
- When clusters overlap substantially.
- When cluster assignments should use representations learned by a neural network.

## When NOT to Use

- For well-separated, compact clusters where classic K-Means is faster and simpler.
- For very large datasets where full neural-network passes are too costly.
- When the number of clusters is unknown and has not yet been selected.
- For high-dimensional data without prior dimensionality reduction, where distance measures may become less informative.

## Dependencies

- `lib.KafeGESHA.layers.dense` — Dense layers used by the neural network.
- `lib.KafeGESHA.activations` — Softmax produces soft assignments.
- `lib.KafeGESHA.core.model` — implements unsupervised training and the Soft K-Means loss/gradient.

## Related Concepts

- `dense-layer.md` — the neural network uses Dense layers.
- `activation-functions.md` — Softmax produces soft assignments.
- `loss-functions.md` — MSE is used for the clustering loss.
- `optimizers.md` — describes optimizer objects accepted by model compilation and the current training integration status.

## Relationship with KAFE

### Implementation in `core/model.py`

Unsupervised mode is selected by calling `fit(x_train)` without labels. The model computes soft weighted centroids and distance-based targets during training.

```kafe
import geshaDeep;

GESHA hidden = geshaDeep.create_dense(8, "relu", [4], 0.0);
GESHA assignments = geshaDeep.create_dense(3, "softmax", [], 0.0);
GESHA model = geshaDeep.sequential([hidden, assignments]);
geshaDeep.compile(model, "sgd", "mse", []);
model.fit(x_train, [], 10, 1);
```

### Training pipeline

1. **Forward pass**: Process the training points to produce $z_i = \text{softmax}(\text{net}(x_i))$.
2. **Compute centers**: Calculate weighted means using $z_{ik}$.
3. **Compute soft targets**: Normalize inverse squared distances.
4. **Compute MSE**: $L = \frac{1}{n}\sum_i \sum_k (z_{ik} - t_{ik})^2$.
5. **Backpropagate through Softmax**: Apply the Jacobian-vector product to obtain logit gradients.
6. **Update layer weights**: The current model training path passes the configured learning rate to layer backpropagation, which updates the layer weights inline.

### Design: MSE clustering loss

KafeGESHA uses MSE between soft assignments and distance-based targets instead of the classic fuzzy C-Means objective. This provides a simple differentiable teaching example. It should not be interpreted as equivalent to the fuzzy C-Means objective.

### Design: Manual Softmax gradient

The gradient through Softmax is calculated in `core/model.py` using:

```python
weighted_sum = sum(grad_z[c] * z[c] for c in range(k))
grad_logit = [z[c] * (grad_z[c] - weighted_sum) for c in range(k)]
```

### Training integration note

Although `compile()` accepts optimizer names, the model's current training path uses the optimizer's learning rate and applies updates through the layer `backward()` methods. It does not call the optimizer's `step()` method; see `optimizers.md` for details.

## Usage Examples

```kafe
import geshaDeep;

-- Unsupervised clustering with three clusters
GESHA hidden = geshaDeep.create_dense(8, "relu", [4], 0.0);
GESHA assignments = geshaDeep.create_dense(3, "softmax", [], 0.0);
GESHA clustering = geshaDeep.sequential([hidden, assignments]);
geshaDeep.compile(clustering, "sgd", "mse", []);
clustering.fit(x_data, [], 20, 1);

-- Get soft cluster assignments
List[FLOAT] assignment = clustering.predict([1.0, 2.0, 3.0, 4.0]);
show(assignment);  -- Example: [0.1, 0.8, 0.1]

-- Get the most likely cluster index
INT cluster = clustering.predict_label([1.0, 2.0, 3.0, 4.0]);
show(cluster);
```

## Implementation Location

- `src/lib/KafeGESHA/core/model.py` — unsupervised branch of `fit()` and `_unsupervised_loss_and_grad()`.
- `src/lib/KafeGESHA/layers/dense.py` — Dense layers used in the model.
- `src/lib/KafeGESHA/activations/` — Softmax implementation.

## Public API

- Build a model with `geshaDeep.sequential([...])`.
- Compile with `geshaDeep.compile(model, optimizer, loss, metrics)`.
- Call `model.fit(x_train, [], epochs, batch_size)` without labels for unsupervised training.
- `model.predict(x)` returns the model's assignment vector.
- `model.predict_label(x)` returns the index of the largest output.
- `model.predict_proba(x)` returns the model output (a scalar for a one-element output, otherwise a vector).
- `model.evaluate(x_test, y_test)` is supervised and requires labels.

## References

- Dunn, J. C. (1973). A fuzzy relative of the ISODATA process and its use in detecting compact well-separated clusters. *Journal of Cybernetics*, 3(3), 32-57.
- Bezdek, J. C. (1981). *Pattern Recognition with Fuzzy Objective Function Algorithms*. Plenum Press.
- Xie, J., Girshick, R., & Farhadi, A. (2016). Unsupervised deep embedding for clustering analysis. ICML.
- Yang, L., et al. (2017). Towards k-means-friendly spaces: Simultaneous deep learning and clustering. ICML.
- Goodfellow, I., Bengio, Y., & Courville, A. (2016). *Deep Learning*, Chapter 5.13: Autoencoders (nonlinear representation). MIT Press.
