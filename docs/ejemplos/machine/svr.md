# Support Vector Regression

**Dataset:** [Salary Data](https://www.kaggle.com/datasets/karthickveerakumar/salary-data-simple-linear-regression)  
**Task:** Regression

Predicts salary with a support vector regressor.

## Workflow

The program loads the dataset, selects useful features, prepares the inputs, fits the KAFE model, and prints several predictions or assignments. Supervised examples split training and test data before fitting a scaler. Clustering examples use unlabeled observations.

```kafe
--8<-- "docs/ejemplos/machine-salary-svr.kf"
```

[Download the KAFE program](../machine-salary-svr.kf) · [All MACHINE methods](../machine-kaggle.md)

## Visual check

![Support Vector Regression on Salary Data](../machine-salary-svr.svg){ .example-chart }

The chart complements the printed predictions; use the metrics for evaluation.
