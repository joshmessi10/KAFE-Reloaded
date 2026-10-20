# MACHINE · Clasificación y árboles

[Return to Index](../machine.md)

## LogisticRegression

Implements binary logistic regression using gradient descent.

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `lr.fit(X, y)` | `(List[List[NUM]] or List[NUM], List[INT]) -> VOID` | Fits the model. `y` must contain only 0 and 1 |
| `lr.predict(X)` | `(List[List[NUM]] or List[NUM]) -> List[INT]` | Predicts classes (0 or 1) |
| `lr.predict_proba(X)` | `(List[List[NUM]] or List[NUM]) -> List[List[FLOAT]]` | Returns probabilities [P(0), P(1)] |
| `lr.score(X, y)` | `(List[List[NUM]] or List[NUM], List[INT]) -> FLOAT` | Computes accuracy |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `lr.coef_` | `List[FLOAT]` | Coefficient for each feature |
| `lr.intercept_` | `FLOAT` | Intercept term |

### Constructor parameters

```kafe
-- Defaults: learning_rate=0.01, max_iter=1000
MACHINE lr = machine.logistic_regression(0.1, 5000);
```

### Example

```kafe
import machine;

List[FLOAT] X = [-5.0, -4.0, -3.0, -2.0, 2.0, 3.0, 4.0, 5.0];
List[INT] y = [0, 0, 0, 0, 1, 1, 1, 1];

MACHINE lr = machine.logistic_regression(0.1, 5000);
lr.fit(X, y);

show(lr.coef_);  -- ~[3.17]

List[INT] preds = lr.predict([-3.0, -1.0, 1.0, 3.0]);
show(preds);  -- [0, 0, 1, 1]

List[List[FLOAT]] probs = lr.predict_proba([-3.0, 0.0, 3.0]);
show(probs);  -- [[~1, ~0], [0.5, 0.5], [~0, ~1]]
```

---

## KNN (K-Nearest Neighbors Classifier)

Classifier based on the k nearest neighbors (Euclidean distance).

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `knn.fit(X, y)` | `(List[List[NUM]] or List[NUM], List[INT]) -> VOID` | Fits the classifier |
| `knn.predict(X)` | `(List[List[NUM]] or List[NUM]) -> List[INT]` | Predicts classes |
| `knn.predict_proba(X)` | `(List[List[NUM]] or List[NUM]) -> List[List[FLOAT]]` | Returns class probabilities |
| `knn.score(X, y)` | `(List[List[NUM]] or List[NUM], List[INT]) -> FLOAT` | Computes accuracy |

### Constructor parameters

```kafe
-- Default: k=3
MACHINE model = machine.knn(3);
```

### Example

```kafe
import machine;

List[List[FLOAT]] X_train = [[1.0, 1.0], [2.0, 2.0], [5.0, 5.0], [6.0, 6.0]];
List[INT] y_train = [0, 0, 1, 1];

MACHINE model = machine.knn(3);
model.fit(X_train, y_train);

List[INT] preds = model.predict([[2.0, 2.0], [5.0, 5.0], [3.0, 3.0]]);
show(preds);  -- [0, 1, 0]

FLOAT acc = model.score(X_train, y_train);
show(acc);  -- 1.0
```

---

## KNNRegressor (K-Nearest Neighbors Regressor)

Regressor based on the k nearest neighbors. It predicts the mean of the target values for the k nearest neighbors.

### Theory

KNNRegressor is a **lazy learning** model that does not fit an explicit model. To make a prediction, it computes the distance to every training point, selects the k nearest points, and averages their target values.

**Prediction (uniform weights)**:

$$\hat{y} = \frac{1}{k} \sum_{i=1}^{k} y_i$$

**Prediction (distance-weighted)**:

$$\hat{y} = \frac{\sum_{i=1}^{k} w_i \cdot y_i}{\sum_{i=1}^{k} w_i}, \quad w_i = \frac{1}{d_i + \epsilon}$$

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `knr.fit(X, y)` | `(List[List[NUM]] or List[NUM], List[NUM]) -> VOID` | Stores the training data |
| `knr.predict(X)` | `(List[List[NUM]] or List[NUM]) -> List[NUM]` | Predicts values |
| `knr.score(X, y)` | `(List[List[NUM]] or List[NUM], List[NUM]) -> FLOAT` | Computes R² |

### Constructor parameters

```kafe
-- Default: k=3
MACHINE model = machine.knn_regressor(3);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `k` | INT | 3 | Number of neighbors to consider |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `knr.k` | `INT` | Number of neighbors |
| `knr.X_train_` | `List[List[FLOAT]]` | Stored training data |
| `knr.y_train_` | `List[FLOAT]` | Stored training targets |

### Example

```kafe
import machine;

