# Benchmark Records

This file consolidates all benchmark records for KAFE. Individual benchmark files have been merged here to reduce file accumulation.

## Benchmark Index

| Benchmark | Component | Category | Date | Status |
|-----------|-----------|----------|------|--------|
| DecisionTreeClassifier | `src/lib/KafeMACHINE/DecisionTree.py` | ML algorithm | 2026-08-04 | Baseline |
| KafeMACHINE Full Suite | `src/lib/KafeMACHINE/` (all models) | ML algorithm | 2026-08-04 | Baseline |
| OrdinalEncoder | `src/lib/KafeMACHINE/preprocessing/OrdinalEncoder.py` | ML preprocessing | 2026-09-02 | Baseline |

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

### Rules

- Each benchmark targets one component under `src/lib/`
- Measure time and/or memory on representative workloads
- Be reproducible: record dataset, hardware, environment, and methodology
- Update the index table after adding a new benchmark
- Keep related references up to date
