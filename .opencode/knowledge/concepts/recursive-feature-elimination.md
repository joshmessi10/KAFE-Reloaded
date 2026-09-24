# RecursiveFeatureElimination (RFE)

## Name

RecursiveFeatureElimination (RFE)

## Category

ML preprocessing / feature selection (supervised, wrapper method)

## Description

Recursive Feature Elimination (RFE) is a feature-selection method that repeatedly trains a model and removes the least important feature until the desired number of features remains. Unlike `VarianceThreshold`, RFE uses a learning model to consider each feature's relationship to the target.

## Mathematical Foundation

RFE is a **wrapper method** that uses a base estimator to evaluate feature importance:

1. Fit the estimator with all $d$ active features.
2. Calculate each feature's importance: $\text{importance}_j = |w_j|$ for linear models or `feature_importances_` for trees.
3. Find the least important feature: $j^* = \arg\min_j \text{importance}_j$.
4. Remove $j^*$ and assign it the current rank.
5. Repeat until $k$ features remain.

**Ranking**: Features removed earlier receive higher ranks (less important). The surviving features receive rank 1.

- **Time Complexity**: $O(d \cdot T_{\text{estimator}} \cdot (d - k))$, where $T_{\text{estimator}}$ is the training time of the base model.
- **Space Complexity**: $O(d)$ for ranks and the support mask.

**Total cost**: RFE trains the model $(d - k)$ times, which may be expensive for complex models.

## Step-by-Step Algorithm

1. **`fit(X, y)`**: Start with all $d$ features active.
2. **For each iteration**:
   a. Fit the estimator using the active features.
   b. Calculate the importance of each active feature.
   c. Remove the least important feature.
   d. Assign it the next rank.
3. **Result**: The $k$ surviving features receive rank 1; the rest receive progressively higher ranks.
4. **`transform(X)`**: Select only columns whose rank is 1.

## Motivation

Filter methods such as `VarianceThreshold` evaluate features independently and ignore interactions. Wrapper methods such as RFE use a model to evaluate each feature's effect on prediction, capturing interactions and redundancy that filter methods may miss.

RFE is a widely used wrapper method. Guyon et al. (2002) proposed it for gene selection in cancer classification.

## Advantages

- **Considers the target relationship**: Uses a supervised model to evaluate importance.
- **Detects redundancy**: Can remove one of two redundant features.
- **Model-specific evaluation**: The selection is directly relevant to the estimator.
- **Flexible**: Works with models that expose `coef_` or `feature_importances_`.
- **Complete ranking**: Ranks all features instead of returning only a binary selection.

## Limitations

- **Requires a model**: A base estimator is needed to evaluate importance.
- **Computationally expensive**: Fits the model $(d - k)$ times.
- **Unstable**: Small data changes may alter the ranking.
- **Greedy**: Removal is irreversible; eliminated features are not reconsidered.
- **Model bias**: Selection depends on the chosen base estimator.

## When to Use

- When selecting a subset of features for a specific model.
- When features have relevant interactions.
- When sufficient computation time is available.
- As a preprocessing step to reduce dimensionality before fitting a final model.

## When NOT to Use

- When the dataset is very large (many features and samples).
- When the base model is expensive to fit.
- When a fast preselection method is needed (apply `VarianceThreshold` first).
- When there is no suitable model for evaluating importance.

## Dependencies

- BaseMachine
- LinearRegression (default estimator)
- PARDOS DataFrame (soporte DataFrames)

## Related Concepts

- variance-threshold (complementary unsupervised filter method)
- lasso-regression (feature selection through L1 regularization)
- pipeline (chain RFE with other steps)
- decision-tree (alternative estimator exposing `feature_importances_`)
- random-forest (alternative estimator exposing `feature_importances_`)

## Relationship with KAFE

In KAFE, RFE is implemented as a preprocessing transformer that extends `BaseMachine`. The factory `machine.recursive_feature_elimination(estimator, n_features)` creates an instance. It uses `LinearRegression` as the default estimator and supports models with `coef_` (linear models) or `feature_importances_` (trees). It produces a complete ranking so users can choose how many features to retain.

## Usage Examples

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 0.5, 3.0, 0.1],
                        [2.0, 0.6, 6.0, 0.2],
                        [3.0, 0.4, 9.0, 0.15],
                        [4.0, 0.7, 12.0, 0.25],
                        [5.0, 0.55, 15.0, 0.18]];
List[FLOAT] y = [2.0, 4.0, 6.0, 8.0, 10.0];

-- Select the two top-ranked features
MACHINE rfe = machine.recursive_feature_elimination(machine.linear_regression(), 2);
rfe.fit(X, y);

show(rfe.ranking_);          -- [1, 3, 1, 2] (features 0 and 2 rank highest)
show(rfe.selected_indices_); -- [0, 2]
show(rfe.support_);          -- [True, False, True, False]

List[List[FLOAT]] X_new = rfe.transform(X);
show(X_new);  -- [[1.0, 3.0], [2.0, 6.0], [3.0, 9.0], [4.0, 12.0], [5.0, 15.0]]
```

## Implementation Location

- `src/lib/KafeMACHINE/preprocessing/RecursiveFeatureElimination.py`

## Public API

- `machine.recursive_feature_elimination(estimator, n_features)` — creates RFE with an estimator and feature count (defaults: `LinearRegression`, 1).
- `rfe.fit(X, y)` — performs recursive fitting and feature selection.
- `rfe.transform(X)` — selects the chosen features.
- `rfe.fit_transform(X, y)` — fits the selector and transforms the data.
- `rfe.selected_indices_` — indices of the selected features.
- `rfe.ranking_` — feature-importance ranking (1 is most important).
- `rfe.support_` — Boolean mask of selected features.
- `rfe.n_features_in_` — number of input features.

## References

- Guyon, I., Weston, J., Barnhill, S., & Vapnik, V. (2002). Gene Selection for Cancer Classification using Support Vector Machines. Machine Learning, 46(1-3), 389-422.
- scikit-learn RFE: https://scikit-learn.org/stable/modules/generated/sklearn.feature_selection.RFE.html
