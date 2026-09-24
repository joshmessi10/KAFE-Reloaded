# CrossValScore

## Name

CrossValScore

## Category

ML utility — model evaluation

## Description

`CrossValScore` evaluates a model with k-fold cross-validation through an object-oriented API. It computes the score for each fold, the mean, and the standard deviation to provide a robust estimate of model performance.

## Mathematical Foundation

Given a dataset of $n$ samples and $k$ folds:

1. Shuffle and partition the dataset into $k$ folds, $\{F_1, F_2, \ldots, F_k\}$.
2. For each fold $i$:
   - Train on $\bigcup_{j \neq i} F_j$.
   - Evaluate on $F_i$ with the selected scoring metric.
3. Compute the mean $\bar{s} = \frac{1}{k} \sum_{i=1}^k s_i$ and sample standard deviation $\sigma = \sqrt{\frac{1}{k-1} \sum_{i=1}^k (s_i - \bar{s})^2}$.

- **Time complexity**: $O(k \cdot T_{\text{model}})$, where $T_{\text{model}}$ is training time per fold.
- **Space complexity**: $O(n)$ to store the folds.

## Step-by-Step Algorithm

1. Receive the model, data $X$ and $y$, and the number of folds $k$.
2. Generate shuffled k-fold partitions.
3. For each fold, split training and test data, fit the model, and calculate its score.
4. Store the scores and calculate their mean and standard deviation.

## Motivation

`CrossValScore` provides a standardized, reusable way to evaluate models with cross-validation by encapsulating partitioning and scoring in one object.

## Advantages

- Object-oriented API (compatible with `Pipeline` and `GridSearchCV`).
- Built-in handling for `accuracy`, `r2`, and `mse`, with a fallback to `model.score()`.
- Standard deviation to estimate score variability.
- Reproducibility through `random_state`.

## Limitations

- Custom scoring callbacks are not accepted; other scoring labels fall back to `model.score()`.

## When to Use

- For a quick model evaluation.
- As an evaluation metric in `GridSearchCV` or `RandomizedSearchCV`.
- When the standard deviation of model performance is needed.

## When NOT to Use

- When evaluation requires passing a custom scoring callback.

## Dependencies

- `k_fold` (partitioning function).
- BaseMachine (models with a `fit`/`predict` interface)

## Related Concepts

- k-fold-cross-validation
- train-test-split
- GridSearchCV

## Relationship with KAFE

In KAFE, `CrossValScore` is implemented as a class in `src/lib/KafeMACHINE/model_selection/`. The factory `machine.cross_val_score(cv, scoring, random_state)` creates an instance.

## Usage Examples

```kafe
import machine;

MACHINE lr = machine.linear_regression();
MACHINE cvs = machine.cross_val_score(5, "r2", 42);
cvs.fit(lr, X, y);

show(cvs.mean_score_);  -- ~0.92
show(cvs.std_score_);   -- ~0.025
```

## Implementation Location

- `src/lib/KafeMACHINE/model_selection/` — `CrossValScore` implementation.

## Public API

- `machine.cross_val_score(cv, scoring, random_state)` — creates a `CrossValScore` instance.
- `cvs.fit(model, X, y)` — evaluates the model with k-fold cross-validation.
- `cvs.scores_` — score for each fold.
- `cvs.mean_score_` — mean score.
- `cvs.std_score_` — standard deviation.

## References

- scikit-learn cross_val_score: https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.cross_val_score.html
