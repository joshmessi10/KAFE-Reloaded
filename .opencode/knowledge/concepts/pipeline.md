# Pipeline

## Name

Pipeline

## Category

ML utility — model selection / workflow composition

## Description

`Pipeline` chains multiple preprocessing steps and a final model in a single object. Each step is fitted and transformed in sequence, preventing data leakage by ensuring that transformers see only the training data during `fit()`.

## Mathematical Foundation

Given a pipeline $P = [T_1, T_2, \ldots, T_n, M]$, where $T_i$ are transformers and $M$ is the final model:

**Training**:
$$X' = T_1.\text{fit\_transform}(X)$$
$$X'' = T_2.\text{fit\_transform}(X')$$
$$\vdots$$
$$M.\text{fit}(X^{(n)}, y)$$

**Prediction**:
$$X' = T_1.\text{transform}(X)$$
$$X'' = T_2.\text{transform}(X')$$
$$\vdots$$
$$\hat{y} = M.\text{predict}(X^{(n)})$$

- **Time Complexity**: $O(\sum_{i=1}^{n} T_{\text{fit}}(T_i) + T_{\text{fit}}(M))$ for training and $O(\sum_{i=1}^{n} T_{\text{transform}}(T_i) + T_{\text{predict}}(M))$ for prediction.
- **Space Complexity**: $O(n \cdot d)$, where $d$ is the number of features, because each transformation creates a new representation.

**Key Formulas**: Each step $T_i$ applies its own mathematical transformation (for example, `StandardScaler` applies $z = (x - \mu) / \sigma$), and the pipeline composes them.

## Step-by-Step Algorithm

1. Receive input data $X$ and target values $y$.
2. For each transformer $T_i$ except the final step:
   a. Call $T_i.\text{fit\_transform}(X_{\text{current}})$ if it implements `fit_transform`.
   b. Otherwise, call $T_i.\text{fit}(X_{\text{current}})$ followed by $T_i.\text{transform}(X_{\text{current}})$.
   c. Replace $X_{\text{current}}$ with the transformed output.
3. For the final model $M$, call $M.\text{fit}(X_{\text{current}}, y)$.
4. Store the fitted steps in `steps_` and `named_steps_`.
5. For prediction, apply each transformer's `transform()` in sequence, then call the model's `predict()`.

## Motivation

`Pipeline` addresses a fundamental ML problem: **data leakage**. Without a pipeline, it is easy to fit a scaler on the entire dataset, including test data, before splitting it, which contaminates the evaluation. A pipeline ensures that each transformer is fitted only on the training data.

It also provides **modularity**, making it easy to experiment with different preprocessing and model combinations without rewriting code.

## Advantages

- **Prevents data leakage**: Each transformer is fitted only on training data during cross-validation.
- **Modularity**: Combines transformations and models as reusable building blocks.
- **Reproducibility**: The same pipeline applies the same sequence of steps on each run.
- **Cleaner code**: One object replaces multiple manual `fit` and `transform` calls.
- **Works with `GridSearchCV` and `RandomizedSearchCV`**: Allows simultaneous search over preprocessing and model hyperparameters.

## Limitations

- **Less flexible than custom code**: Edge cases such as conditional transformations require a custom design.
- **Harder to debug**: Errors in intermediate steps may be difficult to trace.
- **Sequential only**: Does not support transformation graphs such as parallel branches.
- **Final step must be a model**: `Pipeline` expects the last element to provide `fit(X, y)` and `predict(X)`.

## When to Use

- When preprocessing steps must be chained with a model.
- When using cross-validation and preventing data leakage is important.
- When preprocessing and model hyperparameters should be searched together.
- For reproducible and modular ML workflows.

## When NOT to Use

- Intermediate transformations that need simultaneous access to $X$ and $y$.
- Transformation graphs with parallel branches (a DAG is needed).
- When preprocessing is so simple that a pipeline adds unnecessary complexity.

## Dependencies

- BaseMachine (base class)
- Any transformer with a `fit`/`transform` interface (StandardScaler, MinMaxScaler, PCA, etc.)
- Any model with a `fit`/`predict` interface

## Related Concepts

- train-test-split
- k-fold-cross-validation
- GridSearchCV
- RandomizedSearchCV
- StandardScaler
- BaseMachine

## Relationship with KAFE

In KAFE, `Pipeline` is implemented as a class that extends `BaseMachine`. The factory `machine.pipeline()` accepts alternating name and step pairs:

```
machine.pipeline("scaler", scaler, "model", lr)
```

`Pipeline` inherits from `BaseMachine`, which makes it compatible with `GridSearchCV` and `RandomizedSearchCV` for nested hyperparameter search.

## Usage Examples

```kafe
import machine;

-- Create transformers and a model
MACHINE scaler = machine.standard_scaler();
MACHINE lr = machine.linear_regression();

-- Create a pipeline: scaling → linear regression
MACHINE pipe = machine.pipeline("scaler", scaler, "model", lr);

-- Fit the complete pipeline
pipe.fit(X_train, y_train);

-- Predict (the scaler is applied automatically)
List[FLOAT] preds = pipe.predict(X_test);

-- Evaluate
FLOAT r2 = pipe.score(X_test, y_test);

-- Use with GridSearchCV
Dict param_grid = {"scaler__strategy": ["mean", "median"]};
MACHINE gs = machine.grid_search_cv(pipe, param_grid, 5, machine.r2_score);
gs.fit(X_train, y_train);
```

## Implementation Location

- `src/lib/KafeMACHINE/model_selection/` — `Pipeline` implementation.
- `src/lib/KafeMACHINE/functions.py` — `pipeline()` factory.

## Public API

- `machine.pipeline(name1, step1, name2, step2, ...)` — creates a pipeline with named steps.
- `pipe.fit(X, y)` — fits every pipeline step.
- `pipe.predict(X)` — transforms the input and predicts.
- `pipe.score(X, y, metric)` — evaluates using the final model.
- `pipe.transform(X)` — applies only the transformations, without the model.
- `pipe.fit_transform(X, y)` — fits the pipeline and transforms the data.
- `pipe.get_params()` — returns the step names.
- `pipe.named_steps_` — mapping of step names to steps after fitting.
- `pipe.steps_` — list of fitted `(name, step)` tuples.

## References

- scikit-learn Pipeline documentation: https://scikit-learn.org/stable/modules/compose.html#pipeline-chaining-estimators
- Hastie, T., Tibshirani, R., & Friedman, J. (2009). The Elements of Statistical Learning. Chapter 7: Model Assessment and Selection.
