# K-Means

**Dataset:** [Mall Customers](https://www.kaggle.com/datasets/vjchoudhary7/customer-segmentation-tutorial-in-python)  
**Task:** Clustering

Partitions customers into five centroid-based groups.

## Workflow

The program loads the dataset, selects useful features, prepares the inputs, fits the KAFE model, and prints several predictions or assignments. Supervised examples split training and test data before fitting a scaler. Clustering examples use unlabeled observations.

```kafe
--8<-- "docs/ejemplos/machine-mall-customers-kmeans.kf"
```

[Download the KAFE program](../machine-mall-customers-kmeans.kf) · [All MACHINE methods](../machine-kaggle.md)

## Visual check

![K-Means on Mall Customers](../machine-mall-customers-kmeans.svg){ .example-chart }

The chart complements the printed predictions; use the metrics for evaluation.
