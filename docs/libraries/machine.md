# MACHINE — Machine learning utilities

MACHINE provides scikit-learn-style machine learning algorithms, including regression and classification models, preprocessing tools, and evaluation metrics.

**Import:**

```kafe
import machine;
```

---

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

## Classification metrics

| Function | Signature | Description |
|---------|-------|-------------|
| `machine.accuracy_score(y_true, y_pred)` | `(List[NUM], List[NUM]) -> FLOAT` | Proportion of correct predictions |
| `machine.precision_score(y_true, y_pred)` | `(List[NUM], List[NUM]) -> FLOAT` | Macro-average: TP / (TP + FP) per class |
| `machine.recall_score(y_true, y_pred)` | `(List[NUM], List[NUM]) -> FLOAT` | Macro-average: TP / (TP + FN) per class |
| `machine.f1_score(y_true, y_pred)` | `(List[NUM], List[NUM]) -> FLOAT` | Harmonic mean of macro-averaged precision and recall |
| `machine.confusion_matrix(y_true, y_pred)` | `(List[NUM], List[NUM]) -> List[List[INT]]` | N×N confusion matrix |
| `machine.classification_report(y_true, y_pred)` | `(List[NUM], List[NUM]) -> STR` | scikit-learn-style text report |
| `machine.roc_auc_score(y_true, y_score)` | `(List[NUM], List[NUM]) -> FLOAT` | Area under the ROC curve (binary classification) |

### Example

```kafe
import machine;

List[INT] y_true = [1, 0, 1, 1, 0];
List[INT] y_pred = [1, 0, 1, 0, 0];

FLOAT acc = machine.accuracy_score(y_true, y_pred);      -- 0.8
FLOAT prec = machine.precision_score(y_true, y_pred);    -- 1.0
FLOAT rec = machine.recall_score(y_true, y_pred);        -- 0.666...
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
| `machine.silhouette_score(X, labels)` | `(List[List[NUM]], List[INT]) -> FLOAT` | Mean silhouette score (-1 to 1) |

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

## LinearRegression

Implements ordinary least-squares linear regression using the normal equation: $\hat{\beta} = (X^T X)^{-1} X^T y$.

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `lr.fit(X, y)` | `(List[List[NUM]] or List[NUM], List[NUM]) -> VOID` | Fits the model |
| `lr.predict(X)` | `(List[List[NUM]] or List[NUM]) -> List[FLOAT]` | Predicts values |
| `lr.score(X, y)` | `(List[List[NUM]] or List[NUM], List[NUM]) -> FLOAT` | Computes R² |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `lr.coef_` | `List[FLOAT]` | Coefficient for each feature |
| `lr.intercept_` | `FLOAT` | Intercept term |

### Example

```kafe
import machine;

List[FLOAT] x = [1.0, 2.0, 3.0, 4.0, 5.0];
List[FLOAT] y = [2.1, 4.0, 5.8, 8.1, 10.0];

MACHINE lr = machine.linear_regression();
lr.fit(x, y);

show(lr.coef_);       -- ~[1.98]
show(lr.intercept_);  -- ~0.06

List[FLOAT] preds = lr.predict([6.0, 7.0]);
show(preds);           -- ~[11.96, 13.94]

FLOAT r2 = lr.score(x, y);
show(r2);              -- ~0.997
```

---

## RidgeRegression

Implements linear regression with L2 regularization, which penalizes large coefficients to reduce overfitting.

### Theory

Ridge minimizes: $||y - X\theta||^2 + \alpha||\theta||^2$

The term $\alpha||\theta||^2$ penalizes large coefficients without removing them completely.

**Closed-form solution**: $\theta = (X^T X + \alpha I)^{-1} X^T y$

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `ridge.fit(X, y)` | `(List[List[NUM]] or List[NUM], List[NUM]) -> VOID` | Fits the model |
| `ridge.predict(X)` | `(List[List[NUM]] or List[NUM]) -> List[NUM]` | Predicts values |
| `ridge.score(X, y)` | `(List[List[NUM]] or List[NUM], List[NUM]) -> FLOAT` | Computes R² |

### Constructor parameters

```kafe
-- Defaults: alpha=1.0, fit_intercept=True, max_iter=1000
MACHINE ridge = machine.ridge_regression(1.0, True, 1000);
```

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `ridge.coef_` | `List[FLOAT]` | Model coefficients |
| `ridge.intercept_` | `FLOAT` | Intercept |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0], [2.0], [3.0], [4.0], [5.0]];
List[FLOAT] y = [2.0, 4.0, 5.0, 4.0, 5.0];

MACHINE ridge = machine.ridge_regression(1.0);
ridge.fit(X, y);

List[FLOAT] preds = ridge.predict([[1.5], [3.0], [5.5]]);
show(preds);

FLOAT r2 = ridge.score(X, y);
show(r2);
```

### Comparison with LinearRegression

| Aspect | LinearRegression | RidgeRegression |
|---------|------------------|-----------------|
| Regularization | None | L2 |
| Overfitting | Susceptible | Reduced |
| Coefficients | Can be large | Penalized |
| Collinear features | Unstable | Stable |

---

## LassoRegression

Implements linear regression with L1 regularization, which can remove features entirely (feature selection).

### Theory

Lasso minimizes: $||y - X\theta||^2 + \alpha||\theta||_1$

The term $\alpha||\theta||_1$ can set coefficients exactly to zero, removing irrelevant features.

**Algorithm**: Coordinate descent with soft-thresholding (there is no closed-form solution).

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `lasso.fit(X, y)` | `(List[List[NUM]] or List[NUM], List[NUM]) -> VOID` | Fits the model |
| `lasso.predict(X)` | `(List[List[NUM]] or List[NUM]) -> List[NUM]` | Predicts values |
| `lasso.score(X, y)` | `(List[List[NUM]] or List[NUM], List[NUM]) -> FLOAT` | Computes R² |

### Constructor parameters

```kafe
-- Defaults: alpha=1.0, fit_intercept=True, max_iter=1000
MACHINE lasso = machine.lasso_regression(1.0, True, 1000);
```

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `lasso.coef_` | `List[FLOAT]` | Coefficients (some may be zero) |
| `lasso.intercept_` | `FLOAT` | Intercept |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 0.0], [2.0, 0.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0]];
List[FLOAT] y = [2.0, 4.0, 6.0, 8.0, 10.0];

MACHINE lasso = machine.lasso_regression(0.5);
lasso.fit(X, y);

-- Lasso may have removed the second feature (coefficient = 0)
List[FLOAT] preds = lasso.predict([[1.5, 0.0], [3.0, 0.0]]);
show(preds);
```

### Feature selection

Lasso can set coefficients to zero, removing features:

```kafe
-- Higher alpha -> more coefficients set to zero
MACHINE lasso = machine.lasso_regression(1.0);
-- Lower alpha -> fewer coefficients set to zero
MACHINE lasso = machine.lasso_regression(0.1);
```

---

## ElasticNet

Implements linear regression with combined L1 and L2 regularization, combining the benefits of Ridge (handling correlated features) and Lasso (feature selection).

### Theory

ElasticNet minimizes: $\frac{1}{2n}||y - X\theta||^2 + \alpha \cdot l1\_ratio \cdot ||\theta||_1 + \alpha \cdot (1 - l1\_ratio) \cdot ||\theta||^2$

Where:
- $\alpha$ is the overall regularization strength.
- $l1\_ratio$ controls the L1-to-L2 ratio (0 = pure Ridge, 1 = pure Lasso).

**Algorithm**: Coordinate descent with soft-thresholding (there is no closed-form solution).

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `en.fit(X, y)` | `(List[List[NUM]] or List[NUM], List[NUM]) -> VOID` | Fits the model |
| `en.predict(X)` | `(List[List[NUM]] or List[NUM]) -> List[NUM]` | Predicts values |
| `en.score(X, y)` | `(List[List[NUM]] or List[NUM], List[NUM]) -> FLOAT` | Computes R² |

### Constructor parameters

```kafe
-- Defaults: alpha=1.0, l1_ratio=0.5, fit_intercept=True, max_iter=1000
MACHINE en = machine.elastic_net(1.0, 0.5, True, 1000);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `alpha` | FLOAT | 1.0 | Regularization strength |
| `l1_ratio` | FLOAT | 0.5 | L1-to-L2 ratio (0 = Ridge, 1 = Lasso) |
| `fit_intercept` | BOOL | `True` | Whether to fit an intercept |
| `max_iter` | INT | 1000 | Maximum number of iterations |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `en.coef_` | `List[FLOAT]` | Coefficients (some may be zero) |
| `en.intercept_` | `FLOAT` | Intercept |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0], [7.0, 8.0]];
List[FLOAT] y = [2.0, 4.0, 6.0, 8.0];

MACHINE en = machine.elastic_net(1.0, 0.5);
en.fit(X, y);

show(en.coef_);      -- Coefficients (some may be zero)
show(en.intercept_); -- Intercept

List[FLOAT] preds = en.predict([[2.0, 3.0], [6.0, 7.0]]);
show(preds);

