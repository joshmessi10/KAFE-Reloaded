# Benchmark Records

This file consolidates all benchmark records for KAFE. Individual benchmark files have been merged here to reduce file accumulation.

## Benchmark Index

| Benchmark | Component | Category | Date | Status |
|-----------|-----------|----------|------|--------|
| DecisionTreeClassifier | `src/lib/KafeMACHINE/DecisionTree.py` | ML algorithm | 2026-08-04 | Baseline |
| KafeMACHINE Full Suite | `src/lib/KafeMACHINE/` (all models) | ML algorithm | 2026-08-04 | Baseline |
| OrdinalEncoder | `src/lib/KafeMACHINE/preprocessing/OrdinalEncoder.py` | ML preprocessing | 2026-09-02 | Baseline |
| KafeGESHA Full Suite | `src/lib/KafeGESHA/` (all DL components) | DL component | 2026-09-02 | Baseline |
| GaussianNB | `src/lib/KafeMACHINE/GaussianNB.py` | ML algorithm | 2026-09-14 | Baseline |
| GaussianMixture | `src/lib/KafeMACHINE/GaussianMixture.py` | ML algorithm | 2026-09-21 | Baseline |
| RandomForest | `src/lib/KafeMACHINE/RandomForest.py` | ML algorithm | 2026-09-14 | Baseline |
| RidgeRegression | `src/lib/KafeMACHINE/RidgeRegression.py` | ML algorithm | 2026-09-14 | Baseline |
| LassoRegression | `src/lib/KafeMACHINE/LassoRegression.py` | ML algorithm | 2026-09-14 | Baseline |
| SVR | `src/lib/KafeMACHINE/SVR.py` | ML algorithm | 2026-09-14 | Baseline |
| SVM | `src/lib/KafeMACHINE/SVM.py` | ML algorithm | 2026-09-21 | Baseline |
| ModelSelection | `src/lib/KafeMACHINE/model_selection.py` | ML utility | 2026-09-18 | Baseline |
| GridSearchCV | `src/lib/KafeMACHINE/model_selection.py` (GridSearchCV) | ML utility | 2026-09-18 | Baseline |
| RandomizedSearchCV | `src/lib/KafeMACHINE/model_selection.py` (RandomizedSearchCV) | ML utility | 2026-09-18 | Baseline |
| Pipeline | `src/lib/KafeMACHINE/model_selection.py` (Pipeline) | ML utility | 2026-09-18 | Baseline |
| PolynomialFeatures | `src/lib/KafeMACHINE/preprocessing/PolynomialFeatures.py` | ML preprocessing | 2026-09-21 | Baseline |
| ElasticNet | `src/lib/KafeMACHINE/ElasticNet.py` | ML algorithm | 2026-09-21 | Baseline |
| AgglomerativeClustering | `src/lib/KafeMACHINE/AgglomerativeClustering.py` | ML algorithm | 2026-09-21 | Baseline |
| AdaBoost | `src/lib/KafeMACHINE/AdaBoost.py` | ML algorithm | 2026-09-21 | Baseline |
| GradientBoostingClassifier | `src/lib/KafeMACHINE/GradientBoosting.py` (Classifier) | ML algorithm | 2026-09-21 | Baseline |
| GradientBoostingRegressor | `src/lib/KafeMACHINE/GradientBoosting.py` (Regressor) | ML algorithm | 2026-09-21 | Baseline |
| RobustScaler | `src/lib/KafeMACHINE/preprocessing/RobustScaler.py` | ML preprocessing | 2026-09-21 | Baseline |
| DecisionTreeRegressor | `src/lib/KafeMACHINE/DecisionTree.py` (Regressor) | ML algorithm | 2026-09-21 | Baseline |
| KNNRegressor | `src/lib/KafeMACHINE/KNN.py` (Regressor) | ML algorithm | 2026-09-21 | Baseline |
| KafeKAGGLE Image API | `src/lib/KafeKaggle/funciones.py` (load_image/load_images/load_image_dataset) | Library utility (ingesta de imagenes) | 2026-10-13 | Baseline |
| kafekaggle_images_folders.py | `KafeKAGGLE — load_image_folder_dataset` | Library utility (ingesta de imagenes) | 2026-10-13 | Baseline |
| RNN E2E (KafeKaggle + Tokenizer + GESHA) | `src/lib/KafeKaggle/funciones.py` + `src/lib/KafeMACHINE/preprocessing/Tokenizer.py` + `src/lib/KafeGESHA` | DL component (E2E chain) | 2026-10-18 | Measured |
| GeshaCNN Optimization | `src/lib/KafeNUMK/funciones.py` + `src/lib/KafeGESHA/models.py` + `src/lib/KafeGESHA/optimizers/adam.py` | Performance optimization (DL training) | 2026-10-17 | Measured |

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
- **Component**: `src/lib/KafeMACHINE/DecisionTree.py`
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

