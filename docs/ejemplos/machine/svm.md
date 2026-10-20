# Support Vector Machine

**Dataset:** [Breast Cancer Wisconsin](https://www.kaggle.com/datasets/uciml/breast-cancer-wisconsin-data)  
**Task:** Classification

Finds a separating margin for the binary labels.

## Workflow

The program loads the dataset, selects useful features, prepares the inputs, fits the KAFE model, and prints several predictions or assignments. Supervised examples split training and test data before fitting a scaler. Clustering examples use unlabeled observations.

```kafe
--8<-- "docs/ejemplos/machine-breast-cancer-svm.kf"
```

[Download the KAFE program](../machine-breast-cancer-svm.kf) · [All MACHINE methods](../machine-kaggle.md)
