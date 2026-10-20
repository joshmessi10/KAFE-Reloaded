# MACHINE · Functions and metrics

[Return to Index](../machine.md)

## Main functions

| Function | Signature | Description |
|---------|-------|-------------|
| `machine.linear_regression()` | `() -> MACHINE` | Creates a linear regression model |
| `machine.ridge_regression(alpha, fit_intercept, max_iter)` | `(FLOAT, BOOL, INT) -> MACHINE` | Creates a Ridge model (L2 regularization) |
| `machine.lasso_regression(alpha, fit_intercept, max_iter)` | `(FLOAT, BOOL, INT) -> MACHINE` | Creates a Lasso model (L1 regularization) |
| `machine.logistic_regression(lr, iter)` | `(FLOAT, INT) -> MACHINE` | Creates a logistic regression model |
| `machine.knn(k)` | `(INT) -> MACHINE` | Creates a KNN classifier |
| `machine.knn_regressor(k)` | `(INT) -> MACHINE` | Creates a KNN regressor |
| `machine.standard_scaler()` | `() -> MACHINE` | Creates a Z-score standardizer |
| `machine.minmax_scaler()` | `() -> MACHINE` | Creates a min-max scaler |
| `machine.simple_imputer(strategy)` | `(STR) -> MACHINE` | Creates a missing-value imputer |
| `machine.simple_imputer_constant(v)` | `(NUM) -> MACHINE` | Creates an imputer with a constant strategy |
| `machine.label_encoder()` | `() -> MACHINE` | Creates a label encoder |
| `machine.one_hot_encoder()` | `() -> MACHINE` | Creates a one-hot encoder |
| `machine.ordinal_encoder()` | `() -> MACHINE` | Creates an ordinal encoder (ordered integers) |
| `machine.pca(n)` | `(INT) -> MACHINE` | Creates a PCA model with n components |
| `machine.dbscan(eps, min_samples)` | `(FLOAT, INT) -> MACHINE` | Creates a DBSCAN clustering model |
| `machine.gaussian_mixture(n_components, max_iter, tol, random_state)` | `(INT, INT, FLOAT, INT) -> MACHINE` | Creates a Gaussian mixture model (GMM) |
| `machine.gaussian_nb()` | `() -> MACHINE` | Creates a Gaussian Naive Bayes classifier |
| `machine.random_forest_classifier(n_est, depth, split, leaf)` | `(INT, INT, INT, INT) -> MACHINE` | Creates a random forest classifier |
| `machine.random_forest_regressor(n_est, depth, split, leaf)` | `(INT, INT, INT, INT) -> MACHINE` | Creates a random forest regressor |
| `machine.decision_tree_regressor(criterion, max_depth, min_samples_split, min_samples_leaf)` | `(STR, INT, INT, INT) -> MACHINE` | Creates a decision tree regressor |
| `machine.polynomial_features(degree, include_bias)` | `(INT, BOOL) -> MACHINE` | Creates polynomial features up to the specified degree |
| `machine.elastic_net(alpha, l1_ratio, fit_intercept, max_iter)` | `(FLOAT, FLOAT, BOOL, INT) -> MACHINE` | Creates an ElasticNet model (L1 + L2 regularization) |
| `machine.pipeline(name1, step1, ...)` | `(STR, MACHINE, ...) -> MACHINE` | Creates a preprocessing and model pipeline |
| `machine.cross_val_score(cv, scoring, random_state)` | `(INT, STR, INT) -> MACHINE` | Creates a cross-validation evaluator |

---

## One metric API for MACHINE and Gesha

Import `machine` to calculate metrics for either library. Train the estimator or neural network with its own API, then pass true values and predictions to `machine.<metric>(y_true, y_pred)`. Accuracy and ROC AUC are fractions from 0 to 1; multiply accuracy by 100 only when displaying a percentage. Regression errors keep the target's units (or squared units for MSE), and R² can be negative.

| Task | MACHINE prediction | Gesha prediction | Metric input |
|---|---|---|---|
| Classification accuracy | `model.predict(X_test)` | `network.predict_label(X_test)` | Class labels, then `machine.accuracy_score` |
| Binary ROC AUC | Model probability/score output | `network.predict(X_test)` | Raw positive-class scores, then `machine.roc_auc_score` |
| Single-output regression | `model.predict(X_test)` | `network.predict(X_test)` | Numeric predictions, then `machine.mean_squared_error`, `machine.r2_score`, etc. |

For Gesha, batch `predict` returns rows such as `[[0.2], [0.9]]` for a single output. Regression metrics and binary ROC AUC accept this single-column shape as well as a flat vector. Classification metrics expect flat **labels**; use `predict_label`. Multi-output prediction rows such as `[[0.1, 0.9], ...]` cannot be reduced to one regression value per sample automatically.

```kafe
import machine;
import gesha;

List[List[FLOAT]] X = [[0.0], [1.0], [2.0], [3.0]];
List[FLOAT] y = [0.0, 1.0, 2.0, 3.0];
GESHA output = gesha.create_dense(1, "linear", [1], 0.0, 42);
GESHA network = gesha.sequential([output]);
network.compile("adam", "mse", []);
network.fit(X, y, 5, 2);
List[List[FLOAT]] predictions = network.predict(X);
show(machine.mean_squared_error(y, predictions));
```

In a real workflow, split into training and test sets first and calculate this metric on `X_test` and `y_test`.

## Classification metrics