- Tests: `tests/KafeMACHINE/tree_models/`
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
- **Component**: `src/lib/KafeMACHINE/model_selection.py` (GridSearchCV)
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
- Implementation: `src/lib/KafeMACHINE/model_selection.py`

---

### RandomizedSearchCV — 2026-09-18

- **Date**: 2026-09-18
- **Component**: `src/lib/KafeMACHINE/model_selection.py` (RandomizedSearchCV)
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
- Implementation: `src/lib/KafeMACHINE/model_selection.py`

### Pipeline — 2026-09-18

- **Date**: 2026-09-18
- **Component**: `src/lib/KafeMACHINE/model_selection.py` (Pipeline)
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
- Implementation: `src/lib/KafeMACHINE/model_selection.py`

---

### Benchmark: SVM — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/SVM.py`
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
- Implementation: `src/lib/KafeMACHINE/SVM.py`

---

### Benchmark: AgglomerativeClustering — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/AgglomerativeClustering.py`
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
- Implementation: `src/lib/KafeMACHINE/AgglomerativeClustering.py`

---

### Benchmark: AdaBoost — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/AdaBoost.py`
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
- Implementation: `src/lib/KafeMACHINE/AdaBoost.py`

---

### Benchmark: GradientBoostingClassifier — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/GradientBoosting.py` (GradientBoostingClassifier)
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
- Implementation: `src/lib/KafeMACHINE/GradientBoosting.py`

---

### Benchmark: GradientBoostingRegressor — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/GradientBoosting.py` (GradientBoostingRegressor)
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
- Implementation: `src/lib/KafeMACHINE/GradientBoosting.py`

---

### Benchmark: LinearDiscriminantAnalysis — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/LinearDiscriminantAnalysis.py`
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

- Tests: `tests/KafeMACHINE/linear_models/`
- Knowledge: `.opencode/knowledge/concepts/linear-discriminant-analysis.md`
- Implementation: `src/lib/KafeMACHINE/LinearDiscriminantAnalysis.py`

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
- **Component**: `src/lib/KafeMACHINE/DecisionTree.py` (DecisionTreeRegressor)
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

- Tests: `tests/KafeMACHINE/tree_models/`
- Knowledge: `.opencode/knowledge/concepts/decision-tree-regressor.md`
- Implementation: `src/lib/KafeMACHINE/DecisionTree.py`

---

### Benchmark: KNNRegressor — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/KNN.py` (KNNRegressor)
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
- Implementation: `src/lib/KafeMACHINE/KNN.py`

---

### Benchmark: GaussianNB — 2026-09-14

- **Date**: 2026-09-14
- **Component**: `src/lib/KafeMACHINE/GaussianNB.py`
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
- Implementation: `src/lib/KafeMACHINE/GaussianNB.py`

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
- **Component**: `src/lib/KafeMACHINE/RandomForest.py`
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

