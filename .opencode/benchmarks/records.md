# Benchmark Records

This file consolidates all benchmark records for KAFE. Individual benchmark files have been merged here to reduce file accumulation.

## Benchmark Index

| Benchmark | Component | Category | Date | Status |
|-----------|-----------|----------|------|--------|
| DecisionTreeClassifier | `src/lib/KafeMACHINE/tree/DecisionTree.py` | ML algorithm | 2026-08-04 | Baseline |
| KafeMACHINE Full Suite | `src/lib/KafeMACHINE/` (all models) | ML algorithm | 2026-08-04 | Baseline |
| OrdinalEncoder | `src/lib/KafeMACHINE/preprocessing/OrdinalEncoder.py` | ML preprocessing | 2026-09-02 | Baseline |
| KafeGESHA Full Suite | `src/lib/KafeGESHA/` (all DL components) | DL component | 2026-09-02 | Baseline |
| GaussianNB | `src/lib/KafeMACHINE/naive_bayes/GaussianNB.py` | ML algorithm | 2026-09-14 | Baseline |
| GaussianMixture | `src/lib/KafeMACHINE/clustering/GaussianMixture.py` | ML algorithm | 2026-09-21 | Baseline |
| RandomForest | `src/lib/KafeMACHINE/tree/RandomForest.py` | ML algorithm | 2026-09-14 | Baseline |
| RidgeRegression | `src/lib/KafeMACHINE/linear/RidgeRegression.py` | ML algorithm | 2026-09-14 | Baseline |
| LassoRegression | `src/lib/KafeMACHINE/linear/LassoRegression.py` | ML algorithm | 2026-09-14 | Baseline |
| SVR | `src/lib/KafeMACHINE/linear/SVR.py` | ML algorithm | 2026-09-14 | Baseline |
| SVM | `src/lib/KafeMACHINE/svm/SVM.py` | ML algorithm | 2026-09-21 | Baseline |
| ModelSelection | `src/lib/KafeMACHINE/model_selection/model_selection.py` | ML utility | 2026-09-18 | Baseline |
| GridSearchCV | `src/lib/KafeMACHINE/model_selection/model_selection.py` (GridSearchCV) | ML utility | 2026-09-18 | Baseline |
| RandomizedSearchCV | `src/lib/KafeMACHINE/model_selection/model_selection.py` (RandomizedSearchCV) | ML utility | 2026-09-18 | Baseline |
| Pipeline | `src/lib/KafeMACHINE/model_selection/model_selection.py` (Pipeline) | ML utility | 2026-09-18 | Baseline |
| PolynomialFeatures | `src/lib/KafeMACHINE/preprocessing/PolynomialFeatures.py` | ML preprocessing | 2026-09-21 | Baseline |
| ElasticNet | `src/lib/KafeMACHINE/linear/ElasticNet.py` | ML algorithm | 2026-09-21 | Baseline |
| AgglomerativeClustering | `src/lib/KafeMACHINE/clustering/AgglomerativeClustering.py` | ML algorithm | 2026-09-21 | Baseline |
| AdaBoost | `src/lib/KafeMACHINE/ensemble/AdaBoost.py` | ML algorithm | 2026-09-21 | Baseline |
| GradientBoostingClassifier | `src/lib/KafeMACHINE/ensemble/GradientBoosting.py` (Classifier) | ML algorithm | 2026-09-21 | Baseline |
| GradientBoostingRegressor | `src/lib/KafeMACHINE/ensemble/GradientBoosting.py` (Regressor) | ML algorithm | 2026-09-21 | Baseline |
| RobustScaler | `src/lib/KafeMACHINE/preprocessing/RobustScaler.py` | ML preprocessing | 2026-09-21 | Baseline |
| DecisionTreeRegressor | `src/lib/KafeMACHINE/tree/DecisionTree.py` (Regressor) | ML algorithm | 2026-09-21 | Baseline |
| KNNRegressor | `src/lib/KafeMACHINE/neighbors/KNN.py` (Regressor) | ML algorithm | 2026-09-21 | Baseline |
| Tutor conversation persistence | `kafe-vscode/src/tutor/` | Performance optimization | 2026-10-27 | Controlled in-memory comparison at `86b78ff` |

---

## Adding a Benchmark

When the Tester runs `/benchmark`:

1. Determine the component category (ML algorithm, DL component, performance optimization)
2. Add a new section to this file using the format below
3. Update the index table above with the new benchmark

### Benchmark Entry Format

Within this file, use this format for each benchmark:

```markdown
---

### Benchmark: <Component Name>

- **Date**: YYYY-MM-DD
- **Component**: `src/lib/...` module
- **Category**: ML algorithm / DL component / performance optimization
- **Purpose**: <what is measured and why>

#### Setup

- **Dataset**: <dataset or workload description>
- **Hardware**: <CPU/GPU, RAM>
- **Environment**: <Python version, OS, dependency versions>

#### Methodology

- <reproducible steps: how the benchmark is run, iterations, warmup, metrics captured>

#### Results

| Metric | Value |
|--------|-------|
| Runtime | <seconds / ms> |
| Memory | <MB / peak> |
| Dataset | <dataset and size used> |
| Hardware | <hardware the run used> |
| Comparison | <vs baseline or previous version> |

#### Conclusions

- <findings, regressions, performance notes>

#### Related

- Related tests, ADR records, docs, or knowledge concepts.
```

---

### Benchmark: DecisionTreeClassifier

- **Date**: 2026-08-04
- **Component**: `src/lib/KafeMACHINE/tree/DecisionTree.py`
- **Category**: ML algorithm
- **Purpose**: Baseline performance characterization of the from-scratch Decision Tree implementation

#### Setup

- **Dataset**: Synthetic 2D classification data (100 samples, 2 features, 2 classes)
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- Fit DecisionTreeClassifier on training data with default parameters (gini, max_depth=0)
- Measure fit time and predict time over 10 iterations
- Record memory footprint of the tree structure

#### Results

| Metric | Value |
|--------|-------|
| Fit time (100 samples) | < 0.01s |
| Predict time (10 samples) | < 0.001s |
| Memory | Negligible (dict-based tree) |
| Dependencies | None (pure Python + KafeMATH log) |

#### Conclusions

- The implementation is suitable for educational purposes and small-to-medium datasets
- Gini impurity is slightly faster than Entropy (no log computation)
- Tree depth is controlled by max_depth parameter to prevent overfitting

#### Related

- Tests: `tests/KafeMACHINE/tree/`
- Knowledge: `.opencode/knowledge/concepts/decision-tree.md`

---

### Benchmark: KafeMACHINE — Full Suite Characterization

- **Date**: 2026-08-04
- **Component**: `src/lib/KafeMACHINE/` (all models)
- **Category**: ML algorithm
- **Purpose**: Baseline performance characterization of all KafeMACHINE implementations

#### Setup

- **Dataset 1 (Linear)**: 100 samples, 1 feature, y = 2x + noise
- **Dataset 2 (Classification)**: 200 samples, 4 features, 2 classes (Iris-like)
- **Dataset 3 (Multi-class)**: 150 samples, 2 features, 3 classes
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each model: fit on training data, predict on test data, measure time
- 10 iterations per model, report mean time
- Memory measured via object size estimation

#### Results

| Model | Fit Time | Predict Time | Accuracy | Memory |
|-------|----------|--------------|----------|--------|
| LinearRegression | < 0.005s | < 0.001s | R² > 0.95 | ~1KB |
| LogisticRegression | < 0.5s | < 0.001s | > 0.90 | ~1KB |
| KNN (k=3) | < 0.001s | < 0.01s | > 0.90 | O(n·d) |
| DecisionTree | < 0.01s | < 0.001s | > 0.85 | O(nodes) |
| StandardScaler | < 0.001s | < 0.001s | N/A | ~1KB |
| MinMaxScaler | < 0.001s | < 0.001s | N/A | ~1KB |
| PCA (2 components) | < 0.01s | < 0.001s | N/A | O(d²) |

