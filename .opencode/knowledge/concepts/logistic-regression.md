# Logistic Regression

## Category

Machine Learning — Supervised Learning (Classification)

## Description

Logistic Regression is a linear model for binary classification that uses the sigmoid function to map linear combinations of features to probabilities between 0 and 1.

**Sigmoid Function**: $\sigma(z) = 1 / (1 + e^{-z})$ where $z = \beta_0 + \beta_1 x_1 + ... + \beta_n x_n$

**Decision Boundary**: Class 1 if $P(y=1|x) \geq 0.5$, else Class 0

**Training via Gradient Descent**:
- Compute predictions: $\hat{y} = \sigma(X\beta)$
- Compute loss: $J(\beta) = -(1/n)\sum[y\log(\hat{y}) + (1-y)\log(1-\hat{y})]$
- Update weights: $\beta := \beta - \alpha \cdot \nabla J(\beta)$

**Key Properties**:
- Outputs calibrated probabilities (not just class labels)
- Linear decision boundary in feature space
- No hyperparameters required (but learning_rate and max_iter affect training)
- Coefficients indicate feature importance and direction

**Advantages**:
- Probabilistic output enables threshold tuning
- Less prone to overfitting than complex models
- Fast training and prediction
- Interpretable coefficients

**Limitations**:
- Cannot capture non-linear decision boundaries
- Assumes linear relationship between features and log-odds
- Sensitive to outliers
- Requires feature scaling for gradient descent convergence

## Motivation

Logistic Regression bridges linear models and classification. Implementing it from scratch teaches gradient descent optimization, the sigmoid activation, and binary cross-entropy loss — foundational concepts for neural networks.

## Dependencies

- `lib.KafeMATH.funciones` — `exp` for sigmoid function
- `BaseMachine.py` — base class

## Related Concepts

- Linear Regression (regression counterpart)
- Sigmoid Function (activation)
- Binary Cross-Entropy Loss
- Gradient Descent (optimization)

## Usage Examples

```kafe
import machine;

List[FLOAT] X = [-5.0, -4.0, -3.0, -2.0, 2.0, 3.0, 4.0, 5.0];
List[INT] y = [0, 0, 0, 0, 1, 1, 1, 1];

MACHINE lr = machine.logistic_regression(0.1, 5000);
lr.fit(X, y);

show(lr.coef_);  -- ~[3.17]

List[INT] preds = lr.predict([-3.0, -1.0, 1.0, 3.0]);
show(preds);  -- [0, 0, 1, 1]
```

## Implementation Location

- `src/lib/KafeMACHINE/LogisticRegression.py` — class `LogisticRegression(BaseMachine)`

## Public API

- Factory: `machine.logistic_regression(learning_rate, max_iter)`
- Methods: `fit(X, y)`, `predict(X)`, `predict_proba(X)`, `score(X, y)`
- Attributes: `coef_`, `intercept_`

## References

- Sigmoid: $\sigma(z) = 1/(1+e^{-z})$
- Cross-entropy: $L = -[y\log(\hat{y}) + (1-y)\log(1-\hat{y})]$