- Tests: `tests/KafeMACHINE/tree_models/`
- Knowledge: `.opencode/knowledge/concepts/random-forest.md`
- Implementation: `src/lib/KafeMACHINE/RandomForest.py`

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
- **Component**: `src/lib/KafeMACHINE/model_selection.py`
- **Category**: ML utility
- **Purpose**: Baseline performance characterization of train_test_split and k_fold_cross_validation

#### Setup

- **Scenario 1 (Small split)**: 10 samples, 1 feature, test_size=0.2
- **Scenario 2 (Large split)**: 1000 samples, 5 features, test_size=0.3
- **Scenario 3 (5-fold CV)**: 20 samples, 2 features, k=5
- **Scenario 4 (10-fold CV)**: 100 samples, 4 features, k=10
- **Scenario 5 (Stratified split)**: 50 samples, 3 features, 3 classes, test_size=0.2
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
| 5-fold CV | 2D | 20 | 2 | k_fold_cross_validation | <50 | Yes |
| 10-fold CV | 4D | 100 | 4 | k_fold_cross_validation | <200 | Yes |
| Stratified split | 3-class | 50 | 3 | train_test_split (stratified) | <5 | Yes |

#### Conclusions

- `train_test_split` is O(n) — single pass shuffle + slice
- `k_fold_cross_validation` is O(k · T_model) — dominated by model training cost
- Negligible overhead for utility functions themselves
- Stratified split preserves class distribution accurately
- No external dependencies; pure Python

#### Related

- Tests: `tests/KafeMACHINE/model_selection/`
- Knowledge: `.opencode/knowledge/concepts/train-test-split.md`, `.opencode/knowledge/concepts/k-fold-cross-validation.md`
- Implementation: `src/lib/KafeMACHINE/model_selection.py`

---

### Benchmark: PolynomialFeatures — 2026-09-21

- **Date**: 2026-09-21
- **Component**: `src/lib/KafeMACHINE/preprocessing/PolynomialFeatures.py`
- **Category**: ML preprocessing
- **Purpose**: Baseline performance characterization of the from-scratch PolynomialFeatures implementation

#### Setup

- **Scenario 1 (Basic, degree=2)**: 5 samples, 2 features, degree=2, include_bias=true
- **Scenario 2 (Degree=3)**: 5 samples, 2 features, degree=3, include_bias=true
- **Scenario 3 (Single feature)**: 5 samples, 1 feature, degree=2, include_bias=true
- **Scenario 4 (4 features)**: 10 samples, 4 features, degree=2, include_bias=false
- **Scenario 5 (Larger dataset)**: 50 samples, 3 features, degree=2, include_bias=true
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
- **Component**: `src/lib/KafeMACHINE/ElasticNet.py`
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

- Tests: `tests/KafeMACHINE/linear_models/`
- Knowledge: `.opencode/knowledge/concepts/elastic-net.md`
- Implementation: `src/lib/KafeMACHINE/ElasticNet.py`

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
- **Component**: `src/lib/KafeMACHINE/GaussianMixture.py`
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
- Implementation: `src/lib/KafeMACHINE/GaussianMixture.py`

### 2026-10-08 — GESHA Conv2D y SimpleRNN

Mediana de 3 ejecuciones de forward+backward, medida con `perf_counter` y
`tracemalloc`; script `.opencode/benchmarks/gesha_conv_rnn.py`.

| Componente | Escenario | Tiempo | Pico |
|---|---:|---:|---:|
| Conv2D | C1, 8x8, F2, K3 | 0.005348 s | 19.70 KiB |
| Conv2D | C1, 16x16, F4, K3 | 0.045101 s | 130.34 KiB |
| Conv2D | C3, 16x16, F4, K3 | 0.104972 s | 135.02 KiB |
| Conv2D | C3, 24x24, F8, K3 | 0.510385 s | 562.50 KiB |
| Conv2D | C3, 32x32, F8, K5 | 1.580877 s | 901.70 KiB |
| SimpleRNN | T5, F2, U4 | 0.010060 s | 13.85 KiB |
| SimpleRNN | T10, F4, U8 | 0.034415 s | 34.21 KiB |
| SimpleRNN | T20, F8, U16 | 0.144150 s | 95.05 KiB |
| SimpleRNN | T40, F8, U16 | 0.291254 s | 142.52 KiB |
| SimpleRNN | T60, F16, U32 | 1.064947 s | 390.92 KiB |

