# K-Nearest Neighbors (KNN)

## Category

Machine Learning — Supervised Learning (Classification)

## Description

KNN is a non-parametric, instance-based learning algorithm that classifies new data points based on the majority class of their k nearest neighbors in the feature space.

**Algorithm**:
1. Store all training data
2. For a new sample, compute distances to all training points
3. Select the k closest training points
4. Return the majority class among those k neighbors

**Distance Metric**: Euclidean distance $d(a,b) = \sqrt{\sum(a_i - b_i)^2}$

**Key Properties**:
- Lazy learning: no training phase (just stores data)
- Non-parametric: makes no assumptions about data distribution
- Instance-based: decisions based on individual training points
- Complexity: O(n·d) per prediction (n = training size, d = dimensions)

**Advantages**:
- Simple to understand and implement
- Adapts to any data distribution
- No training time
- Naturally handles multi-class problems

**Limitations**:
- Slow prediction on large datasets (must compute all distances)
- Sensitive to irrelevant features (all features weighted equally)
- Sensitive to feature scaling (distance-based)
- Requires choosing k (hyperparameter)

## Motivation

KNN teaches the concept of instance-based learning and distance metrics. It demonstrates that a model can simply memorize data (lazy learning) and generalize through local neighborhoods — a contrast to parametric models like linear regression.

## Dependencies

- `lib.KafeMATH.funciones` — `sqrt` for Euclidean distance
- `BaseMachine.py` — base class

## Related Concepts

- Euclidean Distance
- Lazy Learning vs Eager Learning
- Curse of Dimensionality (KNN degrades in high dimensions)
- Feature Scaling (required for fair distance computation)

## Usage Examples

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 1.0], [2.0, 2.0], [5.0, 5.0], [6.0, 6.0]];
List[INT] y = [0, 0, 1, 1];

MACHINE model = machine.knn(3);
model.fit(X, y);

List[INT] preds = model.predict([[2.0, 2.0], [5.0, 5.0], [3.0, 3.0]]);
show(preds);  -- [0, 1, 0]
```

## Implementation Location

- `src/lib/KafeMACHINE/KNN.py` — class `KNN(BaseMachine)`

## Public API

- Factory: `machine.knn(k)`
- Methods: `fit(X, y)`, `predict(X)`, `predict_proba(X)`, `score(X, y)`

## References

- Cover & Hart (1967) — Nearest Neighbor Pattern Classification
