# K-Fold Cross Validation

## Mathematical Foundation

K-Fold Cross Validation is an evaluation method that partitions a dataset into $k$ subsets (folds) and trains and evaluates a model $k$ times. Each run uses a different fold as the test set and the remaining folds as the training set.

### Formulation

Given a dataset $D$ with $n$ samples, partition it into $k$ disjoint folds $D_1, D_2, \dots, D_k$ of approximately $n/k$ samples each:

$$D = \bigcup_{i=1}^{k} D_i, \quad D_i \cap D_j = \emptyset \quad \forall i \neq j$$

For each fold $i \in \{1, \dots, k\}$:

- **Training set**: $D_{train}^{(i)} = D \setminus D_i$ — size $(k-1) \cdot n/k$.
- **Test set**: $D_{test}^{(i)} = D_i$ — size $n/k$.

### Aggregate Score

The final score is the mean of the scores from each fold:

$$\text{CV}_k = \frac{1}{k} \sum_{i=1}^{k} \text{score}(f^{(i)}, D_i)$$

where $f^{(i)}$ is the model trained on $D_{train}^{(i)}$.

### Estimator Variance

The variance of the cross-validation estimate can be calculated as:

$$\text{Var}(\text{CV}_k) = \frac{1}{k} \sum_{i=1}^{k} \left( \text{score}_i - \text{CV}_k \right)^2$$

### Computational Complexity

| Operation | Time Complexity | Space Complexity |
|-----------|---------------------|---------------------|
| Partition | $O(n)$ | $O(n)$ |
| Full evaluation | $O(k \cdot T(n))$ | $O(n)$ |

Here, $T(n)$ is the cost of training the model on $n$ samples.

## Step-by-Step Algorithm

1. **Shuffle the dataset**: Randomly permute the $n$ indices.
2. **Create folds**: Divide the indices into $k$ groups of approximately $n/k$ elements.
3. **For each fold $i = 1, \ldots, k$**:
   a. Use fold $i$ as the test set.
   b. Concatenate the remaining folds into the training set.
   c. Train model $f^{(i)}$ on the training set.
   d. Evaluate $\text{score}_i$ on the test set.
   e. Store $\text{score}_i$.
4. **Average**: Calculate $\text{CV}_k = \frac{1}{k} \sum_{i=1}^{k} \text{score}_i$.
5. **Optional**: Calculate the standard deviation for confidence intervals.

## Motivation

The main limitation of Train-Test Split is its high variance: the evaluation depends on a single partition. K-Fold CV addresses this by evaluating multiple partitions and averaging their scores, producing a more stable estimate of generalization performance.

Each sample is used exactly once for testing and $k-1$ times for training, making efficient use of the available data.

## Advantages

- **Lower variance**: Averages multiple evaluations and reduces sensitivity to a single partition.
- **Efficient data use**: Each sample is used for both training and testing.
- **Robust estimate**: Provides a basis for estimating performance variability.
- **General-purpose**: Applies to many models and metrics.
- **No samples discarded**: Unlike a single train-test split, every sample is used.

## Limitations

- **Computational cost**: Trains the model $k$ times instead of once.
- **Not suitable for time series**: Shuffling breaks temporal dependencies.
- **Evaluation bias**: Each model is evaluated on one fold, not the full dataset.
- **Overlapping training sets**: Training folds overlap substantially.

## When to Use

- Small or medium-sized datasets where every sample matters.
- When a robust performance estimate is needed.
- Comparing models or selecting hyperparameters.
- Assessing model stability.
- When the dataset is too small for a reliable single split.

## When NOT to Use

- Very large datasets (>$10^5$), where a train-test split may be sufficient and faster.
- Data with temporal dependence (use a time-series split).
- When training is extremely expensive (use a holdout set).
- When evaluation must use a completely new dataset (use a holdout set).

## Dependencies

- Does not depend on other KAFE modules.
- Requires only random permutation and partitioning.

## Related Concepts

- **Train-Test Split**: Simplified version with one partition.
- **Leave-One-Out (LOO)**: K-Fold with $k = n$.
- **Repeated K-Fold**: Repeats K-Fold multiple times.
- **Nested Cross-Validation**: For less-biased hyperparameter selection.

## Relationship with KAFE

KAFE implements `k_fold` in `src/lib/KafeMACHINE/model_selection/model_selection.py` as a function that returns training and test indices for each fold. It defaults to `n_splits=5`, `shuffle=False`, and `random_state=0` (where `0` selects a non-fixed random seed). The `machine.cross_val_score(cv, scoring, random_state)` factory creates a `CrossValScore` object that evaluates a model over shuffled folds. The implementation:

- `machine.k_fold(n_samples, n_splits, shuffle, random_state)` returns a list of `[train_indices, test_indices]` pairs.
- `CrossValScore.fit(model, X, y)` fits and scores the model on each fold.
- Supported scoring names include `accuracy`, `r2`, and `mse`.
- `CrossValScore` works with KafeMACHINE models that implement `fit` and `predict`.

## Usage Examples

```kafe
import machine;

List[List[FLOAT]] X = [[1.0, 2.0], [2.0, 3.0], [3.0, 4.0],
                        [4.0, 5.0], [5.0, 6.0], [6.0, 7.0],
                        [7.0, 8.0], [8.0, 9.0], [9.0, 10.0], [10.0, 11.0]];
List[FLOAT] y = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];

MACHINE lr = machine.linear_regression();
MACHINE cvs = machine.cross_val_score(5, "r2", 42);
cvs.fit(lr, X, y);
show(cvs.scores_);
show(cvs.mean_score_);
show(cvs.std_score_);
```

## Implementation Location

- `src/lib/KafeMACHINE/model_selection/model_selection.py` — `k_fold` and `CrossValScore` implementations.

## Public API

- `machine.k_fold(n_samples, n_splits=5, shuffle=False, random_state=0)` returns fold index pairs.
- `machine.cross_val_score(cv=5, scoring="accuracy", random_state=0)` creates a `CrossValScore` object.
- `cvs.fit(model, X, y)` computes `scores_`, `mean_score_`, and `std_score_`.

## References

- Hastie, T., Tibshirani, R., & Friedman, J. (2009). *The Elements of Statistical Learning*. Springer.
- Kohavi, R. (1995). A Study of Cross-Validation and Bootstrap for Accuracy Estimation and Model Selection. *IJCAI*.
- scikit-learn documentation: `sklearn.model_selection.cross_val_score`
