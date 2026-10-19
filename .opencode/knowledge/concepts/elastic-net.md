# ElasticNet

## Name

ElasticNet — Regularización Combinada L1 + L2

## Category

ML algorithm (linear regression with regularization)

## Description

ElasticNet es un modelo de regresión lineal que combina las regularizaciones L1 (Lasso) y L2 (Ridge) en un solo modelo. Minimiza la pérdida cuadrática加上 una penalización que es una mezcla de la norma L1 y la norma L2 de los coeficientes. Esto permite simultáneamente selección de features (vía L1) y manejo de features correlacionadas (vía L2).

## Mathematical Foundation

**Función de coste**:

$$J(\theta) = \frac{1}{2n} \|y - X\theta\|^2 + \alpha \cdot \lambda \cdot \|\theta\|_1 + \alpha \cdot (1 - \lambda) \cdot \|\theta\|_2^2$$

Donde:

- $\alpha$ es la fuerza total de regularización
- $\lambda$ es el parámetro `l1_ratio` (proporción L1 vs L2)
- $\|\theta\|_1 = \sum |\theta_j|$ (norma L1 — promueve sparsity)
- $\|\theta\|_2^2 = \sum \theta_j^2$ (norma L2 — penaliza coeficientes grandes)

**Casos especiales**:

| l1_ratio | Modelo | Regularización |
|----------|--------|----------------|
| 1.0 | Lasso | Solo L1 |
| 0.0 | Ridge | Solo L2 |
| (0, 1) | ElasticNet | Combinación L1 + L2 |

**Algoritmo**: Coordinate Descent con soft-thresholding:

Para cada coeficiente $\theta_j$:

1. Calcular el residual parcial: $r_j = X_j^T (y - X_{-j}\theta_{-j})$
2. Aplicar soft-thresholding: $\theta_j = \frac{S(r_j/n, \alpha\lambda)}{1 + \alpha(1-\lambda)/n}$

Donde $S(z, \gamma) = \text{sign}(z) \cdot \max(|z| - \gamma, 0)$ es el operador de soft-thresholding.

**Complejidad**:

- **Tiempo de entrenamiento**: $O(n_{iter} \cdot n \cdot d)$ donde $n_{iter}$ es el número de iteraciones hasta convergencia
- **Tiempo de predicción**: $O(n \cdot d)$
- **Espacio**: $O(d)$ para los coeficientes

## Step-by-Step Algorithm

1. **Validar parámetros**: $\alpha \geq 0$, $0 \leq \lambda \leq 1$, $n_{iter} > 0$.
2. **Centrar datos** (si `fit_intercept=true`): Calcular media de X y y, restarla.
3. **Inicializar coeficientes**: $\theta = [0, 0, \ldots, 0]$.
4. **Pre-calcular**: $X^T X$ y $X^T y$ (matrices de Gram).
5. **Iterar Coordinate Descent**:
   a. Para cada feature $j$:
      - Calcular residual parcial $r_j$ excluyendo la contribución de $\theta_j$.
      - Calcular el valor actualizado: $\theta_j \leftarrow \frac{S(r_j/n, \alpha\lambda/n)}{1 + \alpha(1-\lambda)/n}$.
   b. Verificar convergencia: si $\max|\theta_j^{new} - \theta_j^{old}| < tol$, parar.
6. **Calcular intercepto**: $\theta_0 = \bar{y} - \bar{X}^T\theta$.
7. **Retornar coeficientes e intercepto**.

## Motivation

Lasso (L1) puede eliminar features pero es inestable con features correlacionadas (elige una al azar). Ridge (L2) maneja correlaciones pero no puede eliminar features. ElasticNet combina ambos: selección de features + estabilidad con correlaciones.

## Advantages

- **Selección de features**: L1 puede poner coeficientes en 0 exacto, eliminando features irrelevantes.
- **Manejo de correlaciones**: L2 mantiene coeficientes de features correlacionadas estables (no elimina uno al azar).
- **Grupos de features**: Puede seleccionar grupos de features correlacionadas juntas.
- **Flexible**: Un solo parámetro (`l1_ratio`) controla el balance L1/L2.
- **Convergencia garantizada**: Coordinate Descent con soft-thresholding converge en problemas convexos.

## Limitations

- **Dos hiperparámetros**: Requiere ajustar tanto `alpha` como `l1_ratio`, más complejo que Ridge o Lasso individual.
- **No hay solución cerrada**: Unlike Ridge, no tiene fórmula analítica; requiere iteración.
- **Sensible a escalado**: Las features deben estar escaladas para que la regularización sea justa.
- **No Captura No Linealidad**: Es un modelo lineal; no puede ajustar relaciones no lineales sin PolynomialFeatures.

