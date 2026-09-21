# Current Work

## Feature: GradientBoosting (Gradient Boosting) Classifier & Regressor

**Status:** Implemented and verified

**Changes:**
- Created `src/lib/KafeMACHINE/GradientBoosting.py` — GradientBoostingClassifier and GradientBoostingRegressor from scratch using regression trees, following the scikit-learn API pattern (`fit()`, `predict()`, `score()`)
- Updated `src/lib/KafeMACHINE/__init__.py` — export de GradientBoostingClassifier, GradientBoostingRegressor
- Updated `src/lib/KafeMACHINE/funciones.py` — factory functions `gradient_boosting_classifier()` and `gradient_boosting_regressor()` with check_sig
- Created 6 fixture tests under `tests/KafeMACHINE/boosting/`:
  - `test_gbc_basic` — classify linearly separable 2D data, verify predictions and accuracy
  - `test_gbr_basic` — regress on single-feature data, verify predictions and R²
  - `test_gbc_multifeature` — multi-feature classification with duplicate features
  - `test_gbc_empty.error` — empty input raises exception
  - `test_gbc_multiclass.error` — >2 classes raises exception
  - `test_gbr_empty.error` — empty input raises exception

**Test results:** 6/6 new tests passed. No regressions (9 pre-existing failures in model_selection).

## Previous Feature: AdaBoost (Adaptive Boosting) Classifier

**Status:** Implemented and verified

**Changes:**
- Created `src/lib/KafeMACHINE/AdaBoost.py` — AdaBoostClassifier from scratch using decision stumps, following the scikit-learn API pattern (`fit()`, `predict()`, `score()`)
- Updated `src/lib/KafeMACHINE/__init__.py` — export de AdaBoostClassifier
- Updated `src/lib/KafeMACHINE/funciones.py` — factory function `ada_boost_classifier()` with check_sig
- Updated `tests/test_KafeMACHINE.py` — added "boosting" to SUBDIRS
- Created 6 fixture tests under `tests/KafeMACHINE/boosting/`:
  - `test_adaboost_basic` — classify linearly separable 2D data, verify predictions and accuracy
  - `test_adaboost_estimators` — verify estimator count matches n_estimators, verify accuracy
  - `test_adaboost_multifeature` — multi-feature classification with duplicate features
  - `test_adaboost_learning_rate` — verify different learning rates both achieve accuracy on simple data
  - `test_adaboost_empty.error` — empty input raises exception
  - `test_adaboost_multiclass.error` — >2 classes raises exception

**Test results:** 6/6 new tests passed. No regressions (1 pre-existing failure in model_selection).