### 2026-10-10 — Capas CNN/RNN avanzadas

Forward y backward, medidos con `perf_counter` mediante
`.opencode/benchmarks/gesha_cnn_rnn_layers.py`.

| Escenario | Tiempo |
|---|---:|
| Conv1D C4, L128, F8, K3 | 0.010978 s |
| DepthwiseConv2D C8, 32x32, K3 | 0.227299 s |
| Conv2DTranspose C4, 16x16, F8 | 0.031977 s |
| LSTM T40, F8, U16 | 0.095240 s |
| GRU T40, F8, U16 | 0.059625 s |

### 2026-10-08 — KafeKAGGLE (ingesta de datasets de Kaggle)

Mediana de 3 ejecuciones con `perf_counter` y `tracemalloc`; script
`.opencode/benchmarks/kafekaggle.py`. El paso de red se sustituye por un
archivo o directorio local (`_download_dataset` falso), así que se mide la
parte determinista: selección de archivo (directorio con subdirectorios),
parseo CSV (stdlib) y construcción de PARDOS/matriz. 6 escenarios,
ejecución estable entre corridas. **Actualizado el mismo día tras el swap
de cliente `kaggle` → `kagglehub` (v2)**: S5 ahora es directorio en vez de
ZIP y todos los escenarios pasan por la extracción sobre directorio.

| Escenario | Tiempo | Pico |
|---|---:|---:|
| S1 small: 50x4 `load_dataset` (PARDOS) | 0.002751 s | 165.54 KiB |
| S2 medium: 1000x8 `load_dataset` (PARDOS) | 0.088246 s | 932.36 KiB |
| S3 large: 10000x10 `load_dataset_matrix` (todas) | 0.338025 s | 10242.36 KiB |
| S4 large: 10000x10 `load_dataset_matrix` `limit=100` | 0.157276 s | 8104.45 KiB |
| S5 dir: 500x6 selector `data/train.csv` (PARDOS) | 0.038166 s | 385.82 KiB |
| S6 edge: CSV vacío `load_dataset` | 0.000295 s | 154.09 KiB |

Lecturas:
- `load_dataset_matrix` sigue siendo la vía de menor sobrecarga por fila
  frente a `load_dataset` a igual volumen (S2 vs S3): evita el DataFrame de
  PARDOS y la inferencia de tipos.
- `limit` acorta la construcción de la matriz pero NO el parseo CSV ni la
  descarga (S4 sigue parseando las 10000 filas): la reducción es de memoria
  del resultado, no de E/S. Limitación documentada en el concept record.
- S5 (selección por ruta dentro de un directorio con subdirectorios,
  `data/train.csv`) cuesta unos ms más que un CSV suelto equivalente: walk
  recursivo + apertura, sin extracción de ZIP.
- El CSV vacío (S6) y los casos borde se manejan sin errores en <1 ms.

#### Related

- Tests: `tests/test_KafeKaggle_backend.py` (35 unit tests) + 5 fixtures = 40
- Knowledge: `.opencode/knowledge/concepts/kaggle-dataset-ingestion.md`
- Implementation: `src/lib/KafeKaggle/funciones.py`
- ADR: ADR-0013 (cliente kagglehub)
### 2026-10-10 — Inicializadores y regularizadores GESHA

Medición con `.opencode/benchmarks/gesha_training_utilities.py` (una ejecución, semilla 7): small 10x3 0.011122 s; medium 300x8 0.001210 s; edge 1x1 0.000046 s; multi-feature 64x32 0.000992 s; stress 1000x128 0.061408 s. Incluye creación HeNormal y penalización L1L2; también se verificaron GlorotUniform y Orthogonal.

