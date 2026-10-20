# GridSearchCV

## Definition

GridSearchCV performs exhaustive search over a specified parameter grid for an estimator, evaluating each combination using cross-validation.

## Mathematical Foundation

GridSearchCV implements **exhaustive grid search**:

- Given a parameter grid $G = G_1 \times G_2 \times \cdots \times G_p$, where each $G_i$ is a discrete set of values for parameter $i$.
- The algorithm evaluates the estimator at **every** combination $(g_1, g_2, \ldots, g_p) \in G$.
- For each combination, it performs $k$-fold cross-validation and records the mean score.
- The best combination is $\arg\max_{g \in G} \frac{1}{k} \sum_{i=1}^{k} \text{score}(g, \text{fold}_i)$.

**Complexity**: $O\left(\prod_{i=1}^{p} |G_i| \cdot k \cdot T_{\text{model}}\right)$

where $|G_i|$ is the number of values for parameter $i$, $k$ is the number of folds, and $T_{\text{model}}$ is the training time per fit.

## Advantages

- **Exhaustive**: Guarantees finding the best combination within the defined grid.
- **Deterministic**: Same grid + same data = same result (with fixed random_state).
- **Interpretable**: Easy to understand which parameters were tested.
- **Parallelizable**: Each combination is independent.

## Limitations

- **Exponential cost**: Number of evaluations grows as the Cartesian product of all parameter lists.
- **Curse of dimensionality**: Adding one parameter with $m$ values multiplies total evaluations by $m$.
- **Discrete grid only**: Cannot search continuous parameter spaces finely without discretization.
- **Redundant**: Many grid points may yield nearly identical results.

## KAFE Implementation

The `machine.grid_search_cv(cv, scoring, random_state)` factory currently creates a wrapper with an empty grid and does not expose a KAFE argument for configuring `param_grid`. The Python `GridSearchCV` constructor accepts a grid, but a configured search is not currently available through this KAFE factory.

## Relationship with KAFE

GridSearchCV in KAFE is implemented in `src/lib/KafeMACHINE/model_selection/model_selection.py`. It builds shuffled k-fold splits internally and evaluates each parameter combination over those splits.

## References

- Bergstra, J., & Bengio, Y. (2012). Random search for hyper-parameter optimization. JMLR.
- scikit-learn documentation: GridSearchCV
