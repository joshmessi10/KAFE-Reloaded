# Linear Regression

## Category

Machine Learning — Supervised Learning (Regression)

## Description

Linear Regression models the relationship between a dependent variable and one or more independent variables by fitting a linear equation to observed data. The model assumes that the relationship between variables is linear and that errors are normally distributed.

**Ordinary Least Squares (OLS)**: The most common method finds coefficients that minimize the sum of squared residuals: $\hat{\beta} = (X^T X)^{-1} X^T y$

**Key Properties**:
- Assumes linear relationship between features and target
- Closed-form solution (no iterative optimization needed)
- Coefficients are interpretable (each represents the change in y per unit change in x)
- Sensitive to outliers (squared error amplifies large residuals)

**Advantages**:
- Simple, interpretable, fast to train
- No hyperparameters to tune
- Good baseline for regression tasks
- Statistical properties well-understood (confidence intervals, hypothesis tests)

**Limitations**:
- Cannot capture non-linear relationships
- Assumes independence of errors (no autocorrelation)
- Assumes homoscedasticity (constant variance of errors)
- Multicollinearity can make coefficients unstable

## Motivation

Linear Regression is the foundational algorithm in machine learning and statistics. Implementing it from scratch teaches the mathematical underpinnings of model fitting, the normal equation, and the concept of least squares optimization.

## Dependencies

- `lib.KafeNUMK` — matrix operations for the normal equation
- `BaseMachine.py` — base class for fit/predict/score contract

## Related Concepts

- Logistic Regression (classification counterpart)
- Gradient Descent (iterative optimization alternative to OLS)
- Regularization (Ridge, Lasso — prevent overfitting in linear models)

## Usage Examples

```kafe
import machine;

List[FLOAT] x = [1.0, 2.0, 3.0, 4.0, 5.0];
List[FLOAT] y = [2.1, 4.0, 5.8, 8.1, 10.0];

MACHINE lr = machine.linear_regression();
lr.fit(x, y);

show(lr.coef_);       -- ~[1.98]
show(lr.intercept_);  -- ~0.06

List[FLOAT] preds = lr.predict([6.0, 7.0]);
show(preds);           -- ~[11.96, 13.94]

FLOAT r2 = lr.score(x, y);
show(r2);              -- ~0.997
```

## Implementation Location

- `src/lib/KafeMACHINE/LinearRegression.py` — class `LinearRegression(BaseMachine)`
- Factory: `src/lib/KafeMACHINE/funciones.py` — `linear_regression()`

## Public API

- Factory: `machine.linear_regression()`
- Methods: `fit(X, y)`, `predict(X)`, `score(X, y)`
- Attributes: `coef_` (coefficients), `intercept_` (intercept)

## References

- Normal equation: $\hat{\beta} = (X^T X)^{-1} X^T y$
- scikit-learn documentation — `sklearn.linear_model.LinearRegression`