---

### Benchmark: KafeKAGGLE - Image Ingestion API (offline, synthetic data)

- **Date**: 2026-10-13
- **Component**: `src/lib/KafeKaggle/funciones.py` (load_image / load_images / load_image_dataset) + `src/lib/KafeKaggle/dataset.py` (ImageDataset)
- **Category**: Library utility (image ingestion) / memory characterization
- **Purpose**: Measure runtime and peak memory of the generic KafeKAGGLE image-ingestion API. OFFLINE: no network, no package installation. `_download_dataset` is replaced by a temp directory of synthetic 32x32 PNGs generated with Pillow, and `_require_image_dependencies` by a double returning (PIL.Image, None) so py7zr is not required.

#### Setup

- **Dataset**: synthetic PNG images 32x32 generated with Pillow (deterministic colors); NOT real CIFAR-10.
- **Hardware**: 12 logical CPUs, CPU only
- **Environment**: Python 3.13.11, Windows 11 (10.0.26200), Pillow 12.3.0
- **Script**: `.opencode/benchmarks/kafekaggle_images.py`

#### Methodology

- Each scenario runs the public function 3 times inside `tracemalloc`; runtime is the median of `time.perf_counter()`, peak memory is the max of `tracemalloc.get_traced_memory()[1]`.
- A 1-image warm-up runs both `load_images` and `load_image_dataset` before measuring (avoids lazy imports and first-call noise).
- Images are regenerated per scenario inside a `tempfile.TemporaryDirectory`.

#### Results

| Scenario | N | Channels | Time (ms) | Peak (MB) |
|----------|---:|---:|---:|---:|
| load_images rgb N=8 | 8 | 3 | 172.847 | 0.800 |
| load_images rgb N=64 | 64 | 3 | 1301.638 | 6.406 |
| load_images rgb N=256 | 256 | 3 | 6047.247 | 25.609 |
| load_images gray N=256 | 256 | 1 | 1551.444 | 8.603 |
| load_image_dataset N=256 (rgb) | 256 | 3 | 5923.080 | 25.642 |

#### Conclusions

- Peak memory grows linearly with N*C*H*W: about 100 KB per 32x32 rgb image (a boxed Python float plus list overhead); gray (1 channel) is roughly one third of rgb.
- Confirms risk R3: `load_images` / `load_image_dataset` materialize the whole set in memory. A CIFAR-10 style set (4000 rgb 32x32) would need about 400 MB; the full 50000-image train split about 5 GB. `limit` is the documented mitigation.
- Runtime is dominated by the pure-Python per-pixel normalization loop (about 24 ms per rgb image); gray is about 4x faster at equal N.
- `load_image_dataset` at N=256 is on par with `load_images` (5923 vs 6047 ms): label CSV parsing and encoding add negligible overhead; image decoding dominates.
- Offline synthetic measurements isolate the deterministic ingestion cost; they exclude network download (R4) and 7z extraction (R5), which the real CIFAR-10 flow would add.

#### Related

- Tests: `tests/test_KafeKaggle_backend.py` (64 passed) + fixtures
- Knowledge: `.opencode/knowledge/concepts/kaggle-image-ingestion.md`
- Impact: `.opencode/progress/impact-kafekaggle-images.md` (R3/R4)
- Script: `.opencode/benchmarks/kafekaggle_images.py`

## KafeKAGGLE — load_image_folder_dataset (2026-10-13, ADR-0019)

**Script**: `.opencode/benchmarks/kafekaggle_images_folders.py`
**Resultados crudos**: `.opencode/benchmarks/kafekaggle_folders_results.md`
**Entorno**: Python 3.13.11 | Windows-11-10.0.26200-SP0 | Pillow 12.3.0 | CPUs 12
**Dataset**: CIFAR-10 real (`ayush1220/cifar10`, versión 2, caché de kagglehub) —
60000 imágenes en 10 clases (50000 `train` / 10000 `test`), PNG RGB.
**Condiciones**: offline (la descarga se sustituye por la raíz cacheada y las
dependencias de imagen por `(PIL.Image, None)`); sin red, sin `pip`.