#### Conclusions

- LinearRegression is fastest (closed-form solution)
- KNN prediction is O(n) — slow on large datasets
- DecisionTree training is O(n·d·log n) — competitive for small datasets
- All models suitable for educational purposes
- No external dependencies required

#### Related

- Tests: `tests/KafeMACHINE/`
- Knowledge: `.opencode/knowledge/concepts/`

---

### Benchmark: OrdinalEncoder

- **Date**: 2026-09-02
- **Component**: `src/lib/KafeMACHINE/preprocessing/OrdinalEncoder.py`
- **Category**: ML preprocessing
- **Purpose**: Baseline performance characterization of the from-scratch OrdinalEncoder implementation

#### Setup

- **Dataset 1**: 4 samples, 3 columns (color, size, label) — basic multi-column encoding
- **Dataset 2**: 50 samples, 5 categorical columns — medium workload
- **Dataset 3**: Edge cases — single sample, single column, empty categories
- **Dataset 4**: 200 samples, 10 categorical columns with 20+ unique values each
- **Dataset 5**: 1000 samples, 3 columns with 100 unique categories each — stress test
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create PARDOS DataFrame, run fit_transform, measure time
- 10 iterations per scenario, report mean time
- Verify inverse_transform correctness on each scenario
- Memory estimated via object size

#### Results

| Scenario | Dataset Size | Columns | Categories/Col | Runtime | Inverse Correct | Status |
|----------|-------------|---------|----------------|---------|-----------------|--------|
| Basic (3-col) | 4 rows | 3 | 3-4 | < 0.001s | Yes | Pass |
| Medium (50×5) | 50 rows | 5 | 5-10 | < 0.005s | Yes | Pass |
| Edge: single column | 5 rows | 1 | 3 | < 0.001s | Yes | Pass |
| Multi-feature (200×10) | 200 rows | 10 | 20+ | < 0.01s | Yes | Pass |
| Stress (1000×3) | 1000 rows | 3 | 100 | < 0.02s | Yes | Pass |

#### Conclusions

- Encoding is O(n·d) per scenario — linear in rows × columns, as expected from dictionary lookups
- Inverse transform is equally fast (index-based lookup)
- The implementation handles small educational datasets with negligible runtime
- Stress test confirms scalability to 1000+ rows without performance degradation
- No external dependencies; pure Python + PARDOS DataFrame

#### Related

- Tests: `tests/KafeMACHINE/preprocessing/`
- Knowledge: `.opencode/knowledge/concepts/ordinal-encoder.md`
- Implementation: `src/lib/KafeMACHINE/preprocessing/OrdinalEncoder.py`

---

### Benchmark: KafeGESHA — Deep Learning Suite Characterization

- **Date**: 2026-09-02
- **Component**: `src/lib/KafeGESHA/` (all DL components)
- **Category**: DL component
- **Purpose**: Baseline performance characterization of all KafeGESHA from-scratch deep learning implementations

#### Setup

- **Dataset 1 (Binary)**: 4 samples, 2 features, AND gate
- **Dataset 2 (Regression)**: 5 samples, 1 feature, y = 3x + 1
- **Dataset 3 (Multiclass)**: 6 samples, 2 features, 3 classes
- **Dataset 4 (Clustering)**: 6 samples, 2 features, 2 clusters
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, no external dependencies

#### Methodology

- For each model type: create model, compile, fit, predict, measure time
- 10 iterations per model, report mean time
- Memory measured via object size estimation
- Clustering tested with soft k-means neural approach

#### Results

| Component | Model Type | Fit Time (20 epochs) | Predict Time | Memory |
|-----------|-----------|---------------------|--------------|--------|
| Dense + Sigmoid | Binary (AND) | < 0.1s | < 0.001s | ~2KB |
| Dense + Linear | Regression (y=3x+1) | < 0.5s (200 epochs) | < 0.001s | ~1KB |
| Dense + Softmax | Multiclass | < 0.2s | < 0.001s | ~3KB |
| Dense + ReLU/Softmax | Clustering | < 0.3s | < 0.001s | ~5KB |
| Activation Functions | All | < 0.001s each | < 0.001s | ~100B |
| Loss Functions | All | < 0.001s each | < 0.001s | ~200B |
| Optimizers (Adam) | All | < 0.001s/step | N/A | ~500B |

#### Conclusions

- All components suitable for educational purposes
- No external dependencies — pure Python + KafeMATH
- Clustering loss now decreases properly (distance-based targets)
- PARDOS DataFrame integration works for clustering training
- Full backpropagation implemented from scratch

#### Related

- Tests: `tests/KafeGESHA/`
- Knowledge: `.opencode/knowledge/concepts/` (dense-layer, activation-functions, loss-functions, optimizers, soft-kmeans-clustering)
- Implementation: `src/lib/KafeGESHA/`

### GridSearchCV — 2026-09-18

- **Date**: 2026-09-18
- **Component**: `src/lib/KafeMACHINE/model_selection/model_selection.py` (GridSearchCV)
- **Category**: ML utility
- **Purpose**: Baseline performance characterization of GridSearchCV hyperparameter search

#### Setup

- **Scenario 1 (Small grid)**: 6 samples, 2 features, param_grid: 3×2 = 6 combinations, 3-fold CV
- **Scenario 2 (Medium grid)**: 20 samples, 4 features, param_grid: 4×3×2 = 24 combinations, 5-fold CV
- **Scenario 3 (Large grid)**: 50 samples, 6 features, param_grid: 5×4×3 = 60 combinations, 5-fold CV
- **Scenario 4 (Single param)**: 10 samples, 2 features, param_grid: 5 values, 3-fold CV
- **Scenario 5 (High-dimensional)**: 30 samples, 10 features, param_grid: 3×3×3×3 = 81 combinations, 5-fold CV
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create synthetic data, fit GridSearchCV with logistic regression, measure time
- 5 iterations per scenario, report mean time
- Verify best_params_ and best_score_ correctness

#### Results

| Scenario | Combinations | CV Folds | Dataset | Time (ms) | Correct |
|----------|-------------|----------|---------|-----------|---------|
| Small grid | 6 | 3 | 6×2 | <100 | Yes |
| Medium grid | 24 | 5 | 20×4 | <500 | Yes |
| Large grid | 60 | 5 | 50×6 | <2000 | Yes |
| Single param | 5 | 3 | 10×2 | <100 | Yes |
| High-dim | 81 | 5 | 30×10 | <3000 | Yes |

#### Conclusions

- Runtime is O(combinations × folds × T_model) — dominated by model training
- Grid size grows multiplicatively with parameters (exponential)
- Negligible for small grids, significant for large parameter spaces
- No external dependencies; pure Python

#### Related

- Tests: `tests/KafeMACHINE/model_selection/`
- Knowledge: `.opencode/knowledge/concepts/grid-search.md`
- Implementation: `src/lib/KafeMACHINE/model_selection/model_selection.py`

---

### RandomizedSearchCV — 2026-09-18

- **Date**: 2026-09-18
- **Component**: `src/lib/KafeMACHINE/model_selection/model_selection.py` (RandomizedSearchCV)
- **Category**: ML utility
- **Purpose**: Baseline performance characterization of RandomizedSearchCV hyperparameter search

#### Setup

- **Scenario 1 (Small budget)**: 6 samples, 2 features, n_iter=5, 3-fold CV
- **Scenario 2 (Medium budget)**: 20 samples, 4 features, n_iter=15, 5-fold CV
- **Scenario 3 (Large budget)**: 50 samples, 6 features, n_iter=30, 5-fold CV
- **Scenario 4 (Single param)**: 10 samples, 2 features, n_iter=8, 3-fold CV
- **Scenario 5 (High-dimensional)**: 30 samples, 10 features, n_iter=20, 5-fold CV
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create synthetic data, fit RandomizedSearchCV with logistic regression, measure time
- 5 iterations per scenario, report mean time
- Verify best_params_ and best_score_ correctness

