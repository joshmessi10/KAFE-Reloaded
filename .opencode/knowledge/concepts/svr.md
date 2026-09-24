# Support Vector Regression (SVR)

## Mathematical Foundation

SVR extends SVM to regression. It finds a hyperplane that fits the data within a margin of width $\epsilon$.

### Epsilon-Insensitive Loss

SVR uses an epsilon-insensitive loss function:

$$L_\epsilon(y, f(x)) = \max(0, |y - f(x)| - \epsilon)$$

It penalizes only predictions outside the tube of radius $\epsilon$.

### Formulation

The objective is to minimize:

$$\frac{1}{2}||w||^2 + C \sum_{i=1}^{n} L_\epsilon(y_i, f(x_i))$$

Where:
- $w$ = model weights
- $C$ = regularization parameter (trade-off between flatness and tolerance)
- $\epsilon$ = width of the epsilon-insensitive tube
- $f(x) = w \cdot x + b$

### Support Vectors

Points on or outside the boundary of the $\epsilon$ tube are the **support vectors**. Only these points contribute to the model.

### Kernels

- **Linear**: $K(x_i, x_j) = x_i \cdot x_j$
- **RBF (Gaussian)**: $K(x_i, x_j) = \exp(-\gamma ||x_i - x_j||^2)$
- **Polynomial**: $K(x_i, x_j) = (x_i \cdot x_j + 1)^d$

## Computational Complexity

| Operation | Time Complexity | Space Complexity |
|-----------|-----------------|------------------|
| Training | $O(n^2 \cdot m)$ (kernel) or $O(n \cdot m)$ (linear) | $O(n^2)$ (kernel) or $O(m)$ (linear) |
| Prediction | $O(n_{sv} \cdot m)$ (kernel) or $O(m)$ (linear) | $O(n_{sv})$ |

Where $n$ = number of samples, $m$ = number of features, and $n_{sv}$ = number of support vectors.

## Advantages

1. **Robust to outliers** — epsilon-insensitive loss ignores small errors.
2. **Effective in high dimensions** — the kernel trick handles nonlinear features.
3. **Generalization** — maximizes the margin to reduce overfitting.
4. **Sparse model** — prediction uses only support vectors.

## Limitations

1. **Scalability** — kernel training takes $O(n^2)$ time.
2. **Hyperparameter sensitivity** — $C$ and $\epsilon$ require careful tuning.
3. **Not probabilistic** — it does not produce probabilities as output.
4. **Limited interpretability** — nonlinear kernels are difficult to interpret.

## When to Use

- Data with outliers.
- Nonlinear relationships (with a kernel).
- High-dimensional data.
- When robustness is important.

## When NOT to Use

- Very large datasets (training is slow).
- When probability estimates are required.
- When interpretability is critical.

## Relationship with KAFE

KAFE implements SVR from scratch:
- **Linear**: coordinate descent with epsilon-insensitive loss.
- **Kernel**: simplified SMO with a kernel matrix.
- Supports linear, RBF, and polynomial kernels.

## References

- Drucker, H., Burges, C. J., Kaufman, L., Smola, A., & Vapnik, V. (1997). Support Vector Regression Machines. *NeurIPS*.
- Smola, A. J., & Schölkopf, B. (2004). A Tutorial on Support Vector Regression. *Statistics and Computing*, 14(3), 199-222.
