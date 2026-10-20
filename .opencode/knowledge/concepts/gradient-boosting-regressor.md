# Gradient Boosting Regressor

## Mathematical Foundation

Gradient Boosting Regressor builds regression trees sequentially to minimize mean squared error (MSE) using gradient descent.

### Algorithm

1. **Initialize**: $F_0(x) = \bar{y} = \frac{1}{n}\sum_{i=1}^{n} y_i$.
2. **For each iteration $t = 1, \ldots, T$**:
   - Calculate residuals: $r_i = y_i - F_{t-1}(x_i)$.
   - Fit tree $h_t$ to predict residuals $r_i$.
   - Update: $F_t(x) = F_{t-1}(x) + \eta \cdot h_t(x)$.
3. **Predict**: $H(x) = F_T(x)$.

### Loss Function

For regression, Gradient Boosting minimizes **MSE** (mean squared error):

$$\mathcal{L}(y, F) = \frac{1}{2}(y - F)^2$$

The pseudo-residuals are the negative gradient:

$$r_i = -\frac{\partial \mathcal{L}(y_i, F(x_i))}{\partial F(x_i)} = y_i - F(x_i)$$

### Subsampling

`GradientBoostingRegressor` supports **stochastic gradient boosting** through the `subsample` parameter:
- Randomly samples a fraction of the data on each iteration.
- Reduces overfitting and speeds up training.

## Computational Complexity

| Operation | Time Complexity | Space Complexity |
|-----------|---------------------|---------------------|
| Training | $O(T \cdot n \cdot m \cdot d)$ | $O(T \cdot n)$ |
| Prediction | $O(T \cdot d)$ | $O(1)$ |

Here, $T$ is `n_estimators`, $n$ is the number of samples, $m$ is the number of features, and $d$ is `max_depth`.

## Advantages

1. **High accuracy** — can outperform linear regression and Random Forest on some datasets.
2. **Captures nonlinearities** — trees model complex patterns.
3. **Feature importance** — estimates importance for each feature.
4. **Robust to outliers** — less sensitive than linear regression.
5. **Stochastic boosting** — subsampling can reduce overfitting.

## Limitations

1. **Overfitting** — can be more susceptible than Random Forest.
2. **Sequential** — boosting rounds cannot be parallelized.
3. **Sensitive to hyperparameters** — especially `learning_rate` and `n_estimators`.
4. **Slower training** — trees are fitted sequentially.

## When to Use

- Nonlinear regression.
- When high accuracy is important.
- When there is time to tune hyperparameters.
- Data with complex patterns.

## When NOT to Use

- Very noisy data, where overfitting may occur.
- Very large datasets that make sequential training too slow.
- When parallel training is required (consider Random Forest).
- Purely linear relationships (use linear regression).

## Relationship with KAFE

KAFE implements `GradientBoostingRegressor` from scratch:
- Regression trees as weak learners.
- MSE (squared-error) objective.
- Initial prediction equal to the mean of $y$.
- Stochastic gradient boosting through subsampling.
- Scikit-learn-style API: `fit()`, `predict()`, and `score()` ($R^2$).

## References

- Friedman, J. H. (2001). Greedy function approximation: A gradient boosting machine. *Annals of Statistics*.
- Friedman, J. H. (2002). Stochastic gradient boosting. *Computational Statistics & Data Analysis*.
