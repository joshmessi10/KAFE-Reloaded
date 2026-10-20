# MACHINE · Modelos lineales y SVM

[Return to Index](../machine.md)

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
| `svm.predict_proba(X)` | `(List[List[NUM]] or List[NUM]) -> List[List[FLOAT]]` | Sigmoid scores in `classes_` order (uncalibrated probabilities) |
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
