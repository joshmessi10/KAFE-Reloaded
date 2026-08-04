# KafeMACHINE Library (Machine Learning)

## Overview

scikit-learn-style ML models and evaluation metrics, implemented from scratch inside KAFE.

## Structure

- `src/lib/KafeMACHINE/funciones.py` — public factory functions (the `machine` API).
- `src/lib/KafeMACHINE/BaseMachine.py` — base model class shared by models.
- Models: `LinearRegression.py`, `LogisticRegression.py`, `KNN.py`, `PCA.py`, `DecisionTree.py`.
- Preprocessing: `StandardScaler.py`, `MinMaxScaler.py`, `SimpleImputer.py`, `LabelEncoder.py`, `OneHotEncoder.py`.
- Metrics: `metrics.py`.

## Public API (factories)

- `machine.linear_regression()`
- `machine.logistic_regression(lr, iter)`
- `machine.knn(k)`
- `machine.decision_tree_classifier(criterion, max_depth, min_samples_split, min_samples_leaf)`
- `machine.standard_scaler()` / `machine.minmax_scaler()` / `machine.simple_imputer(strategy)`
- `machine.label_encoder()` / `machine.one_hot_encoder()`
- `machine.pca(n)`
- Classification metrics: `accuracy_score`, `precision_score`, `recall_score`, `f1_score`, `confusion_matrix`, `classification_report`.
- Regression metrics: `mean_squared_error`, `mean_absolute_error`, `root_mean_squared_error`, `r2_score`, `max_error`, `median_absolute_error`, `mean_absolute_percentage_error`, `explained_variance_score`.

## Rules

- New ML algorithms require: documentation, tests, examples, and benchmarks.
- Impact Analysis is mandatory before adding ML algorithms.
- Do not import external ML implementations (no sklearn, TensorFlow, PyTorch) — teach via KAFE's own implementation.
- Benchmark generation is mandatory for ML algorithms (see `.opencode/knowledge/engineering.md` — Benchmark Process).

## KafeMACHINE Priorities

Current development is focused on:

- Machine Learning algorithms.
- Deep Learning components.
- Metrics.
- Preprocessing.
- Educational documentation.
- Benchmarks.

Unless explicitly requested otherwise, prioritize improvements in KafeMACHINE over changes to the core language.

## Tests

- Fixtures under `tests/KafeMACHINE/{linear_models,neighbors,tree_models,preprocessing,metrics_classification,metrics_regression}/`, wired in `tests/test_KafeMACHINE.py`.
