# RandomizedSearchCV

## Definition

RandomizedSearchCV performs search over parameter distributions by sampling a fixed number of parameter settings from specified distributions, evaluating each sampled combination using cross-validation.

## Mathematical Foundation

RandomizedSearchCV implements **randomized search** over a parameter space:

- Given parameter distributions $D = (D_1, D_2, \ldots, D_p)$, where each $D_i$ is a distribution (uniform, log-uniform, discrete) or a list of values.
- The algorithm draws $n$ random samples $(g_1, g_2, \ldots, g_p)$ from the product distribution $D_1 \times D_2 \times \cdots \times D_p$.
- For each sample, it performs $k$-fold cross-validation and records the mean score.
- The best sample is $\arg\max_{j=1}^{n} \text{score}(\mathbf{g}^{(j)})$.

**Complexity**: $O(n \cdot k \cdot T_{\text{model}})$

where $n$ is the number of iterations (n_iter), $k$ is the number of folds, and $T_{\text{model}}$ is the training time per fit.

**Budget efficiency**: For a fixed budget $B$, randomized search samples $B / (k \cdot T_{\text{model}})$ combinations, potentially covering more of the parameter space than grid search.

## Advantages

- **More efficient**: For the same budget, explores more parameter combinations than grid search.
- **Continuous distributions**: Can search continuous spaces naturally (e.g., log-uniform for learning rates).
- **Flexible**: Supports independent distributions per parameter.
- **Scalable**: Cost depends on n_iter, not the grid size.

## Limitations

- **No guarantee**: May miss the optimal combination if n_iter is too small.
- **Stochastic**: Results vary across runs (unless random_state is fixed).
- **Requires tuning n_iter**: Too few iterations miss good parameters; too many waste time.

## KAFE Implementation

The `machine.randomized_search_cv(n_iter, cv, scoring, random_state)` factory currently creates a wrapper with an empty distribution and does not expose a KAFE argument for configuring `param_distributions`. The Python `RandomizedSearchCV` constructor accepts distributions, but a configured search is not currently available through this KAFE factory.

## Relationship with KAFE

RandomizedSearchCV in KAFE is implemented in `src/lib/KafeMACHINE/model_selection/model_selection.py`. It samples parameter combinations and builds shuffled k-fold splits internally to evaluate each sample.

## References

- Bergstra, J., & Bengio, Y. (2012). Random search for hyper-parameter optimization. JMLR.
- scikit-learn documentation: RandomizedSearchCV