FLOAT r2 = en.score(X, y);
show(r2);
```

### Comparison: Ridge vs. Lasso vs. ElasticNet

| Aspect | Ridge (L2) | Lasso (L1) | ElasticNet (L1+L2) |
|---------|-----------|------------|---------------------|
| Feature selection | No | Yes | Yes |
| Handling correlated features | Yes | Unstable | Yes |
| Number of parameters | 1 ($\alpha$) | 1 ($\alpha$) | 2 ($\alpha$, $l1\_ratio$) |
| Sparsity | No | Yes | Yes (tunable) |
| Feature groups | No | No | Yes |

### When to use it

- Many potentially irrelevant features: ElasticNet with a high $l1\_ratio$.
- Correlated features (for example, one-hot encoding): ElasticNet with a low $l1\_ratio$.
- Balance feature selection and stability: ElasticNet with an intermediate $l1\_ratio$.

---

## SVR (Support Vector Regression)

Implements regression using support vector machines with an epsilon-insensitive loss function.

### Theory

SVR finds a hyperplane that fits the data within a tube of radius ε. Only points outside the tube (support vectors) contribute to the model.

**Epsilon-insensitive loss**: $L_\epsilon(y, f(x)) = \max(0, |y - f(x)| - \epsilon)$

**Available kernels**:
- `linear`: $K(x_i, x_j) = x_i \cdot x_j$
- `rbf`: $K(x_i, x_j) = \exp(-\gamma ||x_i - x_j||^2)$
- `poly`: $K(x_i, x_j) = (x_i \cdot x_j + 1)^d$

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `svr.fit(X, y)` | `(List[List[NUM]] or List[NUM], List[NUM]) -> VOID` | Fits the model |
| `svr.predict(X)` | `(List[List[NUM]] or List[NUM]) -> List[NUM]` | Predicts values |
| `svr.score(X, y)` | `(List[List[NUM]] or List[NUM], List[NUM]) -> FLOAT` | Computes R² |

### Constructor parameters

```kafe
-- Defaults: C=1.0, epsilon=0.1, kernel="linear"
MACHINE svr_model = machine.svr(1.0, 0.1, "linear");
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `C` | FLOAT | 1.0 | Regularization (higher values mean less regularization) |
| `epsilon` | FLOAT | 0.1 | Width of the epsilon-insensitive tube |
| `kernel` | STRING | "linear" | Kernel type: "linear", "rbf", or "poly" |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `svr.coef_` | `List[FLOAT]` | Coefficients (linear kernel only) |
| `svr.intercept_` | `FLOAT` | Intercept |
| `svr.support_vectors_` | `List[List[FLOAT]]` | Support vectors |
| `svr.n_support_` | `INT` | Number of support vectors |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0], [2.0], [3.0], [4.0], [5.0]];
List[FLOAT] y = [2.0, 4.0, 5.0, 4.0, 5.0];

MACHINE svr_model = machine.svr(1.0, 0.1, "linear");
svr_model.fit(X, y);

List[FLOAT] preds = svr_model.predict([[1.5], [3.0], [5.5]]);
show(preds);

FLOAT r2 = svr_model.score(X, y);
show(r2);
```

### Comparison with LinearRegression

| Aspect | LinearRegression | SVR |
|---------|------------------|-----|
| Loss | Squared error | Epsilon-insensitive |
| Outliers | Sensitive | Robust |
| Support vectors | No | Yes |
| Kernel | No | Yes (linear, rbf, poly) |

---

## SVM (Support Vector Machine Classifier)

Implements an SVM classifier for binary classification. It finds the maximum-margin hyperplane that separates the classes.

### Theory

SVM finds the hyperplane $w \cdot x + b = 0$ that maximizes the margin between classes using **hinge loss**:

$$J(w) = \frac{1}{2}||w||^2 + C \sum_{i=1}^{n} \max(0, 1 - y_i \cdot f(x_i))$$

**Available kernels**:
- `linear`: $K(x_i, x_j) = x_i \cdot x_j$ — primal SGD with hinge loss and L2 regularization
- `rbf`: $K(x_i, x_j) = \exp(-\gamma ||x_i - x_j||^2)$ — simplified dual SMO
- `poly`: $K(x_i, x_j) = (x_i \cdot x_j + 1)^d$ — simplified dual SMO

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `svm.fit(X, y)` | `(List[List[NUM]] or List[NUM], List[INT]) -> VOID` | Fits the classifier. `y` contains binary labels |
| `svm.predict(X)` | `(List[List[NUM]] or List[NUM]) -> List[INT]` | Predicts classes (0 or 1) |
| `svm.predict_proba(X)` | `(List[List[NUM]] or List[NUM]) -> List[List[FLOAT]]` | Probabilities [P(0), P(1)] via sigmoid |
| `svm.score(X, y)` | `(List[List[NUM]] or List[NUM], List[INT]) -> FLOAT` | Computes accuracy (default) or a custom metric |

### Constructor parameters

```kafe
-- Defaults: C=1.0, kernel="linear", max_iter=1000
MACHINE svm_model = machine.svm(1.0, "linear", 1000);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `C` | FLOAT | 1.0 | Regularization (higher values mean less regularization) |
| `kernel` | STRING | "linear" | Kernel type: "linear", "rbf", or "poly" |
| `max_iter` | INT | 1000 | Maximum number of training iterations |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `svm.coef_` | `List[FLOAT]` | Model coefficients (linear kernel only) |
| `svm.intercept_` | `FLOAT` | Model intercept |
| `svm.support_vectors_` | `List[List[FLOAT]]` | Support vectors |
| `svm.support_vector_labels_` | `List[INT]` | Labels of the support vectors |
| `svm.n_support_` | `INT` | Number of support vectors |
| `svm.classes_` | `List[INT]` | Unique classes |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 3.0],
                        [6.0, 5.0], [7.0, 7.0], [8.0, 6.0]];
List[INT] y = [0, 0, 0, 1, 1, 1];

MACHINE svm_model = machine.svm(1.0, "linear", 1000);
svm_model.fit(X, y);

List[INT] preds = svm_model.predict([[2.0, 2.0], [7.0, 7.0], [4.0, 4.0]]);
show(preds);  -- [0, 1, 0]

List[List[FLOAT]] probs = svm_model.predict_proba([[2.0, 2.0], [7.0, 7.0]]);
show(probs);  -- [[~0.9, ~0.1], [~0.1, ~0.9]]

FLOAT acc = svm_model.score(X, y);
show(acc);  -- 1.0
```

### Comparison with LogisticRegression

| Aspect | SVM | LogisticRegression |
|---------|-----|-------------------|
| Loss | Hinge loss | Log loss |
| Margin | Maximizes the margin | Maximizes likelihood |
| Support vectors | Yes (only margin points) | No (uses all data) |
| Kernel trick | Yes (linear, rbf, poly) | No |
| Probabilities | Post-hoc sigmoid | Native (softmax) |

---

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

## LogisticRegression

Implements binary logistic regression using gradient descent.

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `lr.fit(X, y)` | `(List[List[NUM]] or List[NUM], List[INT]) -> VOID` | Fits the model. `y` must contain only 0 and 1 |
| `lr.predict(X)` | `(List[List[NUM]] or List[NUM]) -> List[INT]` | Predicts classes (0 or 1) |
| `lr.predict_proba(X)` | `(List[List[NUM]] or List[NUM]) -> List[List[FLOAT]]` | Returns probabilities [P(0), P(1)] |
| `lr.score(X, y)` | `(List[List[NUM]] or List[NUM], List[INT]) -> FLOAT` | Computes accuracy |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `lr.coef_` | `List[FLOAT]` | Coefficient for each feature |
| `lr.intercept_` | `FLOAT` | Intercept term |

### Constructor parameters

```kafe
-- Defaults: learning_rate=0.01, max_iter=1000
MACHINE lr = machine.logistic_regression(0.1, 5000);
```

### Example

```kafe
import machine;

List[FLOAT] X = [-5.0, -4.0, -3.0, -2.0, 2.0, 3.0, 4.0, 5.0];
List[INT] y = [0, 0, 0, 0, 1, 1, 1, 1];

MACHINE lr = machine.logistic_regression(0.1, 5000);
lr.fit(X, y);

show(lr.coef_);  -- ~[3.17]

List[INT] preds = lr.predict([-3.0, -1.0, 1.0, 3.0]);
show(preds);  -- [0, 0, 1, 1]

List[List[FLOAT]] probs = lr.predict_proba([-3.0, 0.0, 3.0]);
show(probs);  -- [[~1, ~0], [0.5, 0.5], [~0, ~1]]
```

---

## KNN (K-Nearest Neighbors Classifier)

Classifier based on the k nearest neighbors (Euclidean distance).

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `knn.fit(X, y)` | `(List[List[NUM]] or List[NUM], List[INT]) -> VOID` | Fits the classifier |
| `knn.predict(X)` | `(List[List[NUM]] or List[NUM]) -> List[INT]` | Predicts classes |
| `knn.predict_proba(X)` | `(List[List[NUM]] or List[NUM]) -> List[List[FLOAT]]` | Returns class probabilities |
| `knn.score(X, y)` | `(List[List[NUM]] or List[NUM], List[INT]) -> FLOAT` | Computes accuracy |

### Constructor parameters

```kafe
-- Default: k=3
MACHINE model = machine.knn(3);
```

### Example

```kafe
import machine;

List[List[FLOAT]] X_train = [[1.0, 1.0], [2.0, 2.0], [5.0, 5.0], [6.0, 6.0]];
List[INT] y_train = [0, 0, 1, 1];

MACHINE model = machine.knn(3);
model.fit(X_train, y_train);

List[INT] preds = model.predict([[2.0, 2.0], [5.0, 5.0], [3.0, 3.0]]);
show(preds);  -- [0, 1, 0]