| Escenario | N | Canales | Tiempo mediana (ms, 5 reps) | Pico memoria (MB) | img/s |
|---|---:|---:|---:|---:|---:|
| S1 train rgb 32x32 limit=100 | 100 | 3 | 1243.858 | 14.054 | 80.4 |
| S2 train rgb 32x32 limit=500 | 500 | 3 | 1697.118 | 54.072 | 294.6 |
| S3 test rgb 32x32 limit=100 | 100 | 3 | 1225.172 | 14.035 | 81.6 |
| S4 train gray 32x32 limit=100 | 100 | 1 | 1306.790 | 9.123 | 76.5 |
| S5 todas rgb 8x8 limit=200 | 200 | 3 | 1391.668 | 10.149 | 143.7 |

**Metodología**: el tiempo es la mediana de 5 repeticiones con
`time.perf_counter` **sin** instrumentación; la memoria es el pico de
`tracemalloc` medido en una pasada separada. Una versión anterior medía tiempo y
memoria en la misma pasada con `tracemalloc` activo y producía tiempos inflados
(~8-9 s de coste fijo por llamada): el instrumento dominaba la medida.

**Interpretación**:

- **Coste fijo por llamada ≈ 1.1 s** (S1: 1244 ms para 100 imágenes). Está
  dominado por el descubrimiento de archivos —`_find_images` recorre y ordena
  ~60000 rutas— y por el recorrido del árbol en `_ensure_images_extracted`. Es
  independiente de `limit` y de `height/width` (S5: 1392 ms para 200 imágenes a
  8x8), lo que confirma que no es coste de decodificación.
- **Coste marginal ≈ 1.13 ms/imagen** a rgb 32x32, derivado de
  `(1697.118 - 1243.858) / 400`. En régimen marginal el pipeline sostiene
  ~880 img/s; la cifra de la columna `img/s` está penalizada por el coste fijo.
- **Memoria ∝ N·C·H·W**: S2 retiene 54.072 MB para 500×3×32×32 = 1.536 M valores
  (~35 B por valor, contando listas anidadas de `float` de Python). `gray`
  ocupa ~1/3 (9.123 MB vs 14.054 MB) porque hay un solo canal.
- **Mejora futura identificada**: cachear el índice de archivos por raíz de
  dataset eliminaría el ~1.1 s de coste fijo en llamadas repetidas sobre el
  mismo dataset.

---

### Benchmark: RNN E2E (KafeKaggle + Tokenizer + GESHA) — 2026-10-18

- **Date**: 2026-10-18
- **Component**: `src/lib/KafeKaggle/funciones.py` + `src/lib/KafeMACHINE/preprocessing/Tokenizer.py` + `src/lib/KafeGESHA` (Embedding, SimpleRNN, Dense, Sequential)
- **Category**: DL component (E2E chain)
- **Purpose**: medir tiempo, pico de memoria y correctitud de la cadena completa ingesta Kaggle → Tokenizer → RNN/Embedding → evaluación (5 escenarios + anexo KafeMATH.log/BCE). Parte del /benchmark de la validación E2E de RNN.

#### Setup

- **Dataset**: `yelp_labelled.txt` (1000 frases, TAB, sin encabezado) y `daily-minimum-temperatures-in-me.csv` (3651 filas, celdas con prefijo ?), desde la caché local de kagglehub
- **Hardware**: Intel64 Family 6 Model 158, 12 CPUs lógicas, CPU only
- **Environment**: Python 3.13.11, Windows 11 (10.0.26200), sin dependencias externas nuevas

#### Methodology

