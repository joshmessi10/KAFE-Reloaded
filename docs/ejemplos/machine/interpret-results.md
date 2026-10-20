# Interpreting the results

For supervised models, split the data before fitting a scaler to avoid data leakage. Classification accuracy measures the fraction of correct labels. Regression uses mean absolute error (MAE) and R² on the test set. The reported values are from one seeded educational run, not cross-validation.

Clustering has no ground-truth target in these examples. Cluster IDs are arbitrary and do not correspond to class labels. The silhouette score compares within-cluster cohesion with separation when more than one cluster is present. Spatial plots help inspect the assignments, but they do not replace metrics.