FLOAT acc = model.score(X_train, y_train);
show(acc);  -- 1.0
```

---

## KNNRegressor (K-Nearest Neighbors Regressor)

Regressor based on the k nearest neighbors. It predicts the mean of the target values for the k nearest neighbors.

### Theory

KNNRegressor is a **lazy learning** model that does not fit an explicit model. To make a prediction, it computes the distance to every training point, selects the k nearest points, and averages their target values.

**Prediction (uniform weights)**:

$$\hat{y} = \frac{1}{k} \sum_{i=1}^{k} y_i$$

**Prediction (distance-weighted)**:

$$\hat{y} = \frac{\sum_{i=1}^{k} w_i \cdot y_i}{\sum_{i=1}^{k} w_i}, \quad w_i = \frac{1}{d_i + \epsilon}$$

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `knr.fit(X, y)` | `(List[List[NUM]] or List[NUM], List[NUM]) -> VOID` | Stores the training data |
| `knr.predict(X)` | `(List[List[NUM]] or List[NUM]) -> List[NUM]` | Predicts values |
| `knr.score(X, y)` | `(List[List[NUM]] or List[NUM], List[NUM]) -> FLOAT` | Computes R² |

### Constructor parameters

```kafe
-- Default: k=3
MACHINE model = machine.knn_regressor(3);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `k` | INT | 3 | Number of neighbors to consider |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `knr.k` | `INT` | Number of neighbors |
| `knr.X_train_` | `List[List[FLOAT]]` | Stored training data |
| `knr.y_train_` | `List[FLOAT]` | Stored training targets |

### Example

```kafe
import machine;

List[List[FLOAT]] X_train = [[1.0], [2.0], [3.0], [4.0], [5.0]];
List[FLOAT] y_train = [2.0, 4.0, 6.0, 8.0, 10.0];

MACHINE knr = machine.knn_regressor(3);
knr.fit(X_train, y_train);

List[FLOAT] preds = knr.predict([[1.5], [3.0], [5.5]]);
show(preds);  -- ~[4.0, 6.0, 10.0]

FLOAT r2 = knr.score(X_train, y_train);
show(r2);  -- ~0.95
```

### Comparison with the KNN classifier

| Aspect | KNN Classifier | KNN Regressor |
|---------|----------------|---------------|
| Target | Classes (discrete) | Continuous values |
| Prediction | Majority vote | Mean of neighbors |
| Metric | Accuracy | R² |
| Factory | `machine.knn(k)` | `machine.knn_regressor(k)` |

---

## DecisionTreeClassifier

Implements a decision tree classifier using recursion and impurity criteria (Gini or entropy).

### Theory

A **decision tree** recursively partitions the feature space by learning simple decision rules. At each internal node, it selects the feature and threshold that best split the data according to a purity criterion.

**Impurity criteria**:

| Criterion | Formula | Description |
|----------|---------|-------------|
| Gini | $1 - \sum(p_i^2)$ | Gini impurity (0 = pure, maximum = $1 - 1/n_{classes}$) |
| Entropy | $-\sum(p_i \cdot \log_2(p_i))$ | Information entropy (0 = pure, maximum = $\log_2(n_{classes})$) |

**Information gain**: $\text{Gain} = \text{Impurity}_{parent} - \sum \frac{n_{child}}{n_{parent}} \cdot \text{Impurity}_{child}$

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `dt.fit(X, y)` | `(List[List[NUM]], List[INT]) -> VOID` | Builds the decision tree |
| `dt.predict(X)` | `(List[List[NUM]]) -> List[INT]` | Predicts classes by traversing the tree |
| `dt.score(X, y)` | `(List[List[NUM]], List[INT]) -> FLOAT` | Computes accuracy |

### Constructor parameters

```kafe
-- criterion: "gini" (default) or "entropy"
-- max_depth: maximum depth (0 = unlimited)
-- min_samples_split: minimum samples required to split (default: 2)
-- min_samples_leaf: minimum samples in a leaf (default: 1)
MACHINE model = machine.decision_tree_classifier("gini", 0, 2, 1);
```

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `dt.tree_` | `Dict` | Tree structure (internal nodes and leaves) |
| `dt.classes_` | `List[INT]` | Unique classes seen during fitting |
| `dt.n_features_` | `INT` | Number of features |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 3.0],
                        [6.0, 5.0], [7.0, 7.0], [8.0, 6.0]];
List[INT] y = [0, 0, 0, 1, 1, 1];

-- Model with Gini (default)
MACHINE model = machine.decision_tree_classifier();
model.fit(X, y);

List[INT] preds = model.predict([[1.0, 2.0], [7.0, 7.0], [4.0, 4.0]]);
show(preds);  -- [0, 1, 0]

FLOAT acc = model.score(X, y);
show(acc);  -- 1.0

-- Model with entropy and limited depth
MACHINE model2 = machine.decision_tree_classifier("entropy", 2);
model2.fit(X, y);
show(model2.predict([[1.0, 2.0], [7.0, 7.0]]));  -- [0, 1]
```

### Internal algorithm

1. **Split selection**: Compute information gain for each feature and possible threshold.
2. **Recursive construction**: Split the data using the best split and repeat for each subtree.
3. **Stopping criteria**: `max_depth` reached, `min_samples_split` not met, or a pure node.
4. **Prediction**: Traverse the tree from the root to a leaf.

---

## DecisionTreeRegressor

Implements a decision tree regressor. It recursively partitions the feature space to predict continuous values while minimizing MSE.

### Theory

A **decision tree regressor** recursively partitions the feature space by learning simple decision rules. At each internal node, it selects the feature and threshold that best reduce mean squared error (MSE).

**MSE (Mean Squared Error)**:

$$MSE = \frac{1}{n} \sum_{i=1}^{n} (y_i - \bar{y})^2$$

**MSE reduction**: For each candidate split:

$$\Delta MSE = MSE_{parent} - \left(\frac{n_l}{n} \cdot MSE_{left} + \frac{n_r}{n} \cdot MSE_{right}\right)$$

The split with the largest $\Delta MSE$ is selected. Each leaf predicts the mean of the values in that node.

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `dtr.fit(X, y)` | `(List[List[NUM]], List[NUM]) -> VOID` | Builds the regression tree |
| `dtr.predict(X)` | `(List[List[NUM]]) -> List[NUM]` | Predicts values by traversing the tree |
| `dtr.score(X, y)` | `(List[List[NUM]], List[NUM]) -> FLOAT` | Computes R² |

### Constructor parameters

```kafe
-- criterion: "mse" (default)
-- max_depth: maximum depth (0 = unlimited)
-- min_samples_split: minimum samples required to split (default: 2)
-- min_samples_leaf: minimum samples in a leaf (default: 1)
MACHINE model = machine.decision_tree_regressor("mse", 0, 2, 1);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `criterion` | STRING | "mse" | Split criterion: "mse" |
| `max_depth` | INT | 0 | Maximum depth (0 = unlimited) |
| `min_samples_split` | INT | 2 | Minimum samples required to split a node |
| `min_samples_leaf` | INT | 1 | Minimum samples in a leaf |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `dtr.tree_` | `Dict` | Tree structure (internal nodes and leaves) |
| `dtr.n_features_` | `INT` | Number of features |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0], [2.0], [3.0], [4.0], [5.0]];
List[FLOAT] y = [2.0, 4.0, 5.5, 8.0, 10.0];

MACHINE model = machine.decision_tree_regressor();
model.fit(X, y);

List[FLOAT] preds = model.predict([[1.5], [3.0], [5.5]]);
show(preds);  -- ~[3.0, 5.5, 10.0]

FLOAT r2 = model.score(X, y);
show(r2);  -- ~0.98
```

### Internal algorithm

1. **Split selection**: Compute the MSE reduction for each feature and threshold.
2. **Recursive construction**: Split the data using the best split and repeat for each subtree.
3. **Stopping criteria**: `max_depth` reached or `min_samples_split` not met.
4. **Prediction**: Traverse the tree to a leaf and return the node mean.

### Comparison with DecisionTreeClassifier

| Aspect | DecisionTreeClassifier | DecisionTreeRegressor |
|---------|------------------------|----------------------|
| Target | Classes (discrete) | Continuous values |
| Criterion | Gini / entropy | MSE |
| Prediction | Majority vote | Node mean |
| Metric | Accuracy | R² |

---

## GaussianNB (Naive Bayes)

Implements a Gaussian Naive Bayes classifier based on Bayes' theorem and the assumption of conditional independence between features.

### Theory

Naive Bayes classifies by computing the posterior probability of each class:

$$P(y|X) \propto P(y) \cdot \prod_{i=1}^{n} P(x_i|y)$$

Each $P(x_i|y)$ is modeled as a Gaussian distribution:

$$P(x_i|y=c) = \frac{1}{\sqrt{2\pi\sigma_{c,i}^2}} \exp\left(-\frac{(x_i - \mu_{c,i})^2}{2\sigma_{c,i}^2}\right)$$

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `nb.fit(X, y)` | `(List[List[NUM]] or List[NUM], List[INT]) -> VOID` | Fits the classifier |
| `nb.predict(X)` | `(List[List[NUM]] or List[NUM]) -> List[INT]` | Predicts classes |
| `nb.predict_proba(X)` | `(List[List[NUM]] or List[NUM]) -> List[List[FLOAT]]` | Returns class probabilities |
| `nb.score(X, y)` | `(List[List[NUM]] or List[NUM], List[INT]) -> FLOAT` | Computes accuracy |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `nb.classes_` | `List[INT]` | Unique classes seen during fitting |
| `nb.class_prior_` | `List[FLOAT]` | Prior probability of each class |
| `nb.theta_` | `List[List[FLOAT]]` | Mean of each feature per class |
| `nb.var_` | `List[List[FLOAT]]` | Variance of each feature per class |
| `nb.n_features_in_` | `INT` | Number of features |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 3.0],
                        [6.0, 5.0], [7.0, 7.0], [8.0, 6.0]];
List[INT] y = [0, 0, 0, 1, 1, 1];

MACHINE nb = machine.gaussian_nb();
nb.fit(X, y);

List[INT] preds = nb.predict([[2.0, 2.0], [7.0, 7.0], [4.0, 4.0]]);
show(preds);  -- [0, 1, 0]

FLOAT acc = nb.score(X, y);
show(acc);  -- 1.0

List[List[FLOAT]] probs = nb.predict_proba([[2.0, 2.0], [7.0, 7.0]]);
show(probs);  -- [[~0.9, ~0.1], [~0.1, ~0.9]]
```