List[List[FLOAT]] X_train = [[1.0], [2.0], [3.0], [4.0], [5.0]];
List[FLOAT] y_train = [2.0, 4.0, 6.0, 8.0, 10.0];

MACHINE knr = machine.knn_regressor(3);
knr.fit(X_train, y_train);

List[FLOAT] preds = knr.predict([[1.5], [3.0], [5.5]]);
show(preds);  -- ~[4.0, 6.0, 10.0]

FLOAT r2 = knr.score(X_train, y_train);
show(r2);  -- ~0.95
```

### Comparison with the KNN classifier

| Aspect | KNN Classifier | KNN Regressor |
|---------|----------------|---------------|
| Target | Classes (discrete) | Continuous values |
| Prediction | Majority vote | Mean of neighbors |
| Metric | Accuracy | R² |
| Factory | `machine.knn(k)` | `machine.knn_regressor(k)` |

---

## DecisionTreeClassifier

Implements a decision tree classifier using recursion and impurity criteria (Gini or entropy).

### Theory

A **decision tree** recursively partitions the feature space by learning simple decision rules. At each internal node, it selects the feature and threshold that best split the data according to a purity criterion.

**Impurity criteria**:

| Criterion | Formula | Description |
|----------|---------|-------------|
| Gini | $1 - \sum(p_i^2)$ | Gini impurity (0 = pure, maximum = $1 - 1/n_{classes}$) |
| Entropy | $-\sum(p_i \cdot \log_2(p_i))$ | Information entropy (0 = pure, maximum = $\log_2(n_{classes})$) |

**Information gain**: $\text{Gain} = \text{Impurity}_{parent} - \sum \frac{n_{child}}{n_{parent}} \cdot \text{Impurity}_{child}$

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `dt.fit(X, y)` | `(List[List[NUM]], List[INT]) -> VOID` | Builds the decision tree |
| `dt.predict(X)` | `(List[List[NUM]]) -> List[INT]` | Predicts classes by traversing the tree |
| `dt.score(X, y)` | `(List[List[NUM]], List[INT]) -> FLOAT` | Computes accuracy |

### Constructor parameters

```kafe
-- criterion: "gini" (default) or "entropy"
-- max_depth: maximum depth (0 = unlimited)
-- min_samples_split: minimum samples required to split (default: 2)
-- min_samples_leaf: minimum samples in a leaf (default: 1)
MACHINE model = machine.decision_tree_classifier("gini", 0, 2, 1);
```

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `dt.tree_` | `Dict` | Tree structure (internal nodes and leaves) |
| `dt.classes_` | `List[INT]` | Unique classes seen during fitting |
| `dt.n_features_` | `INT` | Number of features |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 3.0],
                        [6.0, 5.0], [7.0, 7.0], [8.0, 6.0]];
List[INT] y = [0, 0, 0, 1, 1, 1];

-- Model with Gini (default)
MACHINE model = machine.decision_tree_classifier();
model.fit(X, y);

List[INT] preds = model.predict([[1.0, 2.0], [7.0, 7.0], [4.0, 4.0]]);
show(preds);  -- [0, 1, 0]

FLOAT acc = model.score(X, y);
show(acc);  -- 1.0

-- Model with entropy and limited depth
MACHINE model2 = machine.decision_tree_classifier("entropy", 2);
model2.fit(X, y);
show(model2.predict([[1.0, 2.0], [7.0, 7.0]]));  -- [0, 1]
```

### Internal algorithm

1. **Split selection**: Compute information gain for each feature and possible threshold.
2. **Recursive construction**: Split the data using the best split and repeat for each subtree.
3. **Stopping criteria**: `max_depth` reached, `min_samples_split` not met, or a pure node.
4. **Prediction**: Traverse the tree from the root to a leaf.

---

## DecisionTreeRegressor

Implements a decision tree regressor. It recursively partitions the feature space to predict continuous values while minimizing MSE.

### Theory

A **decision tree regressor** recursively partitions the feature space by learning simple decision rules. At each internal node, it selects the feature and threshold that best reduce mean squared error (MSE).

**MSE (Mean Squared Error)**:

$$MSE = \frac{1}{n} \sum_{i=1}^{n} (y_i - \bar{y})^2$$

**MSE reduction**: For each candidate split:

$$\Delta MSE = MSE_{parent} - \left(\frac{n_l}{n} \cdot MSE_{left} + \frac{n_r}{n} \cdot MSE_{right}\right)$$

