# Gaussian Mixture

**Dataset:** [Iris Species](https://www.kaggle.com/datasets/uciml/iris)  
**Task:** Clustering

Fits three Gaussian components to petal measurements without species labels.

## Workflow

The program loads the dataset, selects useful features, prepares the inputs, fits the KAFE model, and prints several predictions or assignments. Supervised examples split training and test data before fitting a scaler. Clustering examples use unlabeled observations.

```kafe
--8<-- "docs/ejemplos/machine-iris-gaussian-mixture.kf"
```

[Download the KAFE program](../machine-iris-gaussian-mixture.kf) · [All MACHINE methods](../machine-kaggle.md)

## Visual check

![Gaussian Mixture on Iris Species](../machine-iris-gaussian-mixture.svg){ .example-chart }

The chart complements the printed predictions; use the metrics for evaluation.
