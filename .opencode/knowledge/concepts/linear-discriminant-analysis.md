# Linear Discriminant Analysis (LDA)

## Name

Linear Discriminant Analysis

## Category

ML algorithm / dimensionality reduction / classification

## Description

LDA is a supervised dimensionality-reduction technique that maximizes separation between classes. Unlike unsupervised PCA, LDA uses class labels to find projection directions that best discriminate among classes. It can also serve as a linear classifier.

## Mathematical Foundation

### Objective

Maximize the ratio of between-class to within-class variance:

$$J(w) = \frac{w^T S_B w}{w^T S_W w}$$

Where:
- $S_B$ = between-class scatter matrix.
- $S_W$ = within-class scatter matrix.

### Scatter Matrices

**Within-class scatter**:

$$S_W = \sum_{k=1}^{K} \sum_{x \in C_k} (x - \mu_k)(x - \mu_k)^T$$

**Between-class scatter**:

$$S_B = \sum_{k=1}^{K} n_k (\mu_k - \mu)(\mu_k - \mu)^T$$

Where:
- $\mu_k$ = mean of class $k$.
- $\mu$ = global mean.
- $n_k$ = number of samples in class $k$.
- $K$ = number of classes.

### Solution

Solve the generalized eigenvalue problem:

$$S_W^{-1} S_B w = \lambda w$$

Eigenvectors with the largest eigenvalues are the optimal projection directions. The maximum number of components is $K - 1$ (one less than the number of classes).

### Computational Complexity

| Operation | Time Complexity | Space Complexity |
|-----------|-----------------|------------------|
| `fit` | $O(n \cdot d^2 + d^3)$ | $O(d^2)$ |
| `transform` | $O(n \cdot d \cdot k)$ | $O(n \cdot k)$ |
| `predict` | $O(n \cdot d \cdot k)$ | $O(n \cdot k)$ |

Where $n$ = number of samples, $d$ = number of features, and $k$ = `n_components`.

## Step-by-Step Algorithm

1. **Compute per-class means**: $\mu_k = \frac{1}{n_k} \sum_{x \in C_k} x$.
2. **Compute within-class scatter**: $S_W = \sum_k \sum_{x \in C_k} (x - \mu_k)(x - \mu_k)^T$.
3. **Compute between-class scatter**: $S_B = \sum_k n_k (\mu_k - \mu)(\mu_k - \mu)^T$.
4. **Invert $S_W$** using Gauss-Jordan elimination with partial pivoting.
5. **Compute $M = S_W^{-1} S_B$** by matrix multiplication.
6. **Symmetrize $M$**: $M_{sym} = (M + M^T) / 2$ to ensure real eigenvalues.
7. **Diagonalize with Jacobi** to obtain eigenvalues and eigenvectors.
8. **Sort** by descending eigenvalue.
9. **Select** the first $k$ eigenvectors as projection directions.
10. **Project**: $Y = X \cdot W$, where $W$ contains the selected eigenvectors.

## Motivation

Ronald Fisher introduced LDA in 1936 as a classification method. It is useful in ML education because it:
- Demonstrates the difference between supervised and unsupervised learning.
- Teaches eigenproblems and applied linear algebra.
- Connects dimensionality reduction with classification.
- Introduces Fisher's linear discriminant and discriminant analysis.

## Advantages

1. **Supervised** — uses class information to find projections that separate classes.
2. **Simple** — straightforward to implement and interpret.
3. **Efficient** — training has a closed-form solution.
4. **Classifier** — can also predict class labels.
5. **Discriminative projections** — maximizes class separation.

## Limitations

1. **Gaussian assumption** — assumes a Gaussian distribution for each class.
2. **Equal covariance assumption** — assumes the same covariance matrix for every class.
3. **Linear** — captures only linear separation.
4. **Component limit** — `n_components <= n_classes - 1`.
5. **Outlier sensitivity** — means and covariance estimates are affected by extreme values.

## When to Use

- Classification with classes that are approximately linearly separable.
- Supervised dimensionality reduction before another classifier.
- Data whose class distributions are approximately Gaussian.
- Preprocessing to reduce the cost of a later classifier.
- When interpretable discriminant directions are useful.

## When NOT to Use

- Nonlinear relationships (consider Kernel LDA or PCA).
- Classes with substantially different covariance matrices (consider Quadratic Discriminant Analysis).
- Categorical data without prior transformation.
- Many classes with few samples (high-dimensionality risk).
- Data that are far from Gaussian.

## Dependencies

- BaseMachine.
- KafeMATH (`sqrt`, `pow_` for Jacobi calculations).
- `metrics.py` (`accuracy_score`).

## Related Concepts

- `pca.md` — unsupervised method that maximizes total variance.
- `logistic-regression.md` — probabilistic linear classifier.
- `svm.md` — maximum-margin classifier.
- `gaussian-naive-bayes.md` — probabilistic classifier with a conditional-independence assumption.

## Relationship with KAFE

KAFE implements LDA from scratch using:
- **Jacobi diagonalization** for $S_W^{-1} S_B$ (the same technique used by PCA).
- **Gauss-Jordan elimination** with partial pivoting to invert $S_W$.
- Manual matrix multiplication to compute $M = S_W^{-1} S_B$.
- The `machine.linear_discriminant_analysis(n_components)` factory.
- `fit`, `transform`, `fit_transform`, `predict`, and `score` methods.
- Euclidean distance in the projected space for prediction.

## Usage Examples

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 3.0],
                       [6.0, 5.0], [7.0, 7.0], [8.0, 6.0]];
List[INT] y = [0, 0, 0, 1, 1, 1];

-- Reduce from 2D to 1D and classify
MACHINE lda = machine.linear_discriminant_analysis(1);
lda.fit(X, y);

-- Transform into the lower-dimensional space
List[List[FLOAT]] X_proj = lda.transform(X);
show(X_proj);

-- Predict classes
List[INT] preds = lda.predict([[2.0, 2.0], [7.0, 7.0]]);
show(preds);  -- [0, 1]

-- Evaluate accuracy
FLOAT acc = lda.score(X, y);
show(acc);  -- 1.0
```

## Implementation Location

- `src/lib/KafeMACHINE/discriminant/LinearDiscriminantAnalysis.py`

## Public API

- `machine.linear_discriminant_analysis(n_components)` creates an LDA model with the requested number of components.
- `lda.fit(X, y)` fits the model (computes scatter matrices and eigenvectors).
- `lda.transform(X)` projects data into the lower-dimensional space.
- `lda.fit_transform(X, y)` fits and transforms in one step.
- `lda.predict(X)` predicts classes by distance in the projected space.
- `lda.score(X, y, metric)` computes accuracy by default or a custom metric.
- `lda.scalings_` contains the eigenvectors (projection directions).
- `lda.explained_variance_ratio_` contains the explained-variance ratio per component.
- `lda.means_` contains the per-class means.
- `lda.classes_` contains the unique classes.
- `lda.prior_` contains the prior probability for each class.

## References

- Fisher, R. A. (1936). The use of multiple measurements in taxonomic problems. *Annals of Eugenics*.
- scikit-learn LDA: https://scikit-learn.org/stable/modules/generated/sklearn.discriminant_analysis.LinearDiscriminantAnalysis.html
- Duda, R. O., & Hart, P. E. (2000). *Pattern Classification*. Wiley.
