# RandomForestRegressor

## Name

RandomForestRegressor

## Category

ML algorithm — ensemble regression

## Description

`RandomForestRegressor` is an ensemble of regression trees that combines bagging with random feature selection. It averages predictions to reduce overfitting by individual trees.

## Mathematical Foundation

**Bootstrap Sampling**: Each tree is fitted to a random sample of the original dataset drawn with replacement (about 63% of unique samples, on average).

**Random Feature Selection**: At each split, only $\sqrt{d}$ features are considered.

**Split Criterion**: Variance reduction — choose the split that most reduces target variance across the child nodes.

**Aggregation**: The final prediction is the mean of the predictions from all trees:

$$\hat{y} = \frac{1}{T} \sum_{t=1}^T \hat{y}_t$$

- **Time Complexity**: $O(T \cdot n \cdot d \cdot \log n)$ for training and $O(T \cdot d)$ for prediction.
- **Space Complexity**: $O(T \cdot \text{nodes})$ to store the trees.

## Step-by-Step Algorithm

1. For each tree $t$ from $1$ to $T$:
   a. Draw a bootstrap sample from the dataset.
   b. Build a regression tree with random feature selection.
   c. At each node, calculate target variance and find the split with the greatest variance reduction.
2. For prediction, average the predictions from all trees.

## Motivation

Random forests reduce overfitting by individual trees through bagging and random feature selection. They are widely used because they are robust and easy to apply.

## Advantages

- Reduces overfitting compared with a single tree.
- Handles numeric and categorical features.
- Does not require feature scaling.
- Provides feature-importance estimates.
- Robust to outliers.

## Limitations

- Less interpretable than a single tree.
- Slower to train than an individual tree.
- May overfit when very little data is available.
- Does not extrapolate beyond the training target range.

## When to Use

- Regression on tabular data.
- When robustness and generalization are important.
- Mixed numeric and categorical features.

## When NOT to Use

- When interpretability is critical.
- Time series with trends, since the model does not extrapolate.
- Very small datasets (fewer than 50 samples).

## Dependencies

- DecisionTree (reused for each tree)
- BaseMachine

## Related Concepts

- random-forest (classifier)
- decision-tree
- lasso-regression

## Relationship with KAFE

In KAFE, `RandomForestRegressor` is implemented in `RandomForest.py` alongside the classifier. The factory `machine.random_forest_regressor(n_estimators, max_depth, min_samples_split, min_samples_leaf)` creates an instance.

## Usage Examples

```kafe
import machine;

MACHINE rf = machine.random_forest_regressor(10, 0, 2, 1);
rf.fit(X, y);

List[FLOAT] preds = rf.predict([[1.5], [3.0], [5.5]]);
FLOAT r2 = rf.score(X, y);
```

## Implementation Location

- `src/lib/KafeMACHINE/tree/RandomForest.py` — class `RandomForestRegressor`

## Public API

- `machine.random_forest_regressor(n_estimators, max_depth, min_samples_split, min_samples_leaf)` — creates a `RandomForestRegressor` instance.
- `rf.fit(X, y)` — fits the ensemble.
- `rf.predict(X)` — predicts by averaging tree outputs.
- `rf.score(X, y)` — computes $R^2$.
- `rf.trees_` — list of fitted trees.
- `rf.n_features_` — number of features.

## References

- Breiman, L. (2001). Random Forests. Machine Learning, 45(1), 5-32.
- scikit-learn RandomForestRegressor: https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestRegressor.html
