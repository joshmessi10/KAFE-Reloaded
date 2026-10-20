# KAFE Project Structure Review

**Date:** 2026-09-12
**Scope:** Complete exploration of KAFE libraries, ML/DL state, import mechanism, and Hugging Face integration status.

**Historical snapshot:** This review records the repository as observed on 2026-09-12. Paths, API names, and capability notes below preserve that dated state and are not current operational guidance. Consult `.opencode/knowledge/architecture.md` and `.opencode/knowledge/libraries.md` for the current structure.

---

## 1. KafePARDOS (Data Handling Library)

### Location
`src/lib/KafePARDOS/`

### Files
- `DataFrame.py` — DataFrame class implementation
- `funciones.py` — Public API functions (read_csv, read_json, concat, merge)
- `utils.py` — Type inference utility (`inferir_tipo`)

### DataFrame Capabilities
The `DataFrame` class provides a pandas-like API implemented from scratch:

| Method | Description |
|--------|-------------|
| `__init__(columns, data)` | Create DataFrame from column names and row data |
| `head(n)` / `tail(n)` | First/last n rows (default 5) |
| `shape()` | Returns [n_rows, n_cols] |
| `col(column_name)` | Extract a single column as a list (with type coercion) |
| `dtypes()` | Returns list of [column_name, type] pairs |
| `info()` | Summary: rows, columns, names, dtypes |
| `describe()` | Statistical summary: count, mean, std, min, max for numeric columns |
| `to_csv(path)` | Export to CSV file |
| `to_json(path)` | Export to JSON file (records orient) |
| `rename(old, new)` | Rename a column |
| `drop(column_name)` | Drop a column |
| `fillna(value)` | Fill NaN with a value |
| `dropna()` | Drop rows with NaN |
| `ffill()` | Forward fill NaN values |
| `bfill()` | Backward fill NaN values |
| `value_counts(column)` | Count unique values |
| `mean(column)` | Arithmetic mean |
| `sum(column)` | Sum |
| `agg(column, func)` | Aggregate: sum, mean, min, max, count |
| `round(decimals)` | Round floats |
| `query(query_str)` | Filter rows using KAFE expression (parses with ANTLR grammar) |
| `concat(other)` | Vertical concatenation |
| `merge(other, on, how)` | Merge on common column (inner, left) |
| `groupby(column)` | Group by column (returns GroupBy object with mean/sum/count) |

### GroupBy
- `mean()`, `sum()`, `count()` — Aggregation methods

### Public Functions
- `read_csv(path)` — Read CSV (auto-detects `,` or `;` delimiter)
- `read_json(path)` — Read JSON (records format)
- `concat(df1, df2)` — Concatenate DataFrames
- `merge(df1, df2, on, how)` — Merge DataFrames

### Clustering Functionality in KafePARDOS
**None.** KafePARDOS is purely a data handling library. There is no clustering algorithm in this library. The only "clustering" concept exists in KafeGESHA (see section 3).

---

## 2. KafeMACHINE (Machine Learning Library)

### Location
`src/lib/KafeMACHINE/`

### Files
- `BaseMachine.py` — Base class for all ML models (fit/predict/transform pattern)
- `LinearRegression.py` — Linear regression (Normal Equation / Gauss-Jordan elimination)
- `LogisticRegression.py` — Logistic regression (gradient descent, binary)
- `KNN.py` — K-Nearest Neighbors classifier
- `DecisionTree.py` — Decision Tree classifier (Gini/Entropy, with pruning params)
- `metrics.py` — Classification and regression metrics
- `funciones.py` — Public factory functions (machine API)
- `preprocessing/` — Preprocessing transformers

### ML Algorithms

| Algorithm | File | Type | Methods |
|-----------|------|------|---------|
| LinearRegression | `LinearRegression.py` | Regression | fit, predict, score (R²) |
| LogisticRegression | `LogisticRegression.py` | Binary Classification | fit, predict, predict_proba, score |
| KNN | `KNN.py` | Classification | fit, predict, predict_proba, score |
| DecisionTreeClassifier | `DecisionTree.py` | Classification | fit, predict, score |

### Clustering Algorithms in KafeMACHINE
**None.** There are no clustering algorithms (K-Means, DBSCAN, Hierarchical, etc.) in KafeMACHINE. The library is focused on supervised learning.

### Preprocessing Components

