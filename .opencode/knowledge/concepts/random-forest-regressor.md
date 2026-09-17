# Random Forest Regressor

## Mathematical Foundation

Random Forest Regressor es un método de **ensemble learning** para regresión que construye múltiples árboles de regresión y agrega sus predicciones por promedio.

### Key Concepts

**Bootstrap Sampling**: Cada árbol se entrena en una muestra aleatoria del dataset original con reemplazo (~63% de los datos).

**Random Feature Selection**: En cada split, solo se consideran $\sqrt{d}$ características aleatorias (donde $d$ es el total de features).

**Averaging**: La predicción final es el promedio de las predicciones de todos los árboles.

### Algorithm

**Training (fit)**:
1. Para cada árbol $t = 1, \ldots, T$:
   a. Crear muestra bootstrap $D_t$ del conjunto de entrenamiento $D$
   b. Construir árbol $T_t$ sobre $D_t$:
      - En cada nodo, seleccionar $m$ features aleatorios
      - Encontrar mejor split usando **variance reduction**
      - Dividir en hijos izquierdo y derecho
      - Repetir hasta criterio de parada

**Prediction (predict)**:
1. Para cada árbol, obtener predicción $\hat{y}_t(x)$
2. Retornar promedio: $\hat{y}(x) = \frac{1}{T} \sum_{t=1}^{T} \hat{y}_t(x)$

### Variance Reduction

El criterio de split para regresión es la **reducción de varianza**:

$$\text{gain} = \text{Var}(y) - \left(\frac{n_L}{n}\text{Var}(y_L) + \frac{n_R}{n}\text{Var}(y_R)\right)$$

Donde:
- $\text{Var}(y) = \frac{1}{n}\sum_{i=1}^{n}(y_i - \bar{y})^2$
- $n_L, n_R$ = número de muestras en hijos izquierdo y derecho

## Complexity

| Operation | Time Complexity | Space Complexity |
|-----------|----------------|-----------------|
| Training | $O(T \cdot n \cdot d \cdot \log n)$ | $O(T \cdot n)$ |
| Prediction | $O(T \cdot d)$ | $O(T)$ |

## Advantages

1. **Reduce overfitting** — ensemble generaliza mejor que árbol individual
2. **Captura relaciones no lineales** — árboles pueden modelar cualquier función
3. **No requiere escalado** — modelos basados en árboles son invariantes a escala
4. **Robusto a outliers** — promedio suaviza valores extremos
5. **Feature importance** — puede medir importancia por uso en splits

## Limitations

1. **Menos interpretable** — ensamble es más difícil de interpretar que árbol individual
2. **Entrenamiento lento** — debe entrenar múltiples árboles
3. **Extapolación** — no puede predecir valores fuera del rango visto en entrenamiento
4. **Memoria intensivo** — almacena múltiples árboles

## When to Use

- Relaciones no lineales entre features y target
- Datos con muchos features
- Necesidad de alta precisión sin mucho tuning
- Features de diferentes escalas

## When NOT to Use

- Interpretabilidad es crítica
- Datos con tendencia temporal (extrapolación)
- Datasets muy grandes (entrenamiento es lento)

## Relationship with KAFE

KAFE implementa RandomForestRegressor desde scratch:
- Usa **variance reduction** como criterio de split (vs Gini para classifier)
- Predicción por **promedio** (vs votación mayoritaria para classifier)
- Hereda de BaseMachine con interfaz fit/predict/score estándar

## References

- Breiman, L. (2001). Random Forests. *Machine Learning*, 45(1), 5-32.
- Hastie, T., Tibshirani, R., & Friedman, J. (2009). *The Elements of Statistical Learning*. Springer.
