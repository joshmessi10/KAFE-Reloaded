# Linear Discriminant Analysis (LDA)

## Name

Linear Discriminant Analysis

## Category

ML algorithm / dimensionality reduction / classification

## Description

LDA es una técnica de reducción de dimensionalidad supervisada que maximiza la separación entre clases. A diferencia de PCA (no supervisado), LDA usa la información de las etiquetas de clase para encontrar las direcciones de proyección que mejor discriminan entre clases. También funciona como clasificador lineal.

## Mathematical Foundation

### Objetivo

Maximizar la razón entre varianza inter-clase y varianza intra-clase:

$$J(w) = \frac{w^T S_B w}{w^T S_W w}$$

Donde:
- $S_B$ = matriz de散 inter-clase (between-class scatter)
- $S_W$ = matriz de散 intra-clase (within-class scatter)

### Matrices de散

**Within-class scatter** (varianza intra-clase):
$$S_W = \sum_{k=1}^{K} \sum_{x \in C_k} (x - \mu_k)(x - \mu_k)^T$$

**Between-class scatter** (varianza inter-clase):
$$S_B = \sum_{k=1}^{K} n_k (\mu_k - \mu)(\mu_k - \mu)^T$$

Donde:
- $\mu_k$ = media de la clase $k$
- $\mu$ = media global
- $n_k$ = número de muestras en la clase $k$
- $K$ = número de clases

### Solución

Resolver el eigenproblema generalizado:
$$S_W^{-1} S_B w = \lambda w$$

Los eigenvectores con mayor eigenvalores son las direcciones de proyección óptimas. El número máximo de componentes es $K - 1$ (menos clases).

### Complejidad Computacional

| Operación | Complejidad Temporal | Complejidad Espacial |
|-----------|---------------------|---------------------|
| fit | $O(n \cdot d^2 + d^3)$ | $O(d^2)$ |
| transform | $O(n \cdot d \cdot k)$ | $O(n \cdot k)$ |
| predict | $O(n \cdot d \cdot k)$ | $O(n \cdot k)$ |

Donde $n$ = muestras, $d$ = features, $k$ = n_components.

## Step-by-Step Algorithm

1. **Calcular medias por clase**: $\mu_k = \frac{1}{n_k} \sum_{x \in C_k} x$
2. **Calcular scatter intra-clase**: $S_W = \sum_k \sum_{x \in C_k} (x - \mu_k)(x - \mu_k)^T$
3. **Calcular scatter inter-clase**: $S_B = \sum_k n_k (\mu_k - \mu)(\mu_k - \mu)^T$
4. **Invertir $S_W$**: Usando Gauss-Jordan con pivoteo parcial
5. **Computar $M = S_W^{-1} S_B$**: Producto de matrices
6. **Simetrizar $M$**: $M_{sym} = (M + M^T) / 2$ (garantiza eigenvalores reales)
7. **Diagonalizar con Jacobi**: Obtener eigenvalores y eigenvectores
8. **Ordenar** por eigenvalores descendentes
9. **Seleccionar** los primeros $k$ eigenvectores como direcciones de proyección
10. **Proyectar**: $Y = X \cdot W$ donde $W$ son los eigenvectores seleccionados

## Motivation

LDA fue introducido por Ronald Fisher en 1936 como método de clasificación. Es fundamental en ML educativo porque:
- Demuestra la diferencia entre aprendizaje supervisado y no supervisado
- Enseña eigenproblemas y álgebra lineal aplicada
- Conecta dimensionalidad con clasificación
- Es el precursor de Fishers LDA y analisis discriminante

## Advantages

1. **Supervisado** — usa información de clases para mejor proyección que PCA
2. **Simple** — fácil de implementar e interpretar
3. **Eficiente** — entrenamiento rápido con solución cerrada
4. **Clasificador** — también funciona como clasificador lineal (predict)
5. **Máxima separación** — proyecta en direcciones que maximizan discriminación

## Limitations

