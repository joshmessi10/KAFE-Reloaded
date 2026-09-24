# MinMaxScaler

## Name

MinMaxScaler

## Category

ML preprocessing

## Description

`MinMaxScaler` scales each feature to a fixed range, [0, 1] by default. It applies the linear transformation $X_{norm} = (X - X_{min}) / (X_{max} - X_{min})$.

## Mathematical Foundation

For each feature $j$:

$$X_{ij}^{norm} = \frac{X_{ij} - \min(X_j)}{\max(X_j) - \min(X_j)}$$

Here, $\min(X_j)$ and $\max(X_j)$ are the minimum and maximum of feature $j$ in the training set.

- **Time Complexity**: $O(n \cdot d)$ for `fit` and $O(n \cdot d)$ for `transform`.
- **Space Complexity**: $O(d)$ to store the minimum and maximum of each feature.

## Step-by-Step Algorithm

1. **`fit(X)`**: Calculate $\min(X_j)$ and $\max(X_j)$ for each feature $j$.
2. **`transform(X)`**: Apply $(X_j - \min_j) / (\max_j - \min_j)$ to each feature.
3. **`inverse_transform(X_norm)`**: Recover each feature using $X_j = X_j^{norm} \cdot (\max_j - \min_j) + \min_j$.

## Motivation

`MinMaxScaler` is useful when data must fall within a fixed range, such as inputs expected by a neural network, or when the data distribution is not Gaussian.

## Advantages

- Preserves the shape of the original distribution.
- Guarantees an exact range for the scaled data.
- Supports straightforward inversion with `inverse_transform`.
- Fast element-wise operations.

## Limitations

- Sensitive to outliers, which can compress all other values.
- Does not center the data, so the mean is not necessarily zero.
- Sensitive to changes in the data range.

## When to Use

- When a fixed range such as [0, 1] or [-1, 1] is required.
- When the distribution is not Gaussian.
- For neural networks with sigmoid activations.

## When NOT to Use

- When significant outliers are present (consider `StandardScaler` or `RobustScaler`).
- When zero mean and unit variance are required.

## Dependencies

- BaseMachine

## Related Concepts

- standard-scaler
- base-machine

## Relationship with KAFE

In KAFE, `MinMaxScaler` is implemented as a class that extends `BaseMachine`. The factory `machine.minmax_scaler()` creates an instance without parameters.

## Usage Examples

```kafe
import machine;

MACHINE mms = machine.minmax_scaler();
List[List[FLOAT]] scaled = mms.fit_transform(data);
show(scaled);  -- values in [0, 1]

List[List[FLOAT]] original = mms.inverse_transform(scaled);
show(original);  -- original values
```

## Implementation Location

- `src/lib/KafeMACHINE/preprocessing/MinMaxScaler.py`

## Public API

- `machine.minmax_scaler()` — creates a `MinMaxScaler` instance.
- `mms.fit(X)` — computes the minimum and maximum.
- `mms.transform(X)` — scales features to [0, 1].
- `mms.fit_transform(X)` — fits the scaler and transforms the data.
- `mms.inverse_transform(X)` — reverses the scaling.
- `mms.data_min_` — minimum for each feature.
- `mms.data_max_` — maximum for each feature.
- `mms.scale_` — scale for each feature.

## References

- scikit-learn MinMaxScaler: https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.MinMaxScaler.html
