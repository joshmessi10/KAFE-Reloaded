# MACHINE — Utilidades de Machine Learning

MACHINE provee implementaciones de algoritmos de Machine Learning estilo scikit-learn: modelos de regresión, clasificación, preprocesamiento y métricas de evaluación.

**Importación:**

```kafe
import machine;
```

---

## Funciones Principales

| Función | Firma | Descripción |
|---------|-------|-------------|
| `machine.linear_regression()` | `() -> MACHINE` | Crea un modelo de regresión lineal |
| `machine.ridge_regression(alpha, fit_intercept, max_iter)` | `(FLOAT, BOOL, INT) -> MACHINE` | Crea un modelo Ridge (regularización L2) |
| `machine.lasso_regression(alpha, fit_intercept, max_iter)` | `(FLOAT, BOOL, INT) -> MACHINE` | Crea un modelo Lasso (regularización L1) |
| `machine.logistic_regression(lr, iter)` | `(FLOAT, INT) -> MACHINE` | Crea un modelo de regresión logística |
| `machine.knn(k)` | `(INT) -> MACHINE` | Crea un clasificador KNN |
| `machine.knn_regressor(k)` | `(INT) -> MACHINE` | Crea un regresor KNN |
| `machine.standard_scaler()` | `() -> MACHINE` | Crea un estandarizador Z-score |
| `machine.minmax_scaler()` | `() -> MACHINE` | Crea un escalador min-max |
| `machine.simple_imputer(strategy)` | `(STR) -> MACHINE` | Crea un imputador de valores faltantes |
| `machine.simple_imputer_constant(v)` | `(NUM) -> MACHINE` | Crea un imputador con estrategia constante |
| `machine.label_encoder()` | `() -> MACHINE` | Crea un codificador de etiquetas |
| `machine.one_hot_encoder()` | `() -> MACHINE` | Crea un codificador one-hot |
| `machine.ordinal_encoder()` | `() -> MACHINE` | Crea un codificador ordinal (enteros ordenados) |
| `machine.pca(n)` | `(INT) -> MACHINE` | Crea modelo PCA con n componentes |
| `machine.dbscan(eps, min_samples)` | `(FLOAT, INT) -> MACHINE` | Crea un modelo de clustering DBSCAN |
| `machine.gaussian_mixture(n_components, max_iter, tol, random_state)` | `(INT, INT, FLOAT, INT) -> MACHINE` | Crea un modelo de mezcla de Gaussianas (GMM) |
| `machine.gaussian_nb()` | `() -> MACHINE` | Crea un clasificador Naive Bayes Gaussiano |
| `machine.random_forest_classifier(n_est, depth, split, leaf)` | `(INT, INT, INT, INT) -> MACHINE` | Crea un clasificador Random Forest |
| `machine.random_forest_regressor(n_est, depth, split, leaf)` | `(INT, INT, INT, INT) -> MACHINE` | Crea un regresor Random Forest |
| `machine.decision_tree_regressor(criterion, max_depth, min_samples_split, min_samples_leaf)` | `(STR, INT, INT, INT) -> MACHINE` | Crea un regresor Decision Tree |
| `machine.polynomial_features(degree, include_bias)` | `(INT, BOOL) -> MACHINE` | Crea features polinomiales hasta un grado especificado |
| `machine.elastic_net(alpha, l1_ratio, fit_intercept, max_iter)` | `(FLOAT, FLOAT, BOOL, INT) -> MACHINE` | Crea un modelo ElasticNet (regularización L1+L2) |
| `machine.pipeline(name1, step1, ...)` | `(STR, MACHINE, ...) -> MACHINE` | Crea un Pipeline de preprocessing + modelo |
| `machine.cross_val_score(cv, scoring, random_state)` | `(INT, STR, INT) -> MACHINE` | Crea un evaluador de cross-validation |

---

## Métricas de Clasificación

| Función | Firma | Descripción |
|---------|-------|-------------|
| `machine.accuracy_score(y_true, y_pred)` | `(List[NUM], List[NUM]) -> FLOAT` | Proporción de predicciones correctas |
| `machine.precision_score(y_true, y_pred)` | `(List[NUM], List[NUM]) -> FLOAT` | Macro-average: TP / (TP + FP) por clase |
| `machine.recall_score(y_true, y_pred)` | `(List[NUM], List[NUM]) -> FLOAT` | Macro-average: TP / (TP + FN) por clase |
| `machine.f1_score(y_true, y_pred)` | `(List[NUM], List[NUM]) -> FLOAT` | Media armónica de precision y recall macro-average |
| `machine.confusion_matrix(y_true, y_pred)` | `(List[NUM], List[NUM]) -> List[List[INT]]` | Matriz de confusión N×N |
| `machine.classification_report(y_true, y_pred)` | `(List[NUM], List[NUM]) -> STR` | Reporte textual estilo scikit-learn |
| `machine.roc_auc_score(y_true, y_score)` | `(List[NUM], List[NUM]) -> FLOAT` | Área bajo la curva ROC (binario) |

### Ejemplo

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

### ROC-AUC

Evalúa la capacidad de discriminación de un clasificador binario calculando el área bajo la curva ROC (TPR vs FPR). Es **independiente del umbral**: mide qué tan bien el modelo rankea ejemplos positivos por encima de negativos.

**Fundamento**: AUC = probabilidad de que un positivo aleatorio tenga score mayor que un negativo aleatorio.

- AUC = 1.0: clasificador perfecto
- AUC = 0.5: clasificador aleatorio
- AUC < 0.5: peor que aleatorio

**Solo admite clasificación binaria** (dos clases).

```kafe
import machine;

List[INT] y_true = [1, 0, 1, 1, 0];
List[FLOAT] y_score = [0.9, 0.1, 0.8, 0.7, 0.2];

FLOAT auc = machine.roc_auc_score(y_true, y_score);
show(auc);  -- 1.0
```

---

## Métricas de Clustering

| Función | Firma | Descripción |
|---------|-------|-------------|
| `machine.silhouette_score(X, labels)` | `(List[List[NUM]], List[INT]) -> FLOAT` | Silhouette Score promedio (-1 a 1) |

### Ejemplo

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 1.0], [1.5, 1.5], [2.0, 2.0],
                        [8.0, 8.0], [8.5, 8.5], [9.0, 9.0]];
List[INT] labels = [0, 0, 0, 1, 1, 1];

FLOAT score = machine.silhouette_score(X, labels);
show(score);  -- ~0.87 (clusters bien separados)
```

### Silhouette Score

Mide la calidad del clustering calculando cuán similar es cada punto a su propio cluster (cohesión) comparado con otros clusters (separación). No necesita ground truth.

**Fundamento**: Para cada punto $i$:
- $a(i)$ = distancia promedio a otros puntos del mismo cluster
- $b(i)$ = distancia mínima promedio al cluster más cercano
- $s(i) = (b(i) - a(i)) / \max(a(i), b(i))$

- $s \approx 1$: punto bien clusterizado
- $s \approx 0$: punto en frontera entre clusters
- $s < 0$: punto en cluster incorrecto

---

## Métricas de Regresión

| Función | Fórmula | Descripción |
|---------|---------|-------------|
| `machine.mean_squared_error(y, ŷ)` | $(1/n)\sum (y - ŷ)^2$ | Error cuadrático medio |
| `machine.mean_absolute_error(y, ŷ)` | $(1/n)\sum \|y - ŷ\|$ | Error absoluto medio |
| `machine.root_mean_squared_error(y, ŷ)` | $\sqrt{MSE}$ | Raíz del error cuadrático medio |
| `machine.r2_score(y, ŷ)` | $1 - SS_{res}/SS_{tot}$ | Coeficiente de determinación |
| `machine.max_error(y, ŷ)` | $\max \|y - ŷ\|$ | Máximo error absoluto |
| `machine.median_absolute_error(y, ŷ)` | $\text{median}(\|y - ŷ\|)$ | Mediana del error absoluto |
| `machine.mean_absolute_percentage_error(y, ŷ)` | $(100/n)\sum \|(y - ŷ)/y\|$ | Error porcentual absoluto medio |
| `machine.explained_variance_score(y, ŷ)` | $1 - \text{Var}(y - ŷ)/\text{Var}(y)$ | Varianza explicada |

### Ejemplo

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

Implementa regresión lineal por mínimos cuadrados usando la ecuación normal: $\hat{\beta} = (X^T X)^{-1} X^T y$.

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `lr.fit(X, y)` | `(List[List[NUM]] o List[NUM], List[NUM]) -> VOID` | Entrena el modelo |
| `lr.predict(X)` | `(List[List[NUM]] o List[NUM]) -> List[FLOAT]` | Predice valores |
| `lr.score(X, y)` | `(List[List[NUM]] o List[NUM], List[NUM]) -> FLOAT` | Calcula R² |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `lr.coef_` | `List[FLOAT]` | Coeficientes de cada feature |
| `lr.intercept_` | `FLOAT` | Término independiente |

### Ejemplo

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

Implementa regresión lineal con regularización L2 — penaliza coeficientes grandes para reducir overfitting.

### Fundamento Teórico

Ridge minimiza: $||y - X\theta||^2 + \alpha||\theta||^2$

El término $\alpha||\theta||^2$ penaliza coeficientes grandes sin eliminarlos completamente.

**Solución cerrada**: $\theta = (X^T X + \alpha I)^{-1} X^T y$

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `ridge.fit(X, y)` | `(List[List[NUM]] o List[NUM], List[NUM]) -> VOID` | Entrena el modelo |
| `ridge.predict(X)` | `(List[List[NUM]] o List[NUM]) -> List[NUM]` | Predice valores |
| `ridge.score(X, y)` | `(List[List[NUM]] o List[NUM], List[NUM]) -> FLOAT` | Calcula R² |

### Parámetros del Constructor

```kafe
-- alpha=1.0, fit_intercept=true, max_iter=1000
MACHINE ridge = machine.ridge_regression(1.0, true, 1000);
```

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `ridge.coef_` | `List[FLOAT]` | Coeficientes del modelo |
| `ridge.intercept_` | `FLOAT` | Intercepto |

### Ejemplo

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

### Comparación con LinearRegression

| Aspecto | LinearRegression | RidgeRegression |
|---------|------------------|-----------------|
| Regularización | Ninguna | L2 |
| Overfitting | Susceptible | Reducido |
| Coeficientes | Pueden ser grandes | Penalizados |
| Colineales | Inestable | Estable |

---

## LassoRegression

Implementa regresión lineal con regularización L1 — puede eliminar features completamente (selección de features).

### Fundamento Teórico

Lasso minimiza: $||y - X\theta||^2 + \alpha||\theta||_1$

El término $\alpha||\theta||_1$ puede poner coeficientes en 0 exacto, eliminando features irrelevantes.

**Algoritmo**: Coordinate Descent con soft-thresholding (no hay solución cerrada).

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `lasso.fit(X, y)` | `(List[List[NUM]] o List[NUM], List[NUM]) -> VOID` | Entrena el modelo |
| `lasso.predict(X)` | `(List[List[NUM]] o List[NUM]) -> List[NUM]` | Predice valores |
| `lasso.score(X, y)` | `(List[List[NUM]] o List[NUM], List[NUM]) -> FLOAT` | Calcula R² |

### Parámetros del Constructor

```kafe
-- alpha=1.0, fit_intercept=true, max_iter=1000
MACHINE lasso = machine.lasso_regression(1.0, true, 1000);
```

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `lasso.coef_` | `List[FLOAT]` | Coeficientes (algunos pueden ser 0) |
| `lasso.intercept_` | `FLOAT` | Intercepto |

### Ejemplo

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 0.0], [2.0, 0.0], [3.0, 0.0], [4.0, 0.0], [5.0, 0.0]];
List[FLOAT] y = [2.0, 4.0, 6.0, 8.0, 10.0];

MACHINE lasso = machine.lasso_regression(0.5);
lasso.fit(X, y);

-- Lasso puede haber eliminado la segunda feature (coef = 0)
List[FLOAT] preds = lasso.predict([[1.5, 0.0], [3.0, 0.0]]);
show(preds);
```

