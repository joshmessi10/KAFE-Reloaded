# RecursiveFeatureElimination (RFE)

## Name

RecursiveFeatureElimination (RFE)

## Category

ML preprocessing / feature selection (supervised, wrapper method)

## Description

Recursive Feature Elimination (RFE) es un método de selección de features que entrena un modelo repetidamente y elimina iterativamente la feature menos importante hasta alcanzar el número deseado de features. A diferencia de VarianceThreshold, RFE considera la relación de cada feature con el target usando un modelo de aprendizaje.

## Mathematical Foundation

RFE es un **wrapper method** que utiliza un estimador base para evaluar la importancia de features:

1. Entrenar el estimador con todas las $d$ features activas
2. Calcular importancia de cada feature: $\text{importance}_j = |w_j|$ para modelos lineales (o `feature_importances_` para árboles)
3. Encontrar la feature con menor importancia: $j^* = \arg\min_j \text{importance}_j$
4. Eliminar $j^*$ y asignarle el rank actual
5. Repetir hasta tener $k$ features

**Ranking**: Las features eliminadas primero reciben rank alto (menos importantes). Las supervivientes reciben rank 1.

- **Time Complexity**: $O(d \cdot T_{\text{estimator}} \cdot (d - k))$ donde $T_{\text{estimator}}$ es el tiempo de entrenamiento del modelo base
- **Space Complexity**: $O(d)$ para ranking y soporte

**Complejidad total**: RFE entrena el modelo $(d - k)$ veces, lo que puede ser costoso para modelos complejos.

## Step-by-Step Algorithm

1. **fit(X, y)**: Iniciar con todas las $d$ features activas
2. **Para cada iteración**:
   a. Entrenar el estimador en las features activas
   b. Calcular importancia de cada feature activa
   c. Eliminar la feature con menor importancia
   d. Asignarle un rank decreciente
3. **Resultado**: Las $k$ features supervivientes reciben rank 1, el resto rank descendente
4. **transform(X)**: Seleccionar solo las columnas con rank 1

## Motivation

Los métodos filter (como VarianzaThreshold) evalúan features de forma independiente, ignorando interacciones. Los wrappers como RFE usan un modelo para evaluar el impacto real de cada feature en la predicción, capturando interacciones y redundancia que los métodos filter no detectan.

RFE es el wrapper method más clásico y ampliamente usado. Fue propuesto por Guyon et al. (2002) para selección de genes en problemas de cancerología.

## Advantages

- **Considera la relación con el target**: Usa un modelo supervisado para evaluar importancia
- **Detecta redundancia**: Si dos features son redundantes, RFE puede eliminar una
- **Wrapper method**: La evaluación es directamente relevante para el modelo final
- **Flexible**: Funciona con cualquier modelo que tenga `coef_` o `feature_importances_`
- **Ranking completo**: Produce un ranking de todas las features, no solo selección binaria

## Limitations

- **Requiere un modelo**: Necesita un estimador base para evaluar importancia
- **Costoso computacionalmente**: Entrena el modelo $(d - k)$ veces
- **Inestable**: Pequeños cambios en los datos pueden cambiar el ranking
- **Greedy**: La eliminación es irreversible — no reconsidera features eliminadas
- **Sesgo del modelo**: La selección depende del modelo base elegido

## When to Use

- Cuando se necesita seleccionar un subconjunto óptimo de features para un modelo específico
- Cuando las features tienen interacciones relevantes
- Cuando se dispene de tiempo computacional suficiente
- Como paso previo a un modelo final (reducir dimensionalidad antes de entrenar)

## When NOT to Use

- Cuando el dataset es muy grande (muchas features × muestras)
- Cuando el modelo base es muy costoso de entrenar
- Cuando se necesita un método rápido de preselección (usar VarianzaThreshold primero)
- Cuando no hay un modelo claro para evaluar importancia

## Dependencies

- BaseMachine
- LinearRegression (estimador por defecto)
- PARDOS DataFrame (soporte DataFrames)

## Related Concepts

- variance-threshold (método filter complementario, no supervisado)
- lasso-regression (selección de features via regularización L1)
- pipeline (encadenar RFE con otros pasos)
- decision-tree (alternativa para feature_importances_)
- random-forest (alternativa para feature_importances_)

## Relationship with KAFE

En KAFE, RFE se implementa como un transformador de preprocessing que extiende BaseMachine. El factory `machine.recursive_feature_elimination(estimator, n_features)` crea una instancia. Por defecto usa LinearRegression como estimador. Soporta modelos con `coef_` (lineales) y `feature_importances_` (árboles). Produce un ranking completo que permite al usuario elegir cuántas features conservar.

## Usage Examples

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

show(rfe.ranking_);          -- [1, 3, 1, 2] (features 0 y 2 son las mejores)
show(rfe.selected_indices_); -- [0, 2]
show(rfe.support_);          -- [true, false, true, false]

List[List[FLOAT]] X_new = rfe.transform(X);
show(X_new);  -- [[1.0, 3.0], [2.0, 6.0], [3.0, 9.0], [4.0, 12.0], [5.0, 15.0]]
```

## Implementation Location

- `src/lib/KafeMACHINE/preprocessing/RecursiveFeatureElimination.py`

## Public API

- `machine.recursive_feature_elimination(estimator, n_features)` — crea RFE con modelo y número de features (default: LinearRegression, 1)
- `rfe.fit(X, y)` — entrena recursivamente y selecciona features
- `rfe.transform(X)` — selecciona solo las features elegidas
- `rfe.fit_transform(X, y)` — fit + transform
- `rfe.selected_indices_` — índices de features seleccionadas
- `rfe.ranking_` — ranking de importancia (1 = más importante)
- `rfe.support_` — mascara booleana de features seleccionadas
- `rfe.n_features_in_` — número de features de entrada

## References

- Guyon, I., Weston, J., Barnhill, S., & Vapnik, V. (2002). Gene Selection for Cancer Classification using Support Vector Machines. Machine Learning, 46(1-3), 389-422.
- scikit-learn RFE: https://scikit-learn.org/stable/modules/generated/sklearn.feature_selection.RFE.html