#### Results

| Scenario | n_iter | CV Folds | Dataset | Time (ms) | Correct |
|----------|--------|----------|---------|-----------|---------|
| Small budget | 5 | 3 | 6×2 | <100 | Yes |
| Medium budget | 15 | 5 | 20×4 | <300 | Yes |
| Large budget | 30 | 5 | 50×6 | <1500 | Yes |
| Single param | 8 | 3 | 10×2 | <100 | Yes |
| High-dim | 20 | 5 | 30×10 | <1500 | Yes |

#### Conclusions

- Runtime is O(n_iter × folds × T_model) — linear in iterations
- For the same n_iter, faster than GridSearchCV on large grids
- Can explore more parameter combinations for fixed budget
- No external dependencies; pure Python

#### Related

- Tests: `tests/KafeMACHINE/model_selection/`
- Knowledge: `.opencode/knowledge/concepts/randomized-search.md`
- Implementation: `src/lib/KafeMACHINE/model_selection/model_selection.py`

### Pipeline — 2026-09-18

- **Date**: 2026-09-18
- **Component**: `src/lib/KafeMACHINE/model_selection/model_selection.py` (Pipeline)
- **Category**: ML utility
- **Purpose**: Baseline performance characterization of Pipeline chaining preprocessing and model

#### Setup

- **Scenario 1 (Simple)**: 10 samples, 2 features, StandardScaler + LinearRegression
- **Scenario 2 (Multiple transforms)**: 20 samples, 4 features, StandardScaler + PCA(2) + LogisticRegression
- **Scenario 3 (Large dataset)**: 200 samples, 10 features, StandardScaler + LinearRegression
- **Scenario 4 (No preprocessing)**: 10 samples, 2 features, single LogisticRegression (baseline)
- **Scenario 5 (Deep pipeline)**: 50 samples, 6 features, StandardScaler + PCA(3) + RidgeRegression
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create synthetic data, fit Pipeline, predict, measure time
- 5 iterations per scenario, report mean time
- Verify predictions match manual fit/transform/predict chain

#### Results

| Scenario | Steps | Dataset | Time (ms) | Correct |
|----------|-------|---------|-----------|---------|
| Simple | Scaler + LR | 10×2 | <10 | Yes |
| Multiple transforms | Scaler + PCA + LogReg | 20×4 | <50 | Yes |
| Large dataset | Scaler + LR | 200×10 | <100 | Yes |
| No preprocessing | LogReg only | 10×2 | <10 | Yes |
| Deep pipeline | Scaler + PCA + Ridge | 50×6 | <100 | Yes |

#### Conclusions

- Pipeline overhead is negligible — dominated by individual step costs
- Each step adds O(n·d) for transform operations
- Pipeline correctly chains fit_transform for training and transform for prediction
- No external dependencies; pure Python

#### Related

- Tests: `tests/KafeMACHINE/model_selection/`
- Knowledge: `.opencode/knowledge/concepts/pipeline.md`
- Implementation: `src/lib/KafeMACHINE/model_selection/model_selection.py`

---

### Benchmark: SVM — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/svm/SVM.py`
- **Category**: ML algorithm
- **Purpose**: Baseline performance characterization of the from-scratch SVM Classifier implementation

#### Setup

- **Scenario 1 (Binary simple, linear)**: 6 samples, 2 features, 2 classes, C=1.0, kernel="linear"
- **Scenario 2 (Binary 1D, linear)**: 6 samples, 1 feature, 2 classes, C=1.0, kernel="linear"
- **Scenario 3 (RBF kernel)**: 6 samples, 2 features, 2 classes, C=10.0, kernel="rbf"
- **Scenario 4 (Poly kernel)**: 6 samples, 2 features, 2 classes, C=1.0, kernel="poly"
- **Scenario 5 (Larger dataset)**: 40 samples, 4 features, 2 classes, C=1.0, kernel="linear"
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create synthetic linearly separable data, fit SVM, predict, measure time
- 10 iterations per scenario, report mean time
- Verify accuracy on linearly separable data

#### Results

| Scenario | Dataset | n_samples | n_features | Kernel | Accuracy | Time (ms) |
|----------|---------|-----------|------------|--------|----------|-----------|
| Binary simple | 2 clusters | 6 | 2 | linear | 1.0 | <10 |
| Binary 1D | 2 clusters | 6 | 1 | linear | 1.0 | <10 |
| RBF kernel | 2 clusters | 6 | 2 | rbf | 1.0 | <50 |
| Poly kernel | 2 clusters | 6 | 2 | poly | 1.0 | <50 |
| Larger dataset | 2 clusters | 40 | 4 | linear | ~0.95 | <100 |

#### Conclusions

- Linear kernel (primal SGD) is fastest — O(n·m) per iteration
- RBF and poly kernels are slower due to O(n²) kernel matrix computation
- All scenarios achieve high accuracy on linearly separable data
- No external dependencies; pure Python + KafeMATH exp

#### Related

- Tests: `tests/KafeMACHINE/svm/`
- Knowledge: `.opencode/knowledge/concepts/svm.md`
- Implementation: `src/lib/KafeMACHINE/svm/SVM.py`

---

### Benchmark: AgglomerativeClustering — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/clustering/AgglomerativeClustering.py`
- **Category**: ML algorithm
- **Purpose**: Baseline performance characterization of the from-scratch Agglomerative Clustering implementation

#### Setup

- **Scenario 1 (Binary, 2 clusters)**: 6 samples, 2 features, 2 clusters, ward linkage
- **Scenario 2 (3 clusters)**: 9 samples, 2 features, 3 clusters, ward linkage
- **Scenario 3 (Single linkage)**: 6 samples, 2 features, 2 clusters, single linkage
- **Scenario 4 (Complete linkage)**: 6 samples, 2 features, 2 clusters, complete linkage
- **Scenario 5 (Larger dataset)**: 30 samples, 4 features, 3 clusters, average linkage
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create synthetic clustered data, fit AgglomerativeClustering, measure time
- 10 iterations per scenario, report mean time
- Verify cluster assignments are correct on linearly separable data

#### Results

| Scenario | Dataset | n_samples | n_features | n_clusters | Linkage | Time (ms) |
|----------|---------|-----------|------------|------------|---------|-----------|
| Binary, 2 clusters | 2 blobs | 6 | 2 | 2 | ward | <10 |
| 3 clusters | 3 blobs | 9 | 2 | 3 | ward | <10 |
| Single linkage | 2 blobs | 6 | 2 | 2 | single | <10 |
| Complete linkage | 2 blobs | 6 | 2 | 2 | complete | <10 |
| Larger dataset | 3 blobs | 30 | 4 | 3 | average | <100 |

#### Conclusions

- Training is $O(n^3)$ — dominated by distance matrix computation and iterative merge
- All linkage methods produce correct cluster assignments on linearly separable data
- Ward linkage tends to produce equally-sized clusters (minimizes variance)
- Single linkage can produce elongated clusters (chaining effect)
- Runtime grows significantly with dataset size (cubic complexity)
- No external dependencies; pure Python

#### Related

- Tests: `tests/KafeMACHINE/clustering/`
- Knowledge: `.opencode/knowledge/concepts/agglomerative-clustering.md`
- Implementation: `src/lib/KafeMACHINE/clustering/AgglomerativeClustering.py`

---

### Benchmark: AdaBoost — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/ensemble/AdaBoost.py`
- **Category**: ML algorithm
- **Purpose**: Baseline performance characterization of the from-scratch AdaBoostClassifier implementation

#### Setup

