# MACHINE · Clustering y ensembles

[Return to Index](../machine.md)

## DBSCAN (Density-Based Spatial Clustering)

Implements a density-based clustering algorithm that groups densely packed points and marks outliers as noise. Unlike KMeans, DBSCAN can find arbitrarily shaped clusters and does not require the number of clusters to be specified.

### Theory

DBSCAN is based on the concept of **density reachability**:

| Concept | Definition |
|----------|------------|
| **Core point** | A point with at least `min_samples` points within distance `eps` (including itself) |
| **Direct density reachability** | Point `q` is directly reachable from `p` if `q` is within distance `eps` of `p` and `p` is a core point |
| **Density reachability** | There is a chain `p1, ..., pn` in which each point is directly reachable from the previous one |
| **Density connectivity** | Two points are density-connected if there is a point `o` from which both are density-reachable |

**Cluster**: A maximal set of density-connected points.

**Noise**: Points that do not belong to any cluster (label `-1`).

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `db.fit(X)` | `(List[List[NUM]]) -> VOID` | Fits the DBSCAN clustering model |
| `db.fit_predict(X)` | `(List[List[NUM]]) -> List[INT]` | Fits the model and returns cluster labels |
| `db.labels()` | `() -> List[INT]` | Returns cluster labels after fitting |
| `db.n_clusters()` | `() -> INT` | Returns the number of clusters found |
| `db.core_sample_indices()` | `() -> List[INT]` | Returns the indices of core points |

### Constructor parameters

```kafe
-- eps: maximum distance between neighboring points (default: 0.5)
-- min_samples: minimum number of points to form a dense region (default: 5)
MACHINE db = machine.dbscan(1.0, 2);
```

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `db.labels_` | `List[INT]` | Cluster labels (-1 = noise) |
| `db.n_clusters_` | `INT` | Number of clusters found |
| `db.core_sample_indices_` | `List[INT]` | Indices of core points |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 1.0], [1.5, 1.5], [2.0, 2.0],
                        [8.0, 8.0], [8.5, 8.5], [9.0, 9.0],
                        [50.0, 50.0]];

MACHINE db = machine.dbscan(1.0, 2);
db.fit(X);

show(db.labels());       -- [1, 1, 1, 2, 2, 2, -1]
show(db.n_clusters());   -- 2

-- Use fit_predict
List[INT] labels = db.fit_predict(X);
show(labels);            -- [1, 1, 1, 2, 2, 2, -1]
```

### Internal algorithm

1. **Region query**: For each point, find all points within distance `eps`.
2. **Identify core points**: Points with at least `min_samples` neighbors.
3. **Expand clusters**: Starting from each unvisited core point, expand its cluster by connecting density-reachable points.
4. **Mark noise**: Points that are not core points and are not reachable from any core point.

### Complexity

- **Time**: $O(n^2)$ in the worst case (region queries for all points)
- **Space**: $O(n)$ to store labels and neighbors

### Advantages

- Does not require the number of clusters to be specified.
- Finds arbitrarily shaped clusters.
- Identifies noise (outliers).
- Does not assume a spherical data distribution.

### Limitations

- Has difficulty handling clusters with varying densities.
- Is sensitive to the choice of `eps` and `min_samples`.
- Has quadratic worst-case complexity.

---

## AgglomerativeClustering

Implements bottom-up hierarchical clustering. It starts with each point as a separate cluster and repeatedly merges the closest clusters until the desired number of clusters is reached.

### Theory

The algorithm performs $n - k$ successive merges:

1. Initialize with each point as its own cluster ($n$ clusters).
2. Compute distances between every pair of clusters.
3. Find the two closest clusters according to the linkage criterion.
4. Merge those clusters.
5. Repeat until $k$ clusters remain.

**Linkage criteria**:

| Criterion | Formula | Description |
|----------|---------|-------------|
| `single` | $\min_{x \in C_i, y \in C_j} \|\|x - y\|\|$ | Minimum distance between points |
| `complete` | $\max_{x \in C_i, y \in C_j} \|\|x - y\|\|$ | Maximum distance between points |
| `average` | $\frac{1}{\|C_i\|\|C_j\|} \sum_{x \in C_i} \sum_{y \in C_j} \|\|x - y\|\|$ | Mean distance |
| `ward` | $\frac{\|C_i\|\|C_j\|}{\|C_i\| + \|C_j\|} \|\|\mu_i - \mu_j\|\|^2$ | Minimizes within-cluster variance |

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `ac.fit(X)` | `(List[List[NUM]]) -> VOID` | Fits the agglomerative clustering model |
| `ac.fit_predict(X)` | `(List[List[NUM]]) -> List[INT]` | Fits the model and returns cluster labels |

### Constructor parameters

```kafe
-- Defaults: n_clusters=2, linkage="ward"
MACHINE ac = machine.agglomerative_clustering(2, "ward");
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `n_clusters` | INT | 2 | Desired number of clusters, from 1 to the number of samples |
| `linkage` | STRING | "ward" | Linkage criterion: "single", "complete", "average", or "ward" |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `ac.labels_` | `List[INT]` | Cluster label for each point |
| `ac.n_clusters_` | `INT` | Number of clusters found |
| `ac.children_` | `List[List[INT]]` | Merge history (pairs of merged clusters) |
| `ac.distances_` | `List[FLOAT]` | Distance for each merge |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 1.0], [1.5, 1.5], [2.0, 2.0],
                        [8.0, 8.0], [8.5, 8.5], [9.0, 9.0]];

