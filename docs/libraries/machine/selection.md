# MACHINE · Selección de modelos

[Return to Index](../machine.md)

## Model Selection

Tools for splitting datasets and evaluating models robustly.

### Main functions

| Function | Signature | Description |
|---------|-------|-------------|
| `machine.train_test_split(X, y, test_size, random_state, shuffle)` | `(List[List[NUM]], List[NUM], FLOAT, INT, BOOL) -> Tuple` | Splits data into training and test sets; shuffling is enabled by default |
| `machine.k_fold(n_samples, n_splits, shuffle, random_state)` | `(INT, INT, BOOL, INT) -> List` | Returns training and test index pairs for each fold; shuffling is disabled by default |

### train_test_split

Splits the dataset into a training set (to fit the model) and a test set (to evaluate generalization).

#### Theory

Given a dataset of $n$ examples, randomly partitions it into two subsets:
- **Training set**: $(1 - \text{test\_size}) \cdot n$ examples
- **Test set**: $\text{test\_size} \cdot n$ examples (default: 20%)

Set `shuffle=False` to retain input order. A nonzero `random_state` makes shuffling reproducible; the default value `0` selects a non-fixed seed. The function does not stratify by class label.

#### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `train_test_split(X, y, test_size, random_state, shuffle)` | `(List[List[NUM]], List[NUM], FLOAT, INT, BOOL) -> Tuple` | Returns `(X_train, X_test, y_train, y_test)` |

#### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0], [2.0], [3.0], [4.0], [5.0],
                        [6.0], [7.0], [8.0], [9.0], [10.0]];
List[FLOAT] y = [2.0, 4.0, 6.0, 8.0, 10.0,
                 12.0, 14.0, 16.0, 18.0, 20.0];

-- 80/20 split with a fixed seed
(List[List[FLOAT]] X_train, List[List[FLOAT]] X_test,
 List[FLOAT] y_train, List[FLOAT] y_test) = machine.train_test_split(X, y, 0.2, 42);

show(len(X_train));  -- 8
show(len(X_test));   -- 2

MACHINE lr = machine.linear_regression();
lr.fit(X_train, y_train);

FLOAT r2 = lr.score(X_test, y_test);
show(r2);  -- ~1.0
```

### k_fold

Partitions sample indices into $k$ folds and returns the train/test indices for each fold. This function does not fit or evaluate a model; use `CrossValScore` for model evaluation.

#### Theory

1. Create an index for each sample.
2. Optionally shuffle the indices.
3. Split the indices into $k$ folds and return one training/test index pair per fold.

Each sample is used once for testing and $k-1$ times for training. Scoring and model fitting are handled separately.

#### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `k_fold(n_samples, n_splits, shuffle, random_state)` | `(INT, INT, BOOL, INT) -> List` | Returns `(train_indices, test_indices)` pairs |

The default is `n_splits=5`, `shuffle=False`, and `random_state=0`. When shuffling is enabled, a nonzero `random_state` provides reproducible partitions; `0` selects a non-fixed seed.

#### Comparison: train-test split vs. K-fold CV

| Aspect | Train-Test Split | K-Fold CV |
|---------|------------------|-----------|
| Partitions | 1 | $k$ |
| Variance | High | Low |
| Computational cost | $1 \times$ | $k \times$ |
| Data usage | Leaves out the test set | Each sample is used for testing and training |
| Best suited for | Large datasets | Small or medium datasets |

---

## CrossValScore

Object-oriented wrapper for evaluating models with K-fold cross-validation. It computes per-fold scores, their mean, and standard deviation.

### Function

| Function | Signature | Description |
|---------|-------|-------------|
| `machine.cross_val_score(cv, scoring, random_state)` | `(INT, STR, INT) -> MACHINE` | Creates a cross-validation evaluator |

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `cvs.fit(model, X, y)` | `(MACHINE, List[List[NUM]], List[NUM]) -> VOID` | Evaluates the model with K-fold CV |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `cvs.scores_` | `List[FLOAT]` | Score for each fold |
| `cvs.mean_score_` | `FLOAT` | Mean score |
| `cvs.std_score_` | `FLOAT` | Standard deviation of the scores |

### Scoring strategies

| Strategy | Description |
|------------|-------------|
| `"accuracy"` | Accuracy (default) |
| `"r2"` | Coefficient of determination |
| `"mse"` | Mean squared error |

### Example

```kafe
import machine;

MACHINE lr = machine.linear_regression();

-- Evaluate with 5-fold CV using R²
MACHINE cvs = machine.cross_val_score(5, "r2", 42);
cvs.fit(lr, X, y);