- **Scenario 1 (Binary simple)**: 6 samples, 2 features, 2 classes, n_estimators=10
- **Scenario 2 (Binary 1D)**: 6 samples, 1 feature, 2 classes, n_estimators=5
- **Scenario 3 (Low learning rate)**: 6 samples, 2 features, 2 classes, n_estimators=20, learning_rate=0.1
- **Scenario 4 (Larger dataset)**: 40 samples, 4 features, 2 classes, n_estimators=50
- **Scenario 5 (High dimensional)**: 20 samples, 10 features, 2 classes, n_estimators=30
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create synthetic linearly separable data, fit AdaBoostClassifier, predict, measure time
- 10 iterations per scenario, report mean time
- Verify accuracy on linearly separable data

#### Results

| Scenario | Dataset | n_samples | n_features | n_estimators | learning_rate | Accuracy | Time (ms) |
|----------|---------|-----------|------------|--------------|---------------|----------|-----------|
| Binary simple | 2 clusters | 6 | 2 | 10 | 1.0 | 1.0 | <10 |
| Binary 1D | 2 clusters | 6 | 1 | 5 | 1.0 | 1.0 | <10 |
| Low learning rate | 2 clusters | 6 | 2 | 20 | 0.1 | ~0.83 | <10 |
| Larger dataset | 2 clusters | 40 | 4 | 50 | 1.0 | ~0.95 | <50 |
| High dimensional | 2 clusters | 20 | 10 | 30 | 1.0 | ~0.90 | <50 |

#### Conclusions

- Training is O(T · n · m) — linear in estimators, samples, and features
- Negligible runtime for educational-scale scenarios
- Perfect accuracy on small linearly separable data
- Lower learning rate requires more estimators to converge
- No external dependencies; pure Python

#### Related

- Tests: `tests/KafeMACHINE/ensemble/`
- Knowledge: `.opencode/knowledge/concepts/adaboost.md`
- Implementation: `src/lib/KafeMACHINE/ensemble/AdaBoost.py`

---

### Benchmark: GradientBoostingClassifier — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/ensemble/GradientBoosting.py` (GradientBoostingClassifier)
- **Category**: ML algorithm
- **Purpose**: Baseline performance characterization of the from-scratch GradientBoostingClassifier implementation

#### Setup

- **Scenario 1 (Binary simple)**: 6 samples, 2 features, 2 classes, n_estimators=10
- **Scenario 2 (Binary 1D)**: 6 samples, 1 feature, 2 classes, n_estimators=5
- **Scenario 3 (Low learning rate)**: 6 samples, 2 features, 2 classes, n_estimators=20, learning_rate=0.1
- **Scenario 4 (Larger dataset)**: 40 samples, 4 features, 2 classes, n_estimators=50
- **Scenario 5 (High dimensional)**: 20 samples, 10 features, 2 classes, n_estimators=30
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create synthetic linearly separable data, fit GradientBoostingClassifier, predict, measure time
- 10 iterations per scenario, report mean time
- Verify accuracy on linearly separable data

#### Results

| Scenario | Dataset | n_samples | n_features | n_estimators | learning_rate | Accuracy | Time (ms) |
|----------|---------|-----------|------------|--------------|---------------|----------|-----------|
| Binary simple | 2 clusters | 6 | 2 | 10 | 0.1 | 1.0 | <50 |
| Binary 1D | 2 clusters | 6 | 1 | 5 | 0.1 | 1.0 | <20 |
| Low learning rate | 2 clusters | 6 | 2 | 20 | 0.1 | ~0.83 | <50 |
| Larger dataset | 2 clusters | 40 | 4 | 50 | 0.1 | ~0.95 | <200 |
| High dimensional | 2 clusters | 20 | 10 | 30 | 0.1 | ~0.90 | <100 |

#### Conclusions

- Training is O(T · n · m · d) — linear in estimators, samples, features, and tree depth
- Negligible runtime for educational-scale scenarios
- Perfect accuracy on small linearly separable data
- Lower learning rate requires more estimators to converge
- No external dependencies; pure Python

#### Related

- Tests: `tests/KafeMACHINE/ensemble/`
- Knowledge: `.opencode/knowledge/concepts/gradient-boosting-classifier.md`
- Implementation: `src/lib/KafeMACHINE/ensemble/GradientBoosting.py`

---

### Benchmark: GradientBoostingRegressor — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/ensemble/GradientBoosting.py` (GradientBoostingRegressor)
- **Category**: ML algorithm
- **Purpose**: Baseline performance characterization of the from-scratch GradientBoostingRegressor implementation

#### Setup

- **Scenario 1 (Linear 1D)**: 6 samples, 1 feature, n_estimators=10
- **Scenario 2 (Quadratic)**: 6 samples, 1 feature, n_estimators=20
- **Scenario 3 (Multi-feature)**: 10 samples, 2 features, n_estimators=10
- **Scenario 4 (Larger dataset)**: 50 samples, 1 feature, n_estimators=20
- **Scenario 5 (High dimensional)**: 20 samples, 5 features, n_estimators=30
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create synthetic regression data, fit GradientBoostingRegressor, predict, measure time
- 10 iterations per scenario, report mean time
- Verify R² on linear data approaches 1.0

#### Results

| Scenario | Dataset | n_samples | n_features | n_estimators | R² | Time (ms) |
|----------|---------|-----------|------------|--------------|-----|-----------|
| Linear 1D | 1D linear | 6 | 1 | 10 | ~1.0 | <50 |
| Quadratic | 1D quadratic | 6 | 1 | 20 | ~0.95 | <50 |
| Multi-feature | 2D | 10 | 2 | 10 | ~0.90 | <50 |
| Larger dataset | 1D linear | 50 | 1 | 20 | ~1.0 | <100 |
| High dimensional | 5D | 20 | 5 | 30 | ~0.85 | <100 |

#### Conclusions

- Training is O(T · n · m · d) — linear in all dimensions
- Perfect R² on clean linear data
- Negligible runtime for educational-scale scenarios
- Handles non-linear relationships via tree depth
- No external dependencies; pure Python

#### Related

- Tests: `tests/KafeMACHINE/ensemble/`
- Knowledge: `.opencode/knowledge/concepts/gradient-boosting-regressor.md`
- Implementation: `src/lib/KafeMACHINE/ensemble/GradientBoosting.py`

---

### Benchmark: LinearDiscriminantAnalysis — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/discriminant/LinearDiscriminantAnalysis.py`
- **Category**: ML algorithm
- **Purpose**: Baseline performance characterization of the from-scratch LinearDiscriminantAnalysis implementation

#### Setup

- **Scenario 1 (Binary, 2D→1D)**: 6 samples, 2 features, 2 classes, n_components=1
- **Scenario 2 (Binary, 2D→2D)**: 6 samples, 2 features, 2 classes, n_components=2
- **Scenario 3 (3-class, 4D→2D)**: 12 samples, 4 features, 3 classes, n_components=2
- **Scenario 4 (High dimensional)**: 20 samples, 10 features, 2 classes, n_components=1
- **Scenario 5 (Larger dataset)**: 50 samples, 5 features, 3 classes, n_components=2
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create synthetic linearly separable data, fit LDA, transform, predict, measure time
- 10 iterations per scenario, report mean time
- Verify accuracy on linearly separable data

#### Results

| Scenario | Dataset | n_samples | n_features | n_classes | n_components | Accuracy | Time (ms) |
|----------|---------|-----------|------------|-----------|--------------|----------|-----------|
| Binary, 2D→1D | 2 clusters | 6 | 2 | 2 | 1 | 1.0 | <10 |
| Binary, 2D→2D | 2 clusters | 6 | 2 | 2 | 2 | 1.0 | <10 |
| 3-class, 4D→2D | 3 clusters | 12 | 4 | 3 | 2 | 1.0 | <10 |
| High dimensional | 2 clusters | 20 | 10 | 2 | 1 | ~0.90 | <50 |
| Larger dataset | 3 clusters | 50 | 5 | 3 | 2 | ~0.95 | <100 |

#### Conclusions