### Selección de Features

Lasso puede poner coeficientes en 0, eliminando features:

```kafe
-- Alpha alto → más coeficientes en 0
MACHINE lasso = machine.lasso_regression(1.0);
-- Alpha bajo → menos coeficientes en 0
MACHINE lasso = machine.lasso_regression(0.1);
```

---

## ElasticNet

Implementa regresión lineal con regularización combinada L1 + L2 — combina las ventajas de Ridge (manejo de correlaciones) y Lasso (selección de features).

### Fundamento Teórico

ElasticNet minimiza: $\frac{1}{2n}||y - X\theta||^2 + \alpha \cdot l1\_ratio \cdot ||\theta||_1 + \alpha \cdot (1 - l1\_ratio) \cdot ||\theta||^2$

Donde:
- $\alpha$ es la fuerza total de regularización
- $l1\_ratio$ controla la proporción L1 vs L2 (0=Ridge puro, 1=Lasso puro)

**Algoritmo**: Coordinate Descent con soft-thresholding (no hay solución cerrada).

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `en.fit(X, y)` | `(List[List[NUM]] o List[NUM], List[NUM]) -> VOID` | Entrena el modelo |
| `en.predict(X)` | `(List[List[NUM]] o List[NUM]) -> List[NUM]` | Predice valores |
| `en.score(X, y)` | `(List[List[NUM]] o List[NUM], List[NUM]) -> FLOAT` | Calcula R² |

### Parámetros del Constructor

```kafe
-- alpha=1.0, l1_ratio=0.5, fit_intercept=true, max_iter=1000
MACHINE en = machine.elastic_net(1.0, 0.5, true, 1000);
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `alpha` | FLOAT | 1.0 | Fuerza de regularización |
| `l1_ratio` | FLOAT | 0.5 | Proporción L1 vs L2 (0=Ridge, 1=Lasso) |
| `fit_intercept` | BOOL | true | Si se ajusta intercepto |
| `max_iter` | INT | 1000 | Máximo de iteraciones |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `en.coef_` | `List[FLOAT]` | Coeficientes (algunos pueden ser 0) |
| `en.intercept_` | `FLOAT` | Intercepto |

### Ejemplo

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0], [7.0, 8.0]];
List[FLOAT] y = [2.0, 4.0, 6.0, 8.0];

MACHINE en = machine.elastic_net(1.0, 0.5);
en.fit(X, y);

show(en.coef_);      -- Coeficientes (algunos pueden ser 0)
show(en.intercept_); -- Intercepto

List[FLOAT] preds = en.predict([[2.0, 3.0], [6.0, 7.0]]);
show(preds);

FLOAT r2 = en.score(X, y);
show(r2);
```

### Comparación: Ridge vs Lasso vs ElasticNet

| Aspecto | Ridge (L2) | Lasso (L1) | ElasticNet (L1+L2) |
|---------|-----------|------------|---------------------|
| Selección de features | No | Sí | Sí |
| Manejo de correlaciones | Sí | Inestable | Sí |
| Número de parámetros | 1 ($\alpha$) | 1 ($\alpha$) | 2 ($\alpha$, $l1\_ratio$) |
| Sparsity | No | Sí | Sí (controlable) |
| Grupos de features | No | No | Sí |

### Cuándo Usar

- Muchas features con sospecha de irrelevantes: ElasticNet con $l1\_ratio$ alto
- Features correlacionadas (ej: one-hot encoding): ElasticNet con $l1\_ratio$ bajo
- Balance entre selección y estabilidad: ElasticNet con $l1\_ratio$ intermedio

---

## SVR (Support Vector Regression)

Implementa regresión usando Support Vector Machines con función de pérdida epsilon-insensitive.

### Fundamento Teórico

SVR encuentra un hiperplano que ajusta los datos dentro de un tubo de radio ε. Solo los puntos fuera del tubo (support vectors) contribuyen al modelo.

**Pérdida epsilon-insensitive**: $L_\epsilon(y, f(x)) = \max(0, |y - f(x)| - \epsilon)$

**Kernels disponibles**:
- `linear`: $K(x_i, x_j) = x_i \cdot x_j$
- `rbf`: $K(x_i, x_j) = \exp(-\gamma ||x_i - x_j||^2)$
- `poly`: $K(x_i, x_j) = (x_i \cdot x_j + 1)^d$

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `svr.fit(X, y)` | `(List[List[NUM]] o List[NUM], List[NUM]) -> VOID` | Entrena el modelo |
| `svr.predict(X)` | `(List[List[NUM]] o List[NUM]) -> List[NUM]` | Predice valores |
| `svr.score(X, y)` | `(List[List[NUM]] o List[NUM], List[NUM]) -> FLOAT` | Calcula R² |

### Parámetros del Constructor

```kafe
-- C=1.0, epsilon=0.1, kernel="linear"
MACHINE svr_model = machine.svr(1.0, 0.1, "linear");
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `C` | FLOAT | 1.0 | Regularización (mayor = menos regularización) |
| `epsilon` | FLOAT | 0.1 | Ancho del tubo epsilon-insensitive |
| `kernel` | STRING | "linear" | Tipo de kernel: "linear", "rbf", "poly" |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `svr.coef_` | `List[FLOAT]` | Coeficientes (solo kernel lineal) |
| `svr.intercept_` | `FLOAT` | Intercepto |
| `svr.support_vectors_` | `List[List[FLOAT]]` | Vectores de soporte |
| `svr.n_support_` | `INT` | Número de vectores de soporte |

### Ejemplo

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

### Comparación con LinearRegression

| Aspecto | LinearRegression | SVR |
|---------|------------------|-----|
| Pérdida | Squared error | Epsilon-insensitive |
| Outliers | Sensible | Robusto |
| Support vectors | No | Sí |
| Kernel | No | Sí (linear, rbf, poly) |

---

## SVM (Support Vector Machine Classifier)

Implementa un clasificador SVM para clasificación binaria que encuentra el hiperplano de máximo margen que separa las clases.

### Fundamento Teórico

SVM busca el hiperplano $w \cdot x + b = 0$ que maximice el margen entre clases usando **hinge loss**:

$$J(w) = \frac{1}{2}||w||^2 + C \sum_{i=1}^{n} \max(0, 1 - y_i \cdot f(x_i))$$

**Kernels disponibles**:
- `linear`: $K(x_i, x_j) = x_i \cdot x_j$ — SGD primal con hinge loss + L2
- `rbf`: $K(x_i, x_j) = \exp(-\gamma ||x_i - x_j||^2)$ — SMO simplificado dual
- `poly`: $K(x_i, x_j) = (x_i \cdot x_j + 1)^d$ — SMO simplificado dual

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `svm.fit(X, y)` | `(List[List[NUM]] o List[NUM], List[INT]) -> VOID` | Entrena el clasificador. `y` contiene etiquetas binarias |
| `svm.predict(X)` | `(List[List[NUM]] o List[NUM]) -> List[INT]` | Predice clases (0 o 1) |
| `svm.predict_proba(X)` | `(List[List[NUM]] o List[NUM]) -> List[List[FLOAT]]` | Probabilidades [P(0), P(1)] via sigmoid |
| `svm.score(X, y)` | `(List[List[NUM]] o List[NUM], List[INT]) -> FLOAT` | Calcula exactitud (default) o métrica personalizada |

### Parámetros del Constructor

```kafe
-- C=1.0, kernel="linear", max_iter=1000 (valores por defecto)
MACHINE svm_model = machine.svm(1.0, "linear", 1000);
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `C` | FLOAT | 1.0 | Regularización (mayor = menos regularización) |
| `kernel` | STRING | "linear" | Tipo de kernel: "linear", "rbf", "poly" |
| `max_iter` | INT | 1000 | Máximo de iteraciones de entrenamiento |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `svm.coef_` | `List[FLOAT]` | Coeficientes del modelo (solo kernel lineal) |
| `svm.intercept_` | `FLOAT` | Intercepto del modelo |
| `svm.support_vectors_` | `List[List[FLOAT]]` | Vectores de soporte |
| `svm.support_vector_labels_` | `List[INT]` | Etiquetas de los vectores de soporte |
| `svm.n_support_` | `INT` | Número de vectores de soporte |
| `svm.classes_` | `List[INT]` | Clases únicas |

### Ejemplo

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

### Comparación con LogisticRegression

| Aspecto | SVM | LogisticRegression |
|---------|-----|-------------------|
| Pérdida | Hinge loss | Log loss |
| Margen | Maximiza margen | Maximiza verosimilitud |
| Support vectors | Sí (solo puntos del margen) | No (usa todos los datos) |
| Kernel trick | Sí (linear, rbf, poly) | No |
| Probabilidades | Sigmoid post-hoc | nativa (softmax) |

---

## Model Selection

Herramientas para dividir datasets y evaluar modelos de forma robusta.

### Funciones Principales

| Función | Firma | Descripción |
|---------|-------|-------------|
| `machine.train_test_split(X, y, test_size, random_state)` | `(List[List[NUM]], List[NUM], FLOAT, INT) -> (List[List[NUM]], List[List[NUM]], List[NUM], List[NUM])` | Divide datos en training y test sets |
| `machine.k_fold_cross_validation(model, X, y, k, scoring_fn)` | `(MACHINE, List[List[NUM]], List[NUM], INT, FUNC) -> (List[FLOAT], FLOAT)` | Evalúa modelo con K-Fold CV, retorna scores por fold y promedio |

### train_test_split

Divide el dataset en training set (para ajustar el modelo) y test set (para evaluar generalización).

#### Fundamento Teórico

Dado un dataset de $n$ ejemplos, particiona aleatoriamente en dos subconjuntos:
- **Training set**: $(1 - \text{test\_size}) \cdot n$ ejemplos
- **Test set**: $\text{test\_size} \cdot n$ ejemplos (default: 20%)

El parámetro `random_state` controla la semilla aleatoria para reproducibilidad.

#### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `train_test_split(X, y, test_size, random_state)` | `(List[List[NUM]], List[NUM], FLOAT, INT) -> Tuple` | Retorna `(X_train, X_test, y_train, y_test)` |

#### Ejemplo

```kafe
import machine;

List[List[FLOAT]] X = [[1.0], [2.0], [3.0], [4.0], [5.0],
                        [6.0], [7.0], [8.0], [9.0], [10.0]];
List[FLOAT] y = [2.0, 4.0, 6.0, 8.0, 10.0,
                 12.0, 14.0, 16.0, 18.0, 20.0];

-- División 80/20 con semilla fija
(List[List[FLOAT]] X_train, List[List[FLOAT]] X_test,
 List[FLOAT] y_train, List[FLOAT] y_test) = machine.train_test_split(X, y, 0.2, 42);

show(len(X_train));  -- 8
show(len(X_test));   -- 2

MACHINE lr = machine.linear_regression();
lr.fit(X_train, y_train);

FLOAT r2 = lr.score(X_test, y_test);
show(r2);  -- ~1.0
```

### k_fold_cross_validation

Evalúa un modelo usando K-Fold Cross Validation — particiona el dataset en $k$ folds y entrena/evalúa $k$ veces.

#### Fundamento Teórico

1. Barajar y dividir el dataset en $k$ folds
2. Para cada fold $i$: usar fold $i$ como test, los demás como training
3. Promediar los scores de cada fold

Ventaja sobre train-test split: cada muestra se usa exactamente una vez para test y $k-1$ veces para training, maximizando el uso de los datos.

#### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `k_fold_cross_validation(model, X, y, k, scoring_fn)` | `(MACHINE, List[List[NUM]], List[NUM], INT, FUNC) -> Tuple` | Retorna `(scores, mean_score)` |

