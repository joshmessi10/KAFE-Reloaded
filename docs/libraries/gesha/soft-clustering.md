# Soft clustering with Gesha

Gesha supports an experimental unsupervised training path. With an empty target list, `model.fit(X, [], epochs, batch_size)` performs soft clustering. A softmax output represents assignment weights for the configured number of groups. The cluster numbers are arbitrary IDs, not known class labels.

The training process alternates between assigning observations and updating model parameters toward group structure. Its result depends on initialization, input scaling, number of groups, and data geometry. Inspect assignments and compare them with a clustering metric such as silhouette score when appropriate; do not interpret softmax weights as calibrated class probabilities.

## Complete program


```kafe
import gesha;

List[List[FLOAT]] X_train = [
    [1.0, 1.0], [1.5, 2.0], [5.0, 8.0],
    [8.0, 8.0], [1.0, 0.6], [9.0, 11.0]
];

GESHA layer1 = gesha.create_dense(2, "relu", [2], 0.0, 42);
GESHA layer2 = gesha.create_dense(2, "softmax", [], 0.0, 42);
GESHA model = gesha.sequential([layer1, layer2]);

gesha.compile(model, "adam", "mse", []);
model.fit(X_train, [], 20, 1);

List[FLOAT] probs = model.predict([1.0, 1.0]);
show("Cluster probabilities: " + str(probs));
INT cluster = model.predict_label([1.0, 1.0]);
show("Assigned cluster: " + str(cluster));
```

Passing an empty list as `y_train` selects unsupervised Soft K-Means training: the network's softmax output is interpreted as soft cluster assignments.

---


For a dedicated tabular baseline, compare [MACHINE K-Means](../../ejemplos/machine/kmeans.md) and [Gaussian Mixture](../../ejemplos/machine/gaussian-mixture.md). Those methods have different objectives and need not produce the same groups.

## What an assignment means

If the final layer has `K` softmax units, each input produces `K` nonnegative scores summing to one. `predict_label` reports the index of the largest score. The model can discover a partition, but cluster indices can be permuted without changing the partition, and the scores are not calibrated class probabilities.

## When to compare another method

| Method | Main idea | Practical consideration |
|---|---|---|
| Gesha soft clustering | Learn soft assignments with a network. | Depends on architecture and training dynamics. |
| MACHINE K-Means | Assign points to nearest centroids. | Favors compact, roughly spherical groups. |
| MACHINE DBSCAN | Find dense connected regions. | Can label noise; depends on distance scale. |
| MACHINE Gaussian Mixture | Fit probabilistic components. | Assumes a mixture model. |

Standardize distance-sensitive numeric features when scales differ. Try several random seeds and inspect spatial plots only when the inputs have meaningful axes. A low-dimensional chart is a diagnostic view, not proof that the groups represent known categories.

[Back to Gesha overview](../gesha.md)