show(cvs.scores_);       -- [0.92, 0.95, 0.88, 0.91, 0.94]
show(cvs.mean_score_);   -- ~0.92
show(cvs.std_score_);    -- ~0.025
```

---

## GridSearchCV

Exhaustive hyperparameter search over a defined grid, evaluating each combination with cross-validation.

### Theory

GridSearchCV evaluates **all** possible parameter combinations defined in the grid:

- Complexity: $O(\prod_{i=1}^{p} |G_i| \cdot k \cdot T_{\text{model}})$, where $|G_i|$ is the number of values for parameter $i$, $k$ is the number of folds, and $T_{\text{model}}$ is the training time per fit.
- Benefit: Finds the best combination within the defined grid.
- Limitation: Cost grows exponentially as parameters are added (the curse of dimensionality).

### Function

| Function | Signature | Description |
|---------|-------|-------------|
| `machine.grid_search_cv(cv, scoring, random_state)` | `(INT, STR, INT) -> MACHINE` | Creates a GridSearchCV wrapper; the current KAFE factory does not accept a parameter grid |

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `gs.fit(X, y)` | `(List[List[NUM]], List[NUM]) -> VOID` | Runs the exhaustive CV search |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `gs.best_params_` | `Dict` | Best parameters found |
| `gs.best_score_` | `FLOAT` | Best cross-validation score |
| `gs.cv_results_` | `List[FLOAT]` | Mean score for each evaluated combination |

The KAFE factory currently initializes an empty grid and does not expose a parameter-grid argument. The underlying Python `GridSearchCV` constructor accepts `param_grid`, but a configured grid search is not currently available through this KAFE factory.

### Comparison: GridSearchCV vs. RandomizedSearchCV

| Aspect | GridSearchCV | RandomizedSearchCV |
|---------|--------------|---------------------|
| Search | Exhaustive (all combinations) | Random sampling (`n_iter` combinations) |
| Complexity | $O(\prod \|G_i\| \cdot k \cdot T)$ | $O(n \cdot k \cdot T)$ |
| Continuous space | Discretized | Native (distributions) |
| Guarantee | Optimal within the grid | Not guaranteed |
| Speed | Slow with many parameters | Faster and controllable |

---

## RandomizedSearchCV

Randomized hyperparameter search samples a fixed number of combinations from defined distributions and evaluates each with cross-validation.

### Theory

RandomizedSearchCV performs **random search** over parameter distributions:

- Complexity: $O(n \cdot k \cdot T_{\text{model}})$, where $n$ is `n_iter`, $k$ is the number of folds, and $T_{\text{model}}$ is the training time per fit.
- With a fixed budget $B$, it can explore more combinations than GridSearch because it does not depend on grid size.
- It can use continuous distributions (for example, a log-uniform distribution for learning rates).

### Function

| Function | Signature | Description |
|---------|-------|-------------|
| `machine.randomized_search_cv(n_iter, cv, scoring, random_state)` | `(INT, INT, STR, INT) -> MACHINE` | Creates a RandomizedSearchCV wrapper; the current KAFE factory does not accept parameter distributions |

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `rs.fit(X, y)` | `(List[List[NUM]], List[NUM]) -> VOID` | Runs the randomized CV search |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `rs.best_params_` | `Dict` | Best parameters found |
| `rs.best_score_` | `FLOAT` | Best cross-validation score |
| `rs.cv_results_` | `List[FLOAT]` | Mean score for each sampled combination |

The KAFE factory currently initializes an empty distribution and does not expose a parameter-distribution argument. The underlying Python `RandomizedSearchCV` constructor accepts `param_distributions`, but a configured randomized search is not currently available through this KAFE factory.

---

## Pipeline

Chains multiple preprocessing steps and a final model in one object. It prevents data leakage by ensuring that each transformer sees only the training data during `fit()`.

### Theory

Given a pipeline $P = [T_1, T_2, \ldots, T_n, M]$:

**Training**: Each transformer is fitted and applied in sequence, then the final model is fitted to the transformed data.

**Prediction**: Each transformation is applied in order, then the model makes a prediction.

### Function

| Function | Signature | Description |
|---------|-------|-------------|
| `machine.pipeline(name1, step1, name2, step2, ...)` | `(STR, MACHINE, ...) -> MACHINE` | Creates a pipeline with named steps |

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `pipe.fit(X, y)` | `(List[List[NUM]], List[NUM]) -> VOID` | Fits all pipeline steps |
| `pipe.predict(X)` | `(List[List[NUM]]) -> List[NUM]` | Applies transformations and predicts |
| `pipe.score(X, y, metric)` | `(List[List[NUM]], List[NUM], FUNC) -> FLOAT` | Evaluates using the final model |
| `pipe.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Applies only the transformations |
| `pipe.fit_transform(X, y)` | `(List[List[NUM]], List[NUM]) -> List[List[FLOAT]]` | Fits and transforms |
| `pipe.get_params()` | `() -> List[STR]` | Returns the step names |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `pipe.named_steps_` | `Dict` | Steps indexed by name (after fitting) |
| `pipe.steps_` | `List[Tuple]` | List of fitted (name, step) tuples |

### Example

```kafe
import machine;

-- Create transformers and a model
MACHINE scaler = machine.standard_scaler();
MACHINE lr = machine.linear_regression();

-- Create a pipeline: scale -> linear regression
MACHINE pipe = machine.pipeline("scaler", scaler, "model", lr);

-- Fit the full pipeline
pipe.fit(X_train, y_train);

-- Predict (the scaler is applied automatically)
List[FLOAT] preds = pipe.predict(X_test);

-- Evaluate
FLOAT r2 = pipe.score(X_test, y_test);

-- Access specific steps
show(pipe.named_steps_["scaler"]);
show(pipe.get_params());  -- ["scaler", "model"]
```

### Comparison: manual code vs. pipeline

| Aspect | Manual code | Pipeline |
|---------|---------------|----------|
| Data leakage | High risk (forgetting to separate fit/transform) | Prevented automatically |
| Modularity | Repetitive code | Reusable blocks |
| Cross-validation | Common error: fit the scaler on the entire dataset | Correct by design |
| Hyperparameter search | Not exposed through the current KAFE factory | Not exposed through the current KAFE factory |
| Readability | Multiple fit/transform lines | One expressive object |

---
