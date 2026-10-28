# MACHINE: pinned KAFE contracts

[Return to Index](../machine.md)

This reference describes the public positional DSL implemented by runtime 0.3.0. The extension bundles version-matched contracts for all 42 MACHINE wrappers/factories, 16 metrics, implemented receiver methods and public state. The curated source is `kafe-vscode/reference/machine-api.json`. Examples and expected errors describe repository evidence, not execution of the learner's program.

The reviewed inventory defines documented support. Runtime library dispatch uses backend attribute lookup; the inventory is not a runtime allowlist. An incidental backend name does not establish a supported KAFE API.

## Calling and data rules

Import `machine` and create the concrete receiver before calling its methods. `MACHINE` is a shared type; it does not make every estimator a transformer, every transformer a predictor, or every object a classifier. Unsupported inherited base methods raise errors. Calls use positional arguments; Python keyword calls, dictionary declarations, tuple destructuring and sklearn parameter menus are not KAFE syntax.

`INT`, `FLOAT`, `BOOL`, `STR`, `List[INT]` and `List[FLOAT]` are different types at signature gates. A documented FLOAT-only constructor argument needs a decimal value such as `1.0`. Tables using `NUM` describe accepted INT/FLOAT alternatives, not a declaration keyword. Matrices have one sample per row and a consistent feature count. Supervised targets have one scalar per sample. Fit transformers on training data before applying them to validation/test data.

Concrete `fit(...)` methods return the same `MACHINE`, rather than `VOID`. Make separate variable-based method calls; do not infer Python-style chained-call syntax from the return value. Later predictions/transforms require compatible feature dimensions and, where applicable, a successful fit. A custom scoring function is passed positionally, for example `model.score(X, y, machine.mean_squared_error)`.

## Estimators and clustering

### Linear and neighbor prediction

| Factory | Positional options and limits |
| --- | --- |
| `machine.linear_regression()` | Ordinary least squares; singular feature systems can fail. |
| `machine.ridge_regression(alpha, fit_intercept, max_iter)` | Zero through three arguments; default `1.0, True, 1000`. Fit uses a closed-form solve; stored `max_iter` does not control an iterative loop. |
| `machine.lasso_regression(alpha, fit_intercept, max_iter)` | Zero through three arguments; nonnegative alpha and positive iteration count. |
| `machine.elastic_net(alpha, l1_ratio, fit_intercept, max_iter)` | Zero through four arguments; supplied alpha/ratio must be FLOAT and ratio must be between 0 and 1. |
| `machine.logistic_regression()` / `(learning_rate, max_iter)` | Exactly zero or two arguments; labels must be 0 or 1. A lone learning rate is rejected. |
| `machine.svr(C, epsilon, kernel)` | Zero through three arguments; supplied C/epsilon must be FLOAT; kernels `linear`, `rbf`, `poly`. |
| `machine.svm(C, kernel, max_iter)` | Zero through three arguments; C is FLOAT; binary numeric labels. Gamma/degree/tolerance are not factory arguments. |
| `machine.knn(k)` | Default k=3; classification with numeric labels and enough fitted samples. |
| `machine.knn_regressor(k, weights)` | Default `5, "uniform"`; weights is `uniform` or `distance`. |

Prediction returns one scalar label/target per sample. `score(X,y)` defaults to accuracy for classifiers and R² for regressors. Logistic probability columns are `[P(0), P(1)]`; GaussianNB and SVM columns follow `classes_`. KNN probability columns follow sorted fitted labels and the class has no `classes_` property. SVM sigmoid values are uncalibrated scores. Pass the chosen positive-class column to ROC AUC rather than the whole two-column matrix.

### Trees, ensembles and supervised reduction

