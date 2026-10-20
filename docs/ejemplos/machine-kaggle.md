# MACHINE examples

Choose an algorithm. The dataset appears on each page, while the navigation follows the method.

Each runnable `.kf` program prints five predictions or cluster assignments. Only spatial clustering and salary regression include a chart; the other examples use printed results and test metrics.

Run a program from the repository root:

```bash
python src/Kafe.py docs/ejemplos/machine-iris-knn.kf
```

The first Kaggle download requires an internet connection. Subsequent runs can use the kagglehub cache.

## Clustering

- [K-Means](machine/kmeans.md) — Mall Customers
- [Agglomerative Clustering](machine/agglomerative-clustering.md) — Mall Customers
- [DBSCAN](machine/dbscan.md) — Mall Customers
- [Gaussian Mixture](machine/gaussian-mixture.md) — Iris Species

## Classification

- [Linear Discriminant Analysis](machine/linear-discriminant-analysis.md) — Iris Species
- [Gaussian Naive Bayes](machine/gaussian-naive-bayes.md) — Iris Species
- [K-Nearest Neighbors](machine/knn.md) — Iris Species
- [Decision Tree](machine/decision-tree.md) — Iris Species
- [AdaBoost](machine/adaboost.md) — Breast Cancer Wisconsin
- [Gradient Boosting](machine/gradient-boosting.md) — Breast Cancer Wisconsin
- [Logistic Regression](machine/logistic-regression.md) — Breast Cancer Wisconsin
- [Support Vector Machine](machine/svm.md) — Breast Cancer Wisconsin
- [Random Forest](machine/random-forest.md) — Breast Cancer Wisconsin

## Regression

- [Ridge Regression](machine/ridge-regression.md) — Red Wine Quality
- [Lasso Regression](machine/lasso-regression.md) — Red Wine Quality
- [Elastic Net](machine/elastic-net.md) — Red Wine Quality
- [Linear Regression](machine/linear-regression.md) — Salary Data
- [Support Vector Regression](machine/svr.md) — Salary Data

[How to interpret the results](machine/interpret-results.md)