| Component | File | Description |
|-----------|------|-------------|
| StandardScaler | `StandardScaler.py` | Zero mean, unit variance scaling |
| MinMaxScaler | `MinMaxScaler.py` | Min-max normalization to [0,1] |
| LabelEncoder | `LabelEncoder.py` | Encode labels as integers |
| OneHotEncoder | `OneHotEncoder.py` | One-hot encoding |
| OrdinalEncoder | `OrdinalEncoder.py` | Ordinal encoding with custom order |
| SimpleImputer | `SimpleImputer.py` | Missing value imputation (mean, median, mode, constant) |
| PCA | `PCA.py` | Principal Component Analysis (Jacobi eigenvalue method) |

### Metrics

**Classification:**
- `accuracy_score(y_true, y_pred)`
- `precision_score(y_true, y_pred)` (macro)
- `recall_score(y_true, y_pred)` (macro)
- `f1_score(y_true, y_pred)` (macro)
- `confusion_matrix(y_true, y_pred)`
- `classification_report(y_true, y_pred)`

**Regression:**
- `mean_squared_error(y_true, y_pred)`
- `mean_absolute_error(y_true, y_pred)`
- `root_mean_squared_error(y_true, y_pred)`
- `r2_score(y_true, y_pred)`
- `max_error(y_true, y_pred)`
- `median_absolute_error(y_true, y_pred)`
- `mean_absolute_percentage_error(y_true, y_pred)`
- `explained_variance_score(y_true, y_pred)`

### Factory Functions (machine.*)

```
machine.linear_regression()
machine.logistic_regression(lr, max_iter)
machine.knn(k)
machine.decision_tree_classifier(criterion, max_depth, min_samples_split, min_samples_leaf)
machine.standard_scaler()
machine.minmax_scaler()
machine.simple_imputer(strategy)
machine.simple_imputer_constant(fill_value)
machine.label_encoder()
machine.one_hot_encoder()
machine.ordinal_encoder()
machine.pca(n_components)
```

---

## 3. KafeGESHA (Deep Learning Library)

### Location
`src/lib/KafeGESHA/`

### Structure
```
KafeGESHA/
├── __init__.py
├── funciones.py          # Public API for the interpreter
├── core/
│   ├── model.py          # Gesha (abstract base) + GeshaDeep (main model)
│   ├── parameter.py
│   └── tensor.py
├── layers/
│   ├── layer.py          # Abstract Layer base class
│   ├── dense.py          # Dense (fully connected) layer
│   ├── dropout.py        # Dropout regularization layer
│   ├── flatten.py        # Flatten layer
│   └── utils.py          # Helpers (df_to_matrix, check_regularization)
├── activations/
│   ├── activation.py     # Abstract ActivationFunction base
│   ├── ActivationFunctionLoader.py  # Factory/loader
│   ├── relu.py           # ReLU
│   ├── sigmoid.py        # Sigmoid
│   ├── softmax.py        # Softmax
│   ├── tanh.py           # Tanh
│   └── step.py           # Identity + Step functions
├── losses/
│   ├── loss.py           # Abstract LossFunction base
│   ├── mse.py            # MSE + MAE
│   ├── binary_crossentropy.py  # Binary Cross-Entropy
│   └── categorical_crossentropy.py  # Categorical + Sparse Categorical CE
├── optimizers/
│   ├── optimizer.py      # Abstract Optimizer base
│   ├── sgd.py            # SGD + RMSprop
│   └── adam.py           # Adam + AdamW
├── models/
│   ├── sequential.py
│   └── functional.py
└── training/
    ├── trainer.py
    ├── forward.py
    ├── backward.py
    └── metrics.py
```

### Deep Learning Layers

| Layer | File | Description |
|-------|------|-------------|
| Dense | `layers/dense.py` | Fully connected layer with activation, L2 regularization, reproducibility seed |
| Dropout | `layers/dropout.py` | Dropout regularization (train/eval modes) |
| Flatten | `layers/flatten.py` | Reshape multi-dimensional input to 1D vector |
| Layer (base) | `layers/layer.py` | Abstract base with forward() and backward() |

### Activation Functions

| Activation | Aliases | File |
|------------|---------|------|
| ReLU | relu | `activations/relu.py` |
| Sigmoid | sigmoid, sigmoide | `activations/sigmoid.py` |
| Softmax | softmax | `activations/softmax.py` |
| Tanh | tanh, tangente | `activations/tanh.py` |
| Identity | linear, identity, identidad | `activations/step.py` |
| Step | step, escalon, escalonada | `activations/step.py` |

### Loss Functions

| Loss | File |
|------|------|
| MeanSquaredError | `losses/mse.py` |
| MeanAbsoluteError | `losses/mse.py` |
| BinaryCrossEntropy | `losses/binary_crossentropy.py` |
| CategoricalCrossEntropy | `losses/categorical_crossentropy.py` |
| SparseCategoricalCrossEntropy | `losses/categorical_crossentropy.py` |

### Optimizers