| Factory | Positional options and limits |
| --- | --- |
| `machine.decision_tree_classifier(criterion, max_depth, min_samples_split, min_samples_leaf)` | Zero through four arguments; `gini` or `entropy`; depth 0 is unlimited. |
| `machine.decision_tree_regressor(criterion, max_depth, min_samples_split, min_samples_leaf)` | Zero through four arguments; criterion is exactly `mse`, not `mae` or `squared_error`. |
| `machine.random_forest_classifier(n_estimators, max_depth, min_samples_split, min_samples_leaf)` | Zero through four arguments; random_state/max_features are not exposed by the factory. |
| `machine.random_forest_regressor(n_estimators, max_depth, min_samples_split, min_samples_leaf)` | Same exposed options; default random behavior is not a reproducible fixed seed. |
| `machine.gaussian_nb()` | Gaussian class-feature statistics evaluated in log space. |
| `machine.ada_boost_classifier(n_estimators, learning_rate, random_state)` | Zero through three arguments; binary labels; positive estimator count/rate. |
| `machine.gradient_boosting_classifier(n_estimators, learning_rate, max_depth)` | Zero through three arguments; binary labels; no exposed subsample/random_state options. |
| `machine.gradient_boosting_regressor(n_estimators, learning_rate, max_depth)` | Zero through three arguments; predicts numeric targets. |
| `machine.linear_discriminant_analysis(n_components)` | Zero or one argument; supervised projection/classification. Current Jacobi implementation needs at least two input features and a suitable within-class matrix. |

Public learned values such as `coef_`, `classes_`, `theta_`, `var_`, `scalings_` and `explained_variance_ratio_` are read as properties, not methods. Their availability and shape depend on the concrete class and fit state. A backend setting being readable does not make it a factory argument. After fitting a decision tree, `show(model.tree_)` can display the available raw backend representation. This does not provide ordinary typed list operations or general mapping indexing. A None-valued property is reported as unavailable. Prefer prediction outputs when explaining model behavior.

### Clustering

| Factory | Result and limits |
| --- | --- |
| `machine.kmeans(n_clusters, max_iter, random_state)` | Centroids, training labels, `fit_predict(X)`, `predict(X)` and negative-inertia `score(X)`; higher score is better. |
| `machine.dbscan(eps, min_samples)` | Density clusters, core sample indices and noise label -1; no out-of-sample predict method. |
| `machine.agglomerative_clustering(n_clusters, linkage)` | Training labels/merge history; linkage `single`, `complete`, `average`, `ward`; no out-of-sample predict method. |
| `machine.gaussian_mixture(n_components, max_iter, tol, random_state)` | Diagonal mixture, component probabilities, AIC/BIC and total negative-log-likelihood `score(X)`; lower score is better. |

Cluster/component counts cannot exceed the training sample count. Use a nonzero seed where exposed; 0 means non-fixed randomness. Gaussian mixture probability columns follow component order in `means_`/`weights_`, not supervised class labels. BIC uses the natural logarithm of sample count.

## Preprocessing, encoders and feature selection

### Scaling and missing values

| Factory | Contract |
| --- | --- |
| `machine.standard_scaler()` | Learned feature mean/scale; matrix input returns a matrix, PARDOS input returns PARDOS. |
| `machine.minmax_scaler()` | Fixed [0,1] scaling; no feature_range option. |
| `machine.robust_scaler()` / `(centering)` / `(centering, scaling)` / `(centering, scaling, quantile_low)` | Supplied arguments are INT flags/percentile. A fourth argument and FLOAT percentile are rejected; upper percentile remains 75.0. |
| `machine.simple_imputer(strategy)` | `mean`, `median`, `most_frequent`; use `math.nan` for missing numeric values. Nonconstant all-missing columns fail. |
| `machine.simple_imputer_constant(fill_value)` | Explicit constant imputation; fill value may be INT, FLOAT or STR. |

These receivers implement `fit(data)`, `transform(data)` and `fit_transform(data)`. Scalers also implement `inverse_transform(data)`. Imputation has no supported inverse transform. An unseen feature count fails; empty and malformed data must not be assumed accepted.

### Categories and text

| Factory | Contract |
| --- | --- |
| `machine.label_encoder()` | Sortable scalar labels; fit/transform to indices and inverse_transform to original labels. |
| `machine.one_hot_encoder()` | `fit(df, columns)` and `fit_transform(df, columns)` require PARDOS and selected column names. Unseen categories fail; ignore mode is not a factory argument. |
| `machine.ordinal_encoder()` | Same PARDOS/column interface; categories are sorted, not a caller-specified order. |
| `machine.tokenizer(num_words, oov_token)` | Zero through two arguments; 0 means unlimited words; optional OOV index 1; index 0 is reserved. |

One-hot and ordinal encoders return PARDOS from transform/inverse_transform. Invalid inverse indices or one-hot groups fail. Tokenizer methods accept `List[STR]` and return `List[List[INT]]`; fit returns the same MACHINE. Vocabulary order is descending frequency then first appearance. Tokenization lowercases and splits on non-ASCII alphanumeric characters, so accents can split words. Unknown words are skipped without OOV or mapped to its reserved index. A later fit replaces the vocabulary.