MACHINE ac = machine.agglomerative_clustering(2, "ward");
ac.fit(X);

show(ac.labels_);       -- [0, 0, 0, 1, 1, 1]
show(ac.n_clusters_);   -- 2
show(ac.distances_);    -- Distance for each merge

-- Use fit_predict
List[INT] labels = ac.fit_predict(X);
show(labels);           -- [0, 0, 0, 1, 1, 1]
```

### Comparison with DBSCAN

| Aspect | AgglomerativeClustering | DBSCAN |
|---------|------------------------|--------|
| Type | Hierarchical | Density-based |
| Requires `n_clusters` | Yes | No |
| Cluster shape | Flexible (depends on linkage) | Arbitrary |
| Noise | Not detected | Detected (label -1) |
| Scalability | $O(n^3)$ | $O(n^2)$ |
| Deterministic | Yes | Yes |

---

## GaussianMixture (Gaussian mixture)

Implements a Gaussian mixture model (GMM), a probabilistic model that assumes the data were generated by a mixture of Gaussian distributions. It uses the expectation-maximization (EM) algorithm to estimate parameters.

### Theory

The model assumes that each point was generated by one of $K$ Gaussian distributions:

$$P(\mathbf{x}) = \sum_{k=1}^{K} \pi_k \cdot \mathcal{N}(\mathbf{x} | \boldsymbol{\mu}_k, \boldsymbol{\Sigma}_k)$$

Here, $\pi_k$ is the weight of component $k$, $\boldsymbol{\mu}_k$ is its mean, and $\boldsymbol{\Sigma}_k$ is its covariance.

**EM algorithm**:

1. **E-step**: Compute responsibilities $\gamma(z_{kn})$, the probability that point $n$ belongs to component $k$.
2. **M-step**: Update parameters using the responsibilities.
3. Repeat until convergence.

KAFE evaluates component densities and normalizes responsibilities in log space (log-sum-exp). This preserves meaningful scores and memberships when high-dimensional densities would underflow. The covariance is diagonal, so the model captures axis-aligned elliptical clusters.

**Selecting K**: Use AIC ($2p - 2\ln(\hat{L})$) or BIC ($p\ln(n) - 2\ln(\hat{L})$); lower values are better.

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `gm.fit(X)` | `(List[List[NUM]]) -> VOID` | Fits the model using EM |
| `gm.predict(X)` | `(List[List[NUM]]) -> List[INT]` | Assigns each point to the most likely component |
| `gm.predict_proba(X)` | `(List[List[NUM]]) -> List[List[FLOAT]]` | Returns responsibilities (membership probabilities) |
| `gm.fit_predict(X)` | `(List[List[NUM]]) -> List[INT]` | Fits the model and returns labels |
| `gm.score(X)` | `(List[List[NUM]]) -> FLOAT` | Returns the negative log-likelihood (lower is better) |
| `gm.aic(X)` | `(List[List[NUM]]) -> FLOAT` | Akaike information criterion |
| `gm.bic(X)` | `(List[List[NUM]]) -> FLOAT` | Bayesian information criterion |

### Constructor Parameters

```kafe
-- n_components=3, max_iter=100, tol=1e-3, random_state=0 (default values)
MACHINE gm = machine.gaussian_mixture(3, 100, 1e-3, 0);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `n_components` | INT | 3 | Number of Gaussian components |
| `max_iter` | INT | 100 | Maximum number of EM iterations |
| `tol` | FLOAT | 1e-3 | Convergence tolerance |
| `random_state` | INT | 0 | Reproducibility seed (0 = random) |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `gm.weights_` | `List[FLOAT]` | Weight of each component ($\pi_k$) |
| `gm.means_` | `List[List[FLOAT]]` | Mean of each component ($\boldsymbol{\mu}_k$) |
| `gm.covariances_` | `List[List[FLOAT]]` | Diagonal variance of each component ($\boldsymbol{\Sigma}_k$) |
| `gm.converged_` | `BOOL` | Whether the model converged |
| `gm.n_iter_` | `INT` | Number of iterations performed |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 1.0], [1.5, 1.5], [2.0, 2.0],
                        [8.0, 8.0], [8.5, 8.5], [9.0, 9.0]];

