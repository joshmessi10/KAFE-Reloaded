# Dense Layer (Capa Densamente Conectada)

## Category

Deep Learning — Componente de red neuronal

## Description

Una capa Dense (totalmente conectada o fully connected) es el bloque fundamental de las redes neuronales artificiales. Cada neurona de la capa recibe la **totalidad** de las entradas y produce una salida mediante una transformación lineal seguida de una función de activación no lineal.

Una capa Dense implementa el **perceptrón multicapa**: cada unidad $j$ calcula una suma ponderada de todas las entradas $x_i$, le agrega un sesgo $b_j$, y aplica una función de activación $\sigma$:

$$z_j = \sum_{i=1}^{n} w_{ij} \cdot x_i + b_j$$

$$a_j = \sigma(z_j)$$

Donde:
- $w_{ij}$ es el peso de la conexión entre la entrada $i$ y la unidad $j$
- $b_j$ es el sesgo (bias) de la unidad $j$
- $\sigma$ es la función de activación
- $z_j$ es la pre-activación (input lineal)
- $a_j$ es la salida activada

**Dimensiones**: Para una capa con $n$ entradas y $m$ unidades:
- Pesos: matriz $W \in \mathbb{R}^{n \times m}$
- Sesgos: vector $b \in \mathbb{R}^{m}$
- Salida: vector $a \in \mathbb{R}^{m}$

**Complejidad**:
- Forward: $O(n \cdot m)$ multiplicaciones
- Backward: $O(n \cdot m)$ para gradientes + $O(n \cdot m)$ para actualización
- Espacio: $O(n \cdot m)$ para almacenar pesos + $O(m)$ para sesgos

## Mathematical Foundation

### Forward Pass

Para una entrada $x \in \mathbb{R}^n$ y pesos $W \in \mathbb{R}^{n \times m}$, $b \in \mathbb{R}^m$:

$$z = W^T x + b \in \mathbb{R}^m$$

$$a = \sigma(z) \in \mathbb{R}^m$$

### Backward Pass (Retropropagación)

Dado el gradiente de la pérdida respecto a la salida $\frac{\partial L}{\partial a}$, se calcula:

1. **Gradiente de pre-activación**:
$$\frac{\partial L}{\partial z_j} = \frac{\partial L}{\partial a_j} \cdot \sigma'(z_j)$$

2. **Gradiente de pesos**:
$$\frac{\partial L}{\partial w_{ij}} = x_i \cdot \frac{\partial L}{\partial z_j}$$

3. **Gradiente de sesgos**:
$$\frac{\partial L}{\partial b_j} = \frac{\partial L}{\partial z_j}$$

4. **Gradiente para la capa anterior** (para encadenar):
$$\frac{\partial L}{\partial x_i} = \sum_{j=1}^{m} w_{ij} \cdot \frac{\partial L}{\partial z_j}$$

### Regla de Actualización de Pesos

Con tasa de aprendizaje $\eta$:

$$w_{ij} \leftarrow w_{ij} - \eta \cdot \frac{\partial L}{\partial w_{ij}}$$

$$b_j \leftarrow b_j - \eta \cdot \frac{\partial L}{\partial b_j}$$

### Regularización L2 (Weight Decay)

El término de regularización agrega una penalización al gradiente:

$$\frac{\partial L}{\partial w_{ij}} = \frac{\partial L}{\partial w_{ij}} + \lambda \cdot w_{ij}$$

Donde $\lambda$ es el hiperparámetro de regularización.

## Step-by-Step Algorithm

### Inicialización

1. Seleccionar el número de unidades $m$ y la forma de entrada $n$.
2. Inicializar pesos $W$ con valores aleatorios en $[-0.5, 0.5]$ (usando semilla opcional para reproducibilidad).
3. Inicializar sesgos $b$ con ceros.

### Forward Pass

4. Recibir vector de entrada $x$.
5. Si los pesos no están inicializados, hacer `build(len(x))`.
6. Para cada unidad $j = 1, \ldots, m$:
   a. Calcular $z_j = \sum_{i=1}^{n} x_i \cdot w_{ij} + b_j$.
7. Aplicar función de activación $\sigma$ a cada $z_j$.
8. Si la activación es Softmax, aplicar sobre el vector completo $\mathbf{z}$.
9. Retornar vector de salida $a$.

### Backward Pass

10. Recibir gradiente de salida $\frac{\partial L}{\partial a}$.
11. Calcular gradiente de pre-activación:
    - Si Softmax: usar el gradiente directo (ya incluye la derivada Jacobiana).
    - Si otra activación: $\frac{\partial L}{\partial z_j} = \frac{\partial L}{\partial a_j} \cdot \sigma'(z_j)$.
12. Calcular gradiente de pesos: $\frac{\partial L}{\partial w_{ij}} = x_i \cdot \frac{\partial L}{\partial z_j}$.
13. Calcular gradiente de sesgos: $\frac{\partial L}{\partial b_j} = \frac{\partial L}{\partial z_j}$.
14. Si hay regularización L2: agregar $\lambda \cdot w_{ij}$ al gradiente de pesos.
15. Actualizar pesos: $w_{ij} \leftarrow w_{ij} - \eta \cdot \frac{\partial L}{\partial w_{ij}}$.
16. Actualizar sesgos: $b_j \leftarrow b_j - \eta \cdot \frac{\partial L}{\partial b_j}$.
17. Calcular y retornar gradiente para la capa anterior: $\frac{\partial L}{\partial x_i} = \sum_{j=1}^{m} w_{ij} \cdot \frac{\partial L}{\partial z_j}$.

## Motivation

