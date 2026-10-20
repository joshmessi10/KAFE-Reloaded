# Linear Discriminant Analysis

**Dataset:** [Iris Species](https://www.kaggle.com/datasets/uciml/iris)  
**Task:** Classification

Projects the measurements into a discriminant space and predicts flower species.

## Workflow

The program loads the dataset, selects useful features, prepares the inputs, fits the KAFE model, and prints several predictions or assignments. Supervised examples split training and test data before fitting a scaler. Clustering examples use unlabeled observations.

```kafe
--8<-- "docs/ejemplos/machine-iris-lda.kf"
```

[Download the KAFE program](../machine-iris-lda.kf) · [All MACHINE methods](../machine-kaggle.md)