### Internal algorithm

1. **Training**: Compute the mean, variance, and prior for each class.
2. **Prediction**: Compute the log-posterior for each class using Bayes' rule.
3. **Decision**: Return the class with the highest log-posterior.

---

## RandomForestClassifier

Implements a random forest classifier, an ensemble of decision trees that combines bagging with random feature selection.

### Theory

Random Forest trains multiple decision trees on bootstrap samples and random feature subsets, then aggregates predictions by majority vote.

**Bootstrap sampling**: Each tree is trained on a random sample drawn with replacement from the original dataset (~63% of the data).

**Random selection**: At each split, only $\sqrt{d}$ features are considered (where $d$ is the total number of features).

**Majority vote**: The final prediction is the class receiving the most votes across all trees.

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `rf.fit(X, y)` | `(List[List[NUM]] or List[NUM], List[INT]) -> VOID` | Fits the ensemble |
| `rf.predict(X)` | `(List[List[NUM]] or List[NUM]) -> List[INT]` | Predicts by majority vote |
| `rf.score(X, y)` | `(List[List[NUM]] or List[NUM], List[INT]) -> FLOAT` | Computes accuracy |

### Constructor Parameters

```kafe
-- n_estimators=10, max_depth=0 (unlimited), min_samples_split=2, min_samples_leaf=1
MACHINE rf = machine.random_forest_classifier(10, 0, 2, 1);
```

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `rf.trees_` | `List[Dict]` | List of fitted trees |
| `rf.classes_` | `List[INT]` | Unique classes seen during fitting |
| `rf.n_features_` | `INT` | Number of features |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 3.0],
                        [6.0, 5.0], [7.0, 7.0], [8.0, 6.0]];
List[INT] y = [0, 0, 0, 1, 1, 1];

MACHINE rf = machine.random_forest_classifier(10, 0, 2, 1);
rf.fit(X, y);

List[INT] preds = rf.predict([[2.0, 2.0], [7.0, 7.0], [4.0, 4.0]]);
show(preds);  -- [0, 1, 0]

FLOAT acc = rf.score(X, y);
show(acc);  -- 1.0
```

### Internal algorithm

1. **Bootstrap**: Draw a sample with replacement for each tree.
2. **Construction**: Build each tree using random feature selection at every split.
3. **Prediction**: Take a majority vote across all trees.

---

## RandomForestRegressor

Implements a random forest regressor, an ensemble of regression trees that combines bagging with random feature selection.

### Theory

Random Forest Regressor trains multiple regression trees on bootstrap samples and random feature subsets, then aggregates predictions by averaging.

**Split criterion**: Variance reduction — selects the split that most reduces target variance in the child nodes.

**Aggregation**: The final prediction is the mean of the predictions from all trees.

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `rf.fit(X, y)` | `(List[List[NUM]] or List[NUM], List[NUM]) -> VOID` | Fits the ensemble |
| `rf.predict(X)` | `(List[List[NUM]] or List[NUM]) -> List[NUM]` | Predicts by averaging |
| `rf.score(X, y)` | `(List[List[NUM]] or List[NUM], List[NUM]) -> FLOAT` | Computes R² |

### Constructor parameters

```kafe
-- Defaults: n_estimators=10, max_depth=0 (unlimited), min_samples_split=2, min_samples_leaf=1
MACHINE rf = machine.random_forest_regressor(10, 0, 2, 1);
```

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `rf.trees_` | `List[Dict]` | List of fitted trees |
| `rf.n_features_` | `INT` | Number of features |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0], [2.0], [3.0], [4.0], [5.0]];
List[FLOAT] y = [2.0, 4.0, 6.0, 8.0, 10.0];

MACHINE rf = machine.random_forest_regressor(10, 0, 2, 1);
rf.fit(X, y);

List[FLOAT] preds = rf.predict([[1.5], [3.0], [5.5]]);
show(preds);  -- ~[3.0, 6.0, 11.0]

FLOAT r2 = rf.score(X, y);
show(r2);  -- 1.0
```

### Internal algorithm

1. **Bootstrap**: Draw a sample with replacement for each tree.
2. **Construction**: Build each tree with random feature selection and variance-based splits.
3. **Prediction**: Average predictions from all trees.

---

## DBSCAN (Density-Based Spatial Clustering)

Implements a density-based clustering algorithm that groups densely packed points and marks outliers as noise. Unlike KMeans, DBSCAN can find arbitrarily shaped clusters and does not require the number of clusters to be specified.

### Theory

DBSCAN is based on the concept of **density reachability**:

| Concept | Definition |
|----------|------------|
| **Core point** | A point with at least `min_samples` points within distance `eps` (including itself) |
| **Direct density reachability** | Point `q` is directly reachable from `p` if `q` is within distance `eps` of `p` and `p` is a core point |
| **Density reachability** | There is a chain `p1, ..., pn` in which each point is directly reachable from the previous one |
| **Density connectivity** | Two points are density-connected if there is a point `o` from which both are density-reachable |

**Cluster**: A maximal set of density-connected points.

**Noise**: Points that do not belong to any cluster (label `-1`).

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `db.fit(X)` | `(List[List[NUM]]) -> VOID` | Fits the DBSCAN clustering model |
| `db.fit_predict(X)` | `(List[List[NUM]]) -> List[INT]` | Fits the model and returns cluster labels |
| `db.labels()` | `() -> List[INT]` | Returns cluster labels after fitting |
| `db.n_clusters()` | `() -> INT` | Returns the number of clusters found |
| `db.core_sample_indices()` | `() -> List[INT]` | Returns the indices of core points |

### Constructor parameters

```kafe
-- eps: maximum distance between neighboring points (default: 0.5)
-- min_samples: minimum number of points to form a dense region (default: 5)
MACHINE db = machine.dbscan(1.0, 2);
```

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `db.labels_` | `List[INT]` | Cluster labels (-1 = noise) |
| `db.n_clusters_` | `INT` | Number of clusters found |
| `db.core_sample_indices_` | `List[INT]` | Indices of core points |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 1.0], [1.5, 1.5], [2.0, 2.0],
                        [8.0, 8.0], [8.5, 8.5], [9.0, 9.0],
                        [50.0, 50.0]];

MACHINE db = machine.dbscan(1.0, 2);
db.fit(X);

show(db.labels());       -- [1, 1, 1, 2, 2, 2, -1]
show(db.n_clusters());   -- 2

-- Use fit_predict
List[INT] labels = db.fit_predict(X);
show(labels);            -- [1, 1, 1, 2, 2, 2, -1]
```

### Internal algorithm

1. **Region query**: For each point, find all points within distance `eps`.
2. **Identify core points**: Points with at least `min_samples` neighbors.
3. **Expand clusters**: Starting from each unvisited core point, expand its cluster by connecting density-reachable points.
4. **Mark noise**: Points that are not core points and are not reachable from any core point.

### Complexity

- **Time**: $O(n^2)$ in the worst case (region queries for all points)
- **Space**: $O(n)$ to store labels and neighbors

### Advantages

- Does not require the number of clusters to be specified.
- Finds arbitrarily shaped clusters.
- Identifies noise (outliers).
- Does not assume a spherical data distribution.

### Limitations

- Has difficulty handling clusters with varying densities.
- Is sensitive to the choice of `eps` and `min_samples`.
- Has quadratic worst-case complexity.

---

## AgglomerativeClustering

Implements bottom-up hierarchical clustering. It starts with each point as a separate cluster and repeatedly merges the closest clusters until the desired number of clusters is reached.

### Theory

The algorithm performs $n - k$ successive merges:

1. Initialize with each point as its own cluster ($n$ clusters).
2. Compute distances between every pair of clusters.
3. Find the two closest clusters according to the linkage criterion.
4. Merge those clusters.
5. Repeat until $k$ clusters remain.

**Linkage criteria**:

| Criterion | Formula | Description |
|----------|---------|-------------|
| `single` | $\min_{x \in C_i, y \in C_j} \|\|x - y\|\|$ | Minimum distance between points |
| `complete` | $\max_{x \in C_i, y \in C_j} \|\|x - y\|\|$ | Maximum distance between points |
| `average` | $\frac{1}{\|C_i\|\|C_j\|} \sum_{x \in C_i} \sum_{y \in C_j} \|\|x - y\|\|$ | Mean distance |
| `ward` | $\frac{\|C_i\|\|C_j\|}{\|C_i\| + \|C_j\|} \|\|\mu_i - \mu_j\|\|^2$ | Minimizes within-cluster variance |

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `ac.fit(X)` | `(List[List[NUM]]) -> VOID` | Fits the agglomerative clustering model |
| `ac.fit_predict(X)` | `(List[List[NUM]]) -> List[INT]` | Fits the model and returns cluster labels |

### Constructor parameters

```kafe
-- Defaults: n_clusters=2, linkage="ward"
MACHINE ac = machine.agglomerative_clustering(2, "ward");
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `n_clusters` | INT | 2 | Desired number of clusters |
| `linkage` | STRING | "ward" | Linkage criterion: "single", "complete", "average", or "ward" |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `ac.labels_` | `List[INT]` | Cluster label for each point |
| `ac.n_clusters_` | `INT` | Number of clusters found |
| `ac.children_` | `List[List[INT]]` | Merge history (pairs of merged clusters) |
| `ac.distances_` | `List[FLOAT]` | Distance for each merge |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 1.0], [1.5, 1.5], [2.0, 2.0],
                        [8.0, 8.0], [8.5, 8.5], [9.0, 9.0]];

MACHINE ac = machine.agglomerative_clustering(2, "ward");
ac.fit(X);

show(ac.labels_);       -- [0, 0, 0, 1, 1, 1]
show(ac.n_clusters_);   -- 2
show(ac.distances_);    -- Distance for each merge

