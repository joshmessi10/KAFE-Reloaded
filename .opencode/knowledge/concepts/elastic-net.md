# ElasticNet

## Name

ElasticNet — combined L1 and L2 regularization

## Category

ML algorithm (linear regression with regularization)

## Description

ElasticNet is a linear regression model that combines L1 (Lasso) and L2 (Ridge) regularization. It minimizes squared error plus a penalty that mixes the L1 and L2 coefficient norms. This supports feature selection through L1 while helping stabilize coefficients for correlated features through L2.

## Mathematical Foundation

**Cost function**:

$$J(\theta) = \frac{1}{2n} \|y - X\theta\|^2 + \alpha \cdot \lambda \cdot \|\theta\|_1 + \alpha \cdot (1 - \lambda) \cdot \|\theta\|_2^2$$

Where:

- $\alpha$ is the overall regularization strength.
- $\lambda$ is the `l1_ratio` parameter (the L1-to-L2 balance).
- $\|\theta\|_1 = \sum |\theta_j|$ is the L1 norm, which promotes sparsity.
- $\|\theta\|_2^2 = \sum \theta_j^2$ is the squared L2 norm, which penalizes large coefficients.

**Special cases**:

| `l1_ratio` | Model | Regularization |
|----------:|---|---|
| 1.0 | Lasso | L1 only |
| 0.0 | Ridge | L2 only |
| (0, 1) | ElasticNet | L1 and L2 combination |

**Algorithm**: coordinate descent with soft thresholding.

For each coefficient $\theta_j$:

1. Compute the partial residual: $r_j = X_j^T (y - X_{-j}\theta_{-j})$.
2. Apply soft thresholding: $\theta_j = \frac{S(r_j/n, \alpha\lambda)}{1 + \alpha(1-\lambda)/n}$.

Here, $S(z, \gamma) = \text{sign}(z) \cdot \max(|z| - \gamma, 0)$ is the soft-thresholding operator.

**Complexity**:

- **Training time**: $O(n_{iter} \cdot n \cdot d)$, where $n_{iter}$ is the number of iterations until convergence.
- **Prediction time**: $O(n \cdot d)$.
- **Space**: $O(d)$ for the coefficients.

## Step-by-Step Algorithm

1. **Validate parameters**: $\alpha \geq 0$, $0 \leq \lambda \leq 1$, and $n_{iter} > 0$.
2. **Center the data** (if `fit_intercept=True`): compute the means of $X$ and $y$ and subtract them.
3. **Initialize coefficients**: $\theta = [0, 0, \ldots, 0]$.
4. **Precompute**: $X^T X$ and $X^T y$ (the Gram matrices).
5. **Run coordinate descent**:
   - For each feature $j$, compute its partial residual, excluding the contribution of $\theta_j$.
   - Update the coefficient: $\theta_j \leftarrow \frac{S(r_j/n, \alpha\lambda/n)}{1 + \alpha(1-\lambda)/n}$.
   - Stop when $\max|\theta_j^{new} - \theta_j^{old}| < tol$.
6. **Compute the intercept**: $\theta_0 = \bar{y} - \bar{X}^T\theta$.
7. **Return** the coefficients and intercept.

## Motivation

Lasso (L1) can remove features but may be unstable when features are correlated, selecting one arbitrarily. Ridge (L2) handles correlated features but does not remove features. ElasticNet combines feature selection with greater stability for correlated features.

## Advantages

- **Feature selection**: L1 can set coefficients exactly to zero, removing irrelevant features.
- **Correlation handling**: L2 helps keep coefficients for correlated features stable instead of arbitrarily removing one.
- **Feature groups**: Can select groups of correlated features together.
- **Flexible balance**: A single `l1_ratio` parameter controls the L1/L2 balance.
- **Convergence**: Coordinate descent with soft thresholding converges for convex problems.

## Limitations

- **Two hyperparameters**: Both `alpha` and `l1_ratio` need tuning, which is more involved than using Ridge or Lasso alone.
- **No closed-form solution**: Unlike Ridge, it has no analytical solution and requires iteration.
- **Scale sensitivity**: Features should be scaled for fair regularization.
- **No nonlinear relationships**: It is a linear model; nonlinear relationships require a transformation such as PolynomialFeatures.

