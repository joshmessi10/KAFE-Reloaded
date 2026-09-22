# KNN Regressor

## Mathematical Foundation

K-Nearest Neighbors para regresión que predice el promedio de los k vecinos más cercanos.

### Algoritmo

1. Calcular distancia a todos los puntos de entrenamiento
2. Seleccionar los k vecinos más cercanos
3. Predecir:

$$\hat{y} = \frac{1}{k} \sum_{i=1}^{k} y_i$$

### Pesos (weights)

- **uniform**: promedio simple
- **distance**: promedio ponderado por distancia inversa

$$\hat{y} = \frac{\sum_{i=1}^{k} w_i \cdot y_i}{\sum_{i=1}^{k} w_i}, \quad w_i = \frac{1}{d_i + \epsilon}$$

## Complexity

| Operation | Time | Space |
|-----------|------|-------|
| Training | $O(1)$ | $O(n \cdot m)$ |
| Prediction | $O(n \cdot m)$ | $O(n)$ |

## Advantages

1. **Simple** — fácil de entender e implementar
2. **No necesita entrenamiento** — lazy learning
3. **Adaptable** — captura relaciones locales
4. **Sin supuestos** — no asume distribución

## Limitations

1. **Lento en predicción** — debe calcular distancias a todos los puntos
2. **Sensible a dimensionalidad** — curse of dimensionality
3. **Sensible a outliers** — vecinos ruidosos afectan predicción
4. **Requiere normalización** — distancias dependen de escala

## When to Use

- Dataset pequeños/medianos
- Datos con patrones locales
- Necesitas algo simple y rápido de implementar

## When NOT to Use

- Dataset grandes (lento en predicción)
- Muchas features (curse of dimensionality)
- Datos con outliers (afectan predicción)

## Implementation Location

- `src/lib/KafeMACHINE/KNN.py` — KNNRegressor class

## Public API

- `machine.knn_regressor(k)`
- `model.fit(X, y)` — store training data
- `model.predict(X)` — predict values
- `model.score(X, y)` — R²

## References

- Cover & Hart (1967) — Nearest Neighbor Pattern Classification