#### Ejemplo

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 4.0],
                        [4.0, 5.0], [5.0, 6.0], [6.0, 7.0],
                        [7.0, 8.0], [8.0, 9.0], [9.0, 10.0], [10.0, 11.0]];
List[FLOAT] y = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];

MACHINE lr = machine.linear_regression();

-- 5-Fold Cross Validation
(List[FLOAT] scores, FLOAT mean_score) = machine.k_fold_cross_validation(
    lr, X, y, 5, machine.r2_score
);
show(scores);      -- [0.92, 0.95, 0.88, 0.91, 0.94]
show(mean_score);  -- ~0.92
```

#### Comparación: Train-Test Split vs K-Fold CV

| Aspecto | Train-Test Split | K-Fold CV |
|---------|------------------|-----------|
| Particiones | 1 | $k$ |
| Varianza | Alta | Baja |
| Costo computacional | $1 \times$ | $k \times$ |
| Uso de datos | Desperdicia test set | Cada muestra se usa para test y training |
| Ideal para | Datasets grandes | Datasets pequeños/medianos |

---

## CrossValScore

Wrapper para evaluar modelos con k-fold cross-validation de forma orientada a objetos. Calcula scores por fold, promedio y desviación estándar.

### Función

| Función | Firma | Descripción |
|---------|-------|-------------|
| `machine.cross_val_score(cv, scoring, random_state)` | `(INT, STR, INT) -> MACHINE` | Crea un evaluador de cross-validation |

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `cvs.fit(model, X, y)` | `(MACHINE, List[List[NUM]], List[NUM]) -> VOID` | Evalúa el modelo con k-fold CV |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `cvs.scores_` | `List[FLOAT]` | Scores de cada fold |
| `cvs.mean_score_` | `FLOAT` | Promedio de scores |
| `cvs.std_score_` | `FLOAT` | Desviación estándar de scores |

### Estrategias de Scoring

| Estrategia | Descripción |
|------------|-------------|
| `"accuracy"` | Exactitud (default) |
| `"r2"` | Coeficiente de determinación |
| `"mse"` | Error cuadrático medio |

### Ejemplo

```kafe
import machine;

MACHINE lr = machine.linear_regression();

-- Evaluar con 5-fold CV usando R²
MACHINE cvs = machine.cross_val_score(5, "r2", 42);
cvs.fit(lr, X, y);

show(cvs.scores_);       -- [0.92, 0.95, 0.88, 0.91, 0.94]
show(cvs.mean_score_);   -- ~0.92
show(cvs.std_score_);    -- ~0.025
```

---

## GridSearchCV

Búsqueda exahustiva de hiperparámetros sobre una grilla definida, evaluando cada combinación con cross-validation.

### Fundamento Teórico

GridSearchCV evalúa **todas** las combinaciones posibles de parámetros definidas en la grilla:

- Complejidad: $O(\prod_{i=1}^{p} |G_i| \cdot k \cdot T_{\text{model}})$ donde $|G_i|$ es el número de valores del parámetro $i$, $k$ es el número de folds, y $T_{\text{model}}$ es el tiempo de entrenamiento por ajuste.
- Ventaja: Garantiza encontrar la mejor combinación dentro de la grilla definida.
- Limitación: Costo exponencial al agregar más parámetros (maldición de la dimensionalidad).

### Función

| Función | Firma | Descripción |
|---------|-------|-------------|
| `machine.grid_search_cv(model, param_grid, cv, scoring_fn)` | `(MACHINE, Dict, INT, FUNC) -> MACHINE` | Crea un objeto GridSearchCV |

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `gs.fit(X, y)` | `(List[List[NUM]], List[NUM]) -> VOID` | Ejecuta la búsqueda exhaustiva con CV |
| `gs.predict(X)` | `(List[List[NUM]]) -> List[NUM]` | Predice con el mejor modelo encontrado |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `gs.best_params_` | `Dict` | Mejores parámetros encontrados |
| `gs.best_score_` | `FLOAT` | Mejor score de cross-validation |
| `gs.best_estimator_` | `MACHINE` | Modelo re-entrenado con los mejores parámetros |
| `gs.cv_results_` | `List[Dict]` | Resultados de cada combinación evaluada |

### Ejemplo

```kafe
import machine;

MACHINE lr = machine.logistic_regression(0.01, 1000);

-- Definir grilla de parámetros
Dict param_grid = {"lr": [0.001, 0.01, 0.1], "iter": [500, 1000, 2000]};

-- GridSearchCV con 5-fold CV
MACHINE gs = machine.grid_search_cv(lr, param_grid, 5, machine.accuracy_score);
gs.fit(X_train, y_train);

show(gs.best_params_);   -- Mejor combinación de parámetros
show(gs.best_score_);    -- Mejor score de CV

List[INT] preds = gs.predict(X_test);
show(preds);
```

### Comparación: GridSearchCV vs RandomizedSearchCV

| Aspecto | GridSearchCV | RandomizedSearchCV |
|---------|--------------|---------------------|
| Búsqueda | Exhaustiva (todas las combinaciones) | Muestreo aleatorio (n_iter combinaciones) |
| Complejidad | $O(\prod \|G_i\| \cdot k \cdot T)$ | $O(n \cdot k \cdot T)$ |
| Espacio continuo | Discretizado | Natural (distribuciones) |
| Garantía | Óptimo en la grilla | No garantizado |
| Velocidad | Lento con muchos parámetros | Más rápido, controlable |

---

## RandomizedSearchCV

Búsqueda aleatoria de hiperparámetros muestreando un número fijo de combinaciones de distribuciones definidas, evaluando cada una con cross-validation.

### Fundamento Teórico

RandomizedSearchCV implementa **búsqueda aleatoria** sobre distribuciones de parámetros:

- Complejidad: $O(n \cdot k \cdot T_{\text{model}})$ donde $n$ es `n_iter`, $k$ es el número de folds, y $T_{\text{model}}$ es el tiempo de entrenamiento por ajuste.
- Para un presupuesto fijo $B$, explora más combinaciones que GridSearch ya que no depende del tamaño de la grilla.
- Puede trabajar con distribuciones continuas (ej: log-uniform para learning rates).

### Función

| Función | Firma | Descripción |
|---------|-------|-------------|
| `machine.randomized_search_cv(model, param_dist, n_iter, cv, scoring_fn)` | `(MACHINE, Dict, INT, INT, FUNC) -> MACHINE` | Crea un objeto RandomizedSearchCV |

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `rs.fit(X, y)` | `(List[List[NUM]], List[NUM]) -> VOID` | Ejecuta la búsqueda aleatoria con CV |
| `rs.predict(X)` | `(List[List[NUM]]) -> List[NUM]` | Predice con el mejor modelo encontrado |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `rs.best_params_` | `Dict` | Mejores parámetros encontrados |
| `rs.best_score_` | `FLOAT` | Mejor score de cross-validation |
| `rs.best_estimator_` | `MACHINE` | Modelo re-entrenado con los mejores parámetros |
| `rs.cv_results_` | `List[Dict]` | Resultados de cada combinación evaluada |

### Ejemplo

```kafe
import machine;

MACHINE lr = machine.logistic_regression(0.01, 1000);

-- Definir distribuciones de parámetros
Dict param_dist = {"lr": [0.001, 0.01, 0.1, 0.5], "iter": [100, 500, 1000, 2000]};

-- RandomizedSearchCV: 10 iteraciones, 5-fold CV
MACHINE rs = machine.randomized_search_cv(lr, param_dist, 10, 5, machine.accuracy_score);
rs.fit(X_train, y_train);

show(rs.best_params_);    -- Mejor combinación encontrada
show(rs.best_score_);     -- Mejor score de CV

List[INT] preds = rs.predict(X_test);
show(preds);
```

---

## Pipeline

Encadena múltiples pasos de preprocessing con un modelo final en un solo objeto. Previene data leakage al garantizar que cada transformador solo vea los datos de entrenamiento durante `fit()`.

### Fundamento Teórico

Dado un pipeline $P = [T_1, T_2, \ldots, T_n, M]$:

**Entrenamiento**: Cada transformador se ajusta y transforma secuencialmente, luego el modelo final se ajusta en los datos transformados.

**Predicción**: Cada transformación se aplica en orden, luego el modelo predice.

### Función

| Función | Firma | Descripción |
|---------|-------|-------------|
| `machine.pipeline(name1, step1, name2, step2, ...)` | `(STR, MACHINE, ...) -> MACHINE` | Crea un Pipeline con pasos nombrados |

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `pipe.fit(X, y)` | `(List[List[NUM]], List[NUM]) -> VOID` | Ajusta todos los pasos del pipeline |
| `pipe.predict(X)` | `(List[List[NUM]]) -> List[NUM]` | Aplica transformaciones y predice |
| `pipe.score(X, y, metric)` | `(List[List[NUM]], List[NUM], FUNC) -> FLOAT` | Evalúa usando el modelo final |
| `pipe.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Aplica solo las transformaciones |
| `pipe.fit_transform(X, y)` | `(List[List[NUM]], List[NUM]) -> List[List[FLOAT]]` | Fit + transform |
| `pipe.get_params()` | `() -> List[STR]` | Retorna nombres de los pasos |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `pipe.named_steps_` | `Dict` | Diccionario de pasos por nombre (después de fit) |
| `pipe.steps_` | `List[Tuple]` | Lista de tuplas (nombre, paso) ajustadas |

### Ejemplo

```kafe
import machine;

-- Crear transformadores y modelo
MACHINE scaler = machine.standard_scaler();
MACHINE lr = machine.linear_regression();

-- Crear pipeline: escalar → regresión lineal
MACHINE pipe = machine.pipeline("scaler", scaler, "model", lr);

-- Entrenar pipeline completo
pipe.fit(X_train, y_train);

-- Predecir (aplica scaler automáticamente)
List[FLOAT] preds = pipe.predict(X_test);

-- Evaluar
FLOAT r2 = pipe.score(X_test, y_test);

-- Acceder a pasos específicos
show(pipe.named_steps_["scaler"]);
show(pipe.get_params());  -- ["scaler", "model"]
```

### Ejemplo con GridSearchCV

```kafe
import machine;

MACHINE scaler = machine.standard_scaler();
MACHINE lr = machine.logistic_regression(0.01, 1000);
MACHINE pipe = machine.pipeline("scaler", scaler, "model", lr);

-- Buscar hiperparámetros del scaler y el modelo simultáneamente
Dict param_grid = {"model__lr": [0.001, 0.01, 0.1], "scaler": [scaler]};
MACHINE gs = machine.grid_search_cv(pipe, param_grid, 5, machine.accuracy_score);
gs.fit(X_train, y_train);

show(gs.best_params_);
show(gs.best_score_);
```

### Comparación: Código Manual vs Pipeline

| Aspecto | Código Manual | Pipeline |
|---------|---------------|----------|
| Data leakage | Riesgo alto (olvidar separar fit/transform) | Prevenido automáticamente |
| Modularidad | Código repetitivo | Bloques reutilizables |
| Cross-validation | Error común: fit scaler en todo el dataset | Correcto por diseño |
| GridSearchCV | No integrable | Búsqueda de hiperparámetros anidada |
| Legibilidad | Múltiples líneas de fit/transform | Un solo objeto expressivo |

---

## LogisticRegression

Implementa regresión logística binaria usando gradiente descendente.

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `lr.fit(X, y)` | `(List[List[NUM]] o List[NUM], List[INT]) -> VOID` | Entrena el modelo. `y` debe contener solo 0 y 1 |
| `lr.predict(X)` | `(List[List[NUM]] o List[NUM]) -> List[INT]` | Predice clases (0 o 1) |
| `lr.predict_proba(X)` | `(List[List[NUM]] o List[NUM]) -> List[List[FLOAT]]` | Probabilidades [P(0), P(1)] |
| `lr.score(X, y)` | `(List[List[NUM]] o List[NUM], List[INT]) -> FLOAT` | Calcula exactitud |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `lr.coef_` | `List[FLOAT]` | Coeficientes de cada feature |
| `lr.intercept_` | `FLOAT` | Término independiente |