1. **Asume Gaussianas** — asume distribuciones Gaussianas por clase
2. **Asume igualdad de covarianzas** — misma matriz de covarianza para todas las clases
3. **Lineal** — solo captura separación lineal
4. **n_components ≤ n_classes - 1** — restricción dimensional (máximo K-1 componentes)
5. **Sensible a outliers** — las medias y covarianzas se afectan por valores extremos

## When to Use

- Clasificación con clases bien separadas linealmente
- Reducción de dimensionalidad supervisada (antes de un clasificador)
- Datos con distribuciones Gaussianas por clase
- Pre-processing para acelerar clasificadores posteriores
- Cuando se necesita interpretabilidad (las direcciones tienen sentido discriminativo)

## When NO Usar

- Relaciones no-lineales (usar Kernel LDA o PCA)
- Clases con covarianzas muy diferentes (usar Quadratic Discriminant Analysis)
- Datos categóricos sin transformación previa
- Muchas clases con pocas muestras (maldición de dimensionalidad)
- Cuando la distribución no es Gaussiana

## Dependencies

- BaseMachine
- KafeMATH (sqrt, pow_ para Jacobi)
- metrics.py (accuracy_score)

## Related Concepts

- pca — no supervisado, maximiza varianza total
- logistic-regression — clasificador lineal probabilístico
- svm — clasificador de máximo margen
- gaussian-naive-bayes — clasificador probabilístico con independencia

## Relationship with KAFE

En KAFE, LDA se implementa desde cero usando:
- **Jacobi** para diagonalización de la matriz $S_W^{-1} S_B$ (misma técnica que PCA)
- **Gauss-Jordan** con pivoteo parcial para invertir $S_W$
- Producto de matrices manual para $M = S_W^{-1} S_B$
- El factory `machine.linear_discriminant_analysis(n_components)` crea un modelo con n componentes
- Soporta fit, transform, fit_transform, predict, y score
- Predicción por distancia euclídea en el espacio proyectado

## Usage Examples

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 3.0],
                        [6.0, 5.0], [7.0, 7.0], [8.0, 6.0]];
List[INT] y = [0, 0, 0, 1, 1, 1];

-- Reducir de 2D a 1D y clasificar
MACHINE lda = machine.linear_discriminant_analysis(1);
lda.fit(X, y);

-- Transformar al espacio de menor dimensionalidad
List[List[FLOAT]] X_proj = lda.transform(X);
show(X_proj);

-- Predecir clases
List[INT] preds = lda.predict([[2.0, 2.0], [7.0, 7.0]]);
show(preds);  -- [0, 1]

-- Evaluar accuracy
FLOAT acc = lda.score(X, y);
show(acc);  -- 1.0
```

## Implementation Location

- `src/lib/KafeMACHINE/LinearDiscriminantAnalysis.py`

## Public API

- `machine.linear_discriminant_analysis(n_components)` — crea LDA con n componentes
- `lda.fit(X, y)` — ajusta el modelo (calcula scatter matrices y eigenvectores)
- `lda.transform(X)` — proyecta en el espacio de menor dimensionalidad
- `lda.fit_transform(X, y)` — fit + transform en un paso
- `lda.predict(X)` — predice clases por distancia en espacio proyectado
- `lda.score(X, y, metric)` — calcula accuracy (default) o métrica personalizada
- `lda.scalings_` — eigenvectores (direcciones de proyección)
- `lda.explained_variance_ratio_` — proporción de varianza explicada por componente
- `lda.means_` — medias por clase
- `lda.classes_` — clases únicas
- `lda.prior_` — probabilidades a priori de cada clase

## References

- Fisher, R.A. (1936). The use of multiple measurements in taxonomic problems. Annals of Eugenics.
- scikit-learn LDA: https://scikit-learn.org/stable/modules/generated/sklearn.discriminant_analysis.LinearDiscriminantAnalysis.html
- Duda, R.O., Hart, P.E. (2000). Pattern Classification. Wiley.
