# Support Vector Machine (SVM)

## Mathematical Foundation

SVM is a classification algorithm that finds the maximum-margin hyperplane separating the classes.

### Maximum-Margin Hyperplane

The goal is to find the hyperplane $w \cdot x + b = 0$ that maximizes the margin between the classes.

**Margin**: the perpendicular distance from the hyperplane to the nearest point from either class.

### Cost Function (Hinge Loss)

$$J(w) = \frac{1}{2}||w||^2 + C \sum_{i=1}^{n} \max(0, 1 - y_i \cdot f(x_i))$$

Where:
- $w$ = model weights
- $C$ = regularization parameter
- $y_i \in \{-1, +1\}$ = class labels
- $f(x_i) = w \cdot x_i + b$

### Kernels

- **Linear**: $K(x_i, x_j) = x_i \cdot x_j$
- **RBF (Gaussian)**: $K(x_i, x_j) = \exp(-\gamma ||x_i - x_j||^2)$
- **Polynomial**: $K(x_i, x_j) = (x_i \cdot x_j + 1)^d$

### Support Vectors

Points on or inside the margin are the **support vectors**. These points alone determine the hyperplane.

## Computational Complexity

| Operation | Time Complexity | Space Complexity |
|-----------|-----------------|------------------|
| Training | $O(n^2 \cdot m)$ (kernel) or $O(n \cdot m)$ (linear) | $O(n^2)$ (kernel) or $O(m)$ (linear) |
| Prediction | $O(n_{sv} \cdot m)$ (kernel) or $O(m)$ (linear) | $O(n_{sv})$ |

## Advantages

1. **Effective in high dimensions** — works well with many features.
2. **Kernel trick** — handles nonlinear relationships.
3. **Generalization** — maximizes the margin to reduce overfitting.
4. **Memory efficient** — prediction uses only support vectors.

## Limitations

1. **Scalability** — kernel training takes $O(n^2)$ time.
2. **Binary by default** — natively classifies only two classes.
3. **Scale-sensitive** — requires normalization.
4. **Not probabilistic by default** — does not natively produce probabilities.

## When to Use

- Binary classification.
- High-dimensional data.
- Nonlinear relationships (with a kernel).
- When a clear margin is useful.

## When NOT to Use

- Multiclass classification unless using One-vs-One or One-vs-Rest.
- Very large datasets.
- Data with substantial noise.

## Relationship with KAFE

KAFE implements SVM from scratch:
- **Linear**: SGD with hinge loss and L2 regularization.
- **Kernel**: simplified SMO with a kernel matrix.
- Supports linear, RBF, and polynomial kernels.
- Includes `predict_proba()` for calibrated probabilities.

## References

- Cortes, C., & Vapnik, V. (1995). Support-vector networks. *Machine Learning*, 20(3), 273-297.
- Platt, J. (1998). Sequential Minimal Optimization: A Fast Algorithm for Training Support Vector Machines. *Microsoft Research Technical Report*.
