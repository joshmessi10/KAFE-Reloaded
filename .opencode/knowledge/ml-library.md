# KafeMACHINE Library (Machine Learning)

## Overview

scikit-learn-style ML models and evaluation metrics, implemented from scratch inside KAFE.

## Structure

- `src/lib/KafeMACHINE/functions.py` — public factory functions (the `machine` API).
- `src/lib/KafeMACHINE/BaseMachine.py` — base model class shared by models.
- Linear models: `linear/LinearRegression.py`, `linear/LogisticRegression.py`, `linear/RidgeRegression.py`, `linear/LassoRegression.py`, `linear/ElasticNet.py`, and `linear/SVR.py`.
- Neighbors: `neighbors/KNN.py`.
- Trees: `tree/DecisionTree.py` and `tree/RandomForest.py`.
- Other estimators: `naive_bayes/GaussianNB.py`, `svm/SVM.py`, `discriminant/LinearDiscriminantAnalysis.py`, `clustering/{DBSCAN,AgglomerativeClustering,GaussianMixture,KMeans}.py`, and `ensemble/{AdaBoost,GradientBoosting}.py`.
- Preprocessing: `preprocessing/{StandardScaler,MinMaxScaler,RobustScaler,SimpleImputer,LabelEncoder,OneHotEncoder,OrdinalEncoder,PCA,PolynomialFeatures,VarianceThreshold,RecursiveFeatureElimination}.py`.
- Model selection and pipeline: `model_selection/model_selection.py` contains `train_test_split`, `k_fold`, `CrossValScore`, `GridSearchCV`, `RandomizedSearchCV`, and `Pipeline`.
- Metrics: `metrics.py`.

The KAFE `grid_search_cv` and `randomized_search_cv` factories currently initialize empty parameter collections and do not expose arguments to configure them. Configured parameter searches are not currently available through these KAFE factories.

## Public API (factories)

- `machine.linear_regression()`
- `machine.ridge_regression(alpha, fit_intercept, max_iter)`
- `machine.lasso_regression(alpha, fit_intercept, max_iter)`
- `machine.elastic_net(alpha, l1_ratio, fit_intercept, max_iter)`
- `machine.svr(C, epsilon, kernel)`
- `machine.svm(C, kernel, max_iter)`
- `machine.logistic_regression(lr, iter)`
- `machine.knn(k)`
- `machine.knn_regressor(k)`
- `machine.decision_tree_classifier(criterion, max_depth, min_samples_split, min_samples_leaf)`
- `machine.decision_tree_regressor(criterion, max_depth, min_samples_split, min_samples_leaf)`
- `machine.random_forest_classifier(n_estimators, max_depth, min_samples_split, min_samples_leaf)`
- `machine.random_forest_regressor(n_estimators, max_depth, min_samples_split, min_samples_leaf)`
- `machine.gaussian_nb()`
- `machine.standard_scaler()` / `machine.minmax_scaler()` / `machine.robust_scaler(with_centering, with_scaling, quantile_low, quantile_high)` / `machine.simple_imputer(strategy)`
- `machine.label_encoder()` / `machine.one_hot_encoder()` / `machine.ordinal_encoder()`
- `machine.polynomial_features(degree, include_bias)`
- `machine.variance_threshold(threshold)`
- `machine.recursive_feature_elimination(estimator, n_features)`
- `machine.pca(n)`
- `machine.dbscan(eps, min_samples)`
- `machine.agglomerative_clustering(n_clusters, linkage)`
- `machine.linear_discriminant_analysis(n_components)`
- `machine.gaussian_mixture(n_components, max_iter, tol, random_state)`
- `machine.ada_boost_classifier(n_estimators, learning_rate)`
- `machine.gradient_boosting_classifier(n_estimators, learning_rate, max_depth)`
- `machine.gradient_boosting_regressor(n_estimators, learning_rate, max_depth)`
- Model selection: `machine.train_test_split(X, y, test_size, random_state, shuffle)`, `machine.k_fold(n_samples, n_splits, shuffle, random_state)`, `machine.cross_val_score(cv, scoring, random_state)`
- Hyperparameter-search factories: `machine.grid_search_cv(cv, scoring, random_state)` and `machine.randomized_search_cv(n_iter, cv, scoring, random_state)`.
- Pipeline: `machine.pipeline(name1, step1, name2, step2, ...)`
- Classification metrics: `accuracy_score`, `precision_score`, `recall_score`, `f1_score`, `confusion_matrix`, `classification_report`, `roc_auc_score`.
- Regression metrics: `mean_squared_error`, `mean_absolute_error`, `root_mean_squared_error`, `r2_score`, `max_error`, `median_absolute_error`, `mean_absolute_percentage_error`, `explained_variance_score`.
- Clustering metrics: `silhouette_score`.

## Rules

- New ML algorithms require: documentation, tests, examples, benchmarks (5 scenarios), and enriched concept record.
- Impact Analysis is mandatory before adding ML algorithms.
- Do not import external ML implementations (no sklearn, TensorFlow, PyTorch) — teach via KAFE's own implementation.
- Benchmark generation is mandatory for ML algorithms with 5 test scenarios (see `.opencode/knowledge/engineering.md` — Benchmark Process).
- Concept records must be enriched: mathematical foundation, step-by-step algorithm, advantages/limitations, references.
- Documentation must be updated for every implementation (see `.opencode/knowledge/engineering.md` — Documentation Update Process).
- Context saving must be verified before declaring a task complete.

## KafeMACHINE Priorities

Current development is focused on:

- Machine Learning algorithms.
- Deep Learning components.
- Metrics.
- Preprocessing.
- Educational documentation.
- Benchmarks.

Unless explicitly requested otherwise, prioritize improvements in KafeMACHINE over changes to the core language.

## Tests

- Fixtures under `tests/KafeMACHINE/{linear,neighbors,tree,naive_bayes,preprocessing,metrics/classification,metrics/regression,clustering,model_selection,svm,ensemble}/`, wired in `tests/test_KafeMACHINE.py`.
- Algorithm tests under `tests/Algorithms/`, wired in `tests/test_Algorithms.py`.
