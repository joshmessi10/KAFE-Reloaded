# BaseMachine

## Category

Machine learning — library infrastructure

## Description

`BaseMachine` is the shared base class for KafeMACHINE models and preprocessing components. It provides fitted-state tracking, DataFrame unwrapping, and optional matrix validation helpers. Model and transformer categories retain their own `fit` signatures.

## Core Behavior

- `fit(X, y=None)` marks the component as fitted and returns `self`. Subclasses may define a category-specific signature and call the base implementation when appropriate.
- `predict(X)`, `transform(X)`, `inverse_transform(X)`, and `score(X, y, metric=None)` raise `NotImplementedError` unless a subclass implements them.
- `fit_transform()` is not defined by `BaseMachine`; transformers that support it implement it with their own signature.

## Input Handling

- `_unwrap_data(data)` returns `(matrix, columns, is_dataframe)` for a PARDOS DataFrame, or `(data, [], False)` for other inputs.
- `_validate_matrix_shape(X, expected_features=None)` checks for empty input and inconsistent row widths, converts one-dimensional input into one-feature rows, and can validate an expected feature count.
- The fit contract is semantic rather than syntactic: supervised models may use `fit(X, y)`, unsupervised models `fit(X)`, transformers `fit(data)`, and DataFrame encoders `fit(df, columns)`.

## Fitted-State Guard

- `_check_fitted(method_name)` raises `"{ClassName}: Must call fit before {method_name}"` when `_is_fitted` is false.
- This helper prevents subclasses from transforming or predicting before fitting when they call it in their public methods.

## Motivation

A shared base class keeps common state and input utilities in one place while allowing model and transformer categories to define the signatures their operations require.

## Dependencies

- `lib.KafePARDOS.DataFrame` — DataFrame recognition and unwrapping.

## Related Concepts

- scikit-learn's BaseEstimator pattern.
- Factory pattern — `src/lib/KafeMACHINE/functions.py` creates interpreter-facing instances.
- The KafeMACHINE `fit`/`predict`/`transform` contracts.

## Implementation Location

- `src/lib/KafeMACHINE/BaseMachine.py` — `BaseMachine` class.

## Public API

- Shared methods: `fit()`, `_check_fitted()`, `_unwrap_data()`, and `_validate_matrix_shape()`.
- Default unsupported methods: `predict()`, `transform()`, `inverse_transform()`, and `score()` raise `NotImplementedError`.
- State: `_is_fitted`.
