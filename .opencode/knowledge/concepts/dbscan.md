# DBSCAN (Density-Based Spatial Clustering of Applications with Noise)

## Mathematical Foundation

DBSCAN is a **density-based** clustering algorithm that groups together closely packed points, marking outliers as noise. Unlike KMeans, it can find arbitrarily shaped clusters and doesn't require specifying the number of clusters.

### Core Concepts

**Definition 1 (ε-neighborhood)**: The ε-neighborhood of a point p is:
$$N_\varepsilon(p) = \{q \in D \mid \text{dist}(p, q) \leq \varepsilon\}$$

**Definition 2 (Core point)**: A point p is a **core point** if:
$$|N_\varepsilon(p)| \geq \text{MinPts}$$

**Definition 3 (Border point)**: A point q is a **border point** if:
- It is not a core point
- It is in the ε-neighborhood of some core point

**Definition 4 (Noise point)**: A point o is a **noise point** if it is neither core nor border.

**Definition 5 (Direct density-reachable)**: A point q is **directly density-reachable** from p if:
- $q \in N_\varepsilon(p)$
- p is a core point

**Definition 6 (Density-reachable)**: A point q is **density-reachable** from p if there is a chain $p_1, \ldots, p_n$ where $p_1 = p$, $p_n = q$, and each $p_{i+1}$ is directly density-reachable from $p_i$.

**Definition 7 (Density-connected)**: Points p and q are **density-connected** if there exists a point o such that both p and q are density-reachable from o.

### Cluster Definition

A cluster C is a non-empty subset of D satisfying:
1. **Maximality**: If p ∈ C and q is density-reachable from p, then q ∈ C
2. **Connectivity**: For any p, q ∈ C, p and q are density-connected

## Step-by-Step Algorithm

### DBSCAN(D, ε, MinPts)

1. **Label all points as unvisited**
2. **For each unvisited point p**:
   a. Mark p as visited
   b. Find all points within ε-distance of p (N_ε(p))
   c. If |N_ε(p)| < MinPts:
      - Mark p as **noise** (temporarily)
   d. Else:
      - Create a new cluster C
      - Add p to C
      - Create a seed set S = N_ε(p) \ {p}
      - For each point q in S:
        i. If q was marked noise, change to C
        ii. If q is unvisited:
           - Mark q as visited
           - Find N_ε(q)
           - If |N_ε(q)| ≥ MinPts, add N_ε(q) to S
        iii. If q doesn't belong to any cluster, add to C

## Complexity

| Operation | Time Complexity | Space Complexity |
|-----------|----------------|-----------------|
| Naive implementation | $O(n^2)$ | $O(n)$ |
| With spatial index (KD-tree) | $O(n \log n)$ | $O(n)$ |

## Advantages

1. **No need to specify k** — finds the number of clusters automatically
2. **Finds arbitrary shapes** — not limited to convex clusters
3. **Robust to outliers** — noise points are explicitly identified
4. **Deterministic** — same output for same input (unlike KMeans)
5. **Works with varying densities** — can find clusters of different densities

## Limitations

1. **Struggles with varying densities** — same ε and MinPts for all clusters
2. **Sensitive to parameters** — ε and MinPts significantly affect results
3. **Not deterministic for border points** — border points may be assigned to different clusters depending on order
4. **Curse of dimensionality** — distance becomes less meaningful in high dimensions

## When to Use / When NOT to Use

### Use When:
- Number of clusters is unknown
- Clusters have irregular shapes
- Data contains noise/outliers
- Clusters have similar density

### Do NOT Use When:
- Clusters have very different densities
- High-dimensional data (>10 dimensions)
- Need to classify new points (DBSCAN doesn't generalize well)

## Relationship with KAFE Implementation

KAFE implements DBSCAN from scratch:

- Uses `KafeMATH.functions.sqrt` for distance computation
- Inherits from `BaseMachine` with `fit()` and `fit_predict()` interface
- Does NOT implement `predict()` — DBSCAN doesn't generalize to new points
- Stores `labels_`, `n_clusters_`, `core_sample_indices_`

## References

- Ester, M., Kriegel, H. P., Sander, J., & Xu, X. (1996). A density-based algorithm for discovering clusters in large spatial databases with noise. *KDD*.
- Schubert, E., Sander, J., Ester, M., Kriegel, H. P., & Xu, X. (2017). DBSCAN revisited, revisited: why and how you should (still) use DBSCAN. *ACM TODS*.