### Parámetros del Constructor

```kafe
-- learning_rate=0.01, max_iter=1000 (valores por defecto)
MACHINE lr = machine.logistic_regression(0.1, 5000);
```

### Ejemplo

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

Clasificador basado en los k vecinos más cercanos (distancia euclídea).

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `knn.fit(X, y)` | `(List[List[NUM]] o List[NUM], List[INT]) -> VOID` | Entrena el clasificador |
| `knn.predict(X)` | `(List[List[NUM]] o List[NUM]) -> List[INT]` | Predice clases |
| `knn.predict_proba(X)` | `(List[List[NUM]] o List[NUM]) -> List[List[FLOAT]]` | Probabilidades por clase |
| `knn.score(X, y)` | `(List[List[NUM]] o List[NUM], List[INT]) -> FLOAT` | Calcula exactitud |

### Parámetros del Constructor

```kafe
-- k=3 (valor por defecto)
MACHINE model = machine.knn(3);
```

### Ejemplo

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

Regresor basado en los k vecinos más cercanos — predice el promedio de los valores de los k vecinos más cercanos.

### Fundamento Teórico

KNNRegressor es un modelo de **lazy learning** que no entrena un modelo explícito. Para predecir, calcula la distancia a todos los puntos de entrenamiento, selecciona los k más cercanos y promedia sus valores target.

**Predicción (uniform)**:

$$\hat{y} = \frac{1}{k} \sum_{i=1}^{k} y_i$$

**Predicción (distance-weighted)**:

$$\hat{y} = \frac{\sum_{i=1}^{k} w_i \cdot y_i}{\sum_{i=1}^{k} w_i}, \quad w_i = \frac{1}{d_i + \epsilon}$$

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `knr.fit(X, y)` | `(List[List[NUM]] o List[NUM], List[NUM]) -> VOID` | Almacena datos de entrenamiento |
| `knr.predict(X)` | `(List[List[NUM]] o List[NUM]) -> List[NUM]` | Predice valores |
| `knr.score(X, y)` | `(List[List[NUM]] o List[NUM], List[NUM]) -> FLOAT` | Calcula R² |

### Parámetros del Constructor

```kafe
-- k=3 (valor por defecto)
MACHINE model = machine.knn_regressor(3);
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `k` | INT | 3 | Número de vecinos a considerar |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `knr.k` | `INT` | Número de vecinos |
| `knr.X_train_` | `List[List[FLOAT]]` | Datos de entrenamiento almacenados |
| `knr.y_train_` | `List[FLOAT]` | Targets de entrenamiento almacenados |

### Ejemplo

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

### Comparación con KNN Classifier

| Aspecto | KNN Classifier | KNN Regressor |
|---------|----------------|---------------|
| Target | Clases (discretas) | Valores continuos |
| Predicción | Votación mayoritaria | Promedio de vecinos |
| Métrica | Accuracy | R² |
| Fábrica | `machine.knn(k)` | `machine.knn_regressor(k)` |

---

## DecisionTreeClassifier

Implementa un árbol de decisión para clasificación usando recursión y criterios de impureza (Gini o Entropy).

### Concepto Teórico

Un **árbol de decisión** particiona recursivamente el espacio de características aprendiendo reglas de decisión simples. En cada nodo interno, selecciona la característica y umbral que mejor divide los datos según un criterio de pureza.

**Criterios de Impureza**:

| Criterio | Fórmula | Descripción |
|----------|---------|-------------|
| Gini | $1 - \sum(p_i^2)$ | Impureza de Gini (0 = puro, máximo = $1 - 1/n_{clases}$) |
| Entropy | $-\sum(p_i \cdot \log_2(p_i))$ | Entropía información (0 = puro, máximo = $\log_2(n_{clases})$) |

**Gain Information**: $\text{Gain} = \text{Impurity}_{parent} - \sum \frac{n_{child}}{n_{parent}} \cdot \text{Impurity}_{child}$

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `dt.fit(X, y)` | `(List[List[NUM]], List[INT]) -> VOID` | Construye el árbol de decisión |
| `dt.predict(X)` | `(List[List[NUM]]) -> List[INT]` | Predice clases traversando el árbol |
| `dt.score(X, y)` | `(List[List[NUM]], List[INT]) -> FLOAT` | Calcula exactitud |

### Parámetros del Constructor

```kafe
-- criterion: "gini" (default) o "entropy"
-- max_depth: profundidad máxima (0 = ilimitada)
-- min_samples_split: mínimo de muestras para dividir (default: 2)
-- min_samples_leaf: mínimo de muestras en hoja (default: 1)
MACHINE model = machine.decision_tree_classifier("gini", 0, 2, 1);
```

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `dt.tree_` | `Dict` | Estructura del árbol (nodos internos y hojas) |
| `dt.classes_` | `List[INT]` | Clases únicas vistas durante fit |
| `dt.n_features_` | `INT` | Número de features |

### Ejemplo

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 3.0],
                        [6.0, 5.0], [7.0, 7.0], [8.0, 6.0]];
List[INT] y = [0, 0, 0, 1, 1, 1];

-- Modelo con Gini (default)
MACHINE model = machine.decision_tree_classifier();
model.fit(X, y);

List[INT] preds = model.predict([[1.0, 2.0], [7.0, 7.0], [4.0, 4.0]]);
show(preds);  -- [0, 1, 0]

FLOAT acc = model.score(X, y);
show(acc);  -- 1.0

-- Modelo con Entropy y profundidad limitada
MACHINE model2 = machine.decision_tree_classifier("entropy", 2);
model2.fit(X, y);
show(model2.predict([[1.0, 2.0], [7.0, 7.0]]));  -- [0, 1]
```

### Algoritmo Interno

1. **Selección de-split**: Para cada feature y threshold posible, calcula Information Gain
2. **Construcción recursiva**: Dividir datos según mejor split, repetir en subárboles
3. **Criterios de parada**: max_depth alcanzado, min_samples_split no satisfecho, nodo puro
4. **Predicción**: Traversar el árbol desde raíz hasta hoja

---

## DecisionTreeRegressor

Implementa un árbol de decisión para regresión — particiona recursivamente el espacio de features para predecir valores continuos minimizando el MSE.

### Fundamento Teórico

Un **árbol de decisión para regresión** particiona recursivamente el espacio de features aprendiendo reglas de decisión simples. En cada nodo interno, selecciona la feature y umbral que mejor reduce el error cuadrático medio (MSE).

**MSE (Mean Squared Error)**:

$$MSE = \frac{1}{n} \sum_{i=1}^{n} (y_i - \bar{y})^2$$

**Reducción de MSE**: Para cada split candidato:

$$\Delta MSE = MSE_{parent} - \left(\frac{n_l}{n} \cdot MSE_{left} + \frac{n_r}{n} \cdot MSE_{right}\right)$$

Se selecciona el split con mayor $\Delta MSE$. Las hojas predicen la media de los valores en el nodo.

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `dtr.fit(X, y)` | `(List[List[NUM]], List[NUM]) -> VOID` | Construye el árbol de regresión |
| `dtr.predict(X)` | `(List[List[NUM]]) -> List[NUM]` | Predice valores traversando el árbol |
| `dtr.score(X, y)` | `(List[List[NUM]], List[NUM]) -> FLOAT` | Calcula R² |

### Parámetros del Constructor