| Optimizer | File |
|-----------|------|
| SGD | `optimizers/sgd.py` |
| RMSprop | `optimizers/sgd.py` |
| Adam | `optimizers/adam.py` |
| AdamW | `optimizers/adam.py` |

### Model Types
`GeshaDeep` supports four model types:
1. **classification** — Multi-class classification with softmax output
2. **binary** — Binary classification with sigmoid output
3. **regression** — Regression with linear output
4. **clustering** — Neural-network-based clustering (soft assignments to k centers, trained with distance-based loss)

### Clustering in KafeGESHA
The `clustering()` model type in KafeGESHA implements a soft-assignment neural clustering approach:
- Uses softmax output layer to produce cluster probabilities
- Centers are computed as weighted means of input features
- Loss is based on inverse-distance weighting
- This is NOT a traditional K-Means; it is a neural network trained to approximate soft clustering assignments

### Public Functions (geshaDeep.*)

```
geshaDeep.create_dense(units, activation, input_shape, regularization_lambda, seed)
geshaDeep.classification()
geshaDeep.clustering()
geshaDeep.regression()
geshaDeep.binary()
geshaDeep.categorical()    # alias for classification()
geshaDeep.compile(model, optimizer, loss, metrics)
geshaDeep.set_lr(model, new_lr)
geshaDeep.fit_from_df(model, df, y_columns, epochs, batch_size, x_val, y_val)
```

---

## 4. All Available Libraries

### Library Registry (src/lib/)

| Directory | Import Name | Purpose | Key Functions |
|-----------|-------------|---------|---------------|
| `KafeNUMK/` | `numk` | Linear algebra (NumPy-like) | add, sub, mul, inv, transpose, dot, dot_matrix, zeros, zeros_matrix, shape |
| `KafeMATH/` | `math` | Math utilities | exp, log, sqrt, pow_, sin, cos, tan, asin, acos, atan, sinh, cosh, tanh, factorial, comb, perm, gcd, lcm, floor, ceil, round, abs, erf, erfc, gamma, lgamma, dist, hypot, etc. |
| `KafeFILES/` | `files` | File I/O | create, read, write, delete |
| `KafePLOT/` | `plot` | SVG plotting | figure, graph, bar, pie, render, xlabel, ylabel, title, grid, legend, color, pointColor, pointSize, barValues |
| `KafeGESHA/` | `geshaDeep` | Deep learning | create_dense, classification, clustering, regression, binary, categorical, compile, set_lr, fit_from_df |
| `KafePARDOS/` | `pardos` | DataFrames / CSV-JSON | read_csv, read_json, concat, merge |
| `KafeMACHINE/` | `machine` | ML models & metrics | linear_regression, logistic_regression, knn, decision_tree_classifier, standard_scaler, minmax_scaler, simple_imputer, label_encoder, one_hot_encoder, ordinal_encoder, pca, + all metrics |

### Library Files

| Library | Files |
|---------|-------|
| KafeNUMK | funciones.py, utils.py, errores.py |
| KafeMATH | funciones.py, errores.py |
| KafeFILES | funciones.py |
| KafePLOT | funciones.py, utils.py |
| KafeGESHA | funciones.py, core/, layers/, activations/, losses/, optimizers/, models/, training/ |
| KafePARDOS | funciones.py, DataFrame.py, utils.py |
| KafeMACHINE | funciones.py, BaseMachine.py, LinearRegression.py, LogisticRegression.py, KNN.py, DecisionTree.py, metrics.py, preprocessing/ |

---

## 5. Import Mechanism

### How "importar" / "import" Works

The import system is handled by two main components:

#### 1. Library Import (Built-in Libraries)
**File:** `src/componentes_lenguaje/importar/funciones.py` → `importStmt()`

Process:
1. When `import <name>` is encountered in KAFE code, the interpreter checks if `<name>` exists in `self.libraries` (the registry).
2. If it is a built-in library, the `[module, imported_flag]` entry's flag is flipped to `True`.
3. If it is NOT a built-in library, the interpreter searches for a `.kf` file:
   - First in `globals.current_dir` (current working directory)
   - Then relative to the importar component directory
   - Then in the parent directory
4. If found, it lexes/parses the `.kf` file and visits the resulting AST (recursive import).

#### 2. Library Function Dispatch
**File:** `src/componentes_lenguaje/librerias/funciones.py`

When a user writes `library.function(args)`:
1. `visitObjectFunctionCall` in `EvalVisitorPrimitivo` checks if the object name is a library or a variable.
2. If it is a library, it calls `libraryFunctionCall(library, function_name, args)`.
3. This checks that the library was imported (raises `raiseLibraryNotImported` if not).
4. It then looks up the function via `getattr(library_module, function_name)`.
5. If found, it calls the function with the provided args.
6. For constants, `libraryConstant()` works similarly.

