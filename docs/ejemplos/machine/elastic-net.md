# Elastic Net

**Dataset:** [Red Wine Quality](https://www.kaggle.com/datasets/uciml/red-wine-quality-cortez-et-al-2009)  
**Task:** Regression

Combines L1 and L2 penalties for wine-quality prediction.

## Workflow

The program loads the dataset, selects useful features, prepares the inputs, fits the KAFE model, and prints several predictions or assignments. Supervised examples split training and test data before fitting a scaler. Clustering examples use unlabeled observations.

```kafe
--8<-- "docs/ejemplos/machine-wine-quality-elastic-net.kf"
```

[Download the KAFE program](../machine-wine-quality-elastic-net.kf) · [All MACHINE methods](../machine-kaggle.md)