-- Use fit_predict
List[INT] labels = ac.fit_predict(X);
show(labels);           -- [0, 0, 0, 1, 1, 1]
```

### Comparison with DBSCAN

| Aspect | AgglomerativeClustering | DBSCAN |
|---------|------------------------|--------|
| Type | Hierarchical | Density-based |
| Requires `n_clusters` | Yes | No |
| Cluster shape | Flexible (depends on linkage) | Arbitrary |
| Noise | Not detected | Detected (label -1) |
| Scalability | $O(n^3)$ | $O(n^2)$ |
| Deterministic | Yes | Yes |

---

## GaussianMixture (Gaussian mixture)

Implements a Gaussian mixture model (GMM), a probabilistic model that assumes the data were generated by a mixture of Gaussian distributions. It uses the expectation-maximization (EM) algorithm to estimate parameters.

### Theory

The model assumes that each point was generated by one of $K$ Gaussian distributions:

$$P(\mathbf{x}) = \sum_{k=1}^{K} \pi_k \cdot \mathcal{N}(\mathbf{x} | \boldsymbol{\mu}_k, \boldsymbol{\Sigma}_k)$$

Here, $\pi_k$ is the weight of component $k$, $\boldsymbol{\mu}_k$ is its mean, and $\boldsymbol{\Sigma}_k$ is its covariance.

**EM algorithm**:

1. **E-step**: Compute responsibilities $\gamma(z_{kn})$, the probability that point $n$ belongs to component $k$.
2. **M-step**: Update parameters using the responsibilities.
3. Repeat until convergence.

**Selecting K**: Use AIC ($2p - 2\ln(\hat{L})$) or BIC ($p\ln(n) - 2\ln(\hat{L})$); lower values are better.

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `gm.fit(X)` | `(List[List[NUM]]) -> VOID` | Fits the model using EM |
| `gm.predict(X)` | `(List[List[NUM]]) -> List[INT]` | Assigns each point to the most likely component |
| `gm.predict_proba(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Returns responsibilities (membership probabilities) |
| `gm.fit_predict(X)` | `(List[List[NUM]]) -> List[INT]` | Fits the model and returns labels |
| `gm.score(X)` | `(List[List[NUM]]) -> FLOAT` | Returns the negative log-likelihood (lower is better) |
| `gm.aic(X)` | `(List[List[NUM]]) -> FLOAT` | Akaike information criterion |
| `gm.bic(X)` | `(List[List[NUM]]) -> FLOAT` | Bayesian information criterion |

### Constructor Parameters

```kafe
-- n_components=3, max_iter=100, tol=1e-3, random_state=0 (default values)
MACHINE gm = machine.gaussian_mixture(3, 100, 1e-3, 0);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `n_components` | INT | 3 | Number of Gaussian components |
| `max_iter` | INT | 100 | Maximum number of EM iterations |
| `tol` | FLOAT | 1e-3 | Convergence tolerance |
| `random_state` | INT | 0 | Reproducibility seed (0 = random) |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `gm.weights_` | `List[FLOAT]` | Weight of each component ($\pi_k$) |
| `gm.means_` | `List[List[FLOAT]]` | Mean of each component ($\boldsymbol{\mu}_k$) |
| `gm.covariances_` | `List[List[FLOAT]]` | Diagonal variance of each component ($\boldsymbol{\Sigma}_k$) |
| `gm.converged_` | `BOOL` | Whether the model converged |
| `gm.n_iter_` | `INT` | Number of iterations performed |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 1.0], [1.5, 1.5], [2.0, 2.0],
                        [8.0, 8.0], [8.5, 8.5], [9.0, 9.0]];

MACHINE gm = machine.gaussian_mixture(2, 100, 1e-3, 42);
gm.fit(X);

show(gm.labels_);           -- [0, 0, 0, 1, 1, 1]
show(gm.means_);            -- Mean of each component
show(gm.weights_);          -- Weight of each component

-- Membership probabilities
List[List[FLOAT]] probs = gm.predict_proba(X);
show(probs);

-- Select the number of components
FLOAT aic = gm.aic(X);
FLOAT bic = gm.bic(X);
show(aic);
show(bic);
```

### Comparison with K-Means

| Aspect | K-Means | GaussianMixture |
|--------|---------|-----------------|
| Type | Hard clustering | Soft clustering |
| Cluster shape | Spherical | Elliptical |
| Model | Distance to centroids | Probabilistic |
| Output | Labels | Probabilities |
| Complexity | $O(T \cdot n \cdot K \cdot d)$ | $O(T \cdot n \cdot K \cdot d)$ |

### Complexity

- **Time**: $O(T \cdot n \cdot K \cdot d)$ per EM iteration
- **Space**: $O(n \cdot K)$ for responsibilities

### Advantages

- Soft clustering: membership probabilities, not only assignments
- Can capture elliptical clusters (unlike the spherical clusters of K-Means)
- Generative model: can generate new points
- AIC/BIC for automatic selection of the number of components

### Limitations

- Sensitive to initialization — may converge to local optima
- Assumes Gaussian distributions — non-Gaussian data can reduce performance
- Sensitive to outliers — they affect the means

---

## AdaBoostClassifier (Adaptive Boosting)

Implements an AdaBoost classifier, an ensemble learning algorithm that combines multiple weak classifiers (decision stumps) sequentially, emphasizing errors made by the previous classifier.

### Theory

AdaBoost trains $T$ weak classifiers sequentially. At each iteration:
1. Assign weights to the samples (uniform at first)
2. Train a decision stump using those weights
3. Calculate the stump weight ($\alpha_t$) from its error
4. Update sample weights by increasing the weights of misclassified samples

**Final prediction**: Weighted vote across all weak classifiers.

$$H(x) = \text{sign}\left(\sum_{t=1}^{T} \alpha_t \cdot h_t(x)\right)$$

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `ab.fit(X, y)` | `(List[List[NUM]], List[INT]) -> VOID` | Trains the ensemble of weak classifiers |
| `ab.predict(X)` | `(List[List[NUM]]) -> List[INT]` | Predicts by weighted voting |
| `ab.score(X, y)` | `(List[List[NUM]], List[INT]) -> FLOAT` | Calculates accuracy |

### Constructor Parameters

```kafe
-- n_estimators=50, learning_rate=1.0 (default values)
MACHINE ab = machine.ada_boost_classifier(50, 1.0);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `n_estimators` | INT | 50 | Number of weak classifiers (decision stumps) |
| `learning_rate` | FLOAT | 1.0 | Scale factor for each stump's contribution |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `ab.estimators_` | `List[Dict]` | List of trained weak classifiers |
| `ab.estimator_weights_` | `List[FLOAT]` | Weight $\alpha_t$ of each weak classifier |
| `ab.estimator_errors_` | `List[FLOAT]` | Error of each weak classifier |
| `ab.classes_` | `List[INT]` | Unique classes |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 3.0],
                        [6.0, 5.0], [7.0, 7.0], [8.0, 6.0]];
List[INT] y = [0, 0, 0, 1, 1, 1];

MACHINE ab = machine.ada_boost_classifier(10, 1.0);
ab.fit(X, y);

List[INT] preds = ab.predict([[2.0, 2.0], [7.0, 7.0], [4.0, 4.0]]);
show(preds);  -- [0, 1, 0]

FLOAT acc = ab.score(X, y);
show(acc);  -- 1.0
```

### Internal Algorithm

1. **Initialization**: Uniform weights $w_i = 1/n$
2. **For each iteration**:
   - Train a decision stump with the current weights
   - Calculate the weighted error $\epsilon_t$
   - Calculate the stump weight $\alpha_t = 0.5 \cdot \ln((1 - \epsilon_t) / \epsilon_t)$
   - Update sample weights
3. **Prediction**: Weighted vote across all stumps

### Comparison with RandomForestClassifier

| Aspect | AdaBoostClassifier | RandomForestClassifier |
|--------|--------------------|----------------------|
| Ensemble type | Boosting (sequential) | Bagging (parallel) |
| Weak learner | Decision stump (depth 1) | Full tree (variable depth) |
| Weighting | Weights weak learners by performance | Equal voting |
| Parallelization | No (sequential) | Yes (independent trees) |
| Overfitting | Controlled by learning_rate | Controlled by max_depth |

---

## GradientBoostingClassifier

Implements a Gradient Boosting classifier, an ensemble of decision trees built sequentially, where each tree corrects the previous tree's errors using gradient descent on the log-loss function.

### Theory

Gradient Boosting builds $T$ trees sequentially. At each iteration:
1. Calculate the pseudo-residuals (the negative gradient of the log-loss)
2. Train a regression tree to predict those residuals
3. Update the model by adding the tree prediction weighted by `learning_rate`

**Loss function** (log-loss / deviance):

$$\mathcal{L}(y, F) = -y \cdot \log(p) - (1-y) \cdot \log(1-p)$$

**Final prediction**: Apply the sigmoid function to the sum of predictions:

$$H(x) = \sigma(F_T(x)) = \sigma\left(F_0(x) + \eta \sum_{t=1}^{T} h_t(x)\right)$$

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `gbc.fit(X, y)` | `(List[List[NUM]], List[INT]) -> VOID` | Trains the tree ensemble |
| `gbc.predict(X)` | `(List[List[NUM]]) -> List[INT]` | Predicts classes (0 or 1) |
| `gbc.score(X, y)` | `(List[List[NUM]], List[INT]) -> FLOAT` | Calculates accuracy |

### Constructor Parameters

```kafe
-- n_estimators=100, learning_rate=0.1, max_depth=3 (default values)
MACHINE gbc = machine.gradient_boosting_classifier(100, 0.1, 3);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `n_estimators` | INT | 100 | Number of trees in the ensemble |
| `learning_rate` | FLOAT | 0.1 | Learning rate (shrinkage) |
| `max_depth` | INT | 3 | Maximum depth of each tree |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `gbc.estimators_` | `List[Dict]` | List of trained trees |
| `gbc.initial_prediction_` | `FLOAT` | Initial prediction (log-odds) |
| `gbc.classes_` | `List[INT]` | Unique classes |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 3.0],
                        [6.0, 5.0], [7.0, 7.0], [8.0, 6.0]];
List[INT] y = [0, 0, 0, 1, 1, 1];

MACHINE gbc = machine.gradient_boosting_classifier(10, 0.1, 3);
gbc.fit(X, y);

List[INT] preds = gbc.predict([[2.0, 2.0], [7.0, 7.0], [4.0, 4.0]]);
show(preds);  -- [0, 1, 0]

FLOAT acc = gbc.score(X, y);
show(acc);  -- 1.0
```

### Internal Algorithm

1. **Initialization**: $F_0 = 0.5 \cdot \ln((1-p)/p)$
2. **For each iteration**:
   - Calculate probabilities with the sigmoid function
   - Calculate pseudo-residuals: $r_i = y_i - p_i$
   - Train a regression tree on the residuals
   - Update: $F_t = F_{t-1} + \eta \cdot h_t$
3. **Prediction**: Class = sigmoid($F_T$) >= 0.5

### Comparison with RandomForestClassifier

| Aspect | GradientBoostingClassifier | RandomForestClassifier |
|--------|---------------------------|----------------------|
| Ensemble type | Boosting (sequential) | Bagging (parallel) |
| Weak learner | Deep tree (residuals) | Tree (bootstrap) |
| Direction | Corrects previous errors | Independent trees |
| Parallelization | No (sequential) | Yes (independent trees) |
| Overfitting | More susceptible | Less susceptible |

### Comparison with AdaBoostClassifier

| Aspect | GradientBoostingClassifier | AdaBoostClassifier |
|--------|---------------------------|-------------------|
| Optimization | Gradient descent on the loss | Sample weighting |
| Weak learner | Regression tree (variable depth) | Decision stump (depth 1) |
| Loss | Log-loss (any differentiable function) | Exponential |
| Flexibility | More flexible (any loss) | Less flexible |

---

## GradientBoostingRegressor

Implements a Gradient Boosting regressor, an ensemble of regression trees built sequentially, where each tree corrects the previous tree's errors using gradient descent on the mean squared error.

### Theory

Gradient Boosting Regressor builds $T$ trees sequentially to minimize MSE:

1. **Initialize**: $F_0(x) = \bar{y}$
2. **At each iteration**:
   - Calculate residuals: $r_i = y_i - F_{t-1}(x_i)$
   - Train tree $h_t$ to predict the residuals
   - Update: $F_t = F_{t-1} + \eta \cdot h_t$

**Loss function** (MSE):

$$\mathcal{L}(y, F) = \frac{1}{2}(y - F)^2$$

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `gbr.fit(X, y)` | `(List[List[NUM]], List[NUM]) -> VOID` | Trains the tree ensemble |
| `gbr.predict(X)` | `(List[List[NUM]]) -> List[NUM]` | Predicts values |
| `gbr.score(X, y)` | `(List[List[NUM]], List[NUM]) -> FLOAT` | Calculates R² |

### Constructor Parameters

```kafe
-- n_estimators=100, learning_rate=0.1, max_depth=3 (default values)
MACHINE gbr = machine.gradient_boosting_regressor(100, 0.1, 3);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `n_estimators` | INT | 100 | Number of trees in the ensemble |
| `learning_rate` | FLOAT | 0.1 | Learning rate (shrinkage) |
| `max_depth` | INT | 3 | Maximum depth of each tree |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `gbr.estimators_` | `List[Dict]` | List of trained trees |
| `gbr.initial_prediction_` | `FLOAT` | Initial prediction (mean of y) |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0], [2.0], [3.0], [4.0], [5.0]];
List[FLOAT] y = [2.0, 4.0, 6.0, 8.0, 10.0];

MACHINE gbr = machine.gradient_boosting_regressor(10, 0.1, 3);
gbr.fit(X, y);

List[FLOAT] preds = gbr.predict([[1.5], [3.0], [5.5]]);
show(preds);  -- ~[3.0, 6.0, 11.0]

FLOAT r2 = gbr.score(X, y);
show(r2);  -- ~1.0
```

### Internal Algorithm

1. **Initialization**: $F_0 = \bar{y}$
2. **For each iteration**:
   - Calculate residuals: $r_i = y_i - F_{t-1}(x_i)$
   - Train a regression tree on the residuals
   - Update: $F_t = F_{t-1} + \eta \cdot h_t$
3. **Prediction**: $H(x) = F_T(x)$

### Comparison with RandomForestRegressor

| Aspect | GradientBoostingRegressor | RandomForestRegressor |
|--------|--------------------------|----------------------|
| Ensemble type | Boosting (sequential) | Bagging (parallel) |
| Optimization | Gradient descent | Tree averaging |
| Overfitting | More susceptible | Less susceptible |
| Training speed | Slower | Faster (parallelizable) |

---

## StandardScaler

Standardizes features by removing the mean and scaling to unit variance (z-score): $z = (x - \mu) / \sigma$.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `ss.fit(X)` | `(List[List[NUM]]) -> VOID` | Calculates the mean and standard deviation |
| `ss.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Standardizes the data |
| `ss.fit_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Fit + transform |
| `ss.inverse_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Reverses the standardization |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `ss.mean_` | `List[FLOAT]` | Mean of each feature |
| `ss.scale_` | `List[FLOAT]` | Standard deviation of each feature |

### Example

```kafe
import machine;

List[List[FLOAT]] data = [[1.0, 4.0], [3.0, 6.0], [5.0, 8.0]];

MACHINE ss = machine.standard_scaler();
List[List[FLOAT]] scaled = ss.fit_transform(data);
show(scaled);  -- [[-1.224..., -1.224...], [0.0, 0.0], [1.224..., 1.224...]]

List[List[FLOAT]] original = ss.inverse_transform(scaled);
show(original);  -- [[1.0, 4.0], [3.0, 6.0], [5.0, 8.0]]
```

---

## MinMaxScaler

Scales features to a fixed range (by default, [0, 1]): $X_{norm} = (X - X_{min}) / (X_{max} - X_{min})$.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `mms.fit(X)` | `(List[List[NUM]]) -> VOID` | Calculates the minimum and maximum |
| `mms.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Scales the data |
| `mms.fit_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Fit + transform |
| `mms.inverse_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Reverses the scaling |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `mms.data_min_` | `List[FLOAT]` | Minimum of each feature |
| `mms.data_max_` | `List[FLOAT]` | Maximum of each feature |
| `mms.scale_` | `List[FLOAT]` | Scale of each feature (1 / range) |

### Example

```kafe
import machine;

List[List[FLOAT]] data = [[1.0, 10.0], [3.0, 20.0], [5.0, 30.0]];

MACHINE mms = machine.minmax_scaler();
List[List[FLOAT]] scaled = mms.fit_transform(data);
show(scaled);  -- [[0.0, 0.0], [0.5, 0.5], [1.0, 1.0]]
```

---

## RobustScaler

Scales features using statistics that are robust to outliers: the median (Q2) for centering and the IQR (Q3 − Q1) for scaling.

### Theory

Unlike StandardScaler (which uses the mean and standard deviation) or MinMaxScaler (which uses the minimum and maximum), RobustScaler uses statistics that are not affected by extreme values:

$$X_{scaled} = \frac{X - \text{median}}{IQR}$$

Here, $\text{median} = Q2$ (the 50th percentile) and $IQR = Q3 - Q1$ (the 75th percentile − the 25th percentile).

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `rs.fit(X)` | `(List[List[NUM]]) -> VOID` | Calculates the median and IQR for each feature |
| `rs.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Scales the data |
| `rs.fit_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Fit + transform |
| `rs.inverse_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Reverses the scaling |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `rs.center_` | `List[FLOAT]` | Median of each feature |
| `rs.scale_` | `List[FLOAT]` | IQR of each feature |

### Constructor Parameters

```kafe
-- with_centering=1 (centers using the median), with_scaling=1 (scales using the IQR)
-- quantile_low=25.0, quantile_high=75.0
MACHINE rs = machine.robust_scaler();
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `with_centering` | INT | 1 | If 1, centers using the median (0 = no centering) |
| `with_scaling` | INT | 1 | If 1, scales using the IQR (0 = no scaling) |
| `quantile_low` | FLOAT | 25.0 | Lower percentile for the IQR |
| `quantile_high` | FLOAT | 75.0 | Upper percentile for the IQR |

### Example

```kafe
import machine;

List[List[FLOAT]] data = [[1.0, 4.0], [3.0, 6.0], [5.0, 100.0]];

MACHINE rs = machine.robust_scaler();
List[List[FLOAT]] scaled = rs.fit_transform(data);
show(rs.center_);   -- [3.0, 6.0] (medians)
show(rs.scale_);    -- [4.0, 94.0] (IQRs)

List[List[FLOAT]] restored = rs.inverse_transform(scaled);
show(restored);  -- [[1.0, 4.0], [3.0, 6.0], [5.0, 100.0]]
```

### Comparison with Other Scalers

| Scaler | Center | Scale | Robust to outliers |
|--------|--------|-------|-------------------:|
| StandardScaler | Mean | Standard deviation | No |
| MinMaxScaler | Min | Max − Min | No |
| **RobustScaler** | **Median** | **IQR** | **Yes** |

### When to Use

- **Outliers are present** — the primary use case
- Data with a skewed distribution
- When the mean/standard deviation are not representative

---

## SimpleImputer

Imputes missing values (represented as NaN in DataFrames) using a configurable strategy.

### Strategies

| Strategy | Description |
|----------|-------------|
| `"mean"` | Fills with the mean of each column |
| `"median"` | Fills with the median of each column |
| `"most_frequent"` | Fills with the mode of each column |
| `"constant"` | Fills with a constant value (use `simple_imputer_constant(v)`) |

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `imp.fit(X)` | `(PARDOS) -> VOID` | Calculates per-column statistics. Raises an error if an entire column is NaN (except with the `"constant"` strategy) |
| `imp.transform(X)` | `(PARDOS) -> PARDOS` | Imputes missing values |
| `imp.fit_transform(X)` | `(PARDOS) -> PARDOS` | Fit + transform |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `imp.statistics_` | `List[FLOAT]` | Statistics calculated for each column |

### Example

```kafe
import pardos;
import machine;

PARDOS df = pardos.read_csv("data.csv");
-- df contains: [[2.0, 6.0, 5.0], [4.0, nan, 5.0], [6.0, 12.0, nan], [4.0, 6.0, 5.0]]

MACHINE imp = machine.simple_imputer("mean");
PARDOS imputed = imp.fit_transform(df);
show(imputed);
-- [[2.0, 6.0, 5.0], [4.0, 8.0, 5.0], [6.0, 12.0, 5.0], [4.0, 6.0, 5.0]]

-- Constant strategy
MACHINE imp_c = machine.simple_imputer_constant(0.0);
PARDOS imputed_c = imp_c.fit_transform(df);
```

---

## LabelEncoder

Encodes text labels as ordinal integer values.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `le.fit(labels)` | `(List[ANY]) -> MACHINE` | Learns the unique classes (sorted) |
| `le.transform(labels)` | `(List[ANY]) -> List[INT]` | Converts labels to integers |
| `le.fit_transform(labels)` | `(List[ANY]) -> List[INT]` | Fit + transform in one step |
| `le.inverse_transform(encoded)` | `(List[INT]) -> List[STR]` | Converts integers back to labels |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `le.classes_` | `List[STR]` | Sorted list of unique classes |

### Example

```kafe
import machine;

MACHINE le = machine.label_encoder();

List[STR] labels = ["cat", "dog", "bird", "cat", "bird"];
le.fit(labels);
show(le.classes_);  -- [bird, cat, dog]

List[INT] encoded = le.transform(labels);
show(encoded);  -- [1, 2, 0, 1, 0]

List[STR] decoded = le.inverse_transform(encoded);
show(decoded);  -- [cat, dog, bird, cat, bird]
```

---

## OneHotEncoder

Encodes categorical DataFrame columns as a binary (one-hot) representation.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `ohe.fit(df, columns)` | `(PARDOS, List[STR]) -> MACHINE` | Learns categories from selected columns |
| `ohe.transform(df)` | `(PARDOS) -> PARDOS` | Transforms the DataFrame using one-hot encoding |
| `ohe.fit_transform(df, columns)` | `(PARDOS, List[STR]) -> PARDOS` | Fit + transform |

### Example

```kafe
import pardos;
import machine;

List[STR] cols = ["color", "size"];
List[List[STR]] data = [
    ["red", "S"],
    ["blue", "M"],
    ["green", "L"],
    ["red", "M"]
];
PARDOS df = pardos.DataFrame(cols, data);

-- One-hot encode a single column
MACHINE ohe = machine.one_hot_encoder();
PARDOS encoded = ohe.fit_transform(df, ["color"]);
show(encoded);
-- Columns: size, color_blue, color_green, color_red
-- Rows: [[S,0,0,1], [M,1,0,0], [L,0,1,0], [M,0,0,1]]

-- Multiple columns
MACHINE ohe2 = machine.one_hot_encoder();
PARDOS encoded2 = ohe2.fit_transform(df, ["color", "size"]);
show(encoded2);
```

---

## OrdinalEncoder

Encodes categorical DataFrame columns as ordinal integer values, ordered alphabetically by category.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `oe.fit(df, columns)` | `(PARDOS, List[STR]) -> MACHINE` | Learns the sorted unique categories in the specified columns |
| `oe.transform(df)` | `(PARDOS) -> PARDOS` | Transforms categorical columns into ordinal integer values |
| `oe.fit_transform(df, columns)` | `(PARDOS, List[STR]) -> PARDOS` | Fit + transform in one step |
| `oe.inverse_transform(df)` | `(PARDOS) -> PARDOS` | Converts ordinal values back to the original categories |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `oe.categories_` | `Dict` | Mapping of columns to lists of sorted categories |
| `oe.columns_` | `List[STR]` | Names of the encoded columns |

### Example

```kafe
import pardos;
import machine;

List[STR] cols = ["color", "size"];
List[List[STR]] data = [
    ["red", "S"],
    ["blue", "M"],
    ["green", "L"],
    ["red", "M"]
];
PARDOS df = pardos.DataFrame(cols, data);

-- Ordinal-encode a single column
MACHINE oe = machine.ordinal_encoder();
PARDOS encoded = oe.fit_transform(df, ["color"]);
show(encoded);
-- Columns: color, size
-- Rows: [[2, S], [0, M], [1, L], [2, M]]
-- Categories sorted alphabetically: blue=0, green=1, red=2

-- Multiple columns
MACHINE oe2 = machine.ordinal_encoder();
PARDOS encoded2 = oe2.fit_transform(df, ["color", "size"]);

-- Reverse the encoding
PARDOS decoded = oe2.inverse_transform(encoded2);
show(decoded);
```

---

## PCA (Principal Component Analysis)

Reduces data dimensionality by finding the directions of greatest variance using the Jacobi algorithm.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `pca.fit(X)` | `(PARDOS or List[List[NUM]]) -> VOID` | Fits the model to the data |
| `pca.transform(X)` | `(PARDOS or List[List[NUM]]) -> PARDOS` | Transforms data into principal components |
| `pca.round(n)` | `(INT) -> VOID` | Rounds internal values to n decimal places |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `pca.components_` | `List[List[FLOAT]]` | Eigenvectors (components) |
| `pca.mean_` | `List[FLOAT]` | Mean of each feature |
| `pca.explained_variance_` | `List[FLOAT]` | Variance explained by each component |

### Example

```kafe
import pardos;
import machine;

List[STR] cols = ["X", "Y", "Z"];
List[List[FLOAT]] data = [
    [1.0, 1.0, 2.5],
    [2.0, 1.0, 4.5],
    [3.0, 2.0, 7.0],
    [1.0, 2.0, 3.0],
    [2.0, 2.0, 5.0],
    [3.0, 1.0, 6.5]
];

PARDOS df = pardos.DataFrame(cols, data);

-- Reduce from 3D to 2D
MACHINE pca_model = machine.pca(2);
pca_model.fit(df);
pca_model.round(4);

show(pca_model.mean_);
show(pca_model.explained_variance_);

PARDOS reduced = pca_model.transform(df);
show(reduced.round(4));
```

### Internal Algorithm

PCA uses the **Jacobi algorithm** to calculate eigenvalues and eigenvectors:

1. **Mean centering**: Subtract the mean of each feature
2. **Covariance matrix**: $C = (X^T \cdot X) / (n - 1)$
3. **Jacobi**: Iterations to diagonalize the covariance matrix
4. **Sorting**: Sort components by explained variance (descending)

---

## LinearDiscriminantAnalysis (Linear Discriminant Analysis)

Implements LDA, a supervised dimensionality-reduction technique that maximizes class separation and also works as a linear classifier.

### Theory

LDA maximizes the ratio of between-class to within-class variance:

$$J(w) = \frac{w^T S_B w}{w^T S_W w}$$

Where:
- $S_W = \sum_{k=1}^{K} \sum_{x \in C_k} (x - \mu_k)(x - \mu_k)^T$ — within-class scatter
- $S_B = \sum_{k=1}^{K} n_k (\mu_k - \mu)(\mu_k - \mu)^T$ — between-class scatter

**Solution**: Solve the eigenvalue problem $S_W^{-1} S_B w = \lambda w$. The eigenvectors with the largest eigenvalues are the optimal directions.

**Constraint**: $n\_components \leq K - 1$ (at most the number of classes minus one components).

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `lda.fit(X, y)` | `(List[List[NUM]], List[INT]) -> VOID` | Fits LDA by calculating scatter matrices and eigenvectors |
| `lda.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Projects data into a lower-dimensional space |
| `lda.fit_transform(X, y)` | `(List[List[NUM]], List[INT]) -> List[List[FLOAT]]` | Fit + transform in one step |
| `lda.predict(X)` | `(List[List[NUM]]) -> List[INT]` | Predicts classes by distance in the projected space |
| `lda.score(X, y)` | `(List[List[NUM]], List[INT]) -> FLOAT` | Calculates accuracy (default) or a custom metric |

### Constructor Parameters

```kafe
-- n_components: number of components (default: None = min(n_classes-1, n_features))
MACHINE lda = machine.linear_discriminant_analysis(2);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `n_components` | INT | None | Number of components (max: n_classes - 1) |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `lda.scalings_` | `List[List[FLOAT]]` | Eigenvectors (projection directions) |
| `lda.explained_variance_ratio_` | `List[FLOAT]` | Proportion of variance explained by each component |
| `lda.means_` | `List[List[FLOAT]]` | Mean of each feature for each class |
| `lda.classes_` | `List[INT]` | Unique classes |
| `lda.prior_` | `List[FLOAT]` | Prior probability of each class |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 3.0],
                        [6.0, 5.0], [7.0, 7.0], [8.0, 6.0]];
