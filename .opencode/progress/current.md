# Current Work

## Test: Perceptron Simple OR gate (KafeGESHA PerceptronSimple)

**Status:** in_progress

**Feature:** Fixture de test `tests/KafeGESHA/PerceptronSimple/or_gate.kf` + `or_gate.expec` — red neuronal (perceptron simple) para la compuerta OR con KafeGESHA, con semilla fija para reprodrucibilidad.

**Current step:** Builder crea fixture y genera .expec determinista
**Next step:** Tester valida pytest; Reviewer /dod; Historian registra
**Blockers:** None
**Related ADRs:** None

---

## Fix: model_selection test fixtures and test_Algorithms error support

**Status:** Implemented and verified

**Root cause (compound):**
1. **Grammar syntax errors in `.kf` files**: Bare `List` type used instead of `List[TYPE]`; lowercase `true`/`false` instead of `True`/`False`; `length()` instead of `len()`.
2. **Missing API**: `cross_val_score_wrapper` doesn't exist — the factory is `machine.cross_val_score(cv, scoring, random_state)`.
3. **Source bug**: `CrossValScore` class didn't extend `BaseMachine`, causing `KeyError` in `TypeUtils.obtener_tipo_dato()` when storing as `MACHINE` variable.
4. **Wrong file extensions**: 3 error tests had `.kf` instead of `.error.kf`, so `test_Algorithms.py` couldn't discover them.
5. **Missing test handler**: `test_Algorithms.py` had no `test_invalid_programs` function.
6. **Wrong `.expec` content**: `train_test_split_shuffle.expec` expected lowercase `true` but KAFE outputs `True`; error `.expec` files missing `Exception: machine:` prefix; `cross_val_score_basic.expec` expected wrong R2 values.
7. **KAFE grammar requirement**: `for` loops need trailing `;` after their block (`program: (stmt SEMI)*`).

**Changes:**
- Fixed `tests/Algorithms/model_selection/k_fold_basic.kf` — inline calls, `False`, `len()`
- Fixed `tests/Algorithms/model_selection/k_fold_coverage.kf` — `List[INT]`, `for` loop with parentheses and trailing `;`, `False`, `len()`
- Fixed `tests/Algorithms/model_selection/cross_val_score_basic.kf` — `cross_val_score` (not `cross_val_score_wrapper`), `len()`
- Fixed `tests/Algorithms/model_selection/train_test_split_basic.kf` — inline calls, `True`, `len()`
- Fixed `tests/Algorithms/model_selection/train_test_split_shuffle.kf` — inline calls, `True`
- Renamed `error_test_size.kf` → `error_test_size.error.kf`, fixed `True`
- Renamed `error_empty.kf` → `error_empty.error.kf`, fixed `True`
- Renamed `error_kfold_splits.kf` → `error_kfold_splits.error.kf`, fixed `False`
- Updated 3 `.error.expec` files to include `Exception: machine:` prefix
- Updated `train_test_split_shuffle.expec` to `True\nTrue\n`
- Updated `cross_val_score_basic.expec` to `[1.0, 1.0, 1.0]\n3` (perfect R2 for y=x data)
- Fixed `src/lib/KafeMACHINE/model_selection/model_selection.py` — `CrossValScore` now extends `BaseMachine` (with `super().__init__()`)
- Added `test_invalid_programs` to `tests/test_Algorithms.py` with `get_invalid_programs` import

**Test results:** 485/485 passed. No regressions.

---

## Fix: test_train_test_split_basic pre-existing failure

**Status:** Implemented and verified

**Root cause (compound):**
1. **Grammar bug in `.kf` file**: `List result = ...` is invalid KAFE syntax — the grammar requires `List[Type]` (line 186 of Kafe_Grammar.g4). The parser threw a "Scientific Notation Error" because it expected `[` after `List`.
2. **check_sig bug in `src/global_utils.py`**: The dict-format `check_sig` decorator iterates over `tipos_definidos` as an iterable. When the type is a scalar string (e.g., `flotante_t = "FLOAT"`), it iterated character-by-character (`'F'`, `'L'`, `'O'`, `'A'`, `'T'`), causing a false type mismatch.

**Changes:**
- Fixed `tests/KafeMACHINE/model_selection/test_train_test_split_basic.kf` — replaced invalid `List result` declaration with direct indexing into `train_test_split` call result; fixed `length` → `len` and `true` → `True`.
- Fixed `src/global_utils.py` line 126 — added `isinstance(tipos_definidos, str)` guard to wrap scalar type strings in a list before iteration.

**Test results:** 199/199 passed. No regressions.

---

## Feature: LinearDiscriminantAnalysis (LDA)

**Status:** Implemented and verified