MACHINE gm = machine.gaussian_mixture(2, 100, 1e-3, 42);
gm.fit(X);

show(gm.labels_);           -- [0, 0, 0, 1, 1, 1]
show(gm.means_);            -- Mean of each component
show(gm.weights_);          -- Weight of each component

-- Membership probabilities
List[List[FLOAT]] probs = gm.predict_proba(X);
show(probs);

-- Select the number of components
FLOAT aic = gm.aic(X);
FLOAT bic = gm.bic(X);
show(aic);
show(bic);
```

### Comparison with K-Means

| Aspect | K-Means | GaussianMixture |
|--------|---------|-----------------|
| Type | Hard clustering | Soft clustering |
| Cluster shape | Spherical | Elliptical |
| Model | Distance to centroids | Probabilistic |
| Output | Labels | Probabilities |
| Complexity | $O(T \cdot n \cdot K \cdot d)$ | $O(T \cdot n \cdot K \cdot d)$ |

### Complexity

- **Time**: $O(T \cdot n \cdot K \cdot d)$ per EM iteration
- **Space**: $O(n \cdot K)$ for responsibilities

### Advantages

- Soft clustering: membership probabilities, not only assignments
- Can capture elliptical clusters (unlike the spherical clusters of K-Means)
- Generative model: can generate new points
- AIC/BIC for automatic selection of the number of components

### Limitations

- Sensitive to initialization — may converge to local optima
- Assumes Gaussian distributions — non-Gaussian data can reduce performance
- Sensitive to outliers — they affect the means

---

## AdaBoostClassifier (Adaptive Boosting)

Implements an AdaBoost classifier, an ensemble learning algorithm that combines multiple weak classifiers (decision stumps) sequentially, emphasizing errors made by the previous classifier.

### Theory

AdaBoost trains $T$ weak classifiers sequentially. At each iteration:
1. Assign weights to the samples (uniform at first)
2. Train a decision stump using those weights
3. Calculate the stump weight ($\alpha_t$) from its error
4. Update sample weights by increasing the weights of misclassified samples

**Final prediction**: Weighted vote across all weak classifiers.

$$H(x) = \text{sign}\left(\sum_{t=1}^{T} \alpha_t \cdot h_t(x)\right)$$

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `ab.fit(X, y)` | `(List[List[NUM]], List[INT]) -> VOID` | Trains the ensemble of weak classifiers |
| `ab.predict(X)` | `(List[List[NUM]]) -> List[INT]` | Predicts by weighted voting |
| `ab.score(X, y)` | `(List[List[NUM]], List[INT]) -> FLOAT` | Calculates accuracy |

### Constructor Parameters

```kafe
-- n_estimators=50, learning_rate=1.0 (default values)
MACHINE ab = machine.ada_boost_classifier(50, 1.0);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `n_estimators` | INT | 50 | Number of weak classifiers (decision stumps) |
| `learning_rate` | FLOAT | 1.0 | Scale factor for each stump's contribution |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `ab.estimators_` | `List[Dict]` | List of trained weak classifiers |
| `ab.estimator_weights_` | `List[FLOAT]` | Weight $\alpha_t$ of each weak classifier |
| `ab.estimator_errors_` | `List[FLOAT]` | Error of each weak classifier |
| `ab.classes_` | `List[INT]` | Unique classes |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 3.0],
                        [6.0, 5.0], [7.0, 7.0], [8.0, 6.0]];