List[INT] y = [0, 0, 0, 1, 1, 1];

-- Reduce from 2D to 1D
MACHINE lda = machine.linear_discriminant_analysis(1);
lda.fit(X, y);

-- Transform into the projected space
List[List[FLOAT]] X_proj = lda.transform(X);
show(X_proj);

-- Classify
List[INT] preds = lda.predict([[2.0, 2.0], [7.0, 7.0]]);
show(preds);  -- [0, 1]

-- Evaluate
FLOAT acc = lda.score(X, y);
show(acc);  -- 1.0
```

### Comparison with PCA

| Aspect | PCA | LDA |
|--------|-----|-----|
| Objective | Maximize total variance | Maximize class separation |
| Supervision | Unsupervised | Supervised |
| Input | X only | X and y |
| Directions | Components with the greatest variance | Directions with the greatest discrimination |
| n_components | ≤ d (features) | ≤ K - 1 (classes - 1) |
| Main use | Visualization, noise reduction | Classification, supervised reduction |

### Internal Algorithm

1. **Calculate per-class means**: Mean of each feature for each class
2. **Within-class scatter ($S_W$)**: Sum of outer products $(x - \mu_k)(x - \mu_k)^T$
3. **Between-class scatter ($S_B$)**: Weighted sum of outer products of means
4. **Invert $S_W$**: Gauss-Jordan elimination with partial pivoting
5. **Product $M = S_W^{-1} S_B$**: Combined matrix
6. **Jacobi**: Diagonalize the symmetrized $M$ to obtain eigenvalues and eigenvectors
7. **Sort**: Select eigenvectors with the largest eigenvalues
8. **Project**: $Y = X \cdot W$

### When to Use

- Classification with linearly separable classes
- Supervised dimensionality reduction (preprocessing)
- Data with Gaussian distributions for each class
- When the projection directions need to be interpretable

### When Not to Use

- Nonlinear relationships (use Kernel LDA)
- Classes with very different covariances (use QDA)
- Categorical data without transformation

---

## PolynomialFeatures

Generates polynomial features up to a specified degree, allowing linear models to capture nonlinear relationships.

### Theory

For $d$ features and degree $n$, it generates all combinations of powers $p_1 + p_2 + \cdots + p_d \leq n$:

$$[x_1, x_2] \xrightarrow{\text{degree}=2} [1, x_1, x_2, x_1^2, x_1 x_2, x_2^2]$$

Number of output features (with bias): $\binom{d+n}{n} = \frac{(d+n)!}{d! \cdot n!}$

**Example** with degree=2 and 2 features:

| Feature | Powers | Value |
|---------|--------|-------|
| 1 (bias) | $(0,0)$ | $1$ |
| x0 | $(1,0)$ | $x_1$ |
| x1 | $(0,1)$ | $x_2$ |
| x0² | $(2,0)$ | $x_1^2$ |
| x0*x1 | $(1,1)$ | $x_1 \cdot x_2$ |
| x1² | $(0,2)$ | $x_2^2$ |

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `pf.fit(data)` | `(List[List[NUM]] or PARDOS) -> MACHINE` | Fits PolynomialFeatures (calculates dimensions) |
| `pf.transform(data)` | `(List[List[NUM]] or PARDOS) -> List[List[FLOAT]]` | Transforms features into polynomial features |
| `pf.fit_transform(data)` | `(List[List[NUM]] or PARDOS) -> List[List[FLOAT]]` | Fit + transform |

### Constructor Parameters

```kafe
-- degree=2, include_bias=True (default values)
MACHINE pf = machine.polynomial_features(2, True);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `degree` | INT | 2 | Maximum polynomial degree |
| `include_bias` | BOOL | `True` | Whether to include a bias column (ones) |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `pf.n_features_in_` | `INT` | Number of input features |
| `pf.n_features_out_` | `INT` | Number of output features |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]];