- Training is $O(n \cdot d^2 + d^3)$ — dominated by scatter matrix computation and Jacobi diagonalization
- Transform is $O(n \cdot d \cdot k)$ — linear projection
- All scenarios achieve high accuracy on linearly separable data
- Negligible runtime for educational-scale datasets
- n_components correctly bounded by min(n_classes-1, n_features)
- No external dependencies; pure Python + KafeMATH sqrt

#### Related

- Tests: `tests/KafeMACHINE/linear/`
- Knowledge: `.opencode/knowledge/concepts/linear-discriminant-analysis.md`
- Implementation: `src/lib/KafeMACHINE/discriminant/LinearDiscriminantAnalysis.py`

---

### Rules

- Each benchmark targets one component under `src/lib/`
- Measure time and/or memory on representative workloads
- Be reproducible: record dataset, hardware, environment, and methodology
- Update the index table after adding a new benchmark
- Keep related references up to date

---

### Benchmark: DecisionTreeRegressor — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/tree/DecisionTree.py` (DecisionTreeRegressor)
- **Category**: ML algorithm
- **Purpose**: Baseline performance characterization of the from-scratch DecisionTreeRegressor implementation

#### Setup

- **Scenario 1 (Linear 1D)**: 6 samples, 1 feature, y = 2x + noise
- **Scenario 2 (Quadratic)**: 6 samples, 1 feature, y = x²
- **Scenario 3 (Multi-feature)**: 10 samples, 2 features
- **Scenario 4 (Depth limited)**: 6 samples, 1 feature, max_depth=2
- **Scenario 5 (Larger dataset)**: 50 samples, 3 features
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create synthetic regression data, fit DecisionTreeRegressor, predict, measure time
- 10 iterations per scenario, report mean time
- Verify R² on linear data approaches 1.0

#### Results

| Scenario | Dataset | n_samples | n_features | max_depth | R² | Time (ms) |
|----------|---------|-----------|------------|-----------|-----|-----------|
| Linear 1D | 1D linear | 6 | 1 | 0 | ~1.0 | <10 |
| Quadratic | 1D quadratic | 6 | 1 | 0 | ~0.95 | <10 |
| Multi-feature | 2D | 10 | 2 | 0 | ~0.90 | <10 |
| Depth limited | 1D linear | 6 | 1 | 2 | ~0.85 | <10 |
| Larger dataset | 3D | 50 | 3 | 0 | ~0.95 | <50 |

#### Conclusions

- Training is O(n·m·log n) — competitive for small datasets
- Perfect R² on clean linear data with sufficient depth
- Depth-limited trees trade accuracy for generalization
- Negligible runtime for educational-scale scenarios
- No external dependencies; pure Python

#### Related

- Tests: `tests/KafeMACHINE/tree/`
- Knowledge: `.opencode/knowledge/concepts/decision-tree-regressor.md`
- Implementation: `src/lib/KafeMACHINE/tree/DecisionTree.py`

---

### Benchmark: KNNRegressor — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/neighbors/KNN.py` (KNNRegressor)
- **Category**: ML algorithm
- **Purpose**: Baseline performance characterization of the from-scratch KNNRegressor implementation

#### Setup

- **Scenario 1 (Linear 1D)**: 6 samples, 1 feature, k=3
- **Scenario 2 (Quadratic)**: 6 samples, 1 feature, k=3
- **Scenario 3 (Multi-feature)**: 10 samples, 2 features, k=3
- **Scenario 4 (Larger k)**: 6 samples, 1 feature, k=5
- **Scenario 5 (Larger dataset)**: 50 samples, 3 features, k=5
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create synthetic regression data, fit KNNRegressor, predict, measure time
- 10 iterations per scenario, report mean time
- Verify R² on clean data approaches 1.0

#### Results

| Scenario | Dataset | n_samples | n_features | k | R² | Time (ms) |
|----------|---------|-----------|------------|---|-----|-----------|
| Linear 1D | 1D linear | 6 | 1 | 3 | ~1.0 | <10 |
| Quadratic | 1D quadratic | 6 | 1 | 3 | ~0.90 | <10 |
| Multi-feature | 2D | 10 | 2 | 3 | ~0.90 | <10 |
| Larger k | 1D linear | 6 | 1 | 5 | ~0.85 | <10 |
| Larger dataset | 3D | 50 | 3 | 5 | ~0.95 | <50 |

#### Conclusions

- Training is O(1) — lazy learning, just stores data
- Prediction is O(n·m) — must compute all distances
- Negligible runtime for educational-scale datasets
- Larger k smooths predictions (bias-variance tradeoff)
- No external dependencies; pure Python + KafeMATH sqrt

#### Related

- Tests: `tests/KafeMACHINE/neighbors/`
- Knowledge: `.opencode/knowledge/concepts/knn-regressor.md`
- Implementation: `src/lib/KafeMACHINE/neighbors/KNN.py`

---

### Benchmark: GaussianNB — 2026-09-14

- **Date**: 2026-09-14
- **Component**: `src/lib/KafeMACHINE/naive_bayes/GaussianNB.py`
- **Category**: ML algorithm
- **Purpose**: Baseline performance characterization of the from-scratch Gaussian Naive Bayes implementation

#### Setup

- **Scenario 1 (Binary simple)**: 6 samples, 2 features, 2 classes (2 clusters)
- **Scenario 2 (Binary 1D)**: 6 samples, 1 feature, 2 classes (2 clusters)
- **Scenario 3 (Multi-class)**: 9 samples, 1 feature, 3 classes (3 clusters)
- **Scenario 4 (Larger dataset)**: 40 samples, 4 features, 4 classes (4 clusters)
- **Scenario 5 (High dimensional)**: 20 samples, 10 features, 2 classes (2 clusters)
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create synthetic clustered data, fit GaussianNB, predict, measure time
- 10 iterations per scenario, report mean time
- Verify accuracy on linearly separable data

#### Results

| Scenario | Dataset | n_samples | n_features | n_classes | Time (ms) | Accuracy |
|----------|---------|-----------|------------|-----------|-----------|----------|
| Binary simple | 2 clusters | 6 | 2 | 2 | <1 | 1.0 |
| Binary 1D | 2 clusters | 6 | 1 | 2 | <1 | 1.0 |
| Multi-class | 3 clusters | 9 | 1 | 3 | <1 | 1.0 |
| Larger dataset | 4 clusters | 40 | 4 | 4 | <1 | ~0.95 |
| High dimensional | 2 clusters | 20 | 10 | 2 | <1 | ~0.9 |

#### Conclusions

- Training is O(n·d) — linear in samples × features (single-pass statistics)
- Prediction is O(k·d) — proportional to classes × features
- Negligible runtime for all educational-scale scenarios
- Perfect accuracy on small linearly separable data
- Slight accuracy drop on larger/high-dimensional data (expected: Naive Bayes assumes feature independence)
- No external dependencies; pure Python + KafeMATH log

#### Related

- Tests: `tests/KafeMACHINE/naive_bayes/`
- Knowledge: `.opencode/knowledge/concepts/gaussian-naive-bayes.md`
- Implementation: `src/lib/KafeMACHINE/naive_bayes/GaussianNB.py`

### DBSCAN — 2026-09-14

| Scenario | Dataset | n_samples | eps | min_samples | Clusters found | Time (ms) |
|----------|---------|-----------|-----|-------------|----------------|-----------|
| 2 blobs | 2 clusters | 7 | 0.5 | 2 | 2 | <1 |
| Single cluster | 1 cluster | 5 | 0.5 | 2 | 1 | <1 |
| All noise | 3 isolated points | 3 | 0.5 | 2 | 0 | <1 |
| 3 blobs | 3 clusters | 15 | 1.0 | 3 | 3 | <1 |
| Varying density | Mixed | 20 | 1.5 | 3 | 2 | <1 |

### KMeans Fixes — 2026-09-14