```kafe
-- criterion: "mse" (default)
-- max_depth: profundidad máxima (0 = ilimitada)
-- min_samples_split: mínimo de muestras para dividir (default: 2)
-- min_samples_leaf: mínimo de muestras en hoja (default: 1)
MACHINE model = machine.decision_tree_regressor("mse", 0, 2, 1);
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `criterion` | STRING | "mse" | Criterio de split: "mse" |
| `max_depth` | INT | 0 | Profundidad máxima (0 = ilimitada) |
| `min_samples_split` | INT | 2 | Mínimo de muestras para dividir un nodo |
| `min_samples_leaf` | INT | 1 | Mínimo de muestras en una hoja |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `dtr.tree_` | `Dict` | Estructura del árbol (nodos internos y hojas) |
| `dtr.n_features_` | `INT` | Número de features |

### Ejemplo

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

### Algoritmo Interno

1. **Selección de-split**: Para cada feature y threshold, calcula reducción de MSE
2. **Construcción recursiva**: Dividir datos según mejor split, repetir en subárboles
3. **Criterios de parada**: max_depth alcanzado, min_samples_split no satisfecho
4. **Predicción**: Traversar árbol hasta hoja, retornar media del nodo

### Comparación con DecisionTreeClassifier

| Aspecto | DecisionTreeClassifier | DecisionTreeRegressor |
|---------|------------------------|----------------------|
| Target | Clases (discretas) | Valores continuos |
| Criterio | Gini / Entropy | MSE |
| Predicción | Votación mayoritaria | Media del nodo |
| Métrica | Accuracy | R² |

---

## GaussianNB (Naive Bayes)

Implementa un clasificador Naive Bayes Gaussiano basado en el teorema de Bayes con la suposición de independencia condicional entre características.

### Fundamento Teórico

Naive Bayes clasifica calculando la probabilidad posterior de cada clase:

$$P(y|X) \propto P(y) \cdot \prod_{i=1}^{n} P(x_i|y)$$

Cada $P(x_i|y)$ se modela como una distribución Gaussiana:

$$P(x_i|y=c) = \frac{1}{\sqrt{2\pi\sigma_{c,i}^2}} \exp\left(-\frac{(x_i - \mu_{c,i})^2}{2\sigma_{c,i}^2}\right)$$

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `nb.fit(X, y)` | `(List[List[NUM]] o List[NUM], List[INT]) -> VOID` | Entrena el clasificador |
| `nb.predict(X)` | `(List[List[NUM]] o List[NUM]) -> List[INT]` | Predice clases |
| `nb.predict_proba(X)` | `(List[List[NUM]] o List[NUM]) -> List[List[FLOAT]]` | Probabilidades por clase |
| `nb.score(X, y)` | `(List[List[NUM]] o List[NUM], List[INT]) -> FLOAT` | Calcula exactitud |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `nb.classes_` | `List[INT]` | Clases únicas vistas durante fit |
| `nb.class_prior_` | `List[FLOAT]` | Probabilidad a priori de cada clase |
| `nb.theta_` | `List[List[FLOAT]]` | Media de cada feature por clase |
| `nb.var_` | `List[List[FLOAT]]` | Varianza de cada feature por clase |
| `nb.n_features_in_` | `INT` | Número de features |

### Ejemplo

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

### Algoritmo Interno

1. **Entrenamiento**: Calcula media, varianza y prior para cada clase
2. **Predicción**: Calcula log-posterior para cada clase usando Bayes
3. **Decisión**: Retorna la clase con mayor log-posterior

---

## RandomForestClassifier

Implementa un clasificador Random Forest — ensamble de árboles de decisión que combina bagging con selección aleatoria de características.

### Fundamento Teórico

Random Forest entrena múltiples árboles de decisión en muestras bootstrap con subconjuntos aleatorios de características, agregando predicciones por votación mayoritaria.

**Muestreo Bootstrap**: Cada árbol se entrena en una muestra aleatoria del dataset original con reemplazo (~63% de los datos).

**Selección Aleatoria**: En cada split, solo se consideran $\sqrt{d}$ características (donde $d$ es el total).

**Votación Mayoritaria**: La predicción final es la clase más votada por todos los árboles.

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `rf.fit(X, y)` | `(List[List[NUM]] o List[NUM], List[INT]) -> VOID` | Entrena el ensamble |
| `rf.predict(X)` | `(List[List[NUM]] o List[NUM]) -> List[INT]` | Predice por votación mayoritaria |
| `rf.score(X, y)` | `(List[List[NUM]] o List[NUM], List[INT]) -> FLOAT` | Calcula exactitud |

### Parámetros del Constructor

```kafe
-- n_estimators=10, max_depth=0 (ilimitada), min_samples_split=2, min_samples_leaf=1
MACHINE rf = machine.random_forest_classifier(10, 0, 2, 1);
```

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `rf.trees_` | `List[Dict]` | Lista de árboles entrenados |
| `rf.classes_` | `List[INT]` | Clases únicas vistas durante fit |
| `rf.n_features_` | `INT` | Número de features |

### Ejemplo

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

### Algoritmo Interno

1. **Bootstrap**: Para cada árbol, crear muestra con reemplazo
2. **Construcción**: Árbol con selección aleatoria de features en cada split
3. **Predicción**: Votación mayoritaria de todos los árboles

---

## RandomForestRegressor

Implementa un regresor Random Forest — ensamble de árboles de regresión que combina bagging con selección aleatoria de características.

### Fundamento Teórico

Random Forest Regressor entrena múltiples árboles de regresión en muestras bootstrap con subconjuntos aleatorios de características, agregando predicciones por promedio.

**Criterio de Split**: Reducción de varianza (variance reduction) — busca el split que más reduce la varianza del target en los hijos.

**Agregación**: Predicción final = promedio de predicciones de todos los árboles.

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `rf.fit(X, y)` | `(List[List[NUM]] o List[NUM], List[NUM]) -> VOID` | Entrena el ensamble |
| `rf.predict(X)` | `(List[List[NUM]] o List[NUM]) -> List[NUM]` | Predice por promedio |
| `rf.score(X, y)` | `(List[List[NUM]] o List[NUM], List[NUM]) -> FLOAT` | Calcula R² |

### Parámetros del Constructor

```kafe
-- n_estimators=10, max_depth=0 (ilimitada), min_samples_split=2, min_samples_leaf=1
MACHINE rf = machine.random_forest_regressor(10, 0, 2, 1);
```

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `rf.trees_` | `List[Dict]` | Lista de árboles entrenados |
| `rf.n_features_` | `INT` | Número de features |

### Ejemplo

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

### Algoritmo Interno

1. **Bootstrap**: Para cada árbol, crear muestra con reemplazo
2. **Construcción**: Árbol con selección aleatoria de features, splits por varianza
3. **Predicción**: Promedio de todos los árboles

---

## DBSCAN (Density-Based Spatial Clustering)

Implementa un algoritmo de clustering basado en densidad que agrupa puntos densamente empaquetados y marca los atípicos como ruido. A diferencia de KMeans, DBSCAN puede encontrar clusters de forma arbitraria y no requiere especificar el número de clusters.

### Fundamento Teórico

DBSCAN se basa en el concepto de **alcanzabilidad por densidad**:

| Concepto | Definición |
|----------|------------|
| **Punto central (Core Point)** | Un punto con al menos `min_samples` puntos dentro de la distancia `eps` (incluyéndose a sí mismo) |
| **Alcanzabilidad directa por densidad** | El punto `q` es directamente alcanzable desde `p` si `q` está dentro de distancia `eps` de `p` y `p` es un punto central |
| **Alcanzabilidad por densidad** | Existe una cadena `p1, ..., pn` donde cada uno es directamente alcanzable desde el anterior |
| **Conectividad por densidad** | Dos puntos están densamente conectados si existe un punto `o` desde el cual ambos son alcanzables por densidad |

**Cluster**: Un conjunto maximal de puntos densamente conectados.

**Ruido**: Puntos que no pertenecen a ningún cluster (etiqueta `-1`).

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `db.fit(X)` | `(List[List[NUM]]) -> VOID` | Realiza el clustering DBSCAN |
| `db.fit_predict(X)` | `(List[List[NUM]]) -> List[INT]` | Ajusta y devuelve etiquetas de cluster |
| `db.labels()` | `() -> List[INT]` | Devuelve etiquetas de cluster después de fit |
| `db.n_clusters()` | `() -> INT` | Devuelve número de clusters encontrados |
| `db.core_sample_indices()` | `() -> List[INT]` | Devuelve índices de puntos centrales |

### Parámetros del Constructor

```kafe
-- eps: distancia máxima entre puntos para ser vecinos (default: 0.5)
-- min_samples: mínimo de puntos para formar región densa (default: 5)
MACHINE db = machine.dbscan(1.0, 2);
```

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `db.labels_` | `List[INT]` | Etiquetas de cluster (-1 = ruido) |
| `db.n_clusters_` | `INT` | Número de clusters encontrados |
| `db.core_sample_indices_` | `List[INT]` | Índices de puntos centrales |

### Ejemplo

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 1.0], [1.5, 1.5], [2.0, 2.0],
                        [8.0, 8.0], [8.5, 8.5], [9.0, 9.0],
                        [50.0, 50.0]];

MACHINE db = machine.dbscan(1.0, 2);
db.fit(X);

show(db.labels());       -- [1, 1, 1, 2, 2, 2, -1]
show(db.n_clusters());   -- 2

-- Usando fit_predict
List[INT] labels = db.fit_predict(X);
show(labels);            -- [1, 1, 1, 2, 2, 2, -1]
```

### Algoritmo Interno

1. **Consultar región**: Para cada punto, encontrar todos los puntos dentro de distancia `eps`
2. **Identificar puntos centrales**: Puntos con al menos `min_samples` vecinos
3. **Expandir clusters**: Desde cada punto central no visitado, expandir el cluster conectando puntos densamente alcanzables
4. **Marcar ruido**: Puntos que no son centrales y no son alcanzables desde ningún punto central

### Complejidad

- **Tiempo**: $O(n^2)$ en el peor caso (consultas de región para todos los puntos)
- **Espacio**: $O(n)$ para almacenar etiquetas y vecinos

### Ventajas

- No requiere especificar el número de clusters
- Encuentra clusters de forma arbitraria
- Identifica ruido (outliers)
- No asume distribución esférica de los datos

### Limitaciones

- Difícil manejo de clusters con densidades variables
- Sensible a la elección de `eps` y `min_samples`
- Complejidad cuadrática en el peor caso

---

## AgglomerativeClustering

Implementa clustering jerárquico aglomerativo (bottom-up) que inicia cada punto como un cluster separado y merge los más cercanos iterativamente hasta alcanzar el número deseado de clusters.

### Fundamento Teórico

El algoritmo ejecuta $n - k$ merges sucesivos:

1. Iniciar: cada punto es un cluster (n clusters)
2. Calcular matriz de distancias entre todos los pares de clusters
3. Encontrar los dos clusters más cercanos según el criterio de enlace
4. Merge esos dos clusters
5. Repetir hasta tener $k$ clusters

**Criterios de enlace**:

| Criterio | Fórmula | Descripción |
|----------|---------|-------------|
| `single` | $\min_{x \in C_i, y \in C_j} \|\|x - y\|\|$ | Distancia mínima entre puntos |
| `complete` | $\max_{x \in C_i, y \in C_j} \|\|x - y\|\|$ | Distancia máxima entre puntos |
| `average` | $\frac{1}{\|C_i\|\|C_j\|} \sum_{x \in C_i} \sum_{y \in C_j} \|\|x - y\|\|$ | Distancia promedio |
| `ward` | $\frac{\|C_i\|\|C_j\|}{\|C_i\| + \|C_j\|} \|\|\mu_i - \mu_j\|\|^2$ | Minimiza varianza intra-cluster |

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `ac.fit(X)` | `(List[List[NUM]]) -> VOID` | Realiza el clustering aglomerativo |
| `ac.fit_predict(X)` | `(List[List[NUM]]) -> List[INT]` | Ajusta y devuelve etiquetas de cluster |

### Parámetros del Constructor

```kafe
-- n_clusters=2, linkage="ward" (valores por defecto)
MACHINE ac = machine.agglomerative_clustering(2, "ward");
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `n_clusters` | INT | 2 | Número de clusters deseado |
| `linkage` | STRING | "ward" | Criterio de enlace: "single", "complete", "average", "ward" |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `ac.labels_` | `List[INT]` | Etiquetas de cluster para cada punto |
| `ac.n_clusters_` | `INT` | Número de clusters encontrados |
| `ac.children_` | `List[List[INT]]` | Historial de merges (par de clusters mergeados) |
| `ac.distances_` | `List[FLOAT]` | Distancia de cada merge |

### Ejemplo

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 1.0], [1.5, 1.5], [2.0, 2.0],
                        [8.0, 8.0], [8.5, 8.5], [9.0, 9.0]];

MACHINE ac = machine.agglomerative_clustering(2, "ward");
ac.fit(X);

show(ac.labels_);       -- [0, 0, 0, 1, 1, 1]
show(ac.n_clusters_);   -- 2
show(ac.distances_);    -- Distancias de cada merge

-- Usando fit_predict
List[INT] labels = ac.fit_predict(X);
show(labels);           -- [0, 0, 0, 1, 1, 1]
```

### Comparación con DBSCAN

| Aspecto | AgglomerativeClustering | DBSCAN |
|---------|------------------------|--------|
| Tipo | Jerárquico | Basado en densidad |
| n_clusters requerido | Sí | No |
| Forma de clusters | Flexible (depende de linkage) | Arbitraria |
| Ruido | No detecta | Sí (etiqueta -1) |
| Escalabilidad | $O(n^3)$ | $O(n^2)$ |
| Determinístico | Sí | Sí |

---

## GaussianMixture (Mezcla de Gaussianas)

Implementa un modelo de mezcla de Gaussianas (GMM) — modelo probabilístico que asume que los datos son generados por una mezcla de distribuciones Gaussianas. Usa el algoritmo EM (Expectation-Maximization) para estimar los parámetros.

### Fundamento Teórico

El modelo asume que cada punto fue generado por una de $K$ distribuciones Gaussianas:

$$P(\mathbf{x}) = \sum_{k=1}^{K} \pi_k \cdot \mathcal{N}(\mathbf{x} | \boldsymbol{\mu}_k, \boldsymbol{\Sigma}_k)$$

Donde $\pi_k$ es el peso de la componente k, $\boldsymbol{\mu}_k$ es la media, y $\boldsymbol{\Sigma}_k$ es la covarianza.

**Algoritmo EM**:

1. **E-step**: Calcular responsabilidades $\gamma(z_{kn})$ — probabilidad de que el punto $n$ pertenezca al componente $k$
2. **M-step**: Actualizar parámetros usando las responsabilidades
3. Repetir hasta convergencia

**Selección de K**: Usar AIC ($2p - 2\ln(\hat{L})$) o BIC ($p\ln(n) - 2\ln(\hat{L})$) — menor es mejor.

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `gm.fit(X)` | `(List[List[NUM]]) -> VOID` | Ajusta el modelo usando EM |
| `gm.predict(X)` | `(List[List[NUM]]) -> List[INT]` | Asigna cada punto al componente más probable |
| `gm.predict_proba(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Devuelve responsabilidades (probabilidades de pertenencia) |
| `gm.fit_predict(X)` | `(List[List[NUM]]) -> List[INT]` | Ajusta el modelo y devuelve etiquetas |
| `gm.score(X)` | `(List[List[NUM]]) -> FLOAT` | Retorna log-verosimilitud negativa (menor es mejor) |
| `gm.aic(X)` | `(List[List[NUM]]) -> FLOAT` | Criterio de Información de Akaike |
| `gm.bic(X)` | `(List[List[NUM]]) -> FLOAT` | Criterio de Información Bayesiano |

### Parámetros del Constructor

```kafe
-- n_components=3, max_iter=100, tol=1e-3, random_state=0 (valores por defecto)
MACHINE gm = machine.gaussian_mixture(3, 100, 1e-3, 0);
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `n_components` | INT | 3 | Número de componentes Gaussianas |
| `max_iter` | INT | 100 | Máximo de iteraciones EM |
| `tol` | FLOAT | 1e-3 | Tolerancia para convergencia |
| `random_state` | INT | 0 | Semilla para reproducibilidad (0 = aleatorio) |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `gm.weights_` | `List[FLOAT]` | Pesos de cada componente ($\pi_k$) |
| `gm.means_` | `List[List[FLOAT]]` | Medias de cada componente ($\boldsymbol{\mu}_k$) |
| `gm.covariances_` | `List[List[FLOAT]]` | Varianzas diagonales de cada componente ($\boldsymbol{\Sigma}_k$) |
| `gm.converged_` | `BOOL` | Si el modelo convergió |
| `gm.n_iter_` | `INT` | Número de iteraciones realizadas |