## When to Use

- Cuando hay muchas features y se sospecha que algunas son irrelevantes (selección de features).
- Cuando hay features altamente correlacionadas (ej: one-hot encoding de categorías).
- Cuando Lasso elimina demasiadas features o Ridge no puede eliminar ninguna.
- Para datasets de dimensionalidad media-alta con ruido.

## When NOT to Use

- Cuando el número de features es muy pequeño (< 10) — Ridge o Lasso son suficientes.
- Cuando la relación features→target es no lineal — usar SVR, Random Forest, o PolynomialFeatures.
- Cuando la interpretabilidad absoluta de coeficientes es crítica — Lasso produce modelos más sparse.
- Cuando hay muestras muy pocas (< features) — riesgo de overfitting extremo.

## Dependencies

- `BaseMachine` (superclass)
- `r2_score` from `metrics.py` (for score method)
- `check_sig` from global_utils (signature validation)

## Related Concepts

- RidgeRegression — ElasticNet con `l1_ratio=0`
- LassoRegression — ElasticNet con `l1_ratio=1`
- LinearRegression — ElasticNet sin regularización (`alpha=0`)
- Coordinate Descent — algoritmo de optimización utilizado
- Soft-thresholding — operador de sparsity

## Relationship with KAFE

ElasticNet se implementó en KafeMACHINE siguiendo el contrato de BaseMachine:

- `fit(X, y)` ejecuta Coordinate Descent con soft-thresholding para ajustar los coeficientes.
- `predict(X)` retorna $\theta_0 + X\theta$.
- `score(X, y)` calcula R² usando `r2_score` de `metrics.py`.
- Validación de hiperparámetros en `__init__()`: $\alpha \geq 0$, $0 \leq \lambda \leq 1$, $n_{iter} > 0$.
- Soporte nativo para PARDOS DataFrames via `_unwrap_data()`.
- Intercepto calculado separadamente (centrado de datos).

La implementación usa las matrices de Gram ($X^T X$, $X^T y$) para eficiencia, evitando recalcular productos en cada iteración.

## Usage Examples

```kafe
import machine;

-- Crear ElasticNet con alpha=1.0 y l1_ratio=0.5 (50% L1, 50% L2)
MACHINE en = machine.elastic_net(1.0, 0.5);

-- Datos de entrada
List[List[FLOAT]] X = [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0], [7.0, 8.0]];
List[FLOAT] y = [2.0, 4.0, 6.0, 8.0];

-- Entrenar
en.fit(X, y);

-- Predecir
List[FLOAT] preds = en.predict([[2.0, 3.0], [6.0, 7.0]]);
show(preds);

-- Coeficientes (algunos pueden ser 0 si l1_ratio es alto)
show(en.coef_);
show(en.intercept_);

-- Evaluar con R²
FLOAT r2 = en.score(X, y);
show(r2);

-- Combinar con PolynomialFeatures para no linealidad
MACHINE pf = machine.polynomial_features(2, false);
MACHINE en2 = machine.elastic_net(0.5, 0.5);
MACHINE pipe = machine.pipeline("poly", pf, "model", en2);
pipe.fit(X_train, y_train);
```

## Implementation Location

- File: `src/lib/KafeMACHINE/ElasticNet.py`

## Public API

```kafe
-- Factory function
MACHINE en = machine.elastic_net(alpha, l1_ratio, fit_intercept, max_iter);

-- Parameters:
-- alpha: FLOAT (default 1.0) — fuerza de regularización
-- l1_ratio: FLOAT (default 0.5) — proporción L1 vs L2 (0=Ridge, 1=Lasso)
-- fit_intercept: BOOL (default true) — si se ajusta intercepto
-- max_iter: INT (default 1000) — máximo de iteraciones

-- Methods:
en.fit(X, y)       -> MACHINE
en.predict(X)      -> List[FLOAT]
en.score(X, y)     -> FLOAT

-- Properties (after fit):
en.coef_     -> List[FLOAT]
en.intercept_ -> FLOAT
```

## References

- Zou, H. and Hastie, T. (2005). "Regularization and variable selection via the elastic net." Journal of the Royal Statistical Society: Series B, 67(2), 301-320.
- Friedman, J. et al. (2010). "Regularization paths for generalized linear models via coordinate descent." Journal of Statistical Software, 33(1), 1-22.
- Scikit-learn documentation: `sklearn.linear_model.ElasticNet`