| Fix | Description | Impact |
|-----|-------------|--------|
| K-Means++ init | Fixed premature break when all distances are zero | Prevents centroid initialization failure |
| score() | Added negative inertia for scikit-learn compatibility | API completeness |
| fit_predict() | Added convenience method | API completeness |

### RandomForestClassifier — 2026-09-14

- **Date**: 2026-09-14
- **Component**: `src/lib/KafeMACHINE/tree/RandomForest.py`
- **Category**: ML algorithm
- **Purpose**: Baseline performance characterization of the from-scratch Random Forest Classifier implementation

#### Setup

- **Scenario 1 (Binary simple)**: 6 samples, 2 features, 2 classes (2 clusters), 10 estimators
- **Scenario 2 (Binary 1D)**: 6 samples, 1 feature, 2 classes, 5 estimators
- **Scenario 3 (Multi-class)**: 9 samples, 1 feature, 3 classes, 10 estimators
- **Scenario 4 (Depth limited)**: 6 samples, 2 features, 2 classes, 5 estimators (max_depth=2)
- **Scenario 5 (Larger dataset)**: 40 samples, 4 features, 4 classes, 20 estimators
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create synthetic clustered data, fit RandomForestClassifier, predict, measure time
- 10 iterations per scenario, report mean time
- Verify accuracy on linearly separable data

#### Results

| Scenario | Dataset | n_samples | n_features | n_estimators | Accuracy | Time (ms) |
|----------|---------|-----------|------------|--------------|----------|-----------|
| Binary simple | 2 clusters | 6 | 2 | 10 | 1.0 | <10 |
| Binary 1D | 2 clusters | 6 | 1 | 5 | 1.0 | <10 |
| Multi-class | 3 clusters | 9 | 1 | 10 | 1.0 | <10 |
| Depth limited | 2 clusters | 6 | 2 | 5 (depth=2) | ~0.83 | <10 |
| Larger dataset | 4 clusters | 40 | 4 | 20 | ~0.95 | <50 |

#### Conclusions

- Training is $O(T \cdot n \cdot d \cdot \log n)$ — linear in trees, sub-quadratic in samples
- Prediction is $O(T \cdot d)$ — one pass per tree
- Slight accuracy drop with depth-limited trees (expected: constrained hypothesis space)
- Larger datasets with more estimators achieve near-perfect accuracy
- No external dependencies; pure Python + DecisionTree reuse

#### Related

- Tests: `tests/KafeMACHINE/tree/`
- Knowledge: `.opencode/knowledge/concepts/random-forest.md`
- Implementation: `src/lib/KafeMACHINE/tree/RandomForest.py`

### RandomForestRegressor — 2026-09-14

| Scenario | Dataset | n_samples | n_features | n_estimators | R² | Time (ms) |
|----------|---------|-----------|------------|--------------|-----|-----------|
| Linear | 1D linear | 5 | 1 | 10 | 1.0 | <10 |
| Quadratic | 1D quadratic | 6 | 1 | 10 | ~0.95 | <10 |
| Multi-feature | 2D | 10 | 2 | 10 | ~0.90 | <10 |
| Depth limited | 1D linear | 5 | 1 | 5 (depth=2) | ~0.85 | <10 |
| Larger dataset | 1D quadratic | 50 | 1 | 20 | ~0.98 | <50 |

### RidgeRegression — 2026-09-14

| Scenario | Dataset | n_samples | n_features | alpha | R² | Time (ms) |
|----------|---------|-----------|------------|-------|-----|-----------|
| Linear 1D | 1D noisy | 5 | 1 | 1.0 | ~0.6 | <10 |
| Linear 1D | 1D clean | 5 | 1 | 0.0 | 1.0 | <10 |
| Multi-feature | 2D | 5 | 2 | 0.5 | 1.0 | <10 |
| High alpha | 1D | 5 | 1 | 10.0 | ~0.3 | <10 |
| Larger dataset | 1D | 50 | 1 | 1.0 | ~0.8 | <50 |

### LassoRegression — 2026-09-14

| Scenario | Dataset | n_samples | n_features | alpha | R² | Time (ms) |
|----------|---------|-----------|------------|-------|-----|-----------|
| Linear 1D | 1D noisy | 5 | 1 | 0.1 | ~0.6 | <10 |
| Feature selection | Sparse | 5 | 2 | 0.5 | 1.0 | <10 |
| High alpha | 1D | 5 | 1 | 10.0 | 0.0 | <10 |
| Multi-feature | 2D | 5 | 2 | 0.1 | ~0.9 | <10 |
| Larger dataset | 1D | 50 | 1 | 0.1 | ~0.9 | <50 |

### SVR — 2026-09-14

| Scenario | Dataset | n_samples | n_features | kernel | C | epsilon | R² | Time (ms) |
|----------|---------|-----------|------------|--------|---|---------|-----|-----------|
| Linear 1D | 1D noisy | 5 | 1 | linear | 1.0 | 0.1 | ~0.6 | <10 |
| Linear 1D | 1D clean | 5 | 1 | linear | 1.0 | 0.1 | ~0.9 | <10 |
| Multi-feature | 2D | 5 | 2 | linear | 1.0 | 0.1 | 1.0 | <10 |
| RBF kernel | 1D quadratic | 5 | 1 | rbf | 10.0 | 0.5 | ~0.85 | <50 |
| High C | 1D | 5 | 1 | linear | 100.0 | 0.1 | ~0.7 | <10 |

### ModelSelection — 2026-09-18

- **Date**: 2026-09-18
- **Component**: `src/lib/KafeMACHINE/model_selection/model_selection.py`
- **Category**: ML utility
- **Purpose**: Baseline performance characterization of train_test_split and k_fold

#### Setup

- **Scenario 1 (Small split)**: 10 samples, 1 feature, test_size=0.2
- **Scenario 2 (Large split)**: 1000 samples, 5 features, test_size=0.3
- **Scenario 3 (5-fold CV)**: 20 samples, 2 features, k=5
- **Scenario 4 (10-fold CV)**: 100 samples, 4 features, k=10
- **Scenario 5 (Class-labeled split)**: 50 samples, 3 features, 3 classes, test_size=0.2; this checks split size, not stratification
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create synthetic data, run model_selection function, measure time
- 10 iterations per scenario, report mean time
- Verify correctness of split sizes and fold counts

#### Results

| Scenario | Dataset | n_samples | n_features | Operation | Time (ms) | Correct |
|----------|---------|-----------|------------|-----------|-----------|---------|
| Small split | 1D | 10 | 1 | train_test_split | <1 | Yes |
| Large split | 5D | 1000 | 5 | train_test_split | <5 | Yes |
| 5-fold CV | 2D | 20 | 2 | k_fold | <50 | Yes |
| 10-fold CV | 4D | 100 | 4 | k_fold | <200 | Yes |
| Class-labeled split | 3-class | 50 | 3 | train_test_split (shuffled; not stratified) | <5 | Yes |

#### Conclusions

- `train_test_split` is O(n) — single pass shuffle + slice
- `k_fold` generates index partitions and does not fit or evaluate a model
- Negligible overhead for utility functions themselves
- `train_test_split` does not guarantee preservation of class proportions
- No external dependencies; pure Python

#### Related

- Tests: `tests/KafeMACHINE/model_selection/`
- Knowledge: `.opencode/knowledge/concepts/train-test-split.md`, `.opencode/knowledge/concepts/k-fold-cross-validation.md`
- Implementation: `src/lib/KafeMACHINE/model_selection/model_selection.py`

---

### Benchmark: PolynomialFeatures — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/preprocessing/PolynomialFeatures.py`
- **Category**: ML preprocessing
- **Purpose**: Baseline performance characterization of the from-scratch PolynomialFeatures implementation

#### Setup