List[INT] y = [0, 0, 0, 1, 1, 1];

MACHINE ab = machine.ada_boost_classifier(10, 1.0);
ab.fit(X, y);

List[INT] preds = ab.predict([[2.0, 2.0], [7.0, 7.0], [4.0, 4.0]]);
show(preds);  -- [0, 1, 0]

FLOAT acc = ab.score(X, y);
show(acc);  -- 1.0
```

### Internal Algorithm

1. **Initialization**: Uniform weights $w_i = 1/n$
2. **For each iteration**:
   - Train a decision stump with the current weights, checking both threshold orientations
   - Calculate the weighted error $\epsilon_t$
   - Calculate the stump weight $\alpha_t = 0.5 \cdot \ln((1 - \epsilon_t) / \epsilon_t)$
   - Update sample weights
3. **Prediction**: Weighted vote across all stumps

### Comparison with RandomForestClassifier

| Aspect | AdaBoostClassifier | RandomForestClassifier |
|--------|--------------------|----------------------|
| Ensemble type | Boosting (sequential) | Bagging (parallel) |
| Weak learner | Decision stump (depth 1) | Full tree (variable depth) |
| Weighting | Weights weak learners by performance | Equal voting |
| Parallelization | No (sequential) | Yes (independent trees) |
| Overfitting | Controlled by learning_rate | Controlled by max_depth |

---

## GradientBoostingClassifier

Implements a Gradient Boosting classifier, an ensemble of decision trees built sequentially, where each tree corrects the previous tree's errors using gradient descent on the log-loss function.

### Theory

Gradient Boosting builds $T$ trees sequentially. At each iteration:
1. Calculate the pseudo-residuals (the negative gradient of the log-loss)
2. Train a regression tree to predict those residuals
3. Update the model by adding the tree prediction weighted by `learning_rate`

**Loss function** (log-loss / deviance):

$$\mathcal{L}(y, F) = -y \cdot \log(p) - (1-y) \cdot \log(1-p)$$

**Final prediction**: Apply the sigmoid function to the sum of predictions:

$$H(x) = \sigma(F_T(x)) = \sigma\left(F_0(x) + \eta \sum_{t=1}^{T} h_t(x)\right)$$

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `gbc.fit(X, y)` | `(List[List[NUM]], List[INT]) -> VOID` | Trains the tree ensemble |
| `gbc.predict(X)` | `(List[List[NUM]]) -> List[INT]` | Predicts classes (0 or 1) |
| `gbc.score(X, y)` | `(List[List[NUM]], List[INT]) -> FLOAT` | Calculates accuracy |

### Constructor Parameters

```kafe
-- n_estimators=100, learning_rate=0.1, max_depth=3 (default values)
MACHINE gbc = machine.gradient_boosting_classifier(100, 0.1, 3);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `n_estimators` | INT | 100 | Number of trees in the ensemble |
| `learning_rate` | FLOAT | 0.1 | Learning rate (shrinkage) |
| `max_depth` | INT | 3 | Maximum depth of each tree |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `gbc.estimators_` | `List[Dict]` | List of trained trees |
| `gbc.initial_prediction_` | `FLOAT` | Initial prediction (log-odds) |
| `gbc.classes_` | `List[INT]` | Unique classes |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 3.0],
                        [6.0, 5.0], [7.0, 7.0], [8.0, 6.0]];
List[INT] y = [0, 0, 0, 1, 1, 1];

MACHINE gbc = machine.gradient_boosting_classifier(10, 0.1, 3);
gbc.fit(X, y);

List[INT] preds = gbc.predict([[2.0, 2.0], [7.0, 7.0], [4.0, 4.0]]);
show(preds);  -- [0, 1, 0]

