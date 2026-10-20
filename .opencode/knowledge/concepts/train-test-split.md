# Train-Test Split

## Mathematical Foundation

Train-test split is a fundamental method for evaluating models. It divides a dataset into two subsets: one for training and one for evaluation.

### Formulation

Given $n$ examples $(x_i, y_i)$, divide them into:

- **Training set**: $X_{train}, y_{train}$ — $(1 - \alpha) \cdot n$ examples for fitting the model.
- **Test set**: $X_{test}, y_{test}$ — $\alpha \cdot n$ examples for evaluating generalization.

Here, $\alpha$ is the test fraction (typically 0.2 or 0.3).

### Random Sampling

When `shuffle` is enabled, the function shuffles sample indices before splitting:

$$P(x_i \in \text{test}) = \alpha \quad \forall i \in \{1, \dots, n\}$$

### Computational Complexity

| Operation | Time Complexity | Space Complexity |
|-----------|-----------------|------------------|
| Split | $O(n)$ | $O(n)$ |

## Step-by-Step Algorithm

1. **Determine sizes**: Compute `n_train = floor(n * (1 - test_size))` and assign the remaining samples to the test set.
2. **Shuffle indices**: Generate a random permutation of $\{0, 1, \dots, n-1\}$.
3. **Split**: The first `n_train` indices go to the training set; the rest go to the test set.
4. **Return**: The tuple `(X_train, X_test, y_train, y_test)`.

## Motivation

Without a train-test split, there is no objective way to measure a model's ability to generalize. A model can memorize training data (overfitting) and fail on unseen data. A test split simulates the real-world situation in which the model encounters data it has not seen before.

## Advantages

- **Simple**: One step, easy to understand and implement.
- **Fast**: Requires only one permutation of indices.
- **Objective**: Provides a direct estimate of generalization performance.
- **Versatile**: Works for classification, regression, and other model types.

## Limitations

- **High variance**: Evaluation depends on a single partition of the dataset.
- **Data is held out**: The test set is not used for training, reducing the training-set size.
- **Limited statistical robustness**: One split does not provide confidence intervals.
- **Distribution-sensitive**: A split can be misleading when data are not i.i.d.

## When to Use

- Large datasets (more than $10^4$ samples) where one split is representative.
- Quick model evaluation.
- Initial dataset exploration.
- When evaluation is costly and multiple splits are impractical.

## When NOT to Use

- Small datasets, where the split withholds too much training data.
- When a robust performance estimate is required (use cross-validation).
- Time-ordered data (use a time-series split).
- Severe class imbalance (use a stratified split or cross-validation).

## Dependencies

- No other KAFE modules.
- Requires only a random shuffle operation.

## Related Concepts

- **K-Fold Cross-Validation**: More robust evaluation using multiple splits.
- **Stratified Split**: A variant that preserves class proportions.
- **Time Series Split**: For data with temporal order.
- **Bootstrap**: Sampling with replacement as an alternative.

## Relationship with KAFE

KAFE implements `train_test_split` in the `model_selection` package as a pure function that operates on native KAFE lists. The implementation:

- Accepts `List[List[NUM]]` for features and `List[NUM]` for targets.
- Provides `test_size` (default 0.2) and `random_state` (default `None`) parameters.
- Provides a `shuffle` parameter (default `True`); it does not implement stratified splitting.
- Uses `random_state=0` by default; a value of `0` selects a non-fixed random seed.
- Returns `(X_train, X_test, y_train, y_test)` as `List[List[NUM]]` values.

## Usage Examples

```kafe
import machine;

List[List[FLOAT]] X = [[1.0], [2.0], [3.0], [4.0], [5.0], [6.0], [7.0], [8.0], [9.0], [10.0]];
List[FLOAT] y = [2.0, 4.0, 6.0, 8.0, 10.0, 12.0, 14.0, 16.0, 18.0, 20.0];

-- 80/20 split
(List[List[FLOAT]] X_train, List[List[FLOAT]] X_test,
 List[FLOAT] y_train, List[FLOAT] y_test) = machine.train_test_split(X, y, 0.2, 42);

show(len(X_train));  -- 8
show(len(X_test));   -- 2
```

## Implementation Location

- `src/lib/KafeMACHINE/model_selection/model_selection.py` — `train_test_split` implementation.

## Public API

- `machine.train_test_split(X, y, test_size=0.2, random_state=0, shuffle=True)` → `(List[List[NUM]], List[List[NUM]], List[NUM], List[NUM])`

## References

- Hastie, T., Tibshirani, R., & Friedman, J. (2009). *The Elements of Statistical Learning*. Springer.
- scikit-learn documentation: `sklearn.model_selection.train_test_split`