- **Scenario 1 (Basic, degree=2)**: 5 samples, 2 features, degree=2, include_bias=True
- **Scenario 2 (Degree=3)**: 5 samples, 2 features, degree=3, include_bias=True
- **Scenario 3 (Single feature)**: 5 samples, 1 feature, degree=2, include_bias=True
- **Scenario 4 (4 features)**: 10 samples, 4 features, degree=2, include_bias=False
- **Scenario 5 (Larger dataset)**: 50 samples, 3 features, degree=2, include_bias=True
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create synthetic data, run fit_transform, measure time
- 10 iterations per scenario, report mean time
- Verify output dimensions match $\binom{d+n}{n}$

#### Results

| Scenario | Dataset | n_samples | n_features | Degree | Output Features | Time (ms) | Correct |
|----------|---------|-----------|------------|--------|-----------------|-----------|---------|
| Basic degree=2 | 2D | 5 | 2 | 2 | 6 | <1 | Yes |
| Degree=3 | 2D | 5 | 2 | 3 | 10 | <1 | Yes |
| Single feature | 1D | 5 | 1 | 2 | 3 | <1 | Yes |
| 4 features | 4D | 10 | 4 | 2 | 15 | <1 | Yes |
| Larger dataset | 3D | 50 | 3 | 2 | 10 | <1 | Yes |

#### Conclusions

- Transform is O(n_samples × n_features_out × d) — linear in all dimensions
- Runtime is negligible for educational-scale datasets
- Output dimensions correctly match combinatorial formula
- DataFrame support preserves column names
- No external dependencies; pure Python

#### Related

- Tests: `tests/KafeMACHINE/preprocessing/`
- Knowledge: `.opencode/knowledge/concepts/polynomial-features.md`
- Implementation: `src/lib/KafeMACHINE/preprocessing/PolynomialFeatures.py`

---

### Benchmark: ElasticNet — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/linear/ElasticNet.py`
- **Category**: ML algorithm
- **Purpose**: Baseline performance characterization of the from-scratch ElasticNet regression implementation

#### Setup

- **Scenario 1 (Basic regression)**: 10 samples, 2 features, alpha=1.0, l1_ratio=0.5
- **Scenario 2 (Lasso mode)**: 10 samples, 2 features, alpha=1.0, l1_ratio=1.0
- **Scenario 3 (Ridge mode)**: 10 samples, 2 features, alpha=1.0, l1_ratio=0.0
- **Scenario 4 (Feature selection)**: 10 samples, 4 features (2 relevant, 2 noise), alpha=0.5, l1_ratio=0.7
- **Scenario 5 (Larger dataset)**: 50 samples, 5 features, alpha=0.1, l1_ratio=0.5
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create synthetic linear data, fit ElasticNet, predict, measure time
- 10 iterations per scenario, report mean time
- Verify R² on linear data approaches 1.0

#### Results

| Scenario | Dataset | n_samples | n_features | alpha | l1_ratio | R² | Time (ms) |
|----------|---------|-----------|------------|-------|----------|-----|-----------|
| Basic regression | 2D | 10 | 2 | 1.0 | 0.5 | ~0.95 | <10 |
| Lasso mode | 2D | 10 | 2 | 1.0 | 1.0 | ~0.90 | <10 |
| Ridge mode | 2D | 10 | 2 | 1.0 | 0.0 | ~0.95 | <10 |
| Feature selection | 4D | 10 | 4 | 0.5 | 0.7 | ~0.85 | <10 |
| Larger dataset | 5D | 50 | 5 | 0.1 | 0.5 | ~0.98 | <50 |

#### Conclusions

- Training is O(n_iter × n × d) — dominated by Coordinate Descent iterations
- All scenarios achieve reasonable R² on linear data
- Lasso mode (l1_ratio=1.0) may zero out some coefficients (feature selection)
- Ridge mode (l1_ratio=0.0) keeps all coefficients non-zero
- No external dependencies; pure Python

#### Related

- Tests: `tests/KafeMACHINE/linear/`
- Knowledge: `.opencode/knowledge/concepts/elastic-net.md`
- Implementation: `src/lib/KafeMACHINE/linear/ElasticNet.py`

---

### Benchmark: RobustScaler — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/preprocessing/RobustScaler.py`
- **Category**: ML preprocessing
- **Purpose**: Baseline performance characterization of the from-scratch RobustScaler implementation

#### Setup

- **Scenario 1 (Basic, no outliers)**: 5 samples, 2 features, with_centering=1, with_scaling=1
- **Scenario 2 (With outlier)**: 5 samples, 2 features, one extreme value (100.0), with_centering=1, with_scaling=1
- **Scenario 3 (Center only)**: 5 samples, 2 features, with_centering=1, with_scaling=0
- **Scenario 4 (Scale only)**: 5 samples, 2 features, with_centering=0, with_scaling=1
- **Scenario 5 (Larger dataset)**: 50 samples, 5 features, with_centering=1, with_scaling=1
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create synthetic data, run fit_transform, then inverse_transform, measure time
- 10 iterations per scenario, report mean time
- Verify inverse_transform recovers original data exactly

#### Results

| Scenario | Dataset | n_samples | n_features | with_centering | with_scaling | Time (ms) | Inverse Correct |
|----------|---------|-----------|------------|----------------|--------------|-----------|-----------------|
| Basic | 2D clean | 5 | 2 | 1 | 1 | <1 | Yes |
| With outlier | 2D + outlier | 5 | 2 | 1 | 1 | <1 | Yes |
| Center only | 2D | 5 | 2 | 1 | 0 | <1 | Yes |
| Scale only | 2D | 5 | 2 | 0 | 1 | <1 | Yes |
| Larger dataset | 5D | 50 | 5 | 1 | 1 | <5 | Yes |

#### Conclusions

- fit is O(n · m · log n) — dominated by sorting each column for percentile computation
- transform and inverse_transform are O(n · m) — linear passes
- Runtime is negligible for educational-scale datasets
- Inverse transform correctly recovers original data in all scenarios
- No external dependencies; pure Python

#### Related

- Tests: `tests/KafeMACHINE/preprocessing/robust_scaler/`
- Knowledge: `.opencode/knowledge/concepts/robust-scaler.md`
- Implementation: `src/lib/KafeMACHINE/preprocessing/RobustScaler.py`

---

### Benchmark: GaussianMixture — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/clustering/GaussianMixture.py`
- **Category**: ML algorithm
- **Purpose**: Baseline performance characterization of the from-scratch Gaussian Mixture Model implementation

#### Setup

- **Scenario 1 (Binary, 2 components)**: 6 samples, 2 features, 2 components, random_state=42
- **Scenario 2 (3 components)**: 9 samples, 2 features, 3 components, random_state=42
- **Scenario 3 (1D data)**: 6 samples, 1 feature, 2 components, random_state=42
- **Scenario 4 (High dimensional)**: 20 samples, 5 features, 3 components, random_state=42
- **Scenario 5 (Larger dataset)**: 50 samples, 3 features, 4 components, random_state=42
- **Hardware**: Development machine (CPU only)
- **Environment**: Python 3.10+, Windows, no external dependencies

#### Methodology

- For each scenario: create synthetic clustered data, fit GaussianMixture, predict, measure time
- 10 iterations per scenario, report mean time
- Verify cluster assignments and log-likelihood convergence

#### Results

| Scenario | Dataset | n_samples | n_features | n_components | Converged | Time (ms) |
|----------|---------|-----------|------------|--------------|-----------|-----------|
| Binary, 2 components | 2 blobs | 6 | 2 | 2 | Yes | <10 |
| 3 components | 3 blobs | 9 | 2 | 3 | Yes | <10 |
| 1D data | 2 blobs | 6 | 1 | 2 | Yes | <10 |
| High dimensional | 3 blobs | 20 | 5 | 3 | Yes | <50 |
| Larger dataset | 4 blobs | 50 | 3 | 4 | Yes | <100 |

#### Conclusions

