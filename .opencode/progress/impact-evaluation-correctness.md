# Impact Analysis: Evaluation correctness and Functional gradients

## Affected Modules

- KafeMACHINE SVM probabilities and model selection (`CrossValScore`, `GridSearchCV`, `RandomizedSearchCV`).
- KafeGESHA `Functional.backward` for multiple outputs.
- Public documentation, exact-output SVM fixture, and Python regression tests.

## Risks

- Previously inverted SVM probability columns change numeric outputs and downstream threshold decisions; retain class ordering and verify `argmax` agreement with `predict`.
- Copying fold estimators increases memory use; avoid copying trained state by rejecting already fitted KAFE estimators.
- MSE search results now select the minimum; confirm accuracy and R² still select the maximum.
- Multi-output gradients must retain output order; test independent heads and shared graph behavior.

## Compatibility Impact

- Method signatures remain unchanged. Cross-validation now rejects previously fitted models to prevent data leakage.
- `best_score_` for MSE remains a positive error, but the selected parameter combination changes to the lowest error.
- SVM probability columns now follow `classes_`; prior consumers relying on the inverse order must update.

## Documentation Impact

- Explain fold isolation, unfitted estimator requirement, MSE direction, SVM score order, and Functional single-loss training limit.

## Testing Impact

- Add focused regressions for class order, extreme margins, fold isolation, pretrained estimators, search selection, and multiple output gradients.
- Run the complete test suite, Ruff, and strict MkDocs build.

## Implementation Plan

1. Correct SVM sigmoid and class mapping.
2. Isolate CV folds and prevent pretrained input from contaminating folds.
3. Minimize MSE in both searches.
4. Route gradients separately for each Functional output.
5. Update fixtures, documentation, and verify all tests.
