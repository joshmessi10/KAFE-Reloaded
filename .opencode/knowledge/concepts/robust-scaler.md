# RobustScaler

## Name

RobustScaler — outlier-robust feature scaling using median and IQR.

## Category

ML preprocessing — library utility of KafeMACHINE (`.opencode/knowledge/ml-library.md`).

## Description

RobustScaler scales each feature using statistics that are robust to outliers: the median (Q2) for centering and the Interquartile Range (IQR = Q3 − Q1) for scaling. Unlike StandardScaler (which uses mean and standard deviation) or MinMaxScaler (which uses min and max), RobustScaler is not influenced by extreme values.

The transformation is: `X_scaled = (X − median) / IQR`

**Advantages**:

- Robust to outliers — median and IQR are not affected by extreme values.
- Simple and interpretable — easy to understand the transformation.
- Flexible — can center only, scale only, or both via `with_centering` and `with_scaling` parameters.
- Reversible — `inverse_transform` restores original values exactly.

**Limitations**:

- Assumes a roughly symmetric distribution; may not be ideal for highly skewed data.
- Loses the original scale (as does any scaling transformation).
- Does not produce standardized output (mean ≠ 0, std ≠ 1).

## Motivation

StandardScaler and MinMaxScaler are sensitive to outliers because they use mean/std and min/max respectively. When datasets contain extreme values, these scalers produce distorted transformations where most data points are compressed into a small range. RobustScaler solves this by using statistics that ignore extreme values, making it the preferred choice for datasets with outliers.

## Dependencies

- `src/lib/KafeMACHINE/BaseMachine.py` — base class providing the fit/transform contract, the `_is_fitted` guard, and `_unwrap_data` (DataFrame-aware).
- `src/lib/KafePARDOS/DataFrame.py` — accepts `PARDOS` DataFrames and returns scaled DataFrames preserving columns.
- `TypeUtils.py` / `global_utils.py` — `pardos_t`, `matriz_numeros_t`, `check_sig` for signature validation.
- `src/lib/KafeMACHINE/funciones.py` — `machine.robust_scaler()` factory.

## Related Concepts

- `standard-scaler` — uses mean/std, sensitive to outliers.
- `minmax-scaler` — uses min/max, sensitive to outliers.
- `simple-imputer` — missing-value handling that usually runs before scaling.
- `label-encoder` / `one-hot-encoder` — categorical encoding that pairs with numeric scaling in a pipeline.
- Preprocessing family in `.opencode/knowledge/ml-library.md` (Preprocessing section).

## Usage Examples

```kf
import machine;

List[List[FLOAT]] data = [[1.0, 4.0], [3.0, 6.0], [5.0, 100.0]];

MACHINE scaler = machine.robust_scaler();
List[List[FLOAT]] scaled = scaler.fit_transform(data);
show(scaler.center_);   -- [3.0, 6.0] (medians)
show(scaler.scale_);    -- [4.0, 94.0] (IQRs)

List[List[FLOAT]] restored = scaler.inverse_transform(scaled);
show(restored);  -- [[1.0, 4.0], [3.0, 6.0], [5.0, 100.0]]

-- Center only (no IQR scaling)
MACHINE scaler_c = machine.robust_scaler(1, 0);
List[List[FLOAT]] centered = scaler_c.fit_transform(data);

-- Scale only (no median centering)
MACHINE scaler_s = machine.robust_scaler(0, 1);
List[List[FLOAT]] scaled_only = scaler_s.fit_transform(data);
```

Guards: calling `transform`/`inverse_transform` before `fit` raises `RobustScaler: Must call fit before ...`; passing a matrix whose column count differs from the fitted model raises `RobustScaler: Input dimension does not match fitted model`.

## Mathematical Foundation

### Formula

$$X_{scaled} = \frac{X - \text{median}}{IQR}$$

Where:
- $\text{median} = Q2$ (percentil 50)
- $IQR = Q3 - Q1$ (percentil 75 − percentil 25)

### Why median/IQR instead of mean/std?

| Statistic | Sensitive to outliers | Robust |
|-----------|----------------------:|-------:|
| Mean | Yes | No |
| Median | No | Yes |
| Standard deviation | Yes | No |
| IQR | No | Yes |

### Percentile computation

KAFE computes percentiles using linear interpolation on sorted data:

```
k = (p / 100) * (n - 1)
f = floor(k)
c = k - f
percentile = sorted[f] + c * (sorted[f+1] - sorted[f])
```

## Complexity

| Operation | Time | Space |
|-----------|------|-------|
| fit | O(n · m · log n) | O(m) |
| transform | O(n · m) | O(n · m) |
| inverse_transform | O(n · m) | O(n · m) |

Where n = samples, m = features. The log n factor comes from sorting each column during `fit`.

## Implementation Location

- `src/lib/KafeMACHINE/preprocessing/RobustScaler.py` (class `RobustScaler(BaseMachine)`).
- Factory: `src/lib/KafeMACHINE/funciones.py` — `robust_scaler()`.
- Tests: `tests/KafeMACHINE/preprocessing/robust_scaler/` (4 fixtures).

## Public API

- Factory: `machine.robust_scaler(with_centering, with_scaling, quantile_low, quantile_high)`.
- Methods: `fit(data)`, `transform(data)`, `fit_transform(data)`, `inverse_transform(data)`.
- Attributes after fit: `center_` (per-column median), `scale_` (per-column IQR), `_is_fitted`.
- Accepted input: a `PARDOS` DataFrame or a `List[List[FLOAT]]` matrix of numbers; DataFrame inputs return DataFrames, lists return lists.

## References

- scikit-learn documentation — `sklearn.preprocessing.RobustScaler`.
- `.opencode/knowledge/concepts/concept-template.md`.
- `.opencode/knowledge/ml-library.md` (KafeMACHINE priorities include preprocessing).
