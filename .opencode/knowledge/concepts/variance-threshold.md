# VarianceThreshold

## Name

VarianceThreshold

## Category

ML preprocessing / feature selection (unsupervised)

## Description

VarianceThreshold es un método de selección de features que elimina automáticamente las características con varianza por debajo de un umbral especificado. Es el método más simple de feature selection: no requiere un modelo supervisado ni etiquetas, solo analiza la dispersión de cada feature de forma independiente.

## Mathematical Foundation

Para cada feature $j$, se calcula la varianza muestral:

$$\text{Var}(j) = \frac{1}{n} \sum_{i=1}^{n} (x_{ij} - \bar{x}_j)^2$$

donde $\bar{x}_j = \frac{1}{n} \sum_{i=1}^{n} x_{ij}$ es la media de la feature $j$.

**Regla de selección**: Se conserva la feature $j$ si y solo si $\text{Var}(j) > \text{threshold}$.

- **Time Complexity**: $O(n \cdot d)$ para fit (calcular varianzas), $O(n \cdot k)$ para transform (donde $k$ es el número de features seleccionadas)
- **Space Complexity**: $O(d)$ para almacenar varianzas e índices

**Propiedades importantes**:
- Una feature con varianza 0 es constante: todos los valores son iguales, no aporta información.
- Una feature con baja varianza tiene poca capacidad discriminatoria.
- El threshold por defecto es 0.0, lo que elimina solo features constantes.

## Step-by-Step Algorithm

1. **fit(X)**: Para cada feature $j$ en $[0, d)$, calcular $\bar{x}_j$ y $\text{Var}(j)$
2. **Selección**: Los índices donde $\text{Var}(j) > \text{threshold}$ forman `selected_indices_`
3. **transform(X)**: Para cada fila, extraer solo las columnas en `selected_indices_`
4. **Result**: Matriz reducida de $n \times k$ donde $k \leq d$

## Motivation

En datasets reales, muchas features son constantes o casi constantes (ej: una columna donde todos los valores son 5.0). Estas features no aportan información al modelo pero sí aumentan la dimensionalidad, el consumo de memoria y el tiempo de entrenamiento. VarianceThreshold proporciona una eliminación rápida y sin supervisión de estas features irrelevantes.

## Advantages

- **Simplicidad extrema**: Un solo parámetro (threshold), cálculo trivial
- **Rapidez**: $O(n \cdot d)$ — más rápido que cualquier método supervisado
- **No supervisado**: No necesita etiquetas $y$, útil en preprocessing temprano
- **Determinístico**: Siempre produce el mismo resultado para los mismos datos
- **Complementario**: Se puede combinar con métodos supervisados (primero VarianzaThreshold, luego RFE)

## Limitations

- **No considera la relación con el target**: Una feature con baja varianza puede ser muy predictiva si el target varía con ella (ej: umbral de detección de fallo)
- **Umbral depende de la escala**: Features en diferentes escalas tienen varianzas incomparables — requiere StandardScaler o MinMaxScaler previo
- **Solo elimina features individuales**: No detecta redundancia entre features (features altamente correlacionadas)
- **Sensible a outliers**: Un solo outlier puede inflar la varianza artificialmente

## When to Use

- Primera paso de preprocessing en datasets con muchas features
- Eliminar features constantes o casi constantes
- Preprocessing antes de algoritmos costosos (SVM, Neural Networks)
- Combinar con métodos supervisados (pipeline: VarianceThreshold → RFE)

## When NOT to Use

- Cuando una feature de baja varianza es conocida como predictiva
- Cuando las features están en diferentes escalas (primero escalar)
- Cuando se necesita detectar features redundantes (usar correlación o PCA)

## Dependencies

- BaseMachine
- PARDOS DataFrame (soporte DataFrames)
- math operations (sum, division)

## Related Concepts

- standard-scaler (normalización previa recomendada)
- recursive-feature-elimination (método supervisado complementario)
- pca (reducción de dimensionalidad alternativa)
- pipeline (encadenar preprocessing)

## Relationship with KAFE

En KAFE, VarianceThreshold se implementa como un transformador de preprocessing que extiende BaseMachine. El factory `machine.variance_threshold(threshold)` crea una instancia. Soporta `fit`, `transform`, `fit_transform` y PARDOS DataFrames. La fórmula de varianza usa la varianza poblacional ($1/n$, no $1/(n-1)$), consistente con scikit-learn.

## Usage Examples

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
-- La feature 1 (constante con valor 0) fue eliminada

show(vt.variances_);       -- [1.25, 0.0, 10.125]
show(vt.selected_indices_); -- [0, 2]
show(vt.n_features_out_);   -- 2
```

## Implementation Location

- `src/lib/KafeMACHINE/preprocessing/VarianceThreshold.py`

## Public API

- `machine.variance_threshold(threshold)` — crea VarianceThreshold con umbral dado (default: 0.0)
- `vt.fit(X)` — calcula varianzas y selecciona features
- `vt.transform(X)` — elimina features con baja varianza
- `vt.fit_transform(X)` — fit + transform
- `vt.variances_` — lista de varianzas por feature
- `vt.selected_indices_` — índices de features seleccionadas
- `vt.n_features_in_` — número de features de entrada
- `vt.n_features_out_` — número de features de salida

## References

- scikit-learn VarianceThreshold: https://scikit-learn.org/stable/modules/generated/sklearn.feature_selection.VarianceThreshold.html
- Guyon, I. & Elisseeff, A. (2003). An Introduction to Variable and Feature Selection. JMLR.
