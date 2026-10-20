# KNN Regressor

## Mathematical Foundation

K-Nearest Neighbors for regression predicts the average target value of the $k$ nearest neighbors.

### Algorithm

1. Calculate the distance to every training point.
2. Select the $k$ nearest neighbors.
3. Predict:

$$\hat{y} = \frac{1}{k} \sum_{i=1}^{k} y_i$$

### Weights

- **uniform**: unweighted average.
- **distance**: average weighted by inverse distance.

$$\hat{y} = \frac{\sum_{i=1}^{k} w_i \cdot y_i}{\sum_{i=1}^{k} w_i}, \quad w_i = \frac{1}{d_i + \epsilon}$$

## Complexity

| Operation | Time | Space |
|-----------|------|-------|
| Training | $O(1)$ | $O(n \cdot m)$ |
| Prediction | $O(n \cdot m)$ | $O(n)$ |

## Advantages

1. **Simple** — easy to understand and implement.
2. **No model fitting required** — uses lazy learning.
3. **Adaptable** — captures local relationships.
4. **Few assumptions** — does not assume a particular data distribution.

## Limitations

1. **Slow prediction** — distances to all training points must be calculated.
2. **Sensitive to dimensionality** — affected by the curse of dimensionality.
3. **Sensitive to outliers** — noisy neighbors can affect predictions.
4. **Requires normalization** — distances depend on feature scales.

## When to Use

- Small or medium-sized datasets.
- Data with local patterns.
- When a simple model is quick to implement.

## When NOT to Use

- Large datasets where prediction cost is too high.
- Data with many features.
- Data with outliers that distort neighborhood predictions.

## Implementation Location

- `src/lib/KafeMACHINE/neighbors/KNN.py` — KNNRegressor class

## Public API

- `machine.knn_regressor(k)`
- `model.fit(X, y)` — store training data
- `model.predict(X)` — predict values
- `model.score(X, y)` — R²

## References

- Cover & Hart (1967) — Nearest Neighbor Pattern Classification