FLOAT acc = gbc.score(X, y);
show(acc);  -- 1.0
```

### Internal Algorithm

1. **Initialization**: $F_0 = \ln(p/(1-p))$, where $p$ is the fraction of samples in the higher-valued class
2. **For each iteration**:
   - Calculate probabilities with the sigmoid function
   - Calculate pseudo-residuals: $r_i = y_i - p_i$
   - Train a regression tree on the residuals
   - Update: $F_t = F_{t-1} + \eta \cdot h_t$
3. **Prediction**: Class = sigmoid($F_T$) >= 0.5

### Comparison with RandomForestClassifier

| Aspect | GradientBoostingClassifier | RandomForestClassifier |
|--------|---------------------------|----------------------|
| Ensemble type | Boosting (sequential) | Bagging (parallel) |
| Weak learner | Deep tree (residuals) | Tree (bootstrap) |
| Direction | Corrects previous errors | Independent trees |
| Parallelization | No (sequential) | Yes (independent trees) |
| Overfitting | More susceptible | Less susceptible |

### Comparison with AdaBoostClassifier

| Aspect | GradientBoostingClassifier | AdaBoostClassifier |
|--------|---------------------------|-------------------|
| Optimization | Gradient descent on the loss | Sample weighting |
| Weak learner | Regression tree (variable depth) | Decision stump (depth 1) |
| Loss | Log-loss (any differentiable function) | Exponential |
| Flexibility | More flexible (any loss) | Less flexible |

---

## GradientBoostingRegressor

Implements a Gradient Boosting regressor, an ensemble of regression trees built sequentially, where each tree corrects the previous tree's errors using gradient descent on the mean squared error.

### Theory

Gradient Boosting Regressor builds $T$ trees sequentially to minimize MSE:

1. **Initialize**: $F_0(x) = \bar{y}$
2. **At each iteration**:
   - Calculate residuals: $r_i = y_i - F_{t-1}(x_i)$
   - Train tree $h_t$ to predict the residuals
   - Update: $F_t = F_{t-1} + \eta \cdot h_t$

**Loss function** (MSE):

$$\mathcal{L}(y, F) = \frac{1}{2}(y - F)^2$$

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `gbr.fit(X, y)` | `(List[List[NUM]], List[NUM]) -> VOID` | Trains the tree ensemble |
| `gbr.predict(X)` | `(List[List[NUM]]) -> List[NUM]` | Predicts values |
| `gbr.score(X, y)` | `(List[List[NUM]], List[NUM]) -> FLOAT` | Calculates R² |

### Constructor Parameters

```kafe
-- n_estimators=100, learning_rate=0.1, max_depth=3 (default values)
MACHINE gbr = machine.gradient_boosting_regressor(100, 0.1, 3);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `n_estimators` | INT | 100 | Number of trees in the ensemble |
| `learning_rate` | FLOAT | 0.1 | Learning rate (shrinkage) |
| `max_depth` | INT | 3 | Maximum depth of each tree |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `gbr.estimators_` | `List[Dict]` | List of trained trees |
| `gbr.initial_prediction_` | `FLOAT` | Initial prediction (mean of y) |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0], [2.0], [3.0], [4.0], [5.0]];
List[FLOAT] y = [2.0, 4.0, 6.0, 8.0, 10.0];

MACHINE gbr = machine.gradient_boosting_regressor(10, 0.1, 3);
gbr.fit(X, y);

List[FLOAT] preds = gbr.predict([[1.5], [3.0], [5.5]]);
show(preds);  -- ~[3.0, 6.0, 11.0]

FLOAT r2 = gbr.score(X, y);
show(r2);  -- ~1.0
```

### Internal Algorithm

1. **Initialization**: $F_0 = \bar{y}$
2. **For each iteration**:
   - Calculate residuals: $r_i = y_i - F_{t-1}(x_i)$
   - Train a regression tree on the residuals
   - Update: $F_t = F_{t-1} + \eta \cdot h_t$
3. **Prediction**: $H(x) = F_T(x)$

### Comparison with RandomForestRegressor

| Aspect | GradientBoostingRegressor | RandomForestRegressor |
|--------|--------------------------|----------------------|
| Ensemble type | Boosting (sequential) | Bagging (parallel) |
| Optimization | Gradient descent | Tree averaging |
| Overfitting | More susceptible | Less susceptible |
| Training speed | Slower | Faster (parallelizable) |

---
