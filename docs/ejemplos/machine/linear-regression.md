# Linear Regression

**Dataset:** [Salary Data](https://www.kaggle.com/datasets/karthickveerakumar/salary-data-simple-linear-regression)  
**Task:** Regression

Predicts salary from years of experience with a straight-line model.

## Workflow

The program loads the dataset, selects useful features, prepares the inputs, fits the KAFE model, and prints several predictions or assignments. Supervised examples split training and test data before fitting a scaler. Clustering examples use unlabeled observations.

```kafe
--8<-- "docs/ejemplos/machine-salary-linear-regression.kf"
```

[Download the KAFE program](../machine-salary-linear-regression.kf) · [All MACHINE methods](../machine-kaggle.md)

## Visual check

![Linear Regression on Salary Data](../machine-salary-linear-regression.svg){ .example-chart }

The chart complements the printed predictions; use the metrics for evaluation.
