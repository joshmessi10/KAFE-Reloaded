# Current Work

## Feature: VarianceThreshold y RecursiveFeatureElimination

**Status:** Implemented and verified

**Changes:**
- Created `src/lib/KafeMACHINE/preprocessing/VarianceThreshold.py` — elimina features con varianza por debajo de un umbral
- Created `src/lib/KafeMACHINE/preprocessing/RecursiveFeatureElimination.py` — seleccion de features por eliminacion recursiva usando importancia de coeficientes
- Updated `src/lib/KafeMACHINE/preprocessing/__init__.py` — exports de las nuevas clases
- Updated `src/lib/KafeMACHINE/__init__.py` — exports de las nuevas clases
- Updated `src/lib/KafeMACHINE/funciones.py` — factory functions `variance_threshold()` y `recursive_feature_elimination()`
- Created 3 fixture tests for VarianceThreshold under `tests/KafeMACHINE/preprocessing/variance_threshold/`:
  - `vt_remove_constant` — elimina feature constante (varianza 0)
  - `vt_high_threshold` — umbral alto filtra feature con baja varianza
  - `vt_keep_all` — umbral 0 conserva todas las features con varianza > 0
- Created 2 fixture tests for RFE under `tests/Algorithms/rfe/`:
  - `rfe_basic` — selecciona 2 de 3 features, verifica selected_indices_, support_, transform
  - `rfe_single_feature` — selecciona 1 feature, verifica ranking_

**Test results:** 5/5 new tests passed. No regressions (9 pre-existing failures in model_selection).