MACHINE pf = machine.polynomial_features(2, True);
List[List[FLOAT]] X_poly = pf.fit_transform(X);

show(pf.n_features_in_);   -- 2
show(pf.n_features_out_);  -- 6 (1 bias + 2 original + 3 polynomial)

-- Combine with linear regression to capture nonlinear relationships
MACHINE lr = machine.linear_regression();
lr.fit(X_poly, y);
```

### Comparison with a Simple Linear Model

| Aspect | Linear Regression | PolynomialFeatures + Linear Regression |
|--------|-------------------|----------------------------------------|
| Relationships captured | Linear only | Linear + polynomial |
| Number of features | $d$ | $\binom{d+n}{n}$ |
| Overfitting | Low | Possible if the degree is high |
| Scaling required | Optional | Recommended |

### Limitations

- **Curse of dimensionality**: The number of features grows exponentially with the degree
- **Overfitting**: A high degree can memorize noise
- **Not invertible**: `inverse_transform` is not implemented
- **Multicollinearity**: Polynomial features are highly correlated

---

## VarianceThreshold

Removes features with variance below a threshold. This unsupervised feature-selection method filters constant or nearly constant features.

### Theory

For each feature $j$, it calculates the population variance:

$$\text{Var}(j) = \frac{1}{n} \sum_{i=1}^{n} (x_{ij} - \bar{x}_j)^2$$

**Selection rule**: Keep feature $j$ if $\text{Var}(j) > \text{threshold}$.

- Feature with variance 0 → constant → no information
- Feature with low variance → little discriminatory power
- Default threshold: 0.0 (removes only constant features)

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `vt.fit(X)` | `(List[List[NUM]]) -> VOID` | Calculates variances and selects features |
| `vt.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Removes low-variance features |
| `vt.fit_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Fit + transform |

### Constructor Parameters

```kafe
-- threshold=0.0 (default value)
MACHINE vt = machine.variance_threshold(0.0);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `threshold` | FLOAT | 0.0 | Minimum variance threshold (non-negative) |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `vt.variances_` | `List[FLOAT]` | Variance of each feature |
| `vt.selected_indices_` | `List[INT]` | Indices of the selected features |
| `vt.n_features_in_` | `INT` | Number of input features |
| `vt.n_features_out_` | `INT` | Number of output features |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 0.0, 3.0],
                        [2.0, 0.0, 6.0],
                        [3.0, 0.0, 9.0],
                        [4.0, 0.0, 12.0]];

