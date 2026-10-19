# Gradient Boosting Regressor

## Mathematical Foundation

Gradient Boosting Regressor construye árboles de regresión secuencialmente para minimizar el error cuadrático medio (MSE) usando gradient descent.

### Algoritmo

1. **Inicializar**: $F_0(x) = \bar{y} = \frac{1}{n}\sum_{i=1}^{n} y_i$
2. **Para cada iteración t = 1, ..., T**:
   - Calcular residuos: $r_i = y_i - F_{t-1}(x_i)$
   - Entrenar árbol $h_t$ para predecir residuos $r_i$
   - Actualizar: $F_t(x) = F_{t-1}(x) + \eta \cdot h_t(x)$
3. **Predicción**: $H(x) = F_T(x)$

### Función de Pérdida

Para regresión, Gradient Boosting minimiza el **MSE** (Mean Squared Error):

$$\mathcal{L}(y, F) = \frac{1}{2}(y - F)^2$$

Los pseudo-residuos son el negativo del gradiente:

$$r_i = -\frac{\partial \mathcal{L}(y_i, F(x_i))}{\partial F(x_i)} = y_i - F(x_i)$$

### Subsampling

GradientBoostingRegressor soporta **stochastic gradient boosting** via el parámetro `subsample`:
- Muestrea aleatoriamente una fracción de datos en cada iteración
- Reduce overfitting y acelera entrenamiento

## Complejidad Computacional

| Operación | Complejidad Temporal | Complejidad Espacial |
|-----------|---------------------|---------------------|
| Training | $O(T \cdot n \cdot m \cdot d)$ | $O(T \cdot n)$ |
| Prediction | $O(T \cdot d)$ | $O(1)$ |

Donde $T$ = n_estimators, $n$ = muestras, $m$ = features, $d$ = max_depth.

## Ventajas

1. **Alta precisión** — generalmente mejor que regresión lineal y Random Forest
2. **Captura no-linearidades** — árboles capturan patrones complejos
3. **Feature importance** — importancia por feature
4. **Robusto a outliers** — menos sensible que regresión lineal
5. **Stochastic boosting** — subsampling reduce overfitting

## Limitaciones

1. **Overfitting** — más susceptible que Random Forest
2. **Secuencial** — no se puede paralelizar
3. **Sensible a hiperparámetros** — learning_rate y n_estimators
4. **Más lento** — entrenamiento secuencial

## Cuando Usar

- Regresión no lineal
- Necesitas máxima precisión
- Tienes tiempo para tuning de hiperparámetros
- Datos con patrones complejos

## Cuando NO Usar

- Datos con mucho ruido (puede overfittear)
- Datasets muy grandes (entrenamiento secuencial)
- Necesitas paralelización (usar Random Forest)
- Relaciones puramente lineales (usar regresión lineal)

## Relación con KAFE

KAFE implementa GradientBoostingRegressor desde scratch:
- Árboles de regresión como weak learners
- Función de pérdida MSE (cuadrática)
- Predicción inicial = media de y
- Stochastic gradient boosting via subsampling
- API estilo scikit-learn: `fit()`, `predict()`, `score()` (R²)

## References

- Friedman, J. H. (2001). Greedy function approximation: A gradient boosting machine. *Annals of Statistics*.
- Friedman, J. H. (2002). Stochastic gradient boosting. *Computational Statistics & Data Analysis*.
