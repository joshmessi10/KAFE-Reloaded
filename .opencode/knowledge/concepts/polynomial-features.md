# PolynomialFeatures

## Name

PolynomialFeatures — Polynomial Feature Generation

## Category

ML preprocessing

## Description

`PolynomialFeatures` transforms a set of $d$ features into all polynomial combinations up to a specified degree $n$. For example, given $[x_1, x_2]$ and degree 2, it generates $[1, x_1, x_2, x_1^2, x_1 x_2, x_2^2]$. This allows a linear model to capture nonlinear relationships between input variables.

The bias term is a column of ones that represents the model intercept.

## Mathematical Foundation

For $d$ input features and degree $n$, the total number of output features is:

$$\text{n\_features\_out} = \binom{d + n}{n} = \frac{(d + n)!}{d! \cdot n!}$$

This count includes the bias term (degree 0). Subtract 1 when bias is excluded.

Each output feature is the product of the original inputs raised to nonnegative powers $p_1, p_2, \ldots, p_d$, where:

$$p_1 + p_2 + \cdots + p_d \leq n$$

**Example** for $[x_1, x_2]$ and degree 2:

| Combination | Powers | Value |
|-------------|-----------|-------|
| Bias | $(0,0)$ | $1$ |
| $x_1$ | $(1,0)$ | $x_1$ |
| $x_2$ | $(0,1)$ | $x_2$ |
| $x_1^2$ | $(2,0)$ | $x_1^2$ |
| $x_1 x_2$ | $(1,1)$ | $x_1 \cdot x_2$ |
| $x_2^2$ | $(0,2)$ | $x_2^2$ |

**Complexity**:

- **Transformation time**: $O(n_{samples} \cdot \binom{d+n}{n} \cdot d)$.
- **Space**: $O(n_{samples} \cdot \binom{d+n}{n})$.

**Number of combinations**:

| d (features) | n (degree) | With bias | Without bias |
|---------------|-----------|----------|----------|
| 2 | 2 | 6 | 5 |
| 3 | 2 | 10 | 9 |
| 2 | 3 | 10 | 9 |
| 5 | 2 | 21 | 20 |
| 3 | 3 | 20 | 19 |

## Step-by-Step Algorithm

1. **Validate input**: Check that $d > 0$ and $n \geq 1$.
2. **Generate power combinations**: For every combination $(p_1, \ldots, p_d)$ where $\sum p_i \leq n$, create one output feature.
3. **Calculate output dimensions**: Count the combinations and subtract 1 if bias is excluded.
4. **Transform each sample**: For every dataset row, multiply the inputs raised to the corresponding powers.
5. **Return the result**: A matrix with shape $n_{samples} \times n_{features\_out}$.

## Motivation

Many ML algorithms, such as linear regression and linear SVMs, can capture only linear relationships between features and the target. `PolynomialFeatures` lets these models capture interactions and nonlinearities by creating polynomial features. It is a fundamental feature-engineering technique.

## Advantages

- Captures nonlinearities: lets linear models fit quadratic, cubic, and higher-order relationships.
- Flexible: degree $n$ controls polynomial complexity.
- Works with regularization: Ridge or Lasso can help manage the expanded feature space.
- Easy to understand: each output feature is a clear polynomial combination.

## Limitations

- **Curse of dimensionality**: The number of features grows rapidly with degree. For $d=10$ and $n=2$, 66 features are generated.
- **Overfitting**: High-degree polynomial features can memorize noise.
- **Scaling may be required**: Polynomial values can have very different magnitudes; consider `StandardScaler`.
- **Not invertible**: There is no `inverse_transform` because the transformation loses the original feature structure.
- **Multicollinearity**: Polynomial features can be highly correlated.

## When to Use

- When the feature-to-target relationship is nonlinear but a linear model is used.
- When interactions between features are expected.
- For small or medium-sized datasets where the expanded dimensionality is manageable.
- With regularization (Ridge, Lasso, or ElasticNet) to control overfitting.

## When NOT to Use

- With models that already capture nonlinearities, such as random forests, RBF-kernel SVMs, and neural networks.
- With high-dimensional datasets where combinatorial growth becomes unmanageable.
- With high degree (>3) on large datasets because of the high risk of overfitting.

## Dependencies

- `BaseMachine` (superclass)
- `DataFrame` from KafePARDOS (for DataFrame support)
- `check_sig` from global_utils (signature validation)

## Related Concepts

- LinearRegression, RidgeRegression, and LassoRegression — models that work well with PolynomialFeatures.
- StandardScaler — scaling is recommended after generating polynomial features.
- Feature engineering — a fundamental preprocessing technique.

## Relationship with KAFE

`PolynomialFeatures` is implemented as a KafeMACHINE transformer that follows the `BaseMachine` contract:

- `fit(data)` calculates output dimensions and generates feature names.
- `transform(data)` applies the polynomial expansion.
- `fit_transform(data)` combines both steps.
- Native support for PARDOS DataFrames preserves column labels.
- `inverse_transform` intentionally raises an error because the transformation is not invertible.

Combinations are generated recursively to enumerate every combination of powers.

## Usage Examples

```kafe
import machine;

-- Create PolynomialFeatures with degree 2
MACHINE pf = machine.polynomial_features(2, True);

-- Input data: 2 features
List[List[FLOAT]] X = [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]];

-- Transform
List[List[FLOAT]] X_poly = pf.fit_transform(X);
-- Result: [[1.0, 1.0, 2.0, 1.0, 2.0, 4.0],
--              [1.0, 3.0, 4.0, 9.0, 12.0, 16.0],
--              [1.0, 5.0, 6.0, 25.0, 30.0, 36.0]]

-- Combine with linear regression
MACHINE lr = machine.linear_regression();
lr.fit(X_poly, y);
```

## Implementation Location

- File: `src/lib/KafeMACHINE/preprocessing/PolynomialFeatures.py`

## Public API

```kafe
-- Factory function
MACHINE pf = machine.polynomial_features(degree, include_bias);

-- Parameters:
-- degree: INT (default 2) — maximum polynomial degree
-- include_bias: BOOL (default True) — include a bias column (ones)

-- Methods:
pf.fit(data)           -> MACHINE
pf.transform(data)     -> List[List[FLOAT]] o PARDOS
pf.fit_transform(data) -> List[List[FLOAT]] o PARDOS

-- Properties (after fit):
pf.n_features_in_  -> INT
pf.n_features_out_ -> INT
```

## References

- Wikipedia: Polynomial Regression
- Scikit-learn documentation: `sklearn.preprocessing.PolynomialFeatures`
- Bishop, C.M. (2006). Pattern Recognition and Machine Learning, Section 3.1.2
