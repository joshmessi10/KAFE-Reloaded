# RandomForestRegressor

## Name

RandomForestRegressor

## Category

ML algorithm — ensemble regression

## Description

RandomForestRegressor es un ensamble de árboles de regresión que combina bagging con selección aleatoria de características. Agrega predicciones por promedio, reduciendo overfitting de árboles individuales.

## Mathematical Foundation

**Muestreo Bootstrap**: Cada árbol se entrena en una muestra aleatoria del dataset original con reemplazo (~63% de los datos únicos).

**Selección Aleatoria**: En cada split, solo se consideran $\sqrt{d}$ características.

**Criterio de Split**: Reducción de varianza — busca el split que más reduce la varianza del target en los hijos.

**Agregación**: Predicción final = promedio de predicciones de todos los árboles:

$$\hat{y} = \frac{1}{T} \sum_{t=1}^T \hat{y}_t$$

- **Time Complexity**: $O(T \cdot n \cdot d \cdot \log n)$ para entrenamiento, $O(T \cdot d)$ para predicción
- **Space Complexity**: $O(T \cdot \text{nodos})$ para almacenar los árboles

## Step-by-Step Algorithm

1. Para cada árbol $t$ en $1, \ldots, T$:
   a. Crear muestra bootstrap del dataset
   b. Construir árbol de regresión con selección aleatoria de features
   c. Cada nodo: calcular varianza del target, buscar mejor split por reducción de varianza
2. Para predicción: promediar predicciones de todos los árboles

## Motivation

Random Forest Reduce el overfitting de árboles individuales mediante bagging y selección aleatoria. Es uno de los algoritmos más utilizados por su robustez y facilidad de uso.

## Advantages

- Reduce overfitting vs árbol individual
- Maneja features numéricas y categóricas
- No requiere escalado de features
- Estimación de importancia de features
- Robusto a outliers

## Limitations

- Menos interpretable que un árbol único
- Más lento de entrenar que un árbol individual
- Puede overfittear con muy pocos datos
- No extrapolá más allá del rango visto en entrenamiento

## When to Use

- Regresión con datos tabulares
- Cuando se necesita robustez y generalización
- Features mixtas (numéricas + categóricas)

## When NOT to Use

- Cuando la interpretabilidad es crítica
- Series de tiempo con tendencia (no extrapolá)
- Datos muy pequeños (< 50 muestras)

## Dependencies

- DecisionTree (reutilizado para cada árbol)
- BaseMachine

## Related Concepts

- random-forest (classifier)
- decision-tree
- lasso-regression

## Relationship with KAFE

En KAFE, RandomForestRegressor se implementa en `RandomForest.py` junto con el Classifier. El factory `machine.random_forest_regressor(n_estimators, max_depth, min_samples_split, min_samples_leaf)` crea una instancia.

## Usage Examples

```kafe
import machine;

MACHINE rf = machine.random_forest_regressor(10, 0, 2, 1);
rf.fit(X, y);

List[FLOAT] preds = rf.predict([[1.5], [3.0], [5.5]]);
FLOAT r2 = rf.score(X, y);
```

## Implementation Location

- `src/lib/KafeMACHINE/RandomForest.py` — class `RandomForestRegressor`

## Public API

- `machine.random_forest_regressor(n_estimators, max_depth, min_samples_split, min_samples_leaf)` — crea RandomForestRegressor
- `rf.fit(X, y)` — entrena el ensamble
- `rf.predict(X)` — predice por promedio
- `rf.score(X, y)` — calcula R²
- `rf.trees_` — lista de árboles entrenados
- `rf.n_features_` — número de features

## References

- Breiman, L. (2001). Random Forests. Machine Learning, 45(1), 5-32.
- scikit-learn RandomForestRegressor: https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestRegressor.html
