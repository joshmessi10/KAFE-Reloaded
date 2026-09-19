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
| `machine.standard_scaler()` | `() -> MACHINE` | Crea un estandarizador Z-score |
| `machine.minmax_scaler()` | `() -> MACHINE` | Crea un escalador min-max |
| `machine.simple_imputer(strategy)` | `(STR) -> MACHINE` | Crea un imputador de valores faltantes |
| `machine.simple_imputer_constant(v)` | `(NUM) -> MACHINE` | Crea un imputador con estrategia constante |
| `machine.label_encoder()` | `() -> MACHINE` | Crea un codificador de etiquetas |
| `machine.one_hot_encoder()` | `() -> MACHINE` | Crea un codificador one-hot |
| `machine.ordinal_encoder()` | `() -> MACHINE` | Crea un codificador ordinal (enteros ordenados) |
| `machine.pca(n)` | `(INT) -> MACHINE` | Crea modelo PCA con n componentes |
| `machine.dbscan(eps, min_samples)` | `(FLOAT, INT) -> MACHINE` | Crea un modelo de clustering DBSCAN |
| `machine.gaussian_nb()` | `() -> MACHINE` | Crea un clasificador Naive Bayes Gaussiano |
| `machine.random_forest_classifier(n_est, depth, split, leaf)` | `(INT, INT, INT, INT) -> MACHINE` | Crea un clasificador Random Forest |
| `machine.random_forest_regressor(n_est, depth, split, leaf)` | `(INT, INT, INT, INT) -> MACHINE` | Crea un regresor Random Forest |
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

## KNN (K-Nearest Neighbors)

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