#### 3. Library Registration
**File:** `src/EvalVisitorPrimitivo.py` (lines 44-65)

```python
self.libraries = {
    "numk":      [numk_funcs_module, False],
    "math":      [math_funcs_module, False],
    "files":     [files_funcs_module, False],
    "plot":      [plot_funcs_module, False],
    "geshaDeep": [gesha_funcs_module, False],
    "pardos":    [pardos_funcs_module, False],
    "machine":   [machine_funcs_module, False],
}
```

Each entry is `[module_reference, imported_flag]`. The flag starts as `False` and is set to `True` when the user writes `import <name>`.

#### 4. Adding a New Library
Per `libraries.md`, the process is:
1. Create `src/lib/KafeXXX/funciones.py`
2. Import the module in `EvalVisitorPrimitivo.py`
3. Register in `self.libraries` with the lowercase KAFE import name
4. Add tests under `tests/KafeXXX/`
5. Update docs

---

## 6. Hugging Face Integration

### Status: **NOT EXISTS**

There is **no existing Hugging Face integration** anywhere in the KAFE project:

- No references to `huggingface`, `transformers`, `hf`, `AutoModel`, `AutoTokenizer`, `pipeline`, or `pretrained` in any KAFE source file.
- No `hugging` or `hf` references in any `.md` documentation file.
- The only `tokenizer` references found are in unrelated VS Code extension packaging code (`kafe-vscode/bin/interpreter/packaging/_tokenizer.py`).
- The `Dependency Policy` in `AGENTS.md` explicitly forbids external dependencies by default and requires explicit justification.
- The project's philosophy emphasizes implementing everything from scratch inside KAFE for educational purposes.

---

## 7. Current ML/DL State (from Knowledge Layer)

### KafeMACHINE Priorities (from ml-library.md)
- Current development focuses on: ML algorithms, DL components, Metrics, Preprocessing, Educational documentation, Benchmarks.
- New ML algorithms require: documentation, tests, examples, benchmarks (5 scenarios), enriched concept record.
- Impact Analysis is mandatory before adding ML algorithms.
- No external ML implementations allowed (no sklearn, TensorFlow, PyTorch).

### KafeGESHA State (from dl-library.md)
- Deep learning components implemented from scratch.
- New DL components require: documentation, tests, examples, benchmarks.
- Impact Analysis is mandatory before adding DL components.
- No external DL frameworks allowed.

### Architecture Notes (from dl-library.md)
- GeshaDeep model supports: classification, binary, regression, clustering.
- Layers: Dense (with activation, L2 reg, seed), Dropout, Flatten.
- Losses: MSE, MAE, Binary CE, Categorical CE, Sparse Categorical CE.
- Optimizers: SGD, RMSprop, Adam, AdamW.
- Activations: ReLU, Sigmoid, Softmax, Tanh, Identity, Step.

---

## 8. Summary of Findings

### What Exists
1. **KafePARDOS** — Full DataFrame implementation with CSV/JSON I/O, querying, merging, grouping.
2. **KafeMACHINE** — 4 supervised ML algorithms (Linear Regression, Logistic Regression, KNN, Decision Tree) + 7 preprocessing transformers + 14 metrics.
3. **KafeGESHA** — Deep learning framework with Dense/Dropout/Flatten layers, 6 activations, 5 losses, 4 optimizers, and 4 model types (including clustering).
4. **KafeMATH** — Comprehensive math library (trig, log, exp, combinatorics, etc.).
5. **KafeNUMK** — Linear algebra (matrix ops, dot product, inverse, transpose).
6. **KafeFILES** — Basic file I/O.
7. **KafePLOT** — SVG plotting (line, bar, pie charts).

### What Does NOT Exist
1. **No clustering algorithms in KafeMACHINE** — No K-Means, DBSCAN, Hierarchical, or other traditional clustering algorithms.
2. **No Hugging Face integration** — Zero references to Hugging Face, transformers, or pretrained models.
3. **No neural network layers beyond Dense/Dropout/Flatten** — No Conv2D, LSTM, BatchNorm, Embedding, Attention, etc.
4. **No ensemble methods** — No Random Forest, Gradient Boosting, SVM, etc.
5. **No NLP-specific functionality** — No tokenization, embeddings, or text processing beyond basic string operations.

### Clustering Summary
The only clustering-related code exists in `KafeGESHA/core/model.py` as the `clustering` model type in `GeshaDeep`. This is a neural-network-based soft clustering approach, NOT a traditional clustering algorithm like K-Means. There are no standalone clustering algorithms anywhere in the codebase.