- Script `.opencode/benchmarks/rnn_e2e.py` (crudos: `rnn_e2e_results.json`, detalle completo: `rnn_e2e_results.md`).
- Tiempos con `time.perf_counter` en UNA corrida por escenario (S1: mediana de 3); memoria en pasada separada con `tracemalloc`; imports de Python fuera del cronómetro.
- S3 sin red: `kg._download_dataset` sustituido por un tempdir y restaurado en `finally`.
- S4 replica en Python el camino de `EjemploRNN1.kf` (mismas capas, hiperparámetros y semillas 101/102).

#### Results

| Escenario | Train/Test | Runtime | Pico | Métrica |
|---|---|---|---|---|
| S1 tokenización 50 frases | - | ingesta 0.788 s + fit 0.000417 s + transform 0.000314 s (medianas 3) | n/d | vocab 271; tipos, rango y determinismo OK |
| S2 300 frases RNN+Embedding | 216/60 | 33.4849 s (6.697 s/época, 5 épocas) | 692.64 KiB | acc 0.60; loss 69.33% → 21.50%; matriz [[12,15],[9,24]] |
| S3 edge cases (13 casos) | - | 0.013 s | n/d | 13/13 estados esperados, sin crash |
| S4 serie 300 días (réplica EjemploRNN1) | 234/59 | 116.7006 s (7.78 s/época, 15 épocas) | 1560.03 KiB | MAE 2.71475 °C (idéntico al .kf); losses 7.77% → 1.56% |
| S5a 1000 frases sin truncar | 800/200 | 130.2025 s (2 épocas; extrap. 8 épocas 520.81 s) | 3998.73 KiB | loss 66.20% → 35.28%; acc(2 épocas) 0.75 |
| S5b 1000 días, ventana 14 | 788/198 | 93.5778 s (2 épocas) | 3719.5 KiB | MAE 6.30 °C con 2 épocas; 2 celdas ? imputadas (filas 566/567) |

#### Conclusions

- Los 5 escenarios completaron sin crash y sin pérdidas negativas; coste por muestra-época escala ≈ con muestras × timesteps: S5b/S4 = x1.79 por doble ventana (T=14 vs 7); S5a/S2 = x2.62 al eliminar el truncado.
- S4 replica `EjemploRNN1.kf` con MAE y losses EXACTAMENTE iguales a los del intérprete (2.714749…): el camino Python y el camino .kf son deterministas y equivalentes.
- Anexo H CONFIRMA el hallazgo de `progress/current.md` §6: `KafeMATH.log(0.999)` = +0.00311689 (matemáticamente correcto: −0.00100050) y `log(0.99999999)` = +0.00502498 (correcto: −1e-8). Consecuencia medida: `BinaryCrossEntropy.compute` devuelve BCE negativa (−0.00311689 con y=1,p=0.999; −0.00502498 con y=0,p=1e-8). `derivative` no usa log (−0.5000000037) y queda intacto: el entrenamiento no se afecta.
- S5b con solo 2 épocas queda en MAE 6.30 °C (el .kf con 15 épocas alcanza 2.71): esperable, no es regresión.
- Deuda menor detectada: mensajes en inglés en rutas educativas en español (`Tokenizer: Must call fit before transform`; `TypeError: Function tokenizer expects argument of type INT, got type STR` de check_sig).

#### Related

- Informe del Tester: `.opencode/benchmarks/tester-rnn-e2e.md`
- Resultados: `.opencode/benchmarks/rnn_e2e_results.md` + `.opencode/benchmarks/rnn_e2e_results.json`
- Ejemplos: `src/EjemploRNN1.kf`, `src/EjemploRNN2.kf` (corridas: `.opencode/benchmarks/rnn_examples_runs.json`)
- Impacto: `.opencode/progress/impact-rnn-e2e.md`

---

### Benchmark: GeshaCNN Optimization — 2026-10-17

