# Ridge Regression

## Mathematical Foundation

Ridge Regression is a form of linear regression with **L2 regularization** that penalizes large coefficients to reduce overfitting.

### Objective

Minimize the objective function:

$$J(\theta) = ||y - X\theta||^2 + \alpha||\theta||^2$$

where:
- $||y - X\theta||^2$ is the fitting error (sum of squared errors).
- $\alpha||\theta||^2$ is the L2 penalty (sum of squared coefficients).
- $\alpha$ controls the regularization strength.

### Closed-Form Solution

$$\theta = (X^T X + \alpha I)^{-1} X^T y$$

Here, $I$ is the identity matrix. The term $\alpha I$ makes the matrix invertible.

### Properties

- **$\alpha = 0$**: Equivalent to OLS (no regularization).
- **$\alpha \to \infty$**: All coefficients approach zero but never become exactly zero.
- **Shrunk coefficients**: All coefficients are reduced proportionally, but none are eliminated.

## Computational Complexity

| Operation | Time Complexity | Space Complexity |
|-----------|---------------------|---------------------|
| Training | $O(n \cdot m^2 + m^3)$ | $O(m^2)$ |
| Prediction | $O(m)$ | $O(1)$ |

Here, $n$ is the number of samples and $m$ is the number of features.

## Advantages

1. **Reduces overfitting** — L2 regularization shrinks the model coefficients.
2. **Always has a solution** — $\alpha I$ makes the matrix invertible.
3. **Numerically stable** — performs better than OLS with collinear data.
4. **Proportional coefficient shrinkage** — retains relative coefficient magnitudes.

## Limitations

1. **Does not eliminate features** — every coefficient remains nonzero.
2. **Sensitive to scale** — feature normalization is required.
3. **Requires tuning** — select $\alpha$ using cross-validation.

## When to Use

- Collinear features (high correlation).
- Many features and few samples.
- Overfitting with OLS.
- When feature selection is not required.

## When NOT to Use

- When feature selection is needed (use Lasso).
- When there are few features and sufficient samples.
- When maximum interpretability is required.

## Relationship with KAFE

KAFE implements `RidgeRegression` with a closed-form solution using Gaussian elimination with partial pivoting. It supports `fit_intercept` through data centering.

## References

- Hoerl, A. E., & Kennard, R. W. (1970). Ridge Regression: Biased Estimation for Nonorthogonal Problems. *Technometrics*, 12(1), 55-67.
- Hastie, T., Tibshirani, R., & Friedman, J. (2009). *The Elements of Statistical Learning*. Springer. Section 3.4.1.
