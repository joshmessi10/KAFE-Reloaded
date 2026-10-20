# VarianceThreshold

## Name

VarianceThreshold

## Category

ML preprocessing / feature selection (unsupervised)

## Description

`VarianceThreshold` is a feature-selection method that automatically removes features whose variance is below a specified threshold. It is the simplest feature-selection method: it requires neither a supervised model nor target labels and analyzes each feature's spread independently.

## Mathematical Foundation

For each feature $j$, calculate the variance:

$$\text{Var}(j) = \frac{1}{n} \sum_{i=1}^{n} (x_{ij} - \bar{x}_j)^2$$

where $\bar{x}_j = \frac{1}{n} \sum_{i=1}^{n} x_{ij}$ is the mean of feature $j$.

**Selection rule**: Keep feature $j$ if and only if $\text{Var}(j) > \text{threshold}$.

- **Time Complexity**: $O(n \cdot d)$ for `fit` (variance calculation) and $O(n \cdot k)$ for `transform`, where $k$ is the number of selected features.
- **Space Complexity**: $O(d)$ to store variances and indices.

**Important properties**:
- A feature with zero variance is constant: all values are equal, so it provides no information.
- A low-variance feature has little discriminative power.
- The default threshold is 0.0, which removes only constant features.

## Step-by-Step Algorithm

1. **`fit(X)`**: For each feature $j$ in $[0, d)$, calculate $\bar{x}_j$ and $\text{Var}(j)$.
2. **Select**: Indices where $\text{Var}(j) > \text{threshold}$ form `selected_indices_`.
3. **`transform(X)`**: For each row, keep only the columns in `selected_indices_`.
4. **Result**: A reduced $n \times k$ matrix, where $k \leq d$.

## Motivation

In real datasets, many features are constant or nearly constant (for example, a column where every value is 5.0). These features add dimensionality, memory use, and training time without providing information to the model. `VarianceThreshold` quickly removes such irrelevant features without supervision.

## Advantages

- **Very simple**: One parameter (`threshold`) and a straightforward calculation.
- **Fast**: $O(n \cdot d)$, faster than supervised methods.
- **Unsupervised**: Does not need labels $y$ and is useful early in preprocessing.
- **Deterministic**: Produces the same result for the same data.
- **Complementary**: Can be combined with supervised methods (apply `VarianceThreshold` before RFE).

## Limitations

- **Ignores the target relationship**: A low-variance feature may be highly predictive if the target changes with it (for example, a fault-detection threshold).
- **Threshold depends on scale**: Variances from features on different scales are not comparable; apply `StandardScaler` or `MinMaxScaler` first.
- **Removes only individual features**: Does not detect redundancy between highly correlated features.
- **Sensitive to outliers**: A single outlier can inflate the variance artificially.

## When to Use

- As an initial preprocessing step for datasets with many features.
- To remove constant or near-constant features.
- Before expensive algorithms such as SVMs or neural networks.
- With supervised methods (pipeline: `VarianceThreshold` → RFE).

## When NOT to Use

- When a low-variance feature is known to be predictive.
- When features use different scales; scale them first.
- When redundant features must be detected (use correlation analysis or PCA).

## Dependencies

- BaseMachine
- PARDOS DataFrame (DataFrame support)
- math operations (sum, division)

## Related Concepts

- standard-scaler (recommended prior scaling).
- recursive-feature-elimination (complementary supervised method).
- pca (alternative dimensionality-reduction method).
- pipeline (to chain preprocessing steps).

## Relationship with KAFE

In KAFE, `VarianceThreshold` is implemented as a preprocessing transformer that extends `BaseMachine`. The factory `machine.variance_threshold(threshold)` creates an instance. It supports `fit`, `transform`, `fit_transform`, and PARDOS DataFrames. Its variance formula uses the population variance ($1/n$, not $1/(n-1)$), consistent with scikit-learn.

## Usage Examples

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 0.0, 3.0],
                        [2.0, 0.0, 6.0],
                        [3.0, 0.0, 9.0],
                        [4.0, 0.0, 12.0]];

-- Remove constant features (threshold=0)
MACHINE vt = machine.variance_threshold(0.0);
List[List[FLOAT]] X_new = vt.fit_transform(X);
show(X_new);  -- [[1.0, 3.0], [2.0, 6.0], [3.0, 9.0], [4.0, 12.0]]
-- Feature 1 (constant with value 0) was removed.

show(vt.variances_);       -- [1.25, 0.0, 10.125]
show(vt.selected_indices_); -- [0, 2]
show(vt.n_features_out_);   -- 2
```

## Implementation Location

- `src/lib/KafeMACHINE/preprocessing/VarianceThreshold.py`

## Public API

- `machine.variance_threshold(threshold)` — creates a `VarianceThreshold` instance with the given threshold (default: 0.0).
- `vt.fit(X)` — calculates variances and selects features.
- `vt.transform(X)` — removes low-variance features.
- `vt.fit_transform(X)` — fits the transformer and transforms the data.
- `vt.variances_` — variance of each feature.
- `vt.selected_indices_` — indices of selected features.
- `vt.n_features_in_` — number of input features.
- `vt.n_features_out_` — number of output features.

## References

- scikit-learn VarianceThreshold: https://scikit-learn.org/stable/modules/generated/sklearn.feature_selection.VarianceThreshold.html
- Guyon, I. & Elisseeff, A. (2003). An Introduction to Variable and Feature Selection. JMLR.