- **Date**: 2026-10-17
- **Component**: `src/lib/KafeNUMK/funciones.py` + `src/lib/KafeGESHA/models.py` + `src/lib/KafeGESHA/optimizers/adam.py`
- **Category**: performance optimization (DL training)
- **Purpose**: medir la mejora de las cinco optimizaciones bit-idénticas del entrenamiento de la CNN (F1-F5) sobre `conv2d` forward/backward y `fit` end-to-end, manteniendo resultados exactamente iguales (requisito duro de bit-idénticos). Parte del /benchmark de ADR-0020.

#### Setup

- **Dataset**: tensores sintéticos deterministas (`random.Random(1234)`, floats `round(uniform(-1,1),12)`): conv1 [3,32,32] → [8,32,32] same, conv2 [8,16,16] → [16,16,16] same; S5 con 64 muestras y `fit(X, y, epochs=1, batch_size=16)`.
- **Hardware**: CPU only (máquina de desarrollo; ejecución aislada, sin nada más en paralelo)
- **Environment**: Python 3.13.11, Windows 11 (10.0.26200), sin dependencias externas nuevas

#### Methodology

- Script `.opencode/benchmarks/gesha_cnn_optimization.py` (detalle completo: `.opencode/benchmarks/gesha_cnn_optimization_results.md`).
- Tiempo = mediana de 5 repeticiones con `time.perf_counter` **sin** `tracemalloc`; memoria = pico de `tracemalloc` en una pasada separada (nunca junto al cronómetro).
- S1-S4 comparan la implementación naive original (copia literal de `conv2d_chw`/`conv2d_chw_backward` previa a la optimización) contra la versión actual de `funciones.py` en la misma sesión; S5 compara el baseline registrado de 521.949 ms/muestra (misma máquina, datos sintéticos idénticos) contra la medición actual.

#### Results

| Escenario | Antes (ms) | Después (ms) | Mejora | Memoria pico (MB) |
|---|---:|---:|---:|---:|
| S1 forward conv1 [3,32,32] -> [8,32,32] same | 45.123 | 28.993 | 1.56x | 0.260 |
| S2 backward conv1 (incluye su forward interno) | 114.703 | 49.369 | 2.32x | 0.109 |
| S3 forward conv2 [8,16,16] -> [16,16,16] same | 57.459 | 39.261 | 1.46x | 0.136 |
| S4 backward conv2 (incluye su forward interno) | 145.268 | 63.295 | 2.30x | 0.137 |
| S5 fit end-to-end (ms/muestra, 64 muestras) | 521.949 | 384.789 | 1.36x | 1.777 |

`Memoria pico` = pico de `tracemalloc` de la versión `Después` en su pasada separada.

#### Conclusions

- Requisito bit-idéntico verificado: **288/288 combinaciones** con igualdad exacta `==` (forward y backward dx/dw/db, sin tolerancias) y **9/9 contratos de error preservados** (`.opencode/benchmarks/conv_equiv_results.md`); suite completa `pytest tests/ -q` → 645 passed / 2 skipped, sin regresiones.
- Los backward ganan más que los forward (2.32×/2.30× vs 1.56×/1.46×): F1 elimina un forward redundante por backward y F5 quita el chequeo de borde de la iteración interna.
- `fit` end-to-end mejora 1.36× (521.949 → 384.789 ms/muestra); proyección del ejemplo completo (`src/Ejemplo.kf`, 4000 imágenes × 5 épocas): ≈2 h 19 min → ≈1 h 45 min.
- Implementación en Python puro sobre listas anidadas, sin dependencias externas. **Los valores absolutos dependen de la CPU y de la carga de la máquina**; las comparaciones antes/después se miden en la misma sesión y máquina.

#### Related

- ADR: ADR-0020
- Resultados: `.opencode/benchmarks/gesha_cnn_optimization_results.md`
- Impacto: `.opencode/progress/impact-cnn-performance.md`
- Review: `.opencode/progress/review-cnn-performance.md` (APPROVED)
