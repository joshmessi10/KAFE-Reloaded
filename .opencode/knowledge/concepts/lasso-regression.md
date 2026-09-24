# Lasso Regression

## Mathematical Foundation

Lasso (Least Absolute Shrinkage and Selection Operator) is linear regression with **L1 regularization**, which can remove features entirely.

### Objective

Minimize the objective function:

$$J(\theta) = ||y - X\theta||^2 + \alpha||\theta||_1$$

where:
- $||y - X\theta||^2$ is the fitting error.
- $\alpha||\theta||_1$ is the L1 penalty (the sum of absolute coefficient values).
- $\alpha$ controls the regularization strength.

### Solution: Coordinate Descent

There is no closed-form solution for L1 regularization, so **Coordinate Descent** is used:

For each coefficient $\theta_j$:

$$\theta_j \leftarrow S\left(\frac{X_j^T r_j}{X_j^T X_j}, \frac{\alpha}{X_j^T X_j}\right)$$

where $S$ is the **soft-thresholding** operator:

$$S(z, \lambda) = \text{sign}(z) \max(|z| - \lambda, 0)$$

### Properties

- **$\alpha = 0$**: Equivalent to OLS.
- **$\alpha \to \infty$**: All coefficients become exactly zero.
- **Feature selection**: Soft thresholding can set coefficients exactly to zero.
- **Sparse models**: Produces models with few nonzero features.

## Computational Complexity

| Operation | Time Complexity | Space Complexity |
|-----------|---------------------|---------------------|
| Training | $O(n \cdot m \cdot T)$ | $O(m^2)$ |
| Prediction | $O(m)$ | $O(1)$ |

Here, $n$ is the number of samples, $m$ is the number of features, and $T$ is the number of iterations.

## Advantages

1. **Feature selection** — removes irrelevant features by setting their coefficients to zero.
2. **Sparse models** — easy to interpret.
3. **Can reduce overfitting** — through L1 regularization.
4. **Handles collinearity** — tends to select one feature from a correlated group.

## Limitations

1. **No closed-form solution** — requires iterative optimization.
2. **Unstable with correlated features** — feature selection may be arbitrary.
3. **At most $n$ selected features** — it cannot select more features than samples.
4. **Sensitive to scale** — feature normalization is required.

## When to Use

- Many features, only a few of which are relevant.
- When interpretability and a sparse model are important.
- Automatic feature selection.
- Overfitting caused by many features.

## When NOT to Use

- Highly correlated features (consider Ridge).
- When all features are relevant.
- $p \gg n$ (many more features than samples).

## Relationship with KAFE

KAFE implements `LassoRegression` with Coordinate Descent and soft thresholding. The algorithm iterates over each coefficient, updating one at a time until convergence.

## References

- Tibshirani, R. (1996). Regression Shrinkage and Selection via the Lasso. *Journal of the Royal Statistical Society*, 58(1), 267-288.
- Hastie, T., Tibshirani, R., & Friedman, J. (2009). *The Elements of Statistical Learning*. Springer. Section 3.4.3.