- Training is O(T · n · K · d) — linear in iterations, samples, components, and features
- All scenarios converge within default max_iter=100
- Negligible runtime for educational-scale datasets
- AIC/BIC correctly penalize model complexity
- No external dependencies; pure Python + KafeMATH exp/sqrt/log

#### Related

- Tests: `tests/KafeMACHINE/clustering/`
- Knowledge: `.opencode/knowledge/concepts/gaussian-mixture.md`
- Implementation: `src/lib/KafeMACHINE/clustering/GaussianMixture.py`


---

## Tutor conversation persistence and event projections (2026-10-27)

### Environment and method

Baseline `f992fed52117abb825fdb0191150e2af15972ff6`; measured final source committed unchanged as `86b78ffb9f39a76eb22b51535725e11cc43c2adc`. Node v24.19.0, Windows 10.0.26300 win32/x64, Intel Core i5-1135G7 at 2.40 GHz. The deterministic valid schema-v2 fixtures have 10/100/1,000 display entries with half as many completed pairs, fixed dates, no sources and one/two display listeners in addition to owner listeners. Each repetition makes 100 draft changes, 100 response chunks of 64 bytes and one explicit flush. Three warmups precede ten measured repetitions; timing instrumentation is absent. A separate precise-coverage pass counts operations and checks every counter is present. The in-memory workspace-state adapter clones saved data and verifies latest draft/response/history. Heavy verification stayed outside the timing window.

Reproduce from `kafe-vscode` with `node scripts/profile-conversation.cjs --phase before|after --output <absolute-json-path>`, selecting the appropriate measured source state. `--phase` labels evidence; it does not switch implementation. The ignored local profile directory `.superpowers/simplicity-plan/verification/profile/` retains `before.json`, authoritative `after-final.json`, `provenance.json` and `final-production.diff`. Initial `after.json` is superseded. After JSON records the baseline HEAD because measurements preceded the commit; provenance maps its exact final working-tree source hashes to `86b78ff`.

- Baseline artifact SHA256: `4a6530936e403a71ff17982443c253b89d9c7ef7b47ff88c8dd72092f1d93912`.
- Final after artifact SHA256: `75cd549de5386b2f5b6ed26511dc3b7a438e99f0082782e8d05e726a4098153e`.
- Final production diff SHA256: `3eb1c59cba7dbc2b9b025fc06858a9c73d473931d80ba2902285508ef8846a09`.

### Measurements

Times are median / p95 milliseconds. Total distributions have ten repetitions; draft/chunk distributions pool 1,000 operations each. Fixture bytes are UTF-8 JSON archive bytes.

| Entries | Listeners | Fixture bytes | Before total | Final after total | Before draft | After draft | Before chunk | After chunk |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 1 | 5593 | 42.2335 / 46.4791 | 7.8203 / 8.9123 | 0.1844 / 0.2518 | 0.0309 / 0.0417 | 0.2143 / 0.2826 | 0.0347 / 0.0559 |
| 10 | 2 | 5593 | 50.8517 / 52.7274 | 7.7039 / 8.4174 | 0.2252 / 0.2738 | 0.0321 / 0.0440 | 0.2558 / 0.3159 | 0.0361 / 0.0414 |
| 100 | 1 | 53548 | 303.3245 / 451.2637 | 36.0887 / 39.7412 | 1.4375 / 2.7388 | 0.1501 / 0.2573 | 1.5075 / 2.2201 | 0.1520 / 0.2102 |
| 100 | 2 | 53548 | 367.0583 / 381.8700 | 36.7088 / 38.1537 | 1.7441 / 2.3973 | 0.1543 / 0.1951 | 1.8100 / 2.1086 | 0.1615 / 0.2436 |
| 1000 | 1 | 534448 | 3390.2902 / 3628.1500 | 355.7740 / 372.9878 | 16.3703 / 19.1352 | 1.6007 / 1.9440 | 16.9664 / 19.6392 | 1.6521 / 1.9683 |
| 1000 | 2 | 534448 | 3834.3770 / 4129.1266 | 334.2373 / 358.6531 | 18.6235 / 21.6465 | 1.5305 / 1.7558 | 19.3364 / 21.7339 | 1.5587 / 1.7921 |

| Entries | Listeners | Before final flush | Final after flush |
| ---: | ---: | ---: | ---: |
| 10 | 1 | 0.5355 / 0.8990 | 0.5151 / 0.9640 |
| 10 | 2 | 0.4736 / 0.7957 | 0.4662 / 0.4991 |
| 100 | 1 | 2.6944 / 3.5732 | 2.4685 / 2.9511 |
| 100 | 2 | 2.7959 / 3.0148 | 2.3755 / 2.9258 |
| 1000 | 1 | 29.7799 / 32.3744 | 24.0729 / 26.4804 |
| 1000 | 2 | 29.0538 / 32.8646 | 23.0234 / 24.8024 |

Counts are identical at every fixture size; listener columns show one / two display listeners.

| Work | Before 1 / 2 | Final after 1 / 2 |
| --- | ---: | ---: |
| Full detached session snapshot | 1,402 / 1,802 | 202 / 202 |
| Coordinator view projection | 400 / 600 | 200 / 200 |
| Manager capture | 202 / 202 | 2 / 2 |
| Coordinator conversation capture | 202 / 202 | 2 / 2 |
| Content normalization | 404 / 404 | 2 / 2 |
| Archive-content validation/normalization | 405 / 405 | 3 / 3 |
| Archive normalization | 1 / 1 | 1 / 1 |
| Serialized writes | 1 / 1 | 1 / 1 |
| Missing counter coverage | none / none | none / none |

### Decision and limits

Retain shared immutable event projections and boundary persistence capture: all six measured elapsed distributions improved and repeated captures/normalizations decreased. Store validation and explicit detached captures remain. No percentage target or memory measurement is claimed. Full snapshot work still scales with transcript size; explicit boundaries remain synchronous work. Listener timings have ordinary noise and do not imply more listeners make execution faster.

These measurements cover synchronous notifications and an in-memory adapter only: no provider/network latency, real disk, native rendering or learner outcomes. They identify `86b78ff`; later source coordination and pending integration cleanup are not included in this profile and must not be represented as final-candidate/native performance. Correctness receipts at the measured commit include 81 focused passes and 992 aggregate passes with one existing platform skip; these historical receipts are not final integration results. ADR-0033 and the architecture record describe the unchanged authority/boundary contract.


### Final integration confirmation (2026-10-27)

Separate confirmation at `524dac51292d0ea365bbf4666e59100ab396ea56` includes the pending-save deadline fix and subsequent source coordination. The profiler now records observer counts/mismatches and asserts after publication, so callback isolation cannot swallow validation failures. Fixtures, 100 draft changes, 100 chunks, three warmups, ten repetitions and the separate precise-coverage counter method remain identical. Callback timing work changed; this is not a new before/after improvement claim. Original `before.json`, `after-final.json` and provenance remain unchanged historical evidence for `86b78ff`.

| Entries | Listeners | Confirmation total median / p95 ms |
| ---: | ---: | ---: |
| 10 | 1 | 7.1537 / 7.9305 |
| 10 | 2 | 7.5385 / 8.2196 |
| 100 | 1 | 34.9640 / 45.3941 |
| 100 | 2 | 36.2360 / 48.2413 |
| 1000 | 1 | 332.9038 / 339.3623 |
| 1000 | 2 | 323.7862 / 419.1126 |

Every scenario retains 202 session snapshots, 200 coordinator projections, two manager/conversation captures, two content normalizations, three archive-content validations, one archive normalization and one write, with complete counter coverage. No heavy concurrent root checks ran during timing. Environment remains Node 24.19.0 on Windows x64. The ignored evidence is `verification/task-11/profile-confirmation.json` with `profile-provenance.json` under `.superpowers/simplicity-plan/`. Timing remains bounded in-memory evidence; no native/provider/disk or learner-effectiveness claim is made.
