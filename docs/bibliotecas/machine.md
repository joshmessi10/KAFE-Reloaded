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
| `machine.logistic_regression(lr, iter)` | `(FLOAT, INT) -> MACHINE` | Crea un modelo de regresión logística |
| `machine.knn(k)` | `(INT) -> MACHINE` | Crea un clasificador KNN |
| `machine.standard_scaler()` | `() -> MACHINE` | Crea un estandarizador Z-score |
| `machine.minmax_scaler()` | `() -> MACHINE` | Crea un escalador min-max |
| `machine.simple_imputer(strategy)` | `(STR) -> MACHINE` | Crea un imputador de valores faltantes |
| `machine.simple_imputer_constant(v)` | `(NUM) -> MACHINE` | Crea un imputador con estrategia constante |
| `machine.label_encoder()` | `() -> MACHINE` | Crea un codificador de etiquetas |
| `machine.one_hot_encoder()` | `() -> MACHINE` | Crea un codificador one-hot |
| `machine.pca(n)` | `(INT) -> MACHINE` | Crea modelo PCA con n componentes |

---

## Métricas de Clasificación

| Función | Firma | Descripción |
|---------|-------|-------------|
| `machine.accuracy_score(y_true, y_pred)` | `(List[NUM], List[NUM]) -> FLOAT` | Proporción de predicciones correctas |
| `machine.precision_score(y_true, y_pred)` | `(List[NUM], List[NUM]) -> FLOAT` | TP / (TP + FP) |
| `machine.recall_score(y_true, y_pred)` | `(List[NUM], List[NUM]) -> FLOAT` | TP / (TP + FN) |
| `machine.f1_score(y_true, y_pred)` | `(List[NUM], List[NUM]) -> FLOAT` | Media armónica de precision y recall |
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

## LogisticRegression

Implementa regresión logística binaria usando gradiente descendente.

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `lr.fit(X, y)` | `(List[List[NUM]] o List[NUM], List[INT]) -> VOID` | Entrena el modelo |
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
| `imp.fit(X)` | `(PARDOS) -> VOID` | Calcula estadísticas por columna |
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
