# SimpleImputer

## Name

SimpleImputer

## Category

ML preprocessing

## Description

SimpleImputer replaces missing values (NaN) using a configurable strategy: mean, median, most frequent value, or a constant. It is an essential first step in many preprocessing pipelines.

## Mathematical Foundation

For each column $j$ containing missing values:

- **mean**: $\hat{x}_j = \frac{1}{n_{\text{valid}}} \sum_{i: x_{ij} \neq \text{NaN}} x_{ij}$
- **median**: $\hat{x}_j = \text{median}(\{x_{ij} : x_{ij} \neq \text{NaN}\})$
- **most_frequent**: $\hat{x}_j = \text{mode}(\{x_{ij} : x_{ij} \neq \text{NaN}\})$
- **constant**: $\hat{x}_j = c$ (a constant supplied by the user)

- **Time complexity**: $O(n \cdot d)$ for `fit` (computing statistics) and $O(n \cdot d)$ for `transform`.
- **Space complexity**: $O(d)$ for storing per-column statistics.

## Step-by-Step Algorithm

1. **`fit(X)`**: Compute the selected statistic (mean, median, or mode) for each column, ignoring NaN values.
2. **`transform(X)`**: Replace each NaN in a column with that column's computed statistic.
3. **`fit_transform(X)`**: Run `fit` and `transform` in one step.

## Motivation

Real-world data frequently contains missing values. SimpleImputer provides a consistent, reproducible way to handle them so models do not fail or produce invalid results.

## Advantages

- Multiple strategies: mean, median, most frequent, and constant.
- Integrates with Pipeline to prevent data leakage.
- Validates numeric types for mean and median strategies.
- Simple and predictable.

## Limitations

- Does not capture imputation uncertainty; all imputed values in a column are identical.
- The mean and median can distort a feature's distribution.
- Does not use relationships between features to impute values.

## When to Use

- Data with missing values that must be imputed before modeling.
- As a step in a preprocessing Pipeline.
- When a simple mean or median strategy is appropriate.

## When NOT to Use

- When missingness patterns are informative (MCAR, MAR, or MNAR).
- When multivariate imputation is required (for example, KNNImputer or IterativeImputer).

## Dependencies

- BaseMachine
- PARDOS DataFrame integration

## Related Concepts

- `standard-scaler.md`
- `minmax-scaler.md`
- `pipeline.md`

## Relationship with KAFE

In KAFE, SimpleImputer is implemented as a class extending BaseMachine. It supports both native lists and PARDOS DataFrames. The `machine.simple_imputer(strategy)` factory creates an instance with the selected strategy.

## Usage Examples

```kafe
import machine;

-- Impute with the mean
MACHINE imp = machine.simple_imputer("mean");
PARDOS imputed = imp.fit_transform(df);

-- Impute with a constant value
MACHINE imp_c = machine.simple_imputer_constant(0.0);
PARDOS imputed_c = imp_c.fit_transform(df);
```

## Implementation Location

- `src/lib/KafeMACHINE/preprocessing/SimpleImputer.py`

## Public API

- `machine.simple_imputer(strategy)` creates a SimpleImputer with the selected strategy (`"mean"`, `"median"`, or `"most_frequent"`).
- `machine.simple_imputer_constant(value)` creates a SimpleImputer with a constant strategy.
- `imp.fit(X)` computes per-column statistics.
- `imp.transform(X)` imputes missing values.
- `imp.fit_transform(X)` runs fit and transform.
- `imp.statistics_` contains the computed per-column statistics.

## References

- scikit-learn SimpleImputer: https://scikit-learn.org/stable/modules/generated/sklearn.impute.SimpleImputer.html
