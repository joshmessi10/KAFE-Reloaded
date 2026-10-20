# DBSCAN

**Dataset:** [Mall Customers](https://www.kaggle.com/datasets/vjchoudhary7/customer-segmentation-tutorial-in-python)  
**Task:** Clustering

Finds dense groups and marks outliers as noise (-1).

## Workflow

The program loads the dataset, selects useful features, prepares the inputs, fits the KAFE model, and prints several predictions or assignments. Supervised examples split training and test data before fitting a scaler. Clustering examples use unlabeled observations.

```kafe
--8<-- "docs/ejemplos/machine-mall-customers-dbscan.kf"
```

[Download the KAFE program](../machine-mall-customers-dbscan.kf) · [All MACHINE methods](../machine-kaggle.md)

## Visual check

![DBSCAN on Mall Customers](../machine-mall-customers-dbscan.svg){ .example-chart }

The chart complements the printed predictions; use the metrics for evaluation.