### Ejemplo

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 1.0], [1.5, 1.5], [2.0, 2.0],
                        [8.0, 8.0], [8.5, 8.5], [9.0, 9.0]];

MACHINE gm = machine.gaussian_mixture(2, 100, 1e-3, 42);
gm.fit(X);

show(gm.labels_);           -- [0, 0, 0, 1, 1, 1]
show(gm.means_);            -- Medias de cada componente
show(gm.weights_);          -- Pesos de cada componente

-- Probabilidades de pertenencia
List[List[FLOAT]] probs = gm.predict_proba(X);
show(probs);

-- Selección de número de componentes
FLOAT aic = gm.aic(X);
FLOAT bic = gm.bic(X);
show(aic);
show(bic);
```

### Comparación con K-Means

| Aspecto | K-Means | GaussianMixture |
|---------|---------|-----------------|
| Tipo | Hard clustering | Soft clustering |
| Forma de clusters | Esféricos | Elípticos |
| Modelo | Distancia a centroides | Probabilístico |
| Salida | Etiquetas | Probabilidades |
| Complejidad | $O(T \cdot n \cdot K \cdot d)$ | $O(T \cdot n \cdot K \cdot d)$ |

### Complejidad

- **Tiempo**: $O(T \cdot n \cdot K \cdot d)$ por iteración EM
- **Espacio**: $O(n \cdot K)$ para responsabilidades

### Ventajas

- Soft clustering: probabilidades de pertenencia, no solo asignaciones
- Puede capturar clusters elípticos (no solo esféricos como K-Means)
- Modelo generativo: puede generar nuevos puntos
- AIC/BIC para selección automática del número de componentes

### Limitaciones

- Sensible a inicialización — puede converger a óptimos locales
- Asume Gaussianas — datos no Gaussianos degradan rendimiento
- Sensible a outliers — afectan las medias

---

## AdaBoostClassifier (Adaptive Boosting)

Implementa un clasificador AdaBoost — algoritmo de ensemble learning que combina múltiples weak classifiers (decision stumps) de forma secuencial, enfatizando los errores del clasificador anterior.

### Fundamento Teórico

AdaBoost entrena $T$ weak classifiers secuencialmente. En cada iteración:
1. Asigna pesos a las muestras (inicialmente uniformes)
2. Entrena un decision stump con esos pesos
3. Calcula el peso del stump ($\alpha_t$) según su error
4. Actualiza los pesos de las muestras: incrementa los pesos de los errores

**Predicción final**: Votación ponderada de todos los weak classifiers.

$$H(x) = \text{sign}\left(\sum_{t=1}^{T} \alpha_t \cdot h_t(x)\right)$$

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `ab.fit(X, y)` | `(List[List[NUM]], List[INT]) -> VOID` | Entrena el ensamble de weak classifiers |
| `ab.predict(X)` | `(List[List[NUM]]) -> List[INT]` | Predice por votación ponderada |
| `ab.score(X, y)` | `(List[List[NUM]], List[INT]) -> FLOAT` | Calcula exactitud |

### Parámetros del Constructor

```kafe
-- n_estimators=50, learning_rate=1.0 (valores por defecto)
MACHINE ab = machine.ada_boost_classifier(50, 1.0);
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `n_estimators` | INT | 50 | Número de weak classifiers (decision stumps) |
| `learning_rate` | FLOAT | 1.0 | Factor de escala para la contribución de cada stump |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `ab.estimators_` | `List[Dict]` | Lista de weak classifiers entrenados |
| `ab.estimator_weights_` | `List[FLOAT]` | Peso $\alpha_t$ de cada weak classifier |
| `ab.estimator_errors_` | `List[FLOAT]` | Error de cada weak classifier |
| `ab.classes_` | `List[INT]` | Clases únicas |

### Ejemplo

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

### Algoritmo Interno

1. **Inicialización**: Pesos uniformes $w_i = 1/n$
2. **Por cada iteración**:
   - Entrenar decision stump con pesos actuales
   - Calcular error ponderado $\epsilon_t$
   - Calcular peso del stump $\alpha_t = 0.5 \cdot \ln((1 - \epsilon_t) / \epsilon_t)$
   - Actualizar pesos de muestras
3. **Predicción**: Votación ponderada de todos los stumps

### Comparación con RandomForestClassifier

| Aspecto | AdaBoostClassifier | RandomForestClassifier |
|---------|-------------------|----------------------|
| Tipo de ensemble | Boosting (secuencial) | Bagging (paralelo) |
| Weak learner | Decision stump (profundidad 1) | Árbol completo (profundidad variable) |
| Ponderación | Pondera weak learners por rendimiento | Votación igualitaria |
| Paralelización | No (secuencial) | Sí (independientes) |
| Overfitting | Controlado por learning_rate | Controlado por max_depth |

---

## GradientBoostingClassifier

Implementa un clasificador Gradient Boosting — ensemble de árboles de decisión construidos secuencialmente, donde cada árbol corrige los errores del anterior usando gradient descent sobre la función de pérdida log-loss.

### Fundamento Teórico

Gradient Boosting construye $T$ árboles secuencialmente. En cada iteración:
1. Calcula los pseudo-residuos (gradiente negativo de la pérdida log-loss)
2. Entrena un árbol de regresión para predecir esos residuos
3. Actualiza el modelo sumando la predicción del árbol ponderada por learning_rate

**Función de Pérdida** (log-loss / deviance):

$$\mathcal{L}(y, F) = -y \cdot \log(p) - (1-y) \cdot \log(1-p)$$

**Predicción final**: Aplicar sigmoide a la suma de predicciones:

$$H(x) = \sigma(F_T(x)) = \sigma\left(F_0(x) + \eta \sum_{t=1}^{T} h_t(x)\right)$$

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `gbc.fit(X, y)` | `(List[List[NUM]], List[INT]) -> VOID` | Entrena el ensamble de árboles |
| `gbc.predict(X)` | `(List[List[NUM]]) -> List[INT]` | Predice clases (0 o 1) |
| `gbc.score(X, y)` | `(List[List[NUM]], List[INT]) -> FLOAT` | Calcula exactitud |

### Parámetros del Constructor

```kafe
-- n_estimators=100, learning_rate=0.1, max_depth=3 (valores por defecto)
MACHINE gbc = machine.gradient_boosting_classifier(100, 0.1, 3);
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `n_estimators` | INT | 100 | Número de árboles en el ensamble |
| `learning_rate` | FLOAT | 0.1 | Tasa de aprendizaje (shrinkage) |
| `max_depth` | INT | 3 | Profundidad máxima de cada árbol |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `gbc.estimators_` | `List[Dict]` | Lista de árboles entrenados |
| `gbc.initial_prediction_` | `FLOAT` | Predicción inicial (log-odds) |
| `gbc.classes_` | `List[INT]` | Clases únicas |

### Ejemplo

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

### Algoritmo Interno

1. **Inicialización**: $F_0 = 0.5 \cdot \ln((1-p)/p)$
2. **Por cada iteración**:
   - Calcular probabilidades con sigmoide
   - Calcular pseudo-residuos: $r_i = y_i - p_i$
   - Entrenar árbol de regresión sobre residuos
   - Actualizar: $F_t = F_{t-1} + \eta \cdot h_t$
3. **Predicción**: Clase = sigmoide($F_T$) >= 0.5

### Comparación con RandomForestClassifier

| Aspecto | GradientBoostingClassifier | RandomForestClassifier |
|---------|---------------------------|----------------------|
| Tipo de ensemble | Boosting (secuencial) | Bagging (paralelo) |
| Weak learner | Árbol profundo (residuos) | Árbol (bootstrap) |
| Dirección | Corrige errores previos | Independientes |
| Paralelización | No (secuencial) | Sí (independientes) |
| Overfitting | Más susceptible | Menos susceptible |

### Comparación con AdaBoostClassifier

| Aspecto | GradientBoostingClassifier | AdaBoostClassifier |
|---------|---------------------------|-------------------|
| Optimización | Gradient descent sobre pérdida | Ponderación de muestras |
| Weak learner | Árbol de regresión (profundidad variable) | Decision stump (profundidad 1) |
| Pérdida | Log-loss (cualquier función diferenciable) | Exponencial |
| Flexibilidad | Más flexible (cualquier pérdida) | Menos flexible |

---

## GradientBoostingRegressor

Implementa un regresor Gradient Boosting — ensemble de árboles de regresión construidos secuencialmente, donde cada árbol corrige los errores del anterior usando gradient descent sobre el error cuadrático medio.

### Fundamento Teórico

Gradient Boosting Regressor construye $T$ árboles secuencialmente para minimizar MSE:

1. **Inicializar**: $F_0(x) = \bar{y}$
2. **En cada iteración**:
   - Calcular residuos: $r_i = y_i - F_{t-1}(x_i)$
   - Entrenar árbol $h_t$ para predecir residuos
   - Actualizar: $F_t = F_{t-1} + \eta \cdot h_t$

**Función de Pérdida** (MSE):

$$\mathcal{L}(y, F) = \frac{1}{2}(y - F)^2$$

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `gbr.fit(X, y)` | `(List[List[NUM]], List[NUM]) -> VOID` | Entrena el ensamble de árboles |
| `gbr.predict(X)` | `(List[List[NUM]]) -> List[NUM]` | Predice valores |
| `gbr.score(X, y)` | `(List[List[NUM]], List[NUM]) -> FLOAT` | Calcula R² |

### Parámetros del Constructor

```kafe
-- n_estimators=100, learning_rate=0.1, max_depth=3 (valores por defecto)
MACHINE gbr = machine.gradient_boosting_regressor(100, 0.1, 3);
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `n_estimators` | INT | 100 | Número de árboles en el ensamble |
| `learning_rate` | FLOAT | 0.1 | Tasa de aprendizaje (shrinkage) |
| `max_depth` | INT | 3 | Profundidad máxima de cada árbol |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `gbr.estimators_` | `List[Dict]` | Lista de árboles entrenados |
| `gbr.initial_prediction_` | `FLOAT` | Predicción inicial (media de y) |

### Ejemplo

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

### Algoritmo Interno

1. **Inicialización**: $F_0 = \bar{y}$
2. **Por cada iteración**:
   - Calcular residuos: $r_i = y_i - F_{t-1}(x_i)$
   - Entrenar árbol de regresión sobre residuos
   - Actualizar: $F_t = F_{t-1} + \eta \cdot h_t$
3. **Predicción**: $H(x) = F_T(x)$

### Comparación con RandomForestRegressor

| Aspecto | GradientBoostingRegressor | RandomForestRegressor |
|---------|--------------------------|----------------------|
| Tipo de ensemble | Boosting (secuencial) | Bagging (paralelo) |
| Optimización | Gradiente descendente | Promedio de árboles |
| Overfitting | Más susceptible | Menos susceptible |
| Velocidad entrenamiento | Más lento | Más rápido (paralelizable) |