-- Remove constant features (threshold=0)
MACHINE vt = machine.variance_threshold(0.0);
List[List[FLOAT]] X_new = vt.fit_transform(X);
show(X_new);  -- [[1.0, 3.0], [2.0, 6.0], [3.0, 9.0], [4.0, 12.0]]

show(vt.variances_);       -- [1.25, 0.0, 10.125]
show(vt.selected_indices_); -- [0, 2]
show(vt.n_features_out_);   -- 2
```

### Comparison with Other Methods

| Aspect | VarianceThreshold | Lasso (L1) | RFE |
|--------|-------------------|------------|-----|
| Type | Filter (unsupervised) | Embedded (supervised) | Wrapper (supervised) |
| Requires y | No | Yes | Yes |
| Speed | Very fast | Fast | Slow |
| Detects interactions | No | Partially | Yes |
| Computational cost | $O(n \cdot d)$ | $O(n \cdot d \cdot iter)$ | $O(d \cdot T_{model} \cdot (d-k))$ |

---

## RecursiveFeatureElimination (RFE)

Selects features by recursive elimination using a supervised model. It repeatedly trains a model and removes the least important feature at each iteration until the desired number of features remains.

### Theory

RFE is a **wrapper method** that uses an estimator to evaluate feature importance:

1. Train the estimator with all active features
2. Calculate importance: $\text{importance}_j = |w_j|$ for linear models
3. Remove the least important feature
4. Repeat until $k$ features remain

**Ranking**: Features removed first receive a high rank (less important). The remaining features receive rank 1.

- **Time complexity**: $O(d \cdot T_{model} \cdot (d - k))$, where $T_{model}$ is the training time
- **Space**: $O(d)$ for ranking and support

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `rfe.fit(X, y)` | `(List[List[NUM]], List[NUM]) -> VOID` | Recursively trains and selects features |
| `rfe.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Selects only the chosen features |
| `rfe.fit_transform(X, y)` | `(List[List[NUM]], List[NUM]) -> List[List[FLOAT]]` | Fit + transform |

### Constructor Parameters

```kafe
-- estimator: LinearRegression (default), n_features: 1 (default)
MACHINE rfe = machine.recursive_feature_elimination(machine.linear_regression(), 2);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `estimator` | MACHINE | LinearRegression | Model with `coef_` or `feature_importances_` |
| `n_features` | INT | 1 | Number of features to select |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `rfe.selected_indices_` | `List[INT]` | Indices of the selected features |
| `rfe.ranking_` | `List[INT]` | Importance ranking (1 = most important) |
| `rfe.support_` | `List[BOOL]` | Boolean mask of the selected features |
| `rfe.n_features_in_` | `INT` | Number of input features |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 0.5, 3.0, 0.1],
                        [2.0, 0.6, 6.0, 0.2],
                        [3.0, 0.4, 9.0, 0.15],
                        [4.0, 0.7, 12.0, 0.25],
                        [5.0, 0.55, 15.0, 0.18]];
List[FLOAT] y = [2.0, 4.0, 6.0, 8.0, 10.0];

-- Select the 2 best features
MACHINE rfe = machine.recursive_feature_elimination(machine.linear_regression(), 2);
rfe.fit(X, y);

show(rfe.ranking_);          -- [1, 3, 1, 2]
show(rfe.selected_indices_); -- [0, 2]
show(rfe.support_);          -- [True, False, True, False]

List[List[FLOAT]] X_new = rfe.transform(X);
show(X_new);  -- [[1.0, 3.0], [2.0, 6.0], [3.0, 9.0], [4.0, 12.0], [5.0, 15.0]]
```

### Comparison with Other Methods

| Aspect | RFE | VarianceThreshold | Lasso (L1) |
|--------|-----|-------------------|------------|
| Type | Wrapper | Filter | Embedded |
| Requires y | Yes | No | Yes |
| Speed | Slow | Very fast | Fast |
| Detects interactions | Yes | No | Partially |
| Instability | High | None | Medium |
| Base model | Any estimator | None | Linear |
