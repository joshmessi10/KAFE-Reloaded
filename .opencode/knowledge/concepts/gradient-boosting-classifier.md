# Gradient Boosting Classifier

## Mathematical Foundation

Gradient Boosting Classifier es un ensemble method que construye árboles secuencialmente, donde cada árbol corrige los errores del anterior usando gradient descent sobre la función de pérdida log-loss.

### Algoritmo

1. **Inicializar**: $F_0(x) = 0.5 \cdot \ln\left(\frac{1-p}{p}\right)$ donde $p$ es la proporción de la clase positiva
2. **Para cada iteración t = 1, ..., T**:
   - Calcular probabilidades: $p_i = \sigma(F_{t-1}(x_i))$
   - Calcular residuos: $r_i = y_i - p_i$ (pseudo-residuos)
   - Entrenar árbol $h_t$ para predecir residuos $r_i$
   - Actualizar: $F_t(x) = F_{t-1}(x) + \eta \cdot h_t(x)$
3. **Predicción**: $H(x) = \sigma(F_T(x))$

Donde $\sigma(x) = \frac{1}{1 + e^{-x}}$ es la función sigmoide.

### Función de Pérdida

Para clasificación binaria, Gradient Boosting minimiza la **log-loss** (deviance):

$$\mathcal{L}(y, F) = -y \cdot \log(p) - (1-y) \cdot \log(1-p)$$

Los pseudo-residuos son el negativo del gradiente de la pérdida respecto al score:

$$r_i = -\frac{\partial \mathcal{L}(y_i, F(x_i))}{\partial F(x_i)} = y_i - \sigma(F(x_i))$$

### Subsampling

GradientBoostingClassifier soporta **stochastic gradient boosting** via el parámetro `subsample`:
- Muestrea aleatoriamente una fracción de datos en cada iteración
- Reduce overfitting y acelera entrenamiento
- Análogo al bagging pero en el contexto de boosting

## Complejidad Computacional

| Operación | Complejidad Temporal | Complejidad Espacial |
|-----------|---------------------|---------------------|
| Training | $O(T \cdot n \cdot m \cdot d)$ | $O(T \cdot n)$ |
| Prediction | $O(T \cdot d)$ | $O(1)$ |

Donde $T$ = n_estimators, $n$ = muestras, $m$ = features, $d$ = max_depth.

## Ventajas

1. **Alta precisión** — generalmente mejor que Random Forest
2. **Flexible** — soporta diversas funciones de pérdida
3. **Feature importance** — se puede calcular importancia por feature
4. **No necesita normalización** — árboles son invariantes a escala
5. **Stochastic boosting** — subsampling reduce overfitting

## Limitaciones

1. **Overfitting** — más susceptible que Random Forest
2. **Secuencial** — no se puede paralelizar
3. **Sensible a hiperparámetros** — learning_rate y n_estimators interactúan
4. **Más lento** — entrenamiento secuencial
5. **Solo binario** — nativamente solo clasificación binaria

## Cuando Usar

- Clasificación binaria
- Necesitas máxima precisión
- Tienes tiempo para tuning de hiperparámetros
- Datos limpios (sin mucho ruido)

## Cuando NO Usar

- Datos con mucho ruido (puede overfittear)
- Datasets muy grandes (entrenamiento secuencial)
- Necesitas paralelización (usar Random Forest)
- Clasificación multiclase (usar otro enfoque)

## Relación con KAFE

KAFE implementa GradientBoostingClassifier desde scratch:
- Árboles de regresión como weak learners
- Función de pérdida log-loss (deviance)
- Sigmoide numéricamente estable
- Stochastic gradient boosting via subsampling
- API estilo scikit-learn: `fit()`, `predict()`, `score()`

## References

- Friedman, J. H. (2001). Greedy function approximation: A gradient boosting machine. *Annals of Statistics*.
- Friedman, J. H. (2002). Stochastic gradient boosting. *Computational Statistics & Data Analysis*.
