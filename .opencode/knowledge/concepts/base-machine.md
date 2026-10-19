# BaseMachine

## Category

Machine Learning — Library Infrastructure

## Description

BaseMachine is the abstract base class for all KafeMACHINE models. It provides the common API contract (fit/predict/transform), input validation, and fitted-state guards.

**Core Contract**:
- `fit(X, y=None)` — Learn from training data. Sets `_is_fitted = True`.
- `predict(X)` — Predict classes/values. Raises if not fitted.
- `score(X, y)` — Evaluate model performance.
- `transform(X)` — Transform data. Raises if not implemented.
- `fit_transform(X)` — Convenience: fit then transform.
- `inverse_transform(X)` — Reverse transformation. Raises if not implemented.

**Input Handling**:
- Accepts `List[List[FLOAT]]` matrices or `PARDOS` DataFrames
- `_unwrap_data(data)` extracts raw data and column names from DataFrames
- Single-feature input `List[FLOAT]` is auto-reshaped to `List[List[FLOAT]]`

**Fitted-State Guard**:
- `_check_fitted(method_name)` raises `"{ClassName}: Must call fit before {method_name}"` if `_is_fitted` is False
- Prevents calling predict/transform before training

## Motivation

A base class enforces consistency across all models. Every KafeMACHINE model has the same interface, making them interchangeable in pipelines and reducing code duplication.

## Dependencies

- `lib.KafePARDOS.DataFrame` — DataFrame support for `_unwrap_data`

## Related Concepts

- scikit-learn BaseEstimator pattern
- Factory pattern (funciones.py creates instances)
- fit/predict/transform API contract

## Implementation Location

- `src/lib/KafeMACHINE/BaseMachine.py` — class `BaseMachine`

## Public API

- Methods: `fit()`, `predict()`, `score()`, `transform()`, `fit_transform()`, `inverse_transform()`
- Attributes: `_is_fitted`
