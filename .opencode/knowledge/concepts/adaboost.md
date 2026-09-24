# AdaBoost (Adaptive Boosting)

## Mathematical Foundation

AdaBoost is an ensemble-learning algorithm that sequentially combines multiple weak classifiers.

### Algorithm

1. **Initialize** uniform weights $w_i = 1/n$.
2. **For each iteration $t = 1, \ldots, T$**:
   - Train weak classifier $h_t$ using weights $w_i$.
   - Calculate error: $\epsilon_t = \sum w_i \cdot I(h_t(x_i) \neq y_i)$.
   - Calculate classifier weight: $\alpha_t = 0.5 \cdot \ln\left(\frac{1 - \epsilon_t}{\epsilon_t}\right)$.
   - Update weights: $w_i \leftarrow w_i \cdot \exp(-\alpha_t \cdot y_i \cdot h_t(x_i))$.
   - Normalize weights: $w_i \leftarrow \frac{w_i}{\sum w_j}$.
3. **Predict** with $H(x) = \text{sign}\left(\sum_{t=1}^{T} \alpha_t \cdot h_t(x)\right)$.

### Weak Classifier (Decision Stump)

A decision stump is a depth-1 decision tree:
- It selects a feature and threshold.
- It predicts one class on the left and another on the right.

## Computational Complexity

| Operation | Time Complexity | Space Complexity |
|-----------|---------------------|---------------------|
| Training | $O(T \cdot n \cdot m)$ | $O(T)$ |
| Prediction | $O(T \cdot m)$ | $O(1)$ |

Here, $T$ is `n_estimators`, $n$ is the number of samples, and $m$ is the number of features.

## Advantages

1. **Can reduce overfitting** — an ensemble of weak learners may generalize better.
2. **No complex base model required** — it uses simple decision stumps.
3. **Adaptive** — it emphasizes examples misclassified by the previous classifier.
4. **Interpretable** — the contribution of each stump can be inspected.

## Limitations

1. **Binary classification only** — the implementation natively classifies two classes.
2. **Sensitive to outliers** — it can overfit noisy data.
3. **Sequential training** — boosting rounds cannot be parallelized.
4. **Depends on the weak learner** — a very weak learner may converge slowly.

## When to Use

- Binary classification.
- Simple weak learners such as decision stumps.
- Relatively clean data with little noise.
- When interpretability is useful.

## When NOT to Use

- Multiclass classification (use One-vs-One).
- Data with many outliers.
- Very large datasets that make sequential training costly.

## Relationship with KAFE

KAFE implements `AdaBoostClassifier` from scratch:
- It uses decision stumps as weak learners.
- It implements an adapted AdaBoost.R2 algorithm.
- It supports `learning_rate` to control each stump's contribution.

## References

- Freund, Y., & Schapire, R. E. (1997). A Decision-Theoretic Generalization of On-Line Learning and an Application to Boosting. *Journal of Computer and System Sciences*.
- Schapire, R. E. (2013). The Boosting Approach to Machine Learning: An Overview. *Nonlinear Estimation and Classification*.
