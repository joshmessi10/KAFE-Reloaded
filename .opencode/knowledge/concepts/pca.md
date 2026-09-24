# PCA (Principal Component Analysis)

## Name

PCA

## Category

ML preprocessing / dimensionality reduction

## Description

PCA reduces data dimensionality by finding the directions of greatest variance (the principal components) using the Jacobi algorithm for matrix diagonalization.

## Mathematical Foundation

1. **Mean centering**: $\tilde{X} = X - \bar{X}$, where $\bar{X}$ is the mean of each feature.
2. **Covariance matrix**: $C = \frac{1}{n-1} \tilde{X}^T \tilde{X}$.
3. **Diagonalization**: Find eigenvalues $\lambda_1 \geq \lambda_2 \geq \ldots \geq \lambda_d$ and eigenvectors $v_1, v_2, \ldots, v_d$.
4. **Projection**: $X_{reduced} = \tilde{X} \cdot V_k$, where $V_k = [v_1, \ldots, v_k]$ contains the first $k$ eigenvectors.

**Varianza explicada**: $\text{EV}_i = \frac{\lambda_i}{\sum_{j=1}^d \lambda_j}$

- **Time Complexity**: $O(n \cdot d^2 + d^3)$ for `fit` (covariance computation and Jacobi diagonalization).
- **Space Complexity**: $O(d^2)$ for the covariance matrix.

## Step-by-Step Algorithm

1. **`fit(X)`**: Center the data, compute the covariance matrix, apply Jacobi to obtain eigenvalues and eigenvectors, and sort them by decreasing variance.
2. **`transform(X)`**: Project centered data onto the first $n$ components.
3. **`round(n)`**: Round internal values to $n$ decimal places.

## Motivation

PCA reduces dimensionality while preserving as much variance as possible. It is useful for visualization, noise reduction, and faster model training.

## Advantages

- Reduces dimensionality while retaining variance information.
- Removes redundancy from correlated features.
- Is unsupervised and does not require target labels.
- Provides a basis for related methods such as Kernel PCA and SVD.

## Limitations

- Captures only linear relationships.
- Is sensitive to feature scales; apply `StandardScaler` first when appropriate.
- Principal components can be difficult to interpret.
- Loses information when dimensions are removed.

## When to Use

- Visualizing high-dimensional data.
- Reducing noise.
- Preprocessing to speed up model training.
- When multicollinearity is present.

## When NOT to Use

- Nonlinear relationships (consider Kernel PCA or t-SNE).
- When interpretability is critical, since components are linear combinations of features.

## Dependencies

- BaseMachine
- PARDOS DataFrame
- KafeMATH (for matrix operations)

## Related Concepts

- standard-scaler
- pipeline
- dense-layer (en Deep Learning)

## Relationship with KAFE

In KAFE, PCA uses the Jacobi algorithm to diagonalize the covariance matrix. The factory `machine.pca(n)` creates a model with $n$ components. It supports both lists and PARDOS DataFrames.

## Usage Examples

```kafe
import pardos;
import machine;

-- Reduce from 3D to 2D
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

- `machine.pca(n_components)` — creates a PCA model with $n$ components.
- `pca.fit(X)` — fits the model.
- `pca.transform(X)` — projects data onto the principal components.
- `pca.round(n)` — rounds internal values.
- `pca.components_` — eigenvectors (principal components).
- `pca.mean_` — mean of each feature.
- `pca.explained_variance_` — variance explained by each component.

## References

- scikit-learn PCA: https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.PCA.html
- Jolliffe, I.T. (2002). Principal Component Analysis. Springer.
