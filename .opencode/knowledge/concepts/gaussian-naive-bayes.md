# Gaussian Naive Bayes

## Mathematical Foundation

Gaussian Naive Bayes is a probabilistic classifier based on **Bayes' theorem** with the **naive assumption** of conditional independence between features.

### Bayes' Theorem

$$P(y|X) = \frac{P(X|y) \cdot P(y)}{P(X)}$$

Where:
- $P(y|X)$ — posterior probability of class $y$ given features $X$
- $P(X|y)$ — likelihood of features $X$ given class $y$
- $P(y)$ — prior probability of class $y$
- $P(X)$ — evidence (constant for all classes)

### Naive Assumption

Features are conditionally independent given the class:

$$P(X|y) = \prod_{i=1}^{n} P(x_i|y)$$

### Gaussian Likelihood

Each feature's likelihood is modeled as a Gaussian distribution:

$$P(x_i|y=c) = \frac{1}{\sqrt{2\pi\sigma_{c,i}^2}} \exp\left(-\frac{(x_i - \mu_{c,i})^2}{2\sigma_{c,i}^2}\right)$$

Where:
- $\mu_{c,i}$ — mean of feature $i$ for class $c$
- $\sigma_{c,i}^2$ — variance of feature $i$ for class $c$

### Decision Rule

Classify to the class with highest posterior:

$$\hat{y} = \arg\max_c \left[ \log P(y=c) + \sum_{i=1}^{n} \log P(x_i|y=c) \right]$$

Log-space computation avoids numerical underflow.

## Step-by-Step Algorithm

### Training (fit)

1. **Compute prior**: $P(y=c) = \frac{n_c}{N}$ where $n_c$ is samples in class $c$
2. **Compute means**: $\mu_{c,i} = \frac{1}{n_c} \sum_{j \in C_c} x_{j,i}$
3. **Compute variances**: $\sigma_{c,i}^2 = \frac{1}{n_c} \sum_{j \in C_c} (x_{j,i} - \mu_{c,i})^2$

### Prediction (predict)

1. For each class $c$:
   - Compute log prior: $\log P(y=c)$
   - Compute log likelihood: $\sum_{i=1}^{n} \log P(x_i|y=c)$
   - Sum: log posterior = log prior + log likelihood
2. Return class with highest log posterior

## Complexity

| Operation | Time Complexity | Space Complexity |
|-----------|----------------|-----------------|
| Training | $O(n \cdot d)$ | $O(c \cdot d)$ |
| Prediction | $O(c \cdot d)$ | $O(c)$ |

Where:
- $n$ = number of samples
- $d$ = number of features
- $c$ = number of classes

## Advantages

1. **Fast training and prediction** — O(n·d) training, O(c·d) prediction
2. **Works well with small datasets** — doesn't need much data to estimate parameters
3. **No hyperparameters to tune** — no regularization, no learning rate
4. **Handles multi-class naturally** — no one-vs-rest needed
5. **Interpretable** — means and variances are easy to understand

## Limitations

1. **Conditional independence assumption** — rarely true in practice; correlated features degrade performance
2. **Zero variance problem** — if a feature has zero variance for a class, probability becomes zero (mitigated with smoothing)
3. **Gaussian assumption** — assumes features follow normal distribution; may not hold for all data
4. **Poor probability estimates** — tends to produce probabilities close to 0 or 1

## When to Use / When NOT to Use

### Use When:
- Training speed is critical
- Dataset is small to medium size
- Features are approximately independent
- You need a baseline classifier
- Interpretability is important

### Do NOT Use When:
- Features are highly correlated
- Data is not numerical (use MultinomialNB or BernoulliNB)
- You need accurate probability estimates
- Dataset is very large (other models may perform better)

## Relationship with KAFE Implementation

KAFE implements GaussianNB from scratch:

- Uses `KafeMATH.functions` for mathematical functions (sqrt, exp)
- Inherits from `BaseMachine` with standard fit/predict/score interface
- Uses log-space computation to avoid numerical underflow
- Supports `predict_proba()` for probability estimates
- Validates dimensions and data integrity

## References

- Bishop, C. M. (2006). *Pattern Recognition and Machine Learning*. Springer. Section 4.2.
- Hastie, T., Tibshirani, R., & Friedman, J. (2009). *The Elements of Statistical Learning*. Springer. Section 6.6.3.
- Rish, I. (2001). An empirical study of the naive Bayes classifier. *IJCAI*.