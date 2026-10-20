# Random Forest Classifier

## Mathematical Foundation

Random Forest is an **ensemble learning method** that constructs multiple decision trees and aggregates their predictions. It combines **bagging** (bootstrap aggregating) with **random feature selection** to reduce overfitting and improve generalization.

### Key Concepts

**Bootstrap Sampling**: Each tree is trained on a random sample of the training data drawn with replacement. If the training set has $n$ samples, each bootstrap sample also has $n$ samples, but some are repeated and some are left out (approximately 37% out-of-bag).

**Random Feature Selection**: At each split, only a random subset of $m$ features is considered (where $m = \sqrt{d}$ by default, with $d$ being the total number of features). This decorrelates the trees.

**Majority Voting**: For classification, the final prediction is the class that appears most frequently across all trees.

### Algorithm

**Training (fit)**:
1. For each tree $t = 1, \ldots, T$:
   a. Draw bootstrap sample $D_t$ from training set $D$
   b. Grow tree $T_t$ on $D_t$:
      - At each node, select $m$ random features
      - Find best split among those features
      - Split into left and right children
      - Repeat until stopping criterion (max_depth, min_samples, or pure node)

**Prediction (predict)**:
1. For each tree, get prediction $\hat{y}_t(x)$
2. Return majority vote: $\hat{y}(x) = \text{mode}(\{\hat{y}_1(x), \ldots, \hat{y}_T(x)\})$

### Out-of-Bag Estimation

Each tree is trained on approximately 63% of the training samples. The remaining 37% are called **out-of-bag (OOB)** samples. These can be used for internal validation without a separate validation set.

## Complexity

| Operation | Time Complexity | Space Complexity |
|-----------|----------------|-----------------|
| Training | $O(T \cdot n \cdot d \cdot \log n)$ | $O(T \cdot n)$ |
| Prediction | $O(T \cdot d)$ | $O(T)$ |

Where:
- $T$ = number of trees
- $n$ = number of samples
- $d$ = number of features

## Advantages

1. **Reduces overfitting** — ensemble of trees generalizes better than single tree
2. **Handles high-dimensional data** — random feature selection works well with many features
3. **Robust to noise** — majority voting smooths out individual tree errors
4. **No feature scaling needed** — tree-based models are invariant to feature scales
5. **Feature importance** — can measure importance by counting feature usage in splits
6. **Out-of-bag estimation** — internal validation without separate test set

## Limitations

1. **Less interpretable** — ensemble of trees is harder to interpret than single tree
2. **Slower training** — must train multiple trees
3. **Memory intensive** — stores multiple trees
4. **Can still overfit** — with very noisy data or too many trees
5. **Biased towards features with more levels** — categorical features with many levels get more splits

## When to Use / When NOT to Use

### Use When:
- Need high accuracy with minimal tuning
- Data has many features
- Want to avoid overfitting of single decision tree
- Need feature importance ranking

### Do NOT Use When:
- Interpretability is critical
- Very large datasets (training is slow)
- Need to classify new points in real-time (prediction is slower than single tree)

## Relationship with KAFE Implementation

KAFE implements RandomForestClassifier from scratch:

- Reuses DecisionTree logic with random feature subsets
- Uses bootstrap sampling for training diversity
- Implements majority voting for aggregation
- Inherits from BaseMachine with standard fit/predict/score interface

## References

- Breiman, L. (2001). Random Forests. *Machine Learning*, 45(1), 5-32.
- Hastie, T., Tibshirani, R., & Friedman, J. (2009). *The Elements of Statistical Learning*. Springer. Section 15.2.
- Criminisi, A., Shotton, J., & Konukoglu, E. (2012). Decision Forests: A Unified Framework for Classification, Regression, Density Estimation, Manifold Learning and Semi-Supervised Learning. *Foundations and Trends in Computer Graphics and Vision*.
