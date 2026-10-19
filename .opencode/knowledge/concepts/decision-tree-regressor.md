# Decision Tree Regressor

## Mathematical Foundation

Un árbol de decisión para regresión que predice valores continuos minimizando el MSE.

### Algoritmo

1. Para cada feature y umbral candidato:
   - Dividir datos en izquierda (X ≤ threshold) y derecha (X > threshold)
   - Calcular MSE reducido = MSE_parent - (n_l/n * MSE_left + n_r/n * MSE_right)
2. Seleccionar split con mayor reducción de MSE
3. Repetir recursivamente hasta condición de parada
4. Hojas predicen la media de los valores en el nodo

### MSE (Mean Squared Error)

$$MSE = \frac{1}{n} \sum_{i=1}^{n} (y_i - \bar{y})^2$$

## Complexity

| Operation | Time | Space |
|-----------|------|-------|
| Training | $O(n \cdot m \cdot \log n)$ | $O(n)$ |
| Prediction | $O(\log n)$ promedio | $O(1)$ |

## Advantages

1. **Interpretable** — fácil de visualizar y entender
2. **No necesita normalización** — invariantes a escala
3. **Captura no-linearidades** — puede modelar relaciones complejas
4. **Rápido en predicción** — O(log n) promedio

## Limitations

1. **Overfitting** — puede memorizar datos de entrenamiento
2. **Inestable** — pequeños cambios en datos cambian el árbol
3. **Sesgo hacia features con muchos valores** — bias por cardinalidad

## When to Use

- Datos con relaciones no-lineales
- Necesitas interpretabilidad
- Features de diferentes escalas

## When NOT to Use

- Datos lineales (regresión lineal es mejor)
- Overfitting es problemático (usar RandomForest)

## Implementation Location

- `src/lib/KafeMACHINE/DecisionTree.py` — DecisionTreeRegressor class

## Public API

- `machine.decision_tree_regressor(criterion, max_depth, min_samples_split, min_samples_leaf)`
- `model.fit(X, y)` — build the tree
- `model.predict(X)` — predict values
- `model.score(X, y)` — R²

## References

- Breiman, L. et al. (1984). Classification and Regression Trees.
- Quinlan, J.R. (1986). Induction of Decision Trees. Machine Learning.
