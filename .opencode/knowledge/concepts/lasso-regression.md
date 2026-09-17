# Lasso Regression

## Mathematical Foundation

Lasso (Least Absolute Shrinkage and Selection Operator) es una regresión lineal con **regularización L1** que puede eliminar features completamente.

### Objetivo

Minimizar la función de coste:

$$J(\theta) = ||y - X\theta||^2 + \alpha||\theta||_1$$

Donde:
- $||y - X\theta||^2$ es el error de ajuste
- $\alpha||\theta||_1$ es la penalización L1 (suma de valores absolutos)
- $\alpha$ controla la fuerza de regularización

### Solución: Coordinate Descent

No hay solución cerrada para L1. Se usa **Coordinate Descent**:

Para cada coeficiente $\theta_j$:

$$\theta_j \leftarrow S\left(\frac{X_j^T r_j}{X_j^T X_j}, \frac{\alpha}{X_j^T X_j}\right)$$

Donde $S$ es el operador de **soft-thresholding**:

$$S(z, \lambda) = \text{sign}(z) \max(|z| - \lambda, 0)$$

### Propiedades

- **α = 0**: Equivale a OLS
- **α → ∞**: Todos los coeficientes llegan a 0 exactamente
- **Selección de features**: El soft-thresholding puede poner coeficientes en 0 exacto
- **Sparse models**: Genera modelos con pocos features no nulos

## Complejidad Computacional

| Operación | Complejidad Temporal | Complejidad Espacial |
|-----------|---------------------|---------------------|
| Training | $O(n \cdot m \cdot T)$ | $O(m^2)$ |
| Prediction | $O(m)$ | $O(1)$ |

Donde $n$ = muestras, $m$ = features, $T$ = iteraciones.

## Ventajas

1. **Selección de features** — elimina features irrelevantes (coef = 0)
2. **Modelos sparse** — fáciles de interpretar
3. **Reduce overfitting** — regularización L1
4. **Maneja colineales** — selecciona una feature de cada grupo correlacionado

## Limitaciones

1. **Sin solución cerrada** — requiere iteraciones
2. **Inestable con features correlacionadas** — selección arbitraria
3. **Máximo n features** — no puede seleccionar más features que samples
4. **Sensible a escala** — requiere normalización

## Cuando Usar

- Muchos features, pocos relevantes
- Necesitas interpretabilidad (modelo sparse)
- Selección de features automática
- Overfitting con muchos features

## Cuando NO Usar

- Features altamente correlacionadas (usar Ridge)
- Todos los features son relevantes
- p >> n (más features que samples)

## Relación con KAFE

KAFE implementa LassoRegression con Coordinate Descent y soft-thresholding. El algoritmo itera sobre cada coeficiente, actualizando uno a la vez hasta convergencia.

## References

- Tibshirani, R. (1996). Regression Shrinkage and Selection via the Lasso. *Journal of the Royal Statistical Society*, 58(1), 267-288.
- Hastie, T., Tibshirani, R., & Friedman, J. (2009). *The Elements of Statistical Learning*. Springer. Section 3.4.3.
