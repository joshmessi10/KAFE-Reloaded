# PCA (Principal Component Analysis)

## Name

PCA

## Category

ML preprocessing / dimensionality reduction

## Description

PCA reduce la dimensionalidad de los datos encontrando las direcciones de mayor varianza (componentes principales) mediante el algoritmo de Jacobi para diagonalización de matrices.

## Mathematical Foundation

1. **Centrado de media**: $\tilde{X} = X - \bar{X}$ donde $\bar{X}$ es la media de cada feature
2. **Matriz de covarianza**: $C = \frac{1}{n-1} \tilde{X}^T \tilde{X}$
3. **Diagonalización**: Encontrar valores propios $\lambda_1 \geq \lambda_2 \geq \ldots \geq \lambda_d$ y vectores propios $v_1, v_2, \ldots, v_d$
4. **Proyección**: $X_{reduced} = \tilde{X} \cdot V_k$ donde $V_k = [v_1, \ldots, v_k]$ son los primeros $k$ vectores propios

**Varianza explicada**: $\text{EV}_i = \frac{\lambda_i}{\sum_{j=1}^d \lambda_j}$

- **Time Complexity**: $O(n \cdot d^2 + d^3)$ para fit (covarianza + Jacobi)
- **Space Complexity**: $O(d^2)$ para la matriz de covarianza

## Step-by-Step Algorithm

1. **fit(X)**: Centrar datos, calcular matriz de covarianza, aplicar Jacobi para obtener valores/vectores propios, ordenar por varianza descendente
2. **transform(X)**: Proyectar datos centrados en los primeros $n$ componentes
3. **round(n)**: Redondear valores internos a n decimales

## Motivation

PCA reduce la dimensionalidad preservando la máxima varianza. Es útil para visualización, reducción de ruido, y acelerar el entrenamiento de modelos.

## Advantages

- Reduce dimensionalidad preservando información (varianza)
- Elimina redundancia (features correlacionadas)
- Sin parámetros supervisados (unsupervised)
- Base para otros algoritmos (Kernel PCA, SVD)

## Limitations

- Solo captura relaciones lineales
- Sensible a la escala de features (requiere StandardScaler previo)
- Los componentes principales pueden ser difíciles de interpretar
- Pierde información al reducir dimensiones

## When to Use

- Visualización de datos de alta dimensionalidad
- Reducción de ruido
- Preprocessing antes de modelar (acelerar entrenamiento)
- Cuando hay multicolinealidad

## When NOT to Use

- Relaciones no lineales (usar Kernel PCA o t-SNE)
- Cuando la interpretabilidad es crítica (los componentes son combinaciones lineales)

## Dependencies

- BaseMachine
- PARDOS DataFrame
- KafeMATH (para operaciones matriciales)

## Related Concepts

- standard-scaler
- pipeline
- dense-layer (en Deep Learning)

## Relationship with KAFE

En KAFE, PCA se implementa usando el algoritmo de Jacobi para diagonalización de la matriz de covarianza. El factory `machine.pca(n)` crea un modelo con n componentes. Soporta tanto listas como PARDOS DataFrames.

## Usage Examples

```kafe
import pardos;
import machine;

-- Reducir de 3D a 2D
MACHINE pca_model = machine.pca(2);
pca_model.fit(df);
pca_model.round(4);

show(pca_model.mean_);
show(pca_model.explained_variance_);

PARDOS reduced = pca_model.transform(df);
show(reduced.round(4));
```

## Implementation Location

- `src/lib/KafeMACHINE/preprocessing/PCA.py`

## Public API

- `machine.pca(n_components)` — crea PCA con n componentes
- `pca.fit(X)` — ajusta el modelo
- `pca.transform(X)` — proyecta en componentes principales
- `pca.round(n)` — redondea valores internos
- `pca.components_` — vectores propios (componentes)
- `pca.mean_` — media de cada feature
- `pca.explained_variance_` — varianza por componente

## References

- scikit-learn PCA: https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html
- Jolliffe, I.T. (2002). Principal Component Analysis. Springer.