## When to Use

- When many features are present and some may be irrelevant.
- When features are highly correlated (for example, one-hot encoded categories).
- When Lasso removes too many features or Ridge cannot remove any.
- For noisy datasets with medium-to-high dimensionality.

## When NOT to Use

- When there are very few features (fewer than 10); Ridge or Lasso may suffice.
- When the feature-to-target relationship is nonlinear; consider SVR, Random Forest, or PolynomialFeatures.
- When absolute coefficient interpretability is critical; Lasso produces sparser models.
- When there are very few samples relative to the number of features; the risk of severe overfitting is high.

## Dependencies

- `BaseMachine` superclass.
- `r2_score` from `metrics.py` for the `score` method.
- `check_sig` from `global_utils` for signature validation.

## Related Concepts

- RidgeRegression — ElasticNet with `l1_ratio=0`.
- LassoRegression — ElasticNet with `l1_ratio=1`.
- LinearRegression — ElasticNet without regularization (`alpha=0`).
- Coordinate descent — the optimization algorithm used.
- Soft thresholding — the sparsity-inducing operator.

## Relationship with KAFE

ElasticNet is implemented in KafeMACHINE according to the BaseMachine contract:

- `fit(X, y)` runs coordinate descent with soft thresholding to fit the coefficients.
- `predict(X)` returns $\theta_0 + X\theta$.
- `score(X, y)` calculates R² using `r2_score` from `metrics.py`.
- Hyperparameters are validated in `__init__()`: $\alpha \geq 0$, $0 \leq \lambda \leq 1$, and `max_iter > 0`.
- Native PARDOS DataFrame support uses `_unwrap_data()`.
- The intercept is computed separately by centering the data.

The implementation uses the Gram matrices ($X^T X$ and $X^T y$) for efficiency, avoiding repeated product calculations during each iteration.

## Usage Examples

```kafe
import machine;

-- Create ElasticNet with alpha=1.0 and l1_ratio=0.5 (equal L1 and L2 weights)
MACHINE en = machine.elastic_net(1.0, 0.5);

-- Input data
List[List[FLOAT]] X = [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0], [7.0, 8.0]];
List[FLOAT] y = [2.0, 4.0, 6.0, 8.0];

-- Fit
en.fit(X, y);

-- Predict
List[FLOAT] preds = en.predict([[2.0, 3.0], [6.0, 7.0]]);
show(preds);

-- Coefficients (some may be zero when l1_ratio is high)
show(en.coef_);
show(en.intercept_);

-- Evaluate with R-squared
FLOAT r2 = en.score(X, y);
show(r2);

-- Combine with PolynomialFeatures to model nonlinear relationships
MACHINE pf = machine.polynomial_features(2, False);
MACHINE en2 = machine.elastic_net(0.5, 0.5);
MACHINE pipe = machine.pipeline("poly", pf, "model", en2);
pipe.fit(X_train, y_train);
```

## Implementation Location

- `src/lib/KafeMACHINE/linear/ElasticNet.py`

## Public API

```kafe
-- Factory function
MACHINE en = machine.elastic_net(alpha, l1_ratio, fit_intercept, max_iter);

-- Parameters:
-- alpha: FLOAT (default 1.0) — regularization strength
-- l1_ratio: FLOAT (default 0.5) — L1/L2 balance (0=Ridge, 1=Lasso)
-- fit_intercept: BOOL (default True) — whether to fit an intercept
-- max_iter: INT (default 1000) — maximum number of iterations

-- Methods:
en.fit(X, y)       -> MACHINE
en.predict(X)      -> List[FLOAT]
en.score(X, y)     -> FLOAT

-- Properties (after fitting):
en.coef_      -> List[FLOAT]
en.intercept_ -> FLOAT
```

## References

- Zou, H. and Hastie, T. (2005). “Regularization and variable selection via the elastic net.” *Journal of the Royal Statistical Society: Series B*, 67(2), 301-320.
- Friedman, J. et al. (2010). “Regularization paths for generalized linear models via coordinate descent.” *Journal of Statistical Software*, 33(1), 1-22.
- scikit-learn documentation: `sklearn.linear_model.ElasticNet`
