# Soft K-Means Neural Clustering (Clustering con Redes Neuronales)

## Category

Deep Learning — Clustering neuronal

## Description

El clustering suave con redes neuronales (Soft K-Means Neural) es un enfoque que reformula el problema de clustering clásico como una tarea de aprendizaje profundo. En lugar de asignar puntos a clusters de forma discreta (hard assignment), cada punto recibe una **asignación suave** (probabilidad de pertenencia a cada cluster) producida por una red neuronal.

La idea central:
1. Una red neuronal con salida Softmax produce vectores de asignación suave $z \in \mathbb{R}^k$ donde $z_c$ representa la probabilidad de que el punto pertenezca al cluster $c$.
2. Se calculan centros de cluster como **medias ponderadas** por las asignaciones suaves.
3. Se construyen objetivos basados en distancias: puntos más cerca de un centro tienen mayor peso en ese cluster.
4. La red se entrena minimizando MSE entre las asignaciones suaves de la red y los objetivos de distancia.

Esto permite que la red neuronal **aprenda una representación no lineal** de los clusters, algo que K-Means clásico no puede hacer.

## Mathematical Foundation

### Clustering Clásico (Hard K-Means)

En K-Means clásico, cada punto $x_i$ se asigna a un solo cluster:

$$c_i = \arg\min_{k} \|x_i - \mu_k\|^2$$

Los centros se actualizan como:

$$\mu_k = \frac{1}{|C_k|} \sum_{x_i \in C_k} x_i$$

### Clustering Suave (Fuzzy C-Means)

En fuzzy clustering, cada punto tiene un grado de pertenencia $u_{ik} \in [0, 1]$ a cada cluster $k$:

$$\sum_{k=1}^{K} u_{ik} = 1 \quad \forall i$$

El objetivo minimiza:

$$J = \sum_{i=1}^{n} \sum_{k=1}^{K} u_{ik}^m \|x_i - \mu_k\|^2$$

Donde $m > 1$ es el parámetro de fuzziness.

### Soft K-Means Neural

KafeGESHA implementa una variante neuronal:

**Forward pass** (red neuronal):
$$z = \text{softmax}(\text{net}(x)) \in \mathbb{R}^k$$

**Cálculo de centros** (media ponderada suave):
$$\mu_k = \frac{\sum_{i=1}^{n} z_{ik} \cdot x_i}{\sum_{i=1}^{n} z_{ik}}$$

**Objetivo por punto** (inversa de distancia):
$$t_{ik} = \frac{1 / \|x_i - \mu_k\|^2 + \epsilon}{\sum_{j=1}^{k} 1 / \|x_i - \mu_j\|^2 + \epsilon}$$

Donde:
- $t_{ik}$ es el "target suave" para el punto $i$ y cluster $k$
- Puntos más cerca de un centro $\mu_k$ tienen $t_{ik}$ mayor
- $\epsilon = 10^{-6}$ previene división por cero

**Función de pérdida** (MSE entre asignaciones y targets):
$$L = \frac{1}{n} \sum_{i=1}^{n} \sum_{k=1}^{K} (z_{ik} - t_{ik})^2$$

**Gradiente de pre-activación** (a través de Softmax):
$$\frac{\partial L}{\partial \text{logit}_{ik}} = z_{ik} \left( \frac{\partial L}{\partial z_{ik}} - \sum_{j=1}^{K} z_{ij} \cdot \frac{\partial L}{\partial z_{ij}} \right)$$

Esto es la inversión de la Jacobiana de Softmax: dada $\frac{\partial L}{\partial z}$, se calcula $\frac{\partial L}{\partial \text{logit}}$.

## Step-by-Step Algorithm

### Entrenamiento (un epoch)

1. Para cada punto $x_i$ en el dataset, ejecutar forward pass a través de todas las capas de la red → obtener $z_i = \text{softmax}(\text{net}(x_i))$.

2. **Calcular centros como medias ponderadas**:
   a. Inicializar centros $\mu_k = [0, \ldots, 0]$ y pesos $w_k = 0$ para cada cluster $k$.
   b. Para cada punto $(z_i, x_i)$:
      - Para cada cluster $c$: $w_c \mathrel{+}= z_{ic}$
      - Para cada cluster $c$ y feature $f$: $\mu_{c,f} \mathrel{+}= z_{ic} \cdot x_{i,f}$
   c. Para cada cluster $c$: si $w_c > \epsilon$, dividir $\mu_c \leftarrow \mu_c / w_c$.

3. **Calcular targets suaves** para cada punto:
   a. Para cada punto $x_i$:
      - Calcular distancias al cuadrado: $d_{ic} = \sum_f (x_{i,f} - \mu_{c,f})^2$
      - Calcular raw scores: $r_{ic} = 1 / (d_{ic} + \epsilon)$
      - Normalizar: $t_{ic} = r_{ic} / \sum_j r_{ij}$

