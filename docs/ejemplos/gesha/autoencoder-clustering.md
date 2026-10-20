# Autoencoder and K-Means: Iris

**Data:** Hugging Face Iris numeric features  
**Program:** [`gesha-huggingface-clustering.kf`](../gesha-huggingface-clustering.kf)

## What the program teaches

Load four numeric features, train a `4 → 3 → 2 → 3 → 4` autoencoder, use its two-dimensional encoder output as features for MACHINE K-Means, and render a cluster scatterplot with PLOT. Labels are not used for clustering. Requires the optional Hugging Face datasets package and a dataset download.

## Reading the code

Open the [complete KAFE source](../gesha-huggingface-clustering.kf) and follow its imports, input preparation, model construction and output. The linked file is the program to copy or run when you choose to try it; this page is a guide to its purpose.

## Continue learning

[Soft clustering](../../libraries/gesha/soft-clustering.md) and [MACHINE clustering](../../libraries/machine/clustering.md) · [All Gesha examples](../gesha-examples.md)
