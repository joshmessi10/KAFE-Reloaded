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

```kafe
import machine;

MACHINE lr = machine.logistic_regression(0.01, 1000);

-- Define parameter grid as dictionary
Dict param_grid = {"lr": [0.001, 0.01, 0.1], "iter": [500, 1000, 2000]};

-- GridSearchCV with 5-fold CV
MACHINE gs = machine.grid_search_cv(lr, param_grid, 5, machine.accuracy_score);
gs.fit(X_train, y_train);

show(gs.best_params_);   -- Best parameter combination
show(gs.best_score_);    -- Best cross-validation score
show(gs.best_estimator_); -- Model refit with best params
```

## Relationship with KAFE

GridSearchCV in KAFE is implemented from scratch, wrapping the model_selection module (k_fold_cross_validation) with a grid enumeration layer. It provides an educational view of how hyperparameter search works internally.

## References

- Bergstra, J., & Bengio, Y. (2012). Random search for hyper-parameter optimization. JMLR.
- scikit-learn documentation: GridSearchCV
