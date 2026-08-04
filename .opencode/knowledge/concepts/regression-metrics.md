# Regression Metrics

## Category

Machine Learning — Evaluation Metrics

## Description

Regression metrics measure the performance of regression models by quantifying the difference between predicted and actual continuous values.

**Core Metrics**:

| Metric | Formula | Interpretation |
|--------|---------|----------------|
| MSE | $(1/n)\sum(y_i - \hat{y}_i)^2$ | Average squared error (penalizes large errors) |
| MAE | $(1/n)\sum|y_i - \hat{y}_i|$ | Average absolute error (interpretable in original units) |
| RMSE | $\sqrt{MSE}$ | Root mean squared error (same units as target) |
| R² | $1 - SS_{res}/SS_{tot}$ | Proportion of variance explained (1 = perfect) |
| Max Error | $\max|y_i - \hat{y}_i|$ | Worst-case error |
| Median AE | $\text{median}(|y_i - \hat{y}_i|)$ | Robust to outliers |
| MAPE | $(100/n)\sum|(y_i - \hat{y}_i)/y_i|$ | Percentage error (scale-independent) |
| Explained Variance | $1 - \text{Var}(y-\hat{y})/\text{Var}(y)$ | Similar to R² but uses variance |

**When to Use Each**:
- **MSE/RMSE**: When large errors should be penalized more
- **MAE**: When you want interpretable error in original units
- **R²**: When you want a normalized measure (0-1 scale)
- **Median AE**: When outliers are present
- **MAPE**: When you need scale-independent comparison

## Motivation

Regression metrics teach how different error measures capture different aspects of model performance. R² introduces the concept of explained variance — a fundamental idea in statistics.

## Dependencies

- `TypeUtils.py` — type validation

## Related Concepts

- Classification Metrics
- Coefficient of Determination (R²)
- Mean Squared Error vs Mean Absolute Error tradeoff

## Usage Examples

```kafe
import machine;

List[FLOAT] y_true = [3.0, -0.5, 2.0, 7.0];
List[FLOAT] y_pred = [2.5, 0.0, 2.0, 8.0];

FLOAT mse = machine.mean_squared_error(y_true, y_pred);       -- 0.375
FLOAT mae = machine.mean_absolute_error(y_true, y_pred);       -- 0.5
FLOAT r2 = machine.r2_score(y_true, y_pred);                   -- 0.948...
```

## Implementation Location

- `src/lib/KafeMACHINE/metrics.py` — all regression metric functions

## References

- scikit-learn documentation — `sklearn.metrics`
