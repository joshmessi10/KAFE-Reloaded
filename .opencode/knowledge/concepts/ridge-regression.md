# Ridge Regression

## Mathematical Foundation

Ridge Regression es una variante de regresión lineal con **regularización L2** que penaliza coeficientes grandes para reducir overfitting.

### Objetivo

Minimizar la función de coste:

$$J(\theta) = ||y - X\theta||^2 + \alpha||\theta||^2$$

Donde:
- $||y - X\theta||^2$ es el error de ajuste (sum of squared errors)
- $\alpha||\theta||^2$ es la penalización L2 (suma de cuadrados de coeficientes)
- $\alpha$ controla la fuerza de regularización

### Solución Cerrada

$$\theta = (X^T X + \alpha I)^{-1} X^T y$$

Donde $I$ es la matriz identidad. El término $\alpha I$ hace que la matriz sea siempre invertible.

### Propiedades

- **α = 0**: Equivale a OLS (sin regularización)
- **α → ∞**: Todos los coeficientes tienden a 0 (pero nunca llegan a 0 exactamente)
- **Coeficientes reducidos**: Todos los coeficientes se reducen proporcionalmente, pero ninguno se elimina

## Complejidad Computacional

| Operación | Complejidad Temporal | Complejidad Espacial |
|-----------|---------------------|---------------------|
| Training | $O(n \cdot m^2 + m^3)$ | $O(m^2)$ |
| Prediction | $O(m)$ | $O(1)$ |

Donde $n$ = muestras, $m$ = features.

## Ventajas

1. **Reduce overfitting** — penalización L2 suaviza el modelo
2. **Siempre tiene solución** — $\alpha I$ hace la matriz invertible
3. **Estable numéricamente** — mejor que OLS en datos colineales
4. **Coeficientes proporcionales** — interpretables

## Limitaciones

1. **No elimina features** — todos los coeficientes permanecen ≠ 0
2. **Sensible a escala** — requiere normalización de features
3. **Un solo hiperparámetro** — α debe ajustarse por cross-validation

## Cuando Usar

- Features colineales (alta correlación)
- Muchos features, pocos samples
- Overfitting con OLS
- No necesitas selección de features

## Cuando NO Usar

- Necesitas selección de features (usar Lasso)
- Pocos features, sufficients samples
- Interpretabilidad máxima requerida

## Relación con KAFE

KAFE implementa RidgeRegression con solución cerrada via Gaussian elimination con pivoteo parcial. Soporta `fit_intercept` con centrado de datos.

## References

- Hoerl, A. E., & Kennard, R. W. (1970). Ridge Regression: Biased Estimation for Nonorthogonal Problems. *Technometrics*, 12(1), 55-67.
- Hastie, T., Tibshirani, R., & Friedman, J. (2009). *The Elements of Statistical Learning*. Springer. Section 3.4.1.