4. **Calcular pérdida y gradientes**:
   a. Para cada punto $x_i$ con asignación $z_i$ y target $t_i$:
      - Calcular pérdida de la muestra: $\ell_i = \sum_k (z_{ik} - t_{ik})^2$
      - Calcular gradiente de salida: $\frac{\partial \ell_i}{\partial z_{ik}} = 2(z_{ik} - t_{ik}) / k$
      - Propagar a través de Softmax (inversión de Jacobiana):
        $$\frac{\partial \ell_i}{\partial \text{logit}_{ik}} = z_{ik} \left( g_k - \sum_j z_{ij} \cdot g_j \right)$$
        donde $g_k = \frac{\partial \ell_i}{\partial z_{ik}}$.
      - Ejecutar backward pass con este gradiente.

5. Imprimir pérdida promedio del epoch.

### Evaluación

6. Ejecutar forward pass en todos los puntos de test.
7. Calcular centros como en el paso 2.
8. Calcular pérdida de clustering como el MSE ponderado por distancias:
   $$L_{\text{eval}} = \frac{1}{n} \sum_{i=1}^{n} \sum_{k=1}^{K} z_{ik} \cdot \|x_i - \mu_k\|^2$$

## Motivation

K-Means clásico solo puede encontrar clusters linealmente separables. Al usar una red neuronal como backbone, Soft K-Means Neural puede descubrir clusters en espacios de representación no lineales. Además, el enfoque suave permite que los puntos estén parcialmente en múltiples clusters, lo que es más realista para datos del mundo real. KafeGESHA implementa esto desde cero para mostrar cómo las redes neuronales pueden ir más allá de la clasificación supervisada.

## Advantages

- **No linealidad**: La red neuronal puede aprender representaciones no lineales de los clusters, algo que K-Means clásico no puede.
- **Asignaciones suaves**: Los puntos pueden pertenecer parcialmente a múltiples clusters, capturing ambigüedad real.
- **Diferenciable**: Todo el pipeline es diferenciable, permitiendo entrenamiento por gradiente descendente.
- **Integración con capas existentes**: Reutiliza Dense, Softmax y optimizadores de KafeGESHA.

## Limitations

- **Sensibilidad a inicialización**: Los centros iniciales afectan fuertemente el resultado; no hay garantía de conver全局.
- **Número fijo de clusters**: El usuario debe especificar $k$ de antemano (igual que K-Means clásico).
- **Más lento que K-Means clásico**: Requiere forward/backward pass completo en cada epoch.
- **Sin selección automática de $k$**: No incluye métricas como silhouette score o elbow method.
- **Un solo epoch de cálculo de targets**: Los centros se recalculan por epoch, no iterativamente como en K-Means clásico.

## When to Use

- Clusters con formas no lineales en el espacio de features originales.
- Cuando se necesita probabilidades de pertenencia (no solo asignaciones duras).
- Datos donde los clusters se solapan significativamente.
- Cuando se quiere integrar clustering con representaciones aprendidas por red neuronal.

## When NOT to Use

- Clusters bien separados y convexos → K-Means clásico es más rápido y simple.
- Dataset muy grande → el forward/backward completo puede ser prohibitivo.
- Cuando no se conoce el número de clusters → usar métodos de selección de $k$ primero.
- Datos de alta dimensionalidad sin reducción previa → la maldición de la dimensionalidad afecta las distancias.

## Dependencies

- `lib.KafeGESHA.Dense.py` — Capas Dense para la red neuronal interna.
- `lib.KafeGESHA.ActivationFunction.py` — Softmax para producir asignaciones suaves.
- `lib.KafeGESHA.LossFunction.py` — MSE para calcular la pérdida de clustering.
- `lib.KafeGESHA.Optimizer.py` — SGD, Adam, etc. para entrenar la red.
- `lib.KafeGESHA.GeshaDeep.py` — Orquestación del entrenamiento con `model_type="clustering"`.

## Related Concepts

- `dense-layer.md` — La red neuronal interna usa capas Dense.
- `activation-functions.md` — Softmax produce las asignaciones suaves.
- `loss-functions.md` — MSE se usa como función de pérdida para clustering.
- `optimizers.md` — Los optimizadores entrenan la red neuronal.

## Relationship with KAFE

### Implementación en `GeshaDeep.py`

El clustering se activa con `model_type="clustering"`:

```python
GESHA modelo = gesha.deep("clustering");
modelo.add(gesha.dense(8, activation: "relu", input_shape: [4]));
modelo.add(gesha.dense(3, activation: "softmax"));  -- 3 clusters
modelo.compile(optimizer: "adam", loss: "mse");
modelo.fit(x_train, epochs: 10);
```

### Pipeline de entrenamiento

El método `fit()` en `GeshaDeep` implementa el loop de clustering:

