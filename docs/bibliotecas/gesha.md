# GeshaDeep — Deep Learning

GeshaDeep es la librería de Deep Learning de KAFE. Soporta modelos de clasificación binaria, clasificación multiclase, regresión lineal y clustering, con una API unificada basada en modelos y capas densas.

**Importación:**

```kafe
import geshaDeep;
```

---

## Tipos de Modelo

| Función | Tipo de Modelo | Activación Típica | Pérdida Recomendada |
|---------|---------------|-------------------|---------------------|
| `geshaDeep.binary()` | Clasificación binaria | `sigmoid` | `binary_crossentropy` |
| `geshaDeep.categorical()` | Clasificación multiclase | `softmax` (salida), `relu` (ocultas) | `categorical_crossentropy` |
| `geshaDeep.regression()` | Regresión lineal | `linear` | `mse` |
| `geshaDeep.clustering()` | Clustering no supervisado | `relu` + `softmax` | `categorical_crossentropy` |

---

## Referencia de Funciones

### Creación de Modelos

| Función | Firma | Descripción |
|---------|-------|-------------|
| `geshaDeep.binary()` | `() -> GESHA` | Crea modelo de clasificación binaria |
| `geshaDeep.categorical()` | `() -> GESHA` | Crea modelo de clasificación multiclase |
| `geshaDeep.regression()` | `() -> GESHA` | Crea modelo de regresión |
| `geshaDeep.clustering()` | `() -> GESHA` | Crea modelo de clustering |

### Capas Densas

| Función | Firma | Descripción |
|---------|-------|-------------|
| `geshaDeep.create_dense` | `(neurons, activation, input_shape, bias, seed) -> GESHA` | Crea una capa densa |

**Parámetros de `create_dense`:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `neurons` | INT | Número de neuronas |
| `activation` | STR | Función de activación |
| `input_shape` | List[INT] | Forma de entrada |
| `bias` | FLOAT | Valor de sesgo |
| `seed` | INT | Semilla aleatoria |

### Métodos de Modelo

| Método | Firma | Descripción |
|--------|-------|-------------|
| `model.add` | `(GESHA) -> VOID` | Agrega una capa |
| `model.compile` | `(optimizer, loss, metrics) -> VOID` | Configura optimizador y pérdida |
| `model.fit` | `(x_train, y_train, epochs, batch_size, ...) -> VOID` | Entrena el modelo |
| `model.evaluate` | `(x_test, y_test) -> FLOAT` | Evalúa el modelo en datos de prueba |
| `model.predict` | `(input) -> List[FLOAT]` | Predicción (probabilidades) |
| `model.predict_proba` | `(input) -> FLOAT` | Probabilidad de la clase positiva |
| `model.predict_label` | `(input) -> INT` | Retorna la etiqueta (0/1) |
| `model.summary` | `() -> VOID` | Imprime arquitectura |

### Configuración

| Función | Firma | Descripción |
|---------|-------|-------------|
| `geshaDeep.set_lr` | `(model, lr) -> VOID` | Establece learning rate (después de compile) |

### Entrenamiento desde PARDOS

| Función | Firma | Descripción |
|---------|-------|-------------|
| `geshaDeep.fit_from_df` | `(model, df, y_columns, epochs, batch_size, ...) -> VOID` | Entrena desde un DataFrame PARDOS |

---

## Valores Disponibles

### Funciones de Activación

- `"sigmoid"` — Regresa valor entre 0 y 1
- `"relu"` — Rectified Linear Unit
- `"tanh"` — Tangente hiperbólica (rango -1 a 1)
- `"softmax"` — Distribución de probabilidad
- `"linear"` — Sin transformación

### Optimizadores

- `"sgd"` — Stochastic Gradient Descent
- `"adam"` — Adaptive Moment Estimation
- `"rmsprop"` — Root Mean Square Propagation
- `"adamw"` — Adam with Weight Decay

### Funciones de Pérdida

- `"binary_crossentropy"` — Para clasificación binaria
- `"categorical_crossentropy"` — Para clasificación multiclase
- `"sparse_categorical_crossentropy"` — Para clasificación multiclase con etiquetas enteras
- `"mse"` — Mean Squared Error (para regresión)
- `"mae"` — Mean Absolute Error (para regresión)

### Métricas

- `"accuracy"` — Precisión de clasificación

---

## Ejemplo: Clasificación Binaria AND

```kafe
import geshaDeep;

List[List[INT]] x_train = [[0,0],[0,1],[1,0],[1,1]];
List[INT] y_train = [0, 0, 0, 1];

GESHA model = geshaDeep.binary();
GESHA layer = geshaDeep.create_dense(1, "sigmoid", [2], 0.0, 42);
model.add(layer);

model.compile("sgd", "binary_crossentropy", ["accuracy"]);
model.fit(x_train, y_train, 1000, 1, [], []);

for (p in x_train):
    FLOAT prob = model.predict_proba(p);
    INT lbl = model.predict_label(p);
    show(str(p) + " -> prob=" + str(prob) + ", label=" + str(lbl));
;
```

## Ejemplo: Regresión

```kafe
import geshaDeep;

List[List[FLOAT]] X_train = [[1.0], [2.0], [3.0], [4.0]];
List[FLOAT] y_train = [2.0, 4.0, 6.0, 8.0];

GESHA model = geshaDeep.regression();
GESHA layer = geshaDeep.create_dense(1, "linear", [1], 0.0, 42);
model.add(layer);

model.compile("sgd", "mse", []);
model.fit(X_train, y_train, 50, 1, [], []);

List[FLOAT] pred = model.predict([5.0]);
show("Predicción para [5.0]: " + str(pred[0]));
```

## Ejemplo: Clustering

```kafe
import geshaDeep;

List[List[FLOAT]] X_train = [
    [1.0, 1.0], [1.5, 2.0], [5.0, 8.0],
    [8.0, 8.0], [1.0, 0.6], [9.0, 11.0]
];

GESHA model = geshaDeep.clustering();
GESHA layer1 = geshaDeep.create_dense(4, "relu", [2], 0.0, 42);
GESHA layer2 = geshaDeep.create_dense(2, "softmax", [], 0.0, 42);
model.add(layer1);
model.add(layer2);

model.compile("adam", "mse", []);
model.fit(X_train, [], 20, 1);

List[FLOAT] probs = model.predict([1.0, 1.0]);
show("Cluster probabilities: " + str(probs));
INT cluster = model.predict_label([1.0, 1.0]);
show("Assigned cluster: " + str(cluster));
```

## Ejemplo: Clustering desde PARDOS DataFrame

```kafe
import geshaDeep;
import pardos;

PARDOS df = pardos.read_csv("data.csv");

GESHA model = geshaDeep.clustering();
GESHA layer1 = geshaDeep.create_dense(4, "relu", [2], 0.0, 42);
GESHA layer2 = geshaDeep.create_dense(2, "softmax", [], 0.0, 42);
model.add(layer1);
model.add(layer2);

model.compile("adam", "mse", []);
geshaDeep.fit_from_df(model, df, [], 20, 1);
```

---

## Manejo de Errores

| Error | Causa |
|-------|-------|
| **Arquitectura** | `input_shape` de la primera capa no coincide con datos |
| **Compilación** | Optimizador o función de pérdida no soportados |
| **Entrenamiento** | `x_train` e `y_train` tienen distinto número de muestras |
| **set_lr antes de compile** | Se intenta establecer LR sin haber compilado |