---

## StandardScaler

Estandariza características eliminando la media y escalando a varianza unitaria (Z-score): $z = (x - \mu) / \sigma$.

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `ss.fit(X)` | `(List[List[NUM]]) -> VOID` | Calcula media y desviación estándar |
| `ss.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Estandariza los datos |
| `ss.fit_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Fit + transform |
| `ss.inverse_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Revierte la estandarización |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `ss.mean_` | `List[FLOAT]` | Media de cada feature |
| `ss.scale_` | `List[FLOAT]` | Desviación estándar de cada feature |

### Ejemplo

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

Escala características a un rango fijo (por defecto [0, 1]): $X_{norm} = (X - X_{min}) / (X_{max} - X_{min})$.

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `mms.fit(X)` | `(List[List[NUM]]) -> VOID` | Calcula mínimo y máximo |
| `mms.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Escala los datos |
| `mms.fit_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Fit + transform |
| `mms.inverse_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Revierte el escalado |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `mms.data_min_` | `List[FLOAT]` | Mínimo de cada feature |
| `mms.data_max_` | `List[FLOAT]` | Máximo de cada feature |
| `mms.scale_` | `List[FLOAT]` | Escala de cada feature (1 / rango) |

### Ejemplo

```kafe
import machine;

List[List[FLOAT]] data = [[1.0, 10.0], [3.0, 20.0], [5.0, 30.0]];

MACHINE mms = machine.minmax_scaler();
List[List[FLOAT]] scaled = mms.fit_transform(data);
show(scaled);  -- [[0.0, 0.0], [0.5, 0.5], [1.0, 1.0]]
```

---

## RobustScaler

Escala características usando estadísticos robustos a outliers: mediana (Q2) para centrar, IQR (Q3 − Q1) para escalar.

### Fundamento Teórico

A diferencia de StandardScaler (usa media y desviación estándar) o MinMaxScaler (usa min y max), RobustScaler usa estadísticos que no se afectan por valores extremos:

$$X_{scaled} = \frac{X - \text{median}}{IQR}$$

Donde $\text{median} = Q2$ (percentil 50) e $IQR = Q3 - Q1$ (percentil 75 − percentil 25).

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `rs.fit(X)` | `(List[List[NUM]]) -> VOID` | Calcula mediana e IQR por feature |
| `rs.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Escala los datos |
| `rs.fit_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Fit + transform |
| `rs.inverse_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Revierte el escalado |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `rs.center_` | `List[FLOAT]` | Mediana de cada feature |
| `rs.scale_` | `List[FLOAT]` | IQR de cada feature |

### Parámetros del Constructor

```kafe
-- with_centering=1 (centra usando mediana), with_scaling=1 (escala usando IQR)
-- quantile_low=25.0, quantile_high=75.0
MACHINE rs = machine.robust_scaler();
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `with_centering` | INT | 1 | Si 1, centra usando mediana (0 = no centra) |
| `with_scaling` | INT | 1 | Si 1, escala usando IQR (0 = no escala) |
| `quantile_low` | FLOAT | 25.0 | Percentil inferior para IQR |
| `quantile_high` | FLOAT | 75.0 | Percentil superior para IQR |

### Ejemplo

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

### Comparación con otros Scalers

| Scaler | Centro | Escala | Robusto a outliers |
|--------|--------|--------|-------------------:|
| StandardScaler | Media | Desviación estándar | No |
| MinMaxScaler | Min | Max − Min | No |
| **RobustScaler** | **Mediana** | **IQR** | **Sí** |

### Cuándo Usar

- **Outliers presentes** — principal caso de uso
- Datos con distribución asimétrica
- Cuando media/desviación estándar no son representativas

---

## SimpleImputer

Imputa valores faltantes (representados como NaN en DataFrames) usando una estrategia configurable.

### Estrategias

| Estrategia | Descripción |
|------------|-------------|
| `"mean"` | Rellena con la media de cada columna |
| `"median"` | Rellena con la mediana de cada columna |
| `"most_frequent"` | Rellena con la moda de cada columna |
| `"constant"` | Rellena con un valor constante (usar `simple_imputer_constant(v)`) |

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `imp.fit(X)` | `(PARDOS) -> VOID` | Calcula estadísticas por columna. Lanza error si toda una columna es NaN (excepto con estrategia `"constant"`) |
| `imp.transform(X)` | `(PARDOS) -> PARDOS` | Imputa valores faltantes |
| `imp.fit_transform(X)` | `(PARDOS) -> PARDOS` | Fit + transform |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `imp.statistics_` | `List[FLOAT]` | Estadísticas calculadas por columna |

### Ejemplo

```kafe
import pardos;
import machine;

PARDOS df = pardos.read_csv("datos.csv");
-- df contiene: [[2.0, 6.0, 5.0], [4.0, nan, 5.0], [6.0, 12.0, nan], [4.0, 6.0, 5.0]]

MACHINE imp = machine.simple_imputer("mean");
PARDOS imputed = imp.fit_transform(df);
show(imputed);
-- [[2.0, 6.0, 5.0], [4.0, 8.0, 5.0], [6.0, 12.0, 5.0], [4.0, 6.0, 5.0]]

-- Estrategia constante
MACHINE imp_c = machine.simple_imputer_constant(0.0);
PARDOS imputed_c = imp_c.fit_transform(df);
```

---

## LabelEncoder

Codifica etiquetas de texto a valores enteros ordinales.

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `le.fit(labels)` | `(List[ANY]) -> MACHINE` | Aprende las clases únicas (ordenadas) |
| `le.transform(labels)` | `(List[ANY]) -> List[INT]` | Convierte etiquetas a enteros |
| `le.fit_transform(labels)` | `(List[ANY]) -> List[INT]` | Fit + transform en un paso |
| `le.inverse_transform(encoded)` | `(List[INT]) -> List[STR]` | Convierte enteros de vuelta a etiquetas |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `le.classes_` | `List[STR]` | Lista ordenada de clases únicas |

### Ejemplo

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

Codifica columnas categóricas de un DataFrame a representación binaria (one-hot).

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `ohe.fit(df, columns)` | `(PARDOS, List[STR]) -> MACHINE` | Aprende categorías de columnas específicas |
| `ohe.transform(df)` | `(PARDOS) -> PARDOS` | Transforma DataFrame a one-hot |
| `ohe.fit_transform(df, columns)` | `(PARDOS, List[STR]) -> PARDOS` | Fit + transform |

### Ejemplo

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

-- One-Hot Encoding de una columna
MACHINE ohe = machine.one_hot_encoder();
PARDOS encoded = ohe.fit_transform(df, ["color"]);
show(encoded);
-- Columnas: size, color_blue, color_green, color_red
-- Filas: [[S,0,0,1], [M,1,0,0], [L,0,1,0], [M,0,0,1]]

-- Múltiples columnas
MACHINE ohe2 = machine.one_hot_encoder();
PARDOS encoded2 = ohe2.fit_transform(df, ["color", "size"]);
show(encoded2);
```

---

## OrdinalEncoder

Codifica columnas categóricas de un DataFrame a valores enteros ordinales según orden alfabético de las categorías.

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `oe.fit(df, columns)` | `(PARDOS, List[STR]) -> MACHINE` | Aprende las categorías únicas ordenadas de las columnas especificadas |
| `oe.transform(df)` | `(PARDOS) -> PARDOS` | Transforma las columnas categóricas a valores ordinales enteros |
| `oe.fit_transform(df, columns)` | `(PARDOS, List[STR]) -> PARDOS` | Fit + transform en un paso |
| `oe.inverse_transform(df)` | `(PARDOS) -> PARDOS` | Convierte valores ordinales de vuelta a categorías originales |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `oe.categories_` | `Dict` | Diccionario de columnas a listas de categorías ordenadas |
| `oe.columns_` | `List[STR]` | Nombres de las columnas codificadas |

### Ejemplo

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

-- Ordinal Encoding de una columna
MACHINE oe = machine.ordinal_encoder();
PARDOS encoded = oe.fit_transform(df, ["color"]);
show(encoded);
-- Columnas: color, size
-- Filas: [[2, S], [0, M], [1, L], [2, M]]
-- Categorías ordenadas alfabéticamente: blue=0, green=1, red=2

-- Múltiples columnas
MACHINE oe2 = machine.ordinal_encoder();
PARDOS encoded2 = oe2.fit_transform(df, ["color", "size"]);

-- Revertir la codificación
PARDOS decoded = oe2.inverse_transform(encoded2);
show(decoded);
```

---

## PCA (Análisis de Componentes Principales)

Reduce la dimensionalidad de los datos encontrando las direcciones de mayor varianza mediante el algoritmo de Jacobi.

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `pca.fit(X)` | `(PARDOS o List[List[NUM]]) -> VOID` | Ajusta el modelo a los datos |
| `pca.transform(X)` | `(PARDOS o List[List[NUM]]) -> PARDOS` | Transforma datos a componentes principales |
| `pca.round(n)` | `(INT) -> VOID` | Redondea valores internos a n decimales |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `pca.components_` | `List[List[FLOAT]]` | Vectores propios (componentes) |
| `pca.mean_` | `List[FLOAT]` | Media de cada feature |
| `pca.explained_variance_` | `List[FLOAT]` | Varianza explicada por cada componente |

### Ejemplo

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

-- Reducir de 3D a 2D
MACHINE pca_model = machine.pca(2);
pca_model.fit(df);
pca_model.round(4);

show(pca_model.mean_);
show(pca_model.explained_variance_);

PARDOS reduced = pca_model.transform(df);
show(reduced.round(4));
```

### Algoritmo Interno

PCA utiliza el **algoritmo de Jacobi** para calcular valores y vectores propios:

1. **Centrado de media**: Restar la media de cada feature
2. **Matriz de covarianza**: $C = (X^T \cdot X) / (n - 1)$
3. **Jacobi**: Iteraciones para diagonalizar la matriz de covarianza
4. **Ordenamiento**: Componentes ordenados por varianza explicada (mayor a menor)

---

## LinearDiscriminantAnalysis (Análisis Discriminante Lineal)

Implementa LDA — técnica de reducción de dimensionalidad supervisada que maximiza la separación entre clases, y también funciona como clasificador lineal.

### Fundamento Teórico

LDA maximiza la razón entre varianza inter-clase e intra-clase:

$$J(w) = \frac{w^T S_B w}{w^T S_W w}$$

Donde:
- $S_W = \sum_{k=1}^{K} \sum_{x \in C_k} (x - \mu_k)(x - \mu_k)^T$ — scatter intra-clase
- $S_B = \sum_{k=1}^{K} n_k (\mu_k - \mu)(\mu_k - \mu)^T$ — scatter inter-clase

**Solución**: Resolver eigenproblema $S_W^{-1} S_B w = \lambda w$. Los eigenvectores con mayor eigenvalores son las direcciones óptimas.

**Restricción**: $n\_components \leq K - 1$ (máximo clases - 1 componentes).

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `lda.fit(X, y)` | `(List[List[NUM]], List[INT]) -> VOID` | Ajusta LDA calculando scatter matrices y eigenvectores |
| `lda.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Proyecta datos al espacio de menor dimensionalidad |
| `lda.fit_transform(X, y)` | `(List[List[NUM]], List[INT]) -> List[List[FLOAT]]` | Fit + transform en un paso |
| `lda.predict(X)` | `(List[List[NUM]]) -> List[INT]` | Predice clases por distancia en espacio proyectado |
| `lda.score(X, y)` | `(List[List[NUM]], List[INT]) -> FLOAT` | Calcula exactitud (default) o métrica personalizada |

### Parámetros del Constructor

