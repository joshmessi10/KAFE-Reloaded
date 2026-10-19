# StandardScaler

## Name

StandardScaler — standardization (z-score normalization) for feature matrices.

## Category

ML preprocessing — library utility of KafeMACHINE (`.opencode/knowledge/ml-library.md`).

## Description

StandardScaler standardizes each feature so that it has zero mean and unit (population) standard deviation. For a feature column with values `x_1, ..., x_n`, it computes the per-column statistics

- `mean_j = (1/n) Σ_i x_ij`
- `scale_j = sqrt((1/n) Σ_i (x_ij - mean_j)^2)`

and transforms every value with `z = (x - mean) / scale`. The result is a matrix where each column has mean 0 and standard deviation 1 (z-scores).

**Advantages**:

- Puts all features on a comparable scale, which is critical for distance-based and gradient-based models.
- Preserves the shape of each feature's distribution (it is a linear transformation).
- `inverse_transform` recovers the original values exactly, so the transformation is reversible.

**Limitations**:

- Assumes features are meaningful as continuous numeric quantities; it is not appropriate for categorical variables.
- Is sensitive to outliers: because it uses the mean and standard deviation, extreme values can distort the scaling.
- When a column has zero variance (`scale_j == 0`), the division is guarded by returning `0.0` for that column (no rescaling is possible).

## Motivation

Gradient-based and distance-based algorithms (linear/logistic regression, KNN, PCA) are distorted when features have different units or magnitudes. Standardization is a foundational preprocessing step that KafeMACHINE implements from scratch so the transformation is fully understood and teachable, consistent with the project's rule of not importing external ML implementations.

## Dependencies

- `src/lib/KafeMACHINE/BaseMachine.py` — base class providing the fit/transform contract, the `_is_fitted` guard, and `_unwrap_data` (DataFrame-aware).
- `src/lib/KafeMATH/funciones.py` — `sqrt` used for the population standard deviation.
- `src/lib/KafePARDOS/DataFrame.py` — accepts `PARDOS` DataFrames and returns scaled DataFrames preserving columns.
- `TypeUtils.py` / `global_utils.py` — `pardos_t`, `matriz_numeros_t`, `check_sig` for signature validation.
- `src/lib/KafeMACHINE/funciones.py` — `machine.standard_scaler()` factory.

## Related Concepts

- `minmax-scaler` — alternative scaling to a fixed range `[0, 1]` (robust to zero-variance columns, bounded output).
- `simple-imputer` — missing-value handling that usually runs before scaling.
- `label-encoder` / `one-hot-encoder` — categorical encoding that pairs with numeric scaling in a pipeline.
- `pca` — dimensionality reduction that is often applied after standardization.
- Preprocessing family in `.opencode/knowledge/ml-library.md` (Preprocessing section).

## Usage Examples

```kf
import machine;

List[List[FLOAT]] data = [[2.0, 4.0], [4.0, 8.0]];

MACHINE scaler = machine.standard_scaler();
scaler.fit(data);
show(scaler.mean_);      -- [3.0, 6.0]
show(scaler.scale_);     -- [1.0, 2.0]

List[List[FLOAT]] transformed = scaler.transform(data);   -- [[-1.0, -1.0], [1.0, 1.0]]
List[List[FLOAT]] restored = scaler.inverse_transform(transformed);  -- original values

PARDOS df = pardos.DataFrame(["a", "b"], [[2.0, 4.0], [4.0, 8.0]]);
MACHINE scaler2 = machine.standard_scaler();
PARDOS scaled_df = scaler2.fit_transform(df);  -- DataFrame preserves columns
```

Guards: calling `transform`/`inverse_transform` before `fit` raises `StandardScaler: Must call fit before ...`; passing a matrix whose column count differs from the fitted model raises `StandardScaler: Input dimension does not match fitted model`.

## Implementation Location

- `src/lib/KafeMACHINE/StandardScaler.py` (class `StandardScaler(BaseMachine)`).
- Factory: `src/lib/KafeMACHINE/funciones.py` — `standard_scaler()`.
- Tests: `tests/KafeMACHINE/preprocessing/test_standard_scaler{,_list,_single_feature,_zero_variance}.kf` and error fixtures `test_ss_{empty,not_fitted,dim_mismatch}.error.kf`.

## Public API

- Factory: `machine.standard_scaler()`.
- Methods: `fit(data)`, `transform(data)`, `fit_transform(data)`, `inverse_transform(data)`.
- Attributes after fit: `mean_` (per-column mean), `scale_` (per-column population standard deviation), `_is_fitted`.
- Accepted input: a `PARDOS` DataFrame or a `List[List[FLOAT]]` matrix of numbers; DataFrame inputs return DataFrames, lists return lists.

## References

- scikit-learn documentation — `sklearn.preprocessing.StandardScaler`.
- `.opencode/knowledge/concepts/concept-template.md`.
- `.opencode/knowledge/ml-library.md` (KafeMACHINE priorities include preprocessing).
