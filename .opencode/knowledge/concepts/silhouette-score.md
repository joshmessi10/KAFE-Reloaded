# Silhouette Score

## Category

Machine Learning — Clustering Metrics

## Description

Silhouette Score evaluates clustering quality by measuring how similar each point is to its own cluster (cohesion) compared to other clusters (separation). It ranges from -1 to 1, where higher values indicate better-defined clusters.

## Mathematical Foundation

### Per-Point Silhouette Coefficient

For each data point $i$:

**Intra-cluster distance** ($a(i)$): mean distance from $i$ to all other points in the same cluster:

$$a(i) = \frac{1}{|C_k| - 1} \sum_{j \in C_k, j \neq i} d(i, j)$$

**Nearest-cluster distance** ($b(i)$): minimum mean distance from $i$ to points in the nearest neighboring cluster:

$$b(i) = \min_{l \neq k} \frac{1}{|C_l|} \sum_{j \in C_l} d(i, j)$$

**Silhouette coefficient** ($s(i)$):

$$s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))}$$

### Overall Silhouette Score

The silhouette score is the mean of all per-point coefficients:

$$\text{Silhouette Score} = \frac{1}{n} \sum_{i=1}^{n} s(i)$$

### Complexity

- **Time**: $O(n^2 \cdot d)$ where $n$ = number of samples, $d$ = number of features (pairwise distance computation).
- **Space**: $O(n^2)$ for the distance matrix.

### Interpretation

| Silhouette Value | Interpretation |
|------------------|----------------|
| $\approx 1$ | Point is well-matched to its cluster, far from others |
| $\approx 0$ | Point is on the border between two clusters |
| $< 0$ | Point may be assigned to the wrong cluster |

## Step-by-Step Algorithm

1. Validate inputs: at least 2 samples, at least 2 non-empty clusters.
2. Compute pairwise Euclidean distance matrix $D_{n \times n}$.
3. For each point $i$:
   a. Compute $a(i)$: mean distance to other points in the same cluster.
   b. For each other cluster $l$, compute mean distance from $i$ to all points in $l$.
   c. Set $b(i)$ = minimum of those inter-cluster means.
   d. Compute $s(i) = (b(i) - a(i)) / \max(a(i), b(i))$.
   e. If $\max(a(i), b(i)) = 0$, set $s(i) = 0$.
4. Return the mean of all $s(i)$.

## Motivation

K-Means and other clustering algorithms require external validation when ground truth labels are unavailable. Internal validation metrics like the Silhouette Score measure cluster quality without needing true labels, making them essential for:
- Determining the optimal number of clusters.
- Evaluating whether clusters are well-separated.
- Comparing different clustering algorithms on the same data.

## Advantages

- **No ground truth needed**: Evaluates clusters without requiring true labels (unsupervised evaluation).
- **Interpretable**: Values near 1 indicate strong clustering, near 0 indicate overlap, negative values indicate misassignment.
- **Per-point granularity**: Can identify individual points that are poorly clustered, enabling diagnostics.
- **Scale-aware**: Uses actual distances, so it captures the geometric quality of clusters.

## Limitations

- **Computational cost**: Requires computing the full pairwise distance matrix ($O(n^2)$), which is expensive for large datasets.
- **Assumes convex clusters**: Works best with globular, convex clusters; may give misleading scores for elongated or non-convex shapes.
- **Sensitive to distance metric**: Uses Euclidean distance by default, which may not be appropriate for high-dimensional or categorical data.
- **Requires at least 2 clusters**: Cannot evaluate single-cluster solutions.

## When to Use

- Evaluating K-Means or other centroid-based clustering results.
- Choosing the optimal number of clusters (elbow method + silhouette analysis).
- Comparing different clustering algorithms on the same dataset.
- Diagnosing which points are poorly clustered.

## When NOT to Use

- Very large datasets ($n > 10{,}000$) due to $O(n^2)$ distance computation.
- Non-convex cluster shapes (consider Davies-Bouldin index or Calinski-Harabasz).
- When ground truth labels are available (use Adjusted Rand Index or Normalized Mutual Information).
- Single-cluster scenarios.

## Dependencies

- No external dependencies (computed from feature matrix `X` and cluster `labels`).

## Related Concepts

- K-Means Clustering
- DBSCAN
- Agglomerative Clustering
- Davies-Bouldin Index
- Calinski-Harabasz Index

## Relationship with KAFE

Implemented in `src/lib/KafeMACHINE/metrics.py` as `silhouette_score(X, labels)`. Computes the full pairwise Euclidean distance matrix and evaluates each point's cohesion and separation. Works with any clustering algorithm's output (K-Means, DBSCAN, AgglomerativeClustering).

## Usage Examples

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 1.0], [1.5, 1.5], [2.0, 2.0],
                        [8.0, 8.0], [8.5, 8.5], [9.0, 9.0]];
List[INT] labels = [0, 0, 0, 1, 1, 1];

FLOAT score = machine.silhouette_score(X, labels);
show(score);  -- ~0.87 (well-separated clusters)
```

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 1.0], [2.0, 2.0], [3.0, 3.0],
                        [4.0, 4.0], [5.0, 5.0]];
List[INT] labels = [0, 0, 1, 1, 1];

FLOAT score = machine.silhouette_score(X, labels);
show(score);  -- ~0.42 (clusters overlap)
```

## Implementation Location

- `src/lib/KafeMACHINE/metrics.py` — `silhouette_score()` function

## Public API

```kafe
machine.silhouette_score(X, labels) -> FLOAT
```

- `X`: `List[List[NUM]]` — feature matrix
- `labels`: `List[INT]` — cluster assignments for each point
- Returns: `FLOAT` — mean silhouette coefficient in [-1, 1]

## References

- Rousseeuw, P. J. (1987). Silhouettes: A graphical aid to the interpretation and validation of cluster analysis. *Journal of Computational and Applied Mathematics*, 20, 53-65.
- scikit-learn documentation — `sklearn.metrics.silhouette_score`
