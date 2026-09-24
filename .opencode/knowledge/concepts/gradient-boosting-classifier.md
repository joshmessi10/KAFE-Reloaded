# Gradient Boosting Classifier

## Mathematical Foundation

Gradient Boosting Classifier is an ensemble method that builds trees sequentially, with each tree correcting the previous tree's errors using gradient descent on the log-loss function.

### Algorithm

1. **Initialize**: $F_0(x) = 0.5 \cdot \ln\left(\frac{1-p}{p}\right)$, where $p$ is the proportion of positive-class samples.
2. **For each iteration $t = 1, \ldots, T$**:
   - Calculate probabilities: $p_i = \sigma(F_{t-1}(x_i))$.
   - Calculate residuals: $r_i = y_i - p_i$ (pseudo-residuals).
   - Fit tree $h_t$ to predict residuals $r_i$.
   - Update: $F_t(x) = F_{t-1}(x) + \eta \cdot h_t(x)$.
3. **Predict**: $H(x) = \sigma(F_T(x))$.

Here, $\sigma(x) = \frac{1}{1 + e^{-x}}$ is the sigmoid function.

### Loss Function

For binary classification, Gradient Boosting minimizes **log loss** (deviance):

$$\mathcal{L}(y, F) = -y \cdot \log(p) - (1-y) \cdot \log(1-p)$$

The pseudo-residuals are the negative gradient of the loss with respect to the score:

$$r_i = -\frac{\partial \mathcal{L}(y_i, F(x_i))}{\partial F(x_i)} = y_i - \sigma(F(x_i))$$

### Subsampling

`GradientBoostingClassifier` supports **stochastic gradient boosting** through the `subsample` parameter:
- Randomly samples a fraction of the data on each iteration.
- Reduces overfitting and speeds up training.
- Similar to bagging, but used within boosting.

## Computational Complexity

| Operation | Time Complexity | Space Complexity |
|-----------|---------------------|---------------------|
| Training | $O(T \cdot n \cdot m \cdot d)$ | $O(T \cdot n)$ |
| Prediction | $O(T \cdot d)$ | $O(1)$ |

Here, $T$ is `n_estimators`, $n$ is the number of samples, $m$ is the number of features, and $d$ is `max_depth`.

## Advantages

1. **High accuracy** — can outperform Random Forest on some datasets.
2. **Flexible** — supports different loss functions.
3. **Feature importance** — importance can be estimated for each feature.
4. **No normalization required** — trees are invariant to scale.
5. **Stochastic boosting** — subsampling can reduce overfitting.

## Limitations

1. **Overfitting** — can be more susceptible than Random Forest.
2. **Sequential** — boosting rounds cannot be parallelized.
3. **Sensitive to hyperparameters** — `learning_rate` and `n_estimators` interact.
4. **Slower training** — trees are fitted sequentially.
5. **Binary only** — the implementation natively handles binary classification.

## When to Use

- Binary classification.
- When high accuracy is important.
- When there is time to tune hyperparameters.
- Relatively clean data with little noise.

## When NOT to Use

- Very noisy data, where overfitting may occur.
- Very large datasets that make sequential training too slow.
- When parallel training is required (consider Random Forest).
- Multiclass classification (use another approach).

## Relationship with KAFE

KAFE implements `GradientBoostingClassifier` from scratch:
- Regression trees as weak learners.
- Log-loss (deviance) objective.
- Numerically stable sigmoid.
- Stochastic gradient boosting through subsampling.
- Scikit-learn-style API: `fit()`, `predict()`, and `score()`.

## References

- Friedman, J. H. (2001). Greedy function approximation: A gradient boosting machine. *Annals of Statistics*.
- Friedman, J. H. (2002). Stochastic gradient boosting. *Computational Statistics & Data Analysis*.
