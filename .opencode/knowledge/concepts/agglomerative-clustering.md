# Agglomerative Clustering

## Mathematical Foundation

Agglomerative Clustering is a bottom-up hierarchical clustering algorithm.

### Algorithm

1. Start with each point in its own cluster.
2. Compute distances between every pair of clusters.
3. Find the two closest clusters.
4. Merge those clusters.
5. Repeat until `n_clusters` remains.

### Linkage Criteria

- **Single**: minimum distance between points in different clusters.
  $d(C_i, C_j) = \min_{x \in C_i, y \in C_j} ||x - y||$

- **Complete**: maximum distance between points in different clusters.
  $d(C_i, C_j) = \max_{x \in C_i, y \in C_j} ||x - y||$

- **Average**: mean distance between points in different clusters.
  $d(C_i, C_j) = \frac{1}{|C_i||C_j|} \sum_{x \in C_i} \sum_{y \in C_j} ||x - y||$

- **Ward**: minimizes the increase in within-cluster variance.
  $\Delta = \frac{|C_i||C_j|}{|C_i| + |C_j|} ||\mu_i - \mu_j||^2$

## Computational Complexity

| Operation | Time Complexity | Space Complexity |
|-----------|---------------------|---------------------|
| Training | $O(n^3)$ | $O(n^2)$ |

## Advantages

1. **Does not require a predefined number of clusters** — a dendrogram can help select $k$.
2. **Captures hierarchical structure** — exposes nested relationships.
3. **Flexible** — offers multiple linkage criteria.
4. **Deterministic** — produces the same result for the same data.

## Limitations

1. **Scalability** — $O(n^3)$ is impractical for large datasets.
2. **No reassignment** — a merge cannot be undone later.
3. **Sensitive to noise** — outliers affect the result.
4. **Greedy** — it does not guarantee a global optimum.

## When to Use

- Small or medium-sized datasets.
- Data with a hierarchical structure.
- When a dendrogram is useful.
- When the number of clusters is unknown.

## When NOT to Use

- Large datasets (more than 10,000 points).
- Spherical clusters (consider K-Means).
- Data with many outliers.

## Relationship with KAFE

KAFE implements `AgglomerativeClustering` from scratch with four linkage criteria: single, complete, average, and ward. The algorithm is deterministic and does not require a random seed.

## References

- Ward, J. H. (1963). Hierarchical Grouping to Optimize an Objective Function. *JASA*.
- agglomerative, A. (1979). An efficient agglomerative hierarchical clustering algorithm. *The Computer Journal*.