1. **Forward pass completo**: Todos los puntos se procesan por la red → $z_i = \text{softmax}(\text{net}(x_i))$.
2. **Cálculo de centros**: Media ponderada por $z_{ik}$.
3. **Targets suaves**: Inversa de distancia cuadrada, normalizada.
4. **Pérdida MSE**: $L = \frac{1}{n}\sum_i \sum_k (z_{ik} - t_{ik})^2$.
5. **Backward con Jacobiana de Softmax**: Invierte la Jacobiana para obtener gradientes de logits.
6. **Actualización de pesos**: El optimizador actualiza los pesos de la red.

### Decisión de diseño: MSE como pérdida de clustering

KafeGESHA usa MSE entre las asignaciones suaves y los targets de distancia, en lugar de la pérdida fuzzy C-Means clásica. Esto es porque:
- MSE es simple y educativo
- Es diferenciable y compatible con Softmax
- Los targets de distancia capturan la misma información que fuzzy membership

### Decisión de diseño: Backward manual a través de Softmax

El gradiente de Softmax se calcula manualmente en `fit()`:

```python
weighted_sum = sum(grad_z[c] * z[c] for c in range(k))
grad_logit = [z[c] * (grad_z[c] - weighted_sum) for c in range(k)]
```

Esto es la inversión de la Jacobiana de Softmax: dado $\frac{\partial L}{\partial z}$, se obtiene $\frac{\partial L}{\partial \text{logit}}$.

### Decisión de diseño: Evalúa con loss ponderado por distancias

`evaluate()` para clustering calcula:
$$L_{\text{eval}} = \frac{1}{n} \sum_{i=1}^{n} \sum_{k=1}^{K} z_{ik} \cdot \|x_i - \mu_k\|^2$$

Esto mide qué tan bien las asignaciones suaves se alinean con las distancias a los centros.

### Decisión de diseño: Advertencia para < 2 capas

Si el modelo de clustering tiene menos de 2 capas, `compile()` emite un warning porque la capacidad de la red puede ser insuficiente para aprender representaciones útiles.

## Usage Examples

```kafe
import gesha;

-- Clustering simple con 3 clusters
GESHA clustering = gesha.deep("clustering");
clustering.add(gesha.dense(8, activation: "relu", input_shape: [4]));
clustering.add(gesha.dense(3, activation: "softmax"));

clustering.compile(optimizer: "adam", loss: "mse");
clustering.fit(x_data, epochs: 20);

-- Evaluar calidad del clustering
FLOAT loss = clustering.evaluate(x_data);

-- Obtener asignaciones suaves
List[FLOAT] asignacion = clustering.predict([1.0, 2.0, 3.0, 4.0]);
show(asignacion);  -- [0.1, 0.8, 0.1] → punto probablemente en cluster 1

-- Obtener cluster más probable
INT cluster = clustering.predict_label([1.0, 2.0, 3.0, 4.0]);
show(cluster);  -- 1

-- Clustering con 5 clusters en datos 2D
GESHA c5 = gesha.deep("clustering");
c5.add(gesha.dense(16, activation: "relu", input_shape: [2]));
c5.add(gesha.dense(16, activation: "relu"));
c5.add(gesha.dense(5, activation: "softmax"));
c5.compile(optimizer: "rmsprop", loss: "mse");
c5.fit(puntos_2d, epochs: 50);
```

## Implementation Location

- `src/lib/KafeGESHA/GeshaDeep.py` — `fit()` con `model_type="clustering"` (líneas 92-150)
- `src/lib/KafeGESHA/GeshaDeep.py` — `evaluate()` con `model_type="clustering"` (líneas 269-294)
- `src/lib/KafeGESHA/Dense.py` — Capas Dense usadas como backbone
- `src/lib/KafeGESHA/ActivationFunction.py` — Softmax para asignaciones suaves

## Public API

- Constructor: `gesha.deep("clustering")`
- Método: `fit(x_train, epochs=1, batch_size=1)` — sin y_train (no supervisado)
- Método: `evaluate(x_test)` → loss de clustering
- Método: `predict(x)` → vector de asignaciones suaves
- Método: `predict_label(x)` → índice del cluster más probable
- Método: `predict_proba(x)` → misma que predict para clustering

## References

- Dunn, J. C. (1973). A fuzzy relative of the ISODATA process and its use in detecting compact well-separated clusters. Journal of Cybernetics, 3(3), 32-57.
- Bezdek, J. C. (1981). Pattern Recognition with Fuzzy Objective Function Algorithms. Plenum Press.
- Xie, J., Girshick, R., & Farhadi, A. (2016). Unsupervised deep embedding for clustering analysis. ICML.
- Yang, L., et al. (2017). Towards k-means-friendly spaces: Simultaneous deep learning and clustering. ICML.
- Goodfellow, I., Bengio, Y., & Courville, A. (2016). Deep Learning, Chapter 5.13: Autoencoders (representación no lineal).
