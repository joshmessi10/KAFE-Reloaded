# Decision Tree Regressor

## Mathematical Foundation

`DecisionTreeRegressor` is a regression tree that predicts continuous values by minimizing mean squared error (MSE).

### Algorithm

1. For each feature and candidate threshold:
   - Split the data into left ($X \leq$ threshold) and right ($X >$ threshold) groups.
   - Calculate the weighted MSE reduction: $MSE_{parent} - (n_l/n \cdot MSE_{left} + n_r/n \cdot MSE_{right})$.
2. Select the split with the greatest MSE reduction.
3. Repeat recursively until a stopping condition is met.
4. Each leaf predicts the mean of the values in its node.

### MSE (Mean Squared Error)

$$MSE = \frac{1}{n} \sum_{i=1}^{n} (y_i - \bar{y})^2$$

## Complexity

| Operation | Time | Space |
|-----------|------|-------|
| Training | $O(n \cdot m \cdot \log n)$ | $O(n)$ |
| Prediction | $O(\log n)$ on average | $O(1)$ |

## Advantages

1. **Interpretable** — easy to visualize and understand.
2. **No normalization required** — invariant to feature scale.
3. **Captures nonlinearities** — can model complex relationships.
4. **Fast prediction** — $O(\log n)$ on average.

## Limitations

1. **Overfitting** — it can memorize the training data.
2. **Unstable** — small data changes can produce a different tree.
3. **Bias toward features with many values** — high cardinality can be favored.

## When to Use

- Data with nonlinear relationships.
- When interpretability is important.
- Features with different scales.

## When NOT to Use

- Linear data (linear regression may be more appropriate).
- When overfitting is a concern (consider a random forest).

## Implementation Location

- `src/lib/KafeMACHINE/tree/DecisionTree.py` — DecisionTreeRegressor class

## Public API

- `machine.decision_tree_regressor(criterion, max_depth, min_samples_split, min_samples_leaf)`
- `model.fit(X, y)` — build the tree
- `model.predict(X)` — predict values
- `model.score(X, y)` — R²

## References

- Breiman, L. et al. (1984). Classification and Regression Trees.
- Quinlan, J.R. (1986). Induction of Decision Trees. Machine Learning.