```kafe
-- n_components: número de componentes (default: None = min(n_classes-1, n_features))
MACHINE lda = machine.linear_discriminant_analysis(2);
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `n_components` | INT | None | Número de componentes (máx: n_classes - 1) |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `lda.scalings_` | `List[List[FLOAT]]` | Eigenvectores (direcciones de proyección) |
| `lda.explained_variance_ratio_` | `List[FLOAT]` | Proporción de varianza explicada por componente |
| `lda.means_` | `List[List[FLOAT]]` | Media de cada feature por clase |
| `lda.classes_` | `List[INT]` | Clases únicas |
| `lda.prior_` | `List[FLOAT]` | Probabilidad a priori de cada clase |

### Ejemplo

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 3.0],
                        [6.0, 5.0], [7.0, 7.0], [8.0, 6.0]];
List[INT] y = [0, 0, 0, 1, 1, 1];

-- Reducir de 2D a 1D
MACHINE lda = machine.linear_discriminant_analysis(1);
lda.fit(X, y);

-- Transformar al espacio proyectado
List[List[FLOAT]] X_proj = lda.transform(X);
show(X_proj);

-- Clasificar
List[INT] preds = lda.predict([[2.0, 2.0], [7.0, 7.0]]);
show(preds);  -- [0, 1]

-- Evaluar
FLOAT acc = lda.score(X, y);
show(acc);  -- 1.0
```

### Comparación con PCA

| Aspecto | PCA | LDA |
|---------|-----|-----|
| Objetivo | Maximizar varianza total | Maximizar separación entre clases |
| Supervisión | No supervisado | Supervisado |
| Información | Solo X | X y y |
| Direcciones | Componentes de mayor varianza | Direcciones de mayor discriminación |
| n_components | ≤ d (features) | ≤ K - 1 (clases - 1) |
| Uso principal | Visualización, reducción de ruido | Clasificación, reducción supervisada |

### Algoritmo Interno

1. **Calcular medias por clase**: Media de cada feature para cada clase
2. **Scatter intra-clase ($S_W$)**: Suma de productos externos $(x - \mu_k)(x - \mu_k)^T$
3. **Scatter inter-clase ($S_B$)**: Suma ponderada de productos externos de medias
4. **Invertir $S_W$**: Gauss-Jordan con pivoteo parcial
5. **Producto $M = S_W^{-1} S_B$**: Matriz combinada
6. **Jacobi**: Diagonalizar $M$ simetrizado para obtener eigenvalores/vectores
7. **Ordenar**: Seleccionar eigenvectores con mayor eigenvalores
8. **Proyectar**: $Y = X \cdot W$

### Cuándo Usar

- Clasificación con clases linealmente separables
- Reducción de dimensionalidad supervisada (pre-processing)
- Datos con distribuciones Gaussianas por clase
- Cuando se necesita interpretabilidad de las direcciones

### Cuándo NO Usar

- Relaciones no-lineales (usar Kernel LDA)
- Clases con covarianzas muy diferentes (usar QDA)
- Datos categóricos sin transformación

---

## PolynomialFeatures

Genera features polinomiales hasta un grado especificado, permitiendo que modelos lineales capturen relaciones no lineales.

### Fundamento Teórico

Para $d$ features y grado $n$, genera todas las combinaciones de potencias $p_1 + p_2 + \cdots + p_d \leq n$:

$$[x_1, x_2] \xrightarrow{\text{degree}=2} [1, x_1, x_2, x_1^2, x_1 x_2, x_2^2]$$

Número de features de salida (con bias): $\binom{d+n}{n} = \frac{(d+n)!}{d! \cdot n!}$

**Ejemplo** con degree=2 y 2 features:

| Feature | Potencias | Valor |
|---------|-----------|-------|
| 1 (bias) | $(0,0)$ | $1$ |
| x0 | $(1,0)$ | $x_1$ |
| x1 | $(0,1)$ | $x_2$ |
| x0² | $(2,0)$ | $x_1^2$ |
| x0*x1 | $(1,1)$ | $x_1 \cdot x_2$ |
| x1² | $(0,2)$ | $x_2^2$ |

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `pf.fit(data)` | `(List[List[NUM]] o PARDOS) -> MACHINE` | Ajusta PolynomialFeatures (calcula dimensiones) |
| `pf.transform(data)` | `(List[List[NUM]] o PARDOS) -> List[List[FLOAT]]` | Transforma features a polinomiales |
| `pf.fit_transform(data)` | `(List[List[NUM]] o PARDOS) -> List[List[FLOAT]]` | Fit + transform |

### Parámetros del Constructor

```kafe
-- degree=2, include_bias=true (valores por defecto)
MACHINE pf = machine.polynomial_features(2, true);
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `degree` | INT | 2 | Grado máximo del polinomio |
| `include_bias` | BOOL | true | Si se incluye columna de sesgo (1s) |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `pf.n_features_in_` | `INT` | Número de features de entrada |
| `pf.n_features_out_` | `INT` | Número de features de salida |

### Ejemplo

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]];

MACHINE pf = machine.polynomial_features(2, true);
List[List[FLOAT]] X_poly = pf.fit_transform(X);

show(pf.n_features_in_);   -- 2
show(pf.n_features_out_);  -- 6 (1 bias + 2 originales + 3 polinomiales)

-- Combinar con regresión lineal para capturar no linealidad
MACHINE lr = machine.linear_regression();
lr.fit(X_poly, y);
```

### Comparación con Modelo Lineal Simple

| Aspecto | Linear Regression | PolynomialFeatures + Linear Regression |
|---------|-------------------|----------------------------------------|
| Relaciones capturadas | Solo lineales | Lineales + polinomiales |
| Número de features | $d$ | $\binom{d+n}{n}$ |
| Overfitting | Bajo | Posible si degree es alto |
| Escalado requerido | Opcional | Recomendado |

### Limitaciones

- **Maldición de dimensionalidad**: Features crecen exponencialmente con el grado
- **Overfitting**: Alto grado puede memorizar ruido
- **No invertible**: inverse_transform no está implementado
- **Multicolinealidad**: Features polinomiales son altamente correlacionadas

---

## VarianceThreshold

Elimina features con varianza por debajo de un umbral. Método de selección de features no supervisado que filtra características constantes o casi constantes.

### Fundamento Teórico

Para cada feature $j$, calcula la varianza poblacional:

$$\text{Var}(j) = \frac{1}{n} \sum_{i=1}^{n} (x_{ij} - \bar{x}_j)^2$$

**Regla de selección**: Conservar feature $j$ si $\text{Var}(j) > \text{threshold}$.

- Feature con varianza 0 → constante → sin información
- Feature con baja varianza → poca capacidad discriminatoria
- Threshold por defecto: 0.0 (elimina solo constantes)

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `vt.fit(X)` | `(List[List[NUM]]) -> VOID` | Calcula varianzas y selecciona features |
| `vt.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Elimina features con baja varianza |
| `vt.fit_transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Fit + transform |

### Parámetros del Constructor

```kafe
-- threshold=0.0 (valor por defecto)
MACHINE vt = machine.variance_threshold(0.0);
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `threshold` | FLOAT | 0.0 | Umbral de varianza mínimo (no-negativo) |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `vt.variances_` | `List[FLOAT]` | Varianza de cada feature |
| `vt.selected_indices_` | `List[INT]` | Índices de features seleccionadas |
| `vt.n_features_in_` | `INT` | Número de features de entrada |
| `vt.n_features_out_` | `INT` | Número de features de salida |

### Ejemplo

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 0.0, 3.0],
                        [2.0, 0.0, 6.0],
                        [3.0, 0.0, 9.0],
                        [4.0, 0.0, 12.0]];

-- Eliminar features constantes (threshold=0)
MACHINE vt = machine.variance_threshold(0.0);
List[List[FLOAT]] X_new = vt.fit_transform(X);
show(X_new);  -- [[1.0, 3.0], [2.0, 6.0], [3.0, 9.0], [4.0, 12.0]]

show(vt.variances_);       -- [1.25, 0.0, 10.125]
show(vt.selected_indices_); -- [0, 2]
show(vt.n_features_out_);   -- 2
```

### Comparación con Otros Métodos

| Aspecto | VarianceThreshold | Lasso (L1) | RFE |
|---------|-------------------|------------|-----|
| Tipo | Filter (no supervisado) | Embedded (supervisado) | Wrapper (supervisado) |
| Requiere y | No | Sí | Sí |
| Velocidad | Muy rápido | Rápido | Lento |
| Detecta interacciones | No | Parcialmente | Sí |
| Costo computacional | $O(n \cdot d)$ | $O(n \cdot d \cdot iter)$ | $O(d \cdot T_{model} \cdot (d-k))$ |

---

## RecursiveFeatureElimination (RFE)

Selecciona features por eliminación recursiva usando un modelo supervisado. Entrena un modelo repetidamente y elimina la feature menos importante en cada iteración hasta alcanzar el número deseado de features.

### Fundamento Teórico

RFE es un **wrapper method** que utiliza un estimador para evaluar importancia:

1. Entrenar el estimador con todas las features activas
2. Calcular importancia: $\text{importance}_j = |w_j|$ para modelos lineales
3. Eliminar la feature con menor importancia
4. Repetir hasta tener $k$ features

**Ranking**: Features eliminadas primero reciben rank alto (menos importantes). Supervivientes reciben rank 1.

- **Time Complexity**: $O(d \cdot T_{model} \cdot (d - k))$ donde $T_{model}$ es el tiempo de entrenamiento
- **Espacio**: $O(d)$ para ranking y soporte

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `rfe.fit(X, y)` | `(List[List[NUM]], List[NUM]) -> VOID` | Entrena recursivamente y selecciona features |
| `rfe.transform(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Selecciona solo las features elegidas |
| `rfe.fit_transform(X, y)` | `(List[List[NUM]], List[NUM]) -> List[List[FLOAT]]` | Fit + transform |

### Parámetros del Constructor

```kafe
-- estimator: LinearRegression (default), n_features: 1 (default)
MACHINE rfe = machine.recursive_feature_elimination(machine.linear_regression(), 2);
```

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `estimator` | MACHINE | LinearRegression | Modelo con `coef_` o `feature_importances_` |
| `n_features` | INT | 1 | Número de features a seleccionar |

### Propiedades

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `rfe.selected_indices_` | `List[INT]` | Índices de features seleccionadas |
| `rfe.ranking_` | `List[INT]` | Ranking de importancia (1 = más importante) |
| `rfe.support_` | `List[BOOL]` | Máscara booleana de features seleccionadas |
| `rfe.n_features_in_` | `INT` | Número de features de entrada |

### Ejemplo

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 0.5, 3.0, 0.1],
                        [2.0, 0.6, 6.0, 0.2],
                        [3.0, 0.4, 9.0, 0.15],
                        [4.0, 0.7, 12.0, 0.25],
                        [5.0, 0.55, 15.0, 0.18]];
List[FLOAT] y = [2.0, 4.0, 6.0, 8.0, 10.0];

-- Seleccionar las 2 mejores features
MACHINE rfe = machine.recursive_feature_elimination(machine.linear_regression(), 2);
rfe.fit(X, y);

show(rfe.ranking_);          -- [1, 3, 1, 2]
show(rfe.selected_indices_); -- [0, 2]
show(rfe.support_);          -- [true, false, true, false]

List[List[FLOAT]] X_new = rfe.transform(X);
show(X_new);  -- [[1.0, 3.0], [2.0, 6.0], [3.0, 9.0], [4.0, 12.0], [5.0, 15.0]]
```

### Comparación con Otros Métodos

| Aspecto | RFE | VarianceThreshold | Lasso (L1) |
|---------|-----|-------------------|------------|
| Tipo | Wrapper | Filter | Embedded |
| Requiere y | Sí | No | Sí |
| Velocidad | Lento | Muy rápido | Rápido |
| Detecta interacciones | Sí | No | Parcialmente |
| Inestabilidad | Alta | Ninguna | Media |
| Modelo base | Cualquier estimador | Ninguno | Lineal |
