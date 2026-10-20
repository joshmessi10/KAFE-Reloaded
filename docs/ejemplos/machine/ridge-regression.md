# Ridge Regression

**Dataset:** [Red Wine Quality](https://www.kaggle.com/datasets/uciml/red-wine-quality-cortez-et-al-2009)  
**Task:** Regression

Predicts wine quality with an L2 penalty on coefficients.

## Workflow

The program loads the dataset, selects useful features, prepares the inputs, fits the KAFE model, and prints several predictions or assignments. Supervised examples split training and test data before fitting a scaler. Clustering examples use unlabeled observations.

```kafe
--8<-- "docs/ejemplos/machine-wine-quality-ridge.kf"
```

[Download the KAFE program](../machine-wine-quality-ridge.kf) · [All MACHINE methods](../machine-kaggle.md)