La capa Dense es el building block esencial de las redes neuronales profundas. Sin ella, no existe forma de aprender representaciones jerárquicas de los datos. KafeGESHA implementa Dense desde cero para que el estudiante pueda observar cada multiplicación de matriz, cada cálculo de gradiente, y cada actualización de peso — sin abstracciones que oculten la mecánica del aprendizaje.

## Advantages

- **Universalidad aproximada**: Una red con al menos una capa Dense oculta y suficientes unidades puede aproximar cualquier función continua (Teorema de Universalidad de Cybenko).
- **Simplicidad conceptual**: La operación es una combinación lineal + activación no lineal, fácil de entender y derivar.
- **Composabilidad**: Se apilan múltiples capas para crear redes profundas con mayor capacidad de representación.
- **Flexibilidad**: Acepta cualquier función de activación, cualquier dimensionalidad de entrada/salida.

## Limitations

- **Parámetros cuadráticos**: Para una capa de $n$ entradas y $m$ salidas, tiene $n \cdot m + m$ parámetros. Las capas muy anchas generan modelos pesados.
- **No capturan estructura espacial**: A diferencia de capas convolucionales, no aprovechan la estructura espacial de imágenes o secuencias.
- **Sensibles a la inicialización**: Una mala inicialización puede causar vanishing/exploding gradients.
- **Overfitting sin regularización**: Con muchos parámetros, tiende a memorizar en lugar de generalizar.

## When to Use

- Tareas de clasificación y regresión con datos tabulares.
- Capas de salida en redes convolucionales (para clasificación).
- Redes neuronales pequeñas para educación y prototipado.
- Cuando la interpretabilidad de los pesos es importante.

## When NOT to Use

- Datos con estructura espacial (imágenes) → preferir convolucionales.
- Secuencias largas → preferir RNN, LSTM, o Transformers.
- Datos extremadamente grandes → la cantidad de parámetros puede ser prohibitiva.

## Dependencies

- `lib.KafeGESHA.Gesha` — clase base para capas de red neuronal.
- `lib.KafeGESHA.ActivationFunctionLoader` — loader para funciones de activación.
- `lib.KafeGESHA.utils` — utilidades de regularización.
- `lib.KafeMATH.funciones` — funciones matemáticas auxiliares.

## Related Concepts

- `activation-functions.md` — Funciones de activación aplicadas post-transformación lineal.
- `loss-functions.md` — Funciones de pérdida que generan los gradientes para backward.
- `optimizers.md` — Optimizadores que controlan la tasa de aprendizaje.
- `soft-kmeans-clustering.md` — Clustering que utiliza capas Dense internamente.

## Relationship with KAFE

### Implementación en `Dense.py`

La clase `Dense` hereda de `Gesha` y encapsula:

| Componente | Atributo | Descripción |
|---|---|---|
| Pesos | `self.weights` | Matriz $n \times m$ inicializada con `_random_matrix()` en $[-0.5, 0.5]$ |
| Sesgos | `self.bias` | Vector de ceros |
| Activación | `self.activation` | Objeto cargado via `ActivationFunctionLoader` |
| Historial | `self.last_input`, `self.last_z` | Guarda entrada y pre-activación para backward |
| Regularización | `self.regularization_lambda` | Coeficiente L2, validado por `check_regularization()` |
| Semilla | `self._rng` | RNG con semilla opcional para reproducibilidad |

### Decisión de diseño: Inicialización uniforme en $[-0.5, 0.5]$

Los pesos se inicializan con `(rng.random() - 0.5)`, lo que produce valores en el rango $[-0.5, 0.5]$. Esta es una aproximación simplificada; en la práctica se usan inicializaciones como Xavier/Glorot o He, que escalan según el número de entradas/salidas. Para fines educativos, la inicialización uniforme es más fácil de entender.

### Decisión de diseño: Softmax como caso especial

La capa detecta si la activación es `"softmax"` y aplica la función sobre el vector completo de pre-activaciones, en lugar de elemento por elemento. Esto es necesario porque Softmax es una función colectiva (depende de todos los elementos del vector).

### Decisión de diseño: Backward sin optimizer acoplado

La capa Dense recibe `learning_rate` como parámetro en `backward()`, no un objeto optimizer. El optimizer se gestiona en el nivel de `GeshaDeep`. Esto mantiene la capa como un componente puro y reutilizable.

## Usage Examples

```kafe
import gesha;

GESHA modelo = gesha.deep("classification");

modelo.add(gesha.dense(32, activation: "relu", input_shape: [4]));
modelo.add(gesha.dense(16, activation: "relu"));
modelo.add(gesha.dense(3, activation: "softmax"));

modelo.compile(optimizer: "adam", loss: "categorical_crossentropy");
modelo.fit(x_train, y_train, epochs: 100);
```

## Implementation Location

- `src/lib/KafeGESHA/Dense.py` — clase `Dense(Gesha)`
- `src/lib/KafeGESHA/ActivationFunctionLoader.py` — carga de activaciones
- `src/lib/KafeGESHA/utils.py` — `check_regularization()`

## Public API

- Constructor: `Dense(units, activation=None, input_shape=None, regularization_lambda=0.0, seed=None)`
- Métodos: `build(input_dim)`, `forward(x)`, `backward(output_error, learning_rate, regularization_lambda=None)`, `summary()`
- Hereda de `Gesha`: `add()`, `predict()`, `compile()`

## References

- Rumelhart, D. E., Hinton, G. E., & Williams, R. J. (1986). Learning representations by back-propagating errors. Nature, 323(6088), 533-536.
- Goodfellow, I., Bengio, Y., & Courville, A. (2016). Deep Learning, Chapter 6: Deep Feedforward Networks. MIT Press.
- Cybenko, G. (1989). Approximation by superpositions of a sigmoidal function. Mathematics of Control, Signals and Systems, 2(4), 303-314.