| Function | Signature | Description |
|---------|-------|-------------|
| `machine.accuracy_score(y_true, y_pred)` | `(List[NUM], List[NUM]) -> FLOAT` | Proportion of correct predictions |
| `machine.precision_score(y_true, y_pred)` | `(List[NUM], List[NUM]) -> FLOAT` | Macro-average: TP / (TP + FP) per class |
| `machine.recall_score(y_true, y_pred)` | `(List[NUM], List[NUM]) -> FLOAT` | Macro-average: TP / (TP + FN) per class |
| `machine.f1_score(y_true, y_pred)` | `(List[NUM], List[NUM]) -> FLOAT` | Mean of the per-class F1 scores (macro F1) |
| `machine.confusion_matrix(y_true, y_pred)` | `(List[NUM], List[NUM]) -> List[List[INT]]` | N×N confusion matrix |
| `machine.classification_report(y_true, y_pred)` | `(List[NUM], List[NUM]) -> STR` | scikit-learn-style text report |
| `machine.roc_auc_score(y_true, y_score)` | `(List[NUM], List[NUM]) -> FLOAT` | Area under the ROC curve (binary classification) |

### Example

```kafe
import machine;

List[INT] y_true = [1, 0, 1, 1, 0];
List[INT] y_pred = [1, 0, 1, 0, 0];

FLOAT acc = machine.accuracy_score(y_true, y_pred);      -- 0.8
FLOAT prec = machine.precision_score(y_true, y_pred);    -- 0.833...
FLOAT rec = machine.recall_score(y_true, y_pred);        -- 0.833...
FLOAT f1 = machine.f1_score(y_true, y_pred);             -- 0.8

List[List[INT]] cm = machine.confusion_matrix(y_true, y_pred);
show(cm);  -- [[2, 0], [1, 2]]

STR report = machine.classification_report(y_true, y_pred);
show(report);
```

### ROC AUC

Evaluates a binary classifier's ability to discriminate by calculating the area under the ROC curve (TPR vs. FPR). It is **threshold-independent** and measures how well the model ranks positive examples above negative ones.

**Definition**: AUC is the probability that a randomly selected positive example receives a higher score than a randomly selected negative example.

- AUC = 1.0: perfect classifier
- AUC = 0.5: random classifier
- AUC < 0.5: worse than random

**Supports binary classification only** (two classes).

```kafe
import machine;

List[INT] y_true = [1, 0, 1, 1, 0];
List[FLOAT] y_score = [0.9, 0.1, 0.8, 0.7, 0.2];

FLOAT auc = machine.roc_auc_score(y_true, y_score);
show(auc);  -- 1.0
```

---

## Clustering metrics

| Function | Signature | Description |
|---------|-------|-------------|
| `machine.silhouette_score(X, labels)` | `(List[List[NUM]], List[INT]) -> FLOAT` | Mean silhouette score (-1 to 1); singleton clusters contribute 0, and all-singleton partitions are undefined |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 1.0], [1.5, 1.5], [2.0, 2.0],
                        [8.0, 8.0], [8.5, 8.5], [9.0, 9.0]];
List[INT] labels = [0, 0, 0, 1, 1, 1];

FLOAT score = machine.silhouette_score(X, labels);
show(score);  -- ~0.87 (well-separated clusters)
```

### Silhouette score

Measures clustering quality by comparing how similar each point is to its own cluster (cohesion) versus other clusters (separation). It does not require ground-truth labels.

**Definition**: For each point $i$:
- $a(i)$ = mean distance to the other points in the same cluster
- $b(i)$ = lowest mean distance to another cluster
- $s(i) = (b(i) - a(i)) / \max(a(i), b(i))$

- $s \approx 1$: point is well matched to its cluster
- $s \approx 0$: point lies near a cluster boundary
- $s < 0$: point may be assigned to the wrong cluster

---

## Regression metrics

| Function | Formula | Description |
|---------|---------|-------------|
| `machine.mean_squared_error(y, ŷ)` | $(1/n)\sum (y - ŷ)^2$ | Mean squared error |
| `machine.mean_absolute_error(y, ŷ)` | $(1/n)\sum \|y - ŷ\|$ | Mean absolute error |
| `machine.root_mean_squared_error(y, ŷ)` | $\sqrt{MSE}$ | Root mean squared error |
| `machine.r2_score(y, ŷ)` | $1 - SS_{res}/SS_{tot}$ | Coefficient of determination |
| `machine.max_error(y, ŷ)` | $\max \|y - ŷ\|$ | Maximum absolute error |
| `machine.median_absolute_error(y, ŷ)` | $\text{median}(\|y - ŷ\|)$ | Median absolute error |
| `machine.mean_absolute_percentage_error(y, ŷ)` | $(100/n)\sum \|(y - ŷ)/y\|$ | Mean absolute percentage error |
| `machine.explained_variance_score(y, ŷ)` | $1 - \text{Var}(y - ŷ)/\text{Var}(y)$ | Explained variance |

### Example

```kafe
import machine;

List[INT] y_true = [1, 3];
List[INT] y_pred = [2, 3];

FLOAT mse  = machine.mean_squared_error(y_true, y_pred);             -- 0.5
FLOAT mae  = machine.mean_absolute_error(y_true, y_pred);           -- 0.5
FLOAT rmse = machine.root_mean_squared_error(y_true, y_pred);       -- 0.707...
FLOAT r2   = machine.r2_score(y_true, y_pred);                      -- 0.5
FLOAT me   = machine.max_error(y_true, y_pred);                     -- 1.0
FLOAT mdae = machine.median_absolute_error(y_true, y_pred);         -- 0.5
FLOAT mape = machine.mean_absolute_percentage_error(y_true, y_pred); -- 50.0
FLOAT ev   = machine.explained_variance_score(y_true, y_pred);      -- 0.75
```

---
