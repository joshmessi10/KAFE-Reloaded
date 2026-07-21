# MACHINE — Utilidades de Machine Learning

MACHINE provee implementaciones de algoritmos de Machine Learning: regresión lineal, codificación de etiquetas, codificación one-hot y análisis de componentes principales (PCA).

**Importación:**

```kafe
import machine;
```

---

## Funciones Principales

| Función | Firma | Descripción |
|---------|-------|-------------|
| `machine.linear_regression()` | `() -> MACHINE` | Crea un modelo de regresión lineal |
| `machine.label_encoder()` | `() -> MACHINE` | Crea un codificador de etiquetas |
| `machine.one_hot_encoder()` | `() -> MACHINE` | Crea un codificador one-hot |
| `machine.pca(n)` | `(INT) -> MACHINE` | Crea modelo PCA con n componentes |

---

## LinearRegression

Implementa regresión lineal por mínimos cuadrados.

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `lr.train` | `(List[NUM], List[NUM]) -> VOID` | Entrena con datos x, y |
| `lr.predict` | `(NUM) -> FLOAT` | Predice valor para una entrada |

### Ejemplo

```kafe
import machine;

MACHINE lr = machine.linear_regression();

List[FLOAT] x = [1.0, 2.0, 3.0, 4.0, 5.0];
List[FLOAT] y = [2.1, 4.0, 5.8, 8.1, 10.0];

lr.train(x, y);

show("Pendiente: " + str(lr.slope));
show("Intercepto: " + str(lr.intercept));
show("Predicción para x=6: " + str(lr.predict(6)));
```

### Cómo Funciona

1. Calcula la pendiente: `m = (n·Σxy - Σx·Σy) / (n·Σx² - (Σx)²)`
2. Calcula el intercepto: `b = (Σy - m·Σx) / n`
3. Predicción: `ŷ = m·x + b`

---

## LabelEncoder

Codifica etiquetas de texto a valores enteros ordinales.

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `le.fit` | `(List[ANY]) -> MACHINE` | Aprende las clases únicas (ordenadas) |
| `le.transform` | `(List[ANY]) -> List[INT]` | Convierte etiquetas a enteros |
| `le.fit_transform` | `(List[ANY]) -> List[INT]` | Fit + transform en un paso |
| `le.inverse_transform` | `(List[INT]) -> List[STR]` | Convierte enteros de vuelta a etiquetas |

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

Codifica columnas categóricas a representación binaria (one-hot).

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `ohe.fit` | `(PARDOS, List[STR]) -> MACHINE` | Aprende categorías de columnas específicas |
| `ohe.transform` | `(PARDOS) -> PARDOS` | Transforma DataFrame a one-hot |
| `ohe.fit_transform` | `(PARDOS, List[STR]) -> PARDOS` | Fit + transform |

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

Reduce la dimensionalidad de los datos encontrando las direcciones de mayor varianza.

### Métodos

| Método | Firma | Descripción |
|--------|-------|-------------|
| `pca.fit` | `(PARDOS o List[List[NUM]]) -> VOID` | Ajusta el modelo a los datos |
| `pca.transform` | `(PARDOS o List[List[NUM]]) -> PARDOS` | Transforma datos a componentes principales |
| `pca.round` | `(n?) -> VOID` | Redondea valores internos |

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

show("Medias: " + str(pca_model.mean_));
show("Varianza explicada: " + str(pca_model.explained_variance_));

PARDOS reduced = pca_model.transform(df);
show("Datos reducidos a 2D:");
show(reduced.round(4));
```

### Algoritmo Interno

PCA utiliza el **algoritmo de Jacobi** para calcular valores y vectores propios:

1. **Centrado de media**: Restar la media de cada feature
2. **Matriz de covarianza**: `C = (X^T · X) / (n - 1)`
3. **Jacobi**: Iteraciones para diagonalizar la matriz de covarianza
4. **Ordenamiento**: Componentes ordenados por varianza explicada (mayor a menor)