The split with the largest $\Delta MSE$ is selected. Each leaf predicts the mean of the values in that node.

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `dtr.fit(X, y)` | `(List[List[NUM]], List[NUM]) -> VOID` | Builds the regression tree |
| `dtr.predict(X)` | `(List[List[NUM]]) -> List[NUM]` | Predicts values by traversing the tree |
| `dtr.score(X, y)` | `(List[List[NUM]], List[NUM]) -> FLOAT` | Computes R² |

### Constructor parameters

```kafe
-- criterion: "mse" (default)
-- max_depth: maximum depth (0 = unlimited)
-- min_samples_split: minimum samples required to split (default: 2)
-- min_samples_leaf: minimum samples in a leaf (default: 1)
MACHINE model = machine.decision_tree_regressor("mse", 0, 2, 1);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `criterion` | STRING | "mse" | Split criterion: "mse" |
| `max_depth` | INT | 0 | Maximum depth (0 = unlimited) |
| `min_samples_split` | INT | 2 | Minimum samples required to split a node |
| `min_samples_leaf` | INT | 1 | Minimum samples in a leaf |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `dtr.tree_` | `Dict` | Tree structure (internal nodes and leaves) |
| `dtr.n_features_` | `INT` | Number of features |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0], [2.0], [3.0], [4.0], [5.0]];
List[FLOAT] y = [2.0, 4.0, 5.5, 8.0, 10.0];

MACHINE model = machine.decision_tree_regressor();
model.fit(X, y);

List[FLOAT] preds = model.predict([[1.5], [3.0], [5.5]]);
show(preds);  -- ~[3.0, 5.5, 10.0]

FLOAT r2 = model.score(X, y);
show(r2);  -- ~0.98
```

### Internal algorithm

1. **Split selection**: Compute the MSE reduction for each feature and threshold.
2. **Recursive construction**: Split the data using the best split and repeat for each subtree.
3. **Stopping criteria**: `max_depth` reached or `min_samples_split` not met.
4. **Prediction**: Traverse the tree to a leaf and return the node mean.

### Comparison with DecisionTreeClassifier

| Aspect | DecisionTreeClassifier | DecisionTreeRegressor |
|---------|------------------------|----------------------|
| Target | Classes (discrete) | Continuous values |
| Criterion | Gini / entropy | MSE |
| Prediction | Majority vote | Node mean |
| Metric | Accuracy | R² |

---

## GaussianNB (Naive Bayes)

Implements a Gaussian Naive Bayes classifier based on Bayes' theorem and the assumption of conditional independence between features.

### Theory

Naive Bayes classifies by computing the posterior probability of each class:

$$P(y|X) \propto P(y) \cdot \prod_{i=1}^{n} P(x_i|y)$$

Each $P(x_i|y)$ is modeled as a Gaussian distribution:

$$P(x_i|y=c) = \frac{1}{\sqrt{2\pi\sigma_{c,i}^2}} \exp\left(-\frac{(x_i - \mu_{c,i})^2}{2\sigma_{c,i}^2}\right)$$

KAFE sums feature log densities and normalizes class scores in log space, so very small densities do not turn into zero before classification.

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `nb.fit(X, y)` | `(List[List[NUM]] or List[NUM], List[INT]) -> VOID` | Fits the classifier |
| `nb.predict(X)` | `(List[List[NUM]] or List[NUM]) -> List[INT]` | Predicts classes |
| `nb.predict_proba(X)` | `(List[List[NUM]] or List[NUM]) -> List[List[FLOAT]]` | Returns class probabilities |
| `nb.score(X, y)` | `(List[List[NUM]] or List[NUM], List[INT]) -> FLOAT` | Computes accuracy |

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `nb.classes_` | `List[INT]` | Unique classes seen during fitting |
| `nb.class_prior_` | `List[FLOAT]` | Prior probability of each class |
| `nb.theta_` | `List[List[FLOAT]]` | Mean of each feature per class |
| `nb.var_` | `List[List[FLOAT]]` | Variance of each feature per class |
| `nb.n_features_in_` | `INT` | Number of features |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 3.0],
                        [6.0, 5.0], [7.0, 7.0], [8.0, 6.0]];
List[INT] y = [0, 0, 0, 1, 1, 1];

MACHINE nb = machine.gaussian_nb();
nb.fit(X, y);

List[INT] preds = nb.predict([[2.0, 2.0], [7.0, 7.0], [4.0, 4.0]]);
show(preds);  -- [0, 1, 0]

FLOAT acc = nb.score(X, y);
show(acc);  -- 1.0