**Changes:**
- Created `src/lib/KafeMACHINE/LinearDiscriminantAnalysis.py` — LinearDiscriminantAnalysis from scratch using Jacobi eigenvalue decomposition for S_W^{-1} S_B, following the scikit-learn API pattern (`fit()`, `transform()`, `fit_transform()`, `predict()`, `score()`). Supports dimensionality reduction (maximizes inter-class vs intra-class scatter ratio) and classification (nearest class mean in LDA space).
- Updated `src/lib/KafeMACHINE/__init__.py` — export de LinearDiscriminantAnalysis
- Updated `src/lib/KafeMACHINE/funciones.py` — factory function `linear_discriminant_analysis()` with check_sig (n_components)
- Created 3 fixture tests under `tests/Algorithms/dimensionality_reduction/lda/`:
  - `test_lda_basic` — fit/transform on 2D data with 1 component, verify output dimensions
  - `test_lda_predict` — predict/score on 2D data, verify predictions and accuracy
  - `test_lda_variance_ratio` — 3-class data with 2 components, verify explained_variance_ratio_ and scalings_ lengths

**Test results:** 3/3 new tests passed. No regressions (9 pre-existing failures in model_selection).

## Previous Feature: GaussianMixture (Modelo de Mezcla de Gaussianas)

**Status:** Implemented and verified

**Changes:**
- Created `src/lib/KafeMACHINE/GaussianMixture.py` — GaussianMixture from scratch using EM algorithm (Expectation-Maximization), following the scikit-learn API pattern (`fit()`, `predict()`, `predict_proba()`, `score()`). Includes `aic()` and `bic()` model selection criteria. Uses diagonal covariance assumption.
- Updated `src/lib/KafeMACHINE/__init__.py` — export de GaussianMixture
- Updated `src/lib/KafeMACHINE/funciones.py` — factory function `gaussian_mixture()` with check_sig (n_components, max_iter, tol, random_state)
- Created 4 fixture tests under `tests/KafeMACHINE/clustering/gmm/`:
  - `test_gmm_basic` — fit/predict on 2D data with 2 components, verify labels, weights, and means
  - `test_gmm_predict_proba` — predict_proba on 2D data, verify probability vectors
  - `test_gmm_score` — score (negative log-likelihood) on 2D data
  - `test_gmm_aic_bic` — AIC and BIC model selection criteria on 2D data

**Test results:** 4/4 new tests passed. No regressions (9 pre-existing failures in model_selection).

## Previous Feature: DecisionTreeRegressor & KNNRegressor

**Status:** Implemented and verified

**Changes:**
- Updated `src/lib/KafeMACHINE/DecisionTree.py` — added `DecisionTreeRegressor` class from scratch using MSE as split criterion, following the scikit-learn API pattern (`fit()`, `predict()`, `score()`)
- Updated `src/lib/KafeMACHINE/KNN.py` — added `KNNRegressor` class from scratch supporting uniform and distance weighting, following the scikit-learn API pattern (`fit()`, `predict()`, `score()`)
- Updated `src/lib/KafeMACHINE/__init__.py` — export de DecisionTreeRegressor, KNNRegressor
- Updated `src/lib/KafeMACHINE/funciones.py` — factory functions `decision_tree_regressor()` and `knn_regressor()` with check_sig
- Created 4 fixture tests under `tests/Algorithms/regression/`:
  - `dtr_basic` — single-feature DTR fit/predict/score, verify predictions and R²
  - `dtr_multifeature` — multi-feature DTR with max_depth constraint
  - `knnr_basic` — single-feature KNNR fit/predict/score with k=3, verify predictions and R²
  - `knnr_multifeature` — multi-feature KNNR with k=3

**Test results:** 4/4 new tests passed. No regressions (9 pre-existing failures in model_selection).

## Previous Feature: RobustScaler (Escalamiento Robusto)

**Status:** Implemented and verified

**Changes:**
- Created `src/lib/KafeMACHINE/preprocessing/RobustScaler.py` — RobustScaler from scratch using median and IQR, following the scikit-learn API pattern (`fit()`, `transform()`, `inverse_transform()`, `fit_transform()`)
- Updated `src/lib/KafeMACHINE/preprocessing/__init__.py` — export de RobustScaler
- Updated `src/lib/KafeMACHINE/__init__.py` — export de RobustScaler from preprocessing
- Updated `src/lib/KafeMACHINE/funciones.py` — factory function `robust_scaler()` with check_sig (with_centering, with_scaling, quantile_low, quantile_high)
- Created 4 fixture tests under `tests/KafeMACHINE/preprocessing/robust_scaler/`:
  - `test_robust_scaler_basic` — fit/transform/inverse_transform, verify center_, scale_, scaled data, and roundtrip restoration
  - `test_robust_scaler_inverse` — verify inverse_transform recovers original data
  - `test_robust_scaler_no_center` — with_centering=0, with_scaling=1, verify only IQR scaling applied
  - `test_robust_scaler_no_scale` — with_centering=1, with_scaling=0, verify only median centering applied

**Test results:** 4/4 new tests passed. No regressions (9 pre-existing failures in model_selection).

## Previous Feature: GradientBoosting (Gradient Boosting) Classifier & Regressor

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