### Dimensionality and selection

| Factory | Contract |
| --- | --- |
| `machine.pca(n_components)` | Required positive INT; transforms/inverses preserve matrix versus PARDOS shape. `round()` defaults to four decimals and returns the same MACHINE. |
| `machine.polynomial_features(degree, include_bias)` | Zero through two arguments; positive degree, BOOL bias; implementation-defined feature ordering. |
| `machine.variance_threshold(threshold)` | Zero or one argument; keep variance strictly above nonnegative threshold; no survivors produce empty rows. |
| `machine.recursive_feature_elimination(n_features, max_iter)` | Zero through two INT arguments; fixed linear estimator; second argument currently ignored. Never pass an estimator as the first argument. |

PolynomialFeatures, VarianceThreshold and RFE explicitly reject `inverse_transform`. Feature selection cannot recreate removed values. RFE can fail when a required intermediate least-squares system is singular. Read `selected_indices_`, `support_`, `ranking_` or `variances_` only where the concrete selector defines them.

## Splitting, cross-validation and pipelines

| Factory | Contract |
| --- | --- |
| `machine.train_test_split(X, y, test_size, random_state, shuffle)` | Two through five positional arguments; numeric feature matrix; returns indexable MACHINE with four parts. |
| `machine.stratified_train_test_split(X, y, test_size, random_state)` | Two through four arguments; preserves class proportions and permits nested sample lists such as images. |
| `machine.k_fold(n_samples, n_splits, shuffle, random_state)` | One through four arguments; returns index pairs and does not train a model. |
| `machine.cross_val_score(cv, scoring, random_state)` | Zero through three arguments; `fit(model,X,y)` evaluates independent unfitted-model copies. |
| `machine.grid_search_cv(cv, scoring, random_state)` | Zero through three arguments; factory fixes an empty grid, so one empty combination is evaluated. |
| `machine.randomized_search_cv(n_iter, cv, scoring, random_state)` | Zero through four arguments; factory fixes an empty distribution, so trials repeat its empty setting. |
| `machine.pipeline(name1, step1, name2, step2, ...)` | At least one STR/MACHINE pair and an even argument count; intermediate transformations and final supervised model. |

For split results use `MACHINE split = ...;` then `split[0]`, `[1]`, `[2]`, `[3]` for X_train, X_test, y_train, y_test. CV/search fit receives the model first and leaves it unfitted. Accuracy/R² are maximized; MSE is minimized. Configured grid/distribution arguments, best_estimator_ and a search-wrapper predict method are not exposed by the current factories.

Pipelines implement fit/predict/score/transform/fit_transform. Transform excludes the final model and fit_transform returns features. `get_params()` returns `List[STR]` step names, not a parameter mapping. The backend `steps_` list contains tuples: `len(pipe.steps_)` raises a KAFE type error; use get_params instead. Selected model options must be set through exposed constructors before fitting.

## Metrics and output shapes

All sixteen metric functions live in `machine`: `accuracy_score`, `precision_score`, `recall_score`, `f1_score`, `confusion_matrix`, `classification_report`, `mean_squared_error`, `mean_absolute_error`, `root_mean_squared_error`, `r2_score`, `max_error`, `median_absolute_error`, `mean_absolute_percentage_error`, `explained_variance_score`, `roc_auc_score`, `silhouette_score`.

Classification metrics take flat numeric labels. Precision/recall/F1 are fixed macro averages over true-label classes; there is no average/labels/zero_division argument. Confusion matrices use sorted true-or-predicted classes. Classification report returns STR, so do not call KAFE's list-only len on it. Eight regression metrics and ROC AUC accept flat vectors or one-column prediction matrices, including single-output Gesha predictions; multi-output rows fail. ROC AUC needs exactly two classes and scores for the greater sorted class. MAPE returns percent and rejects zero true targets. Constant-target R²/explained variance return 0.0 in this implementation.

Silhouette takes a numeric feature matrix and numeric cluster labels. It requires at least two clusters and fewer clusters than samples; singleton samples contribute 0. Read the [metric definitions](metrics.md) for units, formulas and interpretation. Expected fixture results never establish that a learner's current program executed or is correct.