List[List[FLOAT]] probs = nb.predict_proba([[2.0, 2.0], [7.0, 7.0]]);
show(probs);  -- [[~0.9, ~0.1], [~0.1, ~0.9]]
```

### Internal algorithm

1. **Training**: Compute the mean, variance, and prior for each class.
2. **Prediction**: Compute the log-posterior for each class using Bayes' rule.
3. **Decision**: Return the class with the highest log-posterior.

---

## RandomForestClassifier

Implements a random forest classifier, an ensemble of decision trees that combines bagging with random feature selection.

### Theory

Random Forest trains multiple decision trees on bootstrap samples and random feature subsets, then aggregates predictions by majority vote.

**Bootstrap sampling**: Each tree is trained on a random sample drawn with replacement from the original dataset (~63% of the data).

**Random selection**: At each split, only $\sqrt{d}$ features are considered (where $d$ is the total number of features).

**Majority vote**: The final prediction is the class receiving the most votes across all trees.

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `rf.fit(X, y)` | `(List[List[NUM]] or List[NUM], List[INT]) -> VOID` | Fits the ensemble |
| `rf.predict(X)` | `(List[List[NUM]] or List[NUM]) -> List[INT]` | Predicts by majority vote |
| `rf.score(X, y)` | `(List[List[NUM]] or List[NUM], List[INT]) -> FLOAT` | Computes accuracy |

### Constructor Parameters

```kafe
-- n_estimators=10, max_depth=0 (unlimited), min_samples_split=2, min_samples_leaf=1
MACHINE rf = machine.random_forest_classifier(10, 0, 2, 1);
```

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `rf.trees_` | `List[Dict]` | List of fitted trees |
| `rf.classes_` | `List[INT]` | Unique classes seen during fitting |
| `rf.n_features_` | `INT` | Number of features |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 3.0],
                        [6.0, 5.0], [7.0, 7.0], [8.0, 6.0]];
List[INT] y = [0, 0, 0, 1, 1, 1];

MACHINE rf = machine.random_forest_classifier(10, 0, 2, 1);
rf.fit(X, y);

List[INT] preds = rf.predict([[2.0, 2.0], [7.0, 7.0], [4.0, 4.0]]);
show(preds);  -- [0, 1, 0]

FLOAT acc = rf.score(X, y);
show(acc);  -- 1.0
```

### Internal algorithm

1. **Bootstrap**: Draw a sample with replacement for each tree.
2. **Construction**: Build each tree using random feature selection at every split.
3. **Prediction**: Take a majority vote across all trees.

---

## RandomForestRegressor

Implements a random forest regressor, an ensemble of regression trees that combines bagging with random feature selection.

### Theory

Random Forest Regressor trains multiple regression trees on bootstrap samples and random feature subsets, then aggregates predictions by averaging.

**Split criterion**: Variance reduction — selects the split that most reduces target variance in the child nodes.

**Aggregation**: The final prediction is the mean of the predictions from all trees.

### Methods

| Method | Signature | Description |
|--------|-------|-------------|
| `rf.fit(X, y)` | `(List[List[NUM]] or List[NUM], List[NUM]) -> VOID` | Fits the ensemble |
| `rf.predict(X)` | `(List[List[NUM]] or List[NUM]) -> List[NUM]` | Predicts by averaging |
| `rf.score(X, y)` | `(List[List[NUM]] or List[NUM], List[NUM]) -> FLOAT` | Computes R² |

### Constructor parameters

```kafe
-- Defaults: n_estimators=10, max_depth=0 (unlimited), min_samples_split=2, min_samples_leaf=1
MACHINE rf = machine.random_forest_regressor(10, 0, 2, 1);
```

### Properties

| Property | Type | Description |
|-----------|------|-------------|
| `rf.trees_` | `List[Dict]` | List of fitted trees |
| `rf.n_features_` | `INT` | Number of features |

### Example

```kafe
import machine;

List[List[FLOAT]] X = [[1.0], [2.0], [3.0], [4.0], [5.0]];
List[FLOAT] y = [2.0, 4.0, 6.0, 8.0, 10.0];

MACHINE rf = machine.random_forest_regressor(10, 0, 2, 1);
rf.fit(X, y);

List[FLOAT] preds = rf.predict([[1.5], [3.0], [5.5]]);
show(preds);  -- ~[3.0, 6.0, 11.0]

FLOAT r2 = rf.score(X, y);
show(r2);  -- 1.0
```

### Internal algorithm

1. **Bootstrap**: Draw a sample with replacement for each tree.
2. **Construction**: Build each tree with random feature selection and variance-based splits.
3. **Prediction**: Average predictions from all trees.

---
