from global_utils import check_sig
from TypeUtils import integer_type, string_type, number_types, float_type, boolean_type, numeric_matrix_types, numeric_vector_types, any_list_types
from .linear.LinearRegression import LinearRegression
from .preprocessing.LabelEncoder import LabelEncoder
from .preprocessing.OneHotEncoder import OneHotEncoder
from .preprocessing.OrdinalEncoder import OrdinalEncoder
from .preprocessing.PCA import PCA
from .preprocessing.StandardScaler import StandardScaler
from .preprocessing.MinMaxScaler import MinMaxScaler
from .preprocessing.SimpleImputer import SimpleImputer
from .preprocessing.PolynomialFeatures import PolynomialFeatures
from .preprocessing.VarianceThreshold import VarianceThreshold
from .preprocessing.RecursiveFeatureElimination import RecursiveFeatureElimination
from .preprocessing.RobustScaler import RobustScaler
from .linear.LogisticRegression import LogisticRegression
from .neighbors.KNN import KNN, KNNRegressor
from .tree.DecisionTree import DecisionTreeClassifier, DecisionTreeRegressor
from .naive_bayes.GaussianNB import GaussianNB
from .clustering.KMeans import KMeans
from .clustering.DBSCAN import DBSCAN
from .tree.RandomForest import RandomForestClassifier, RandomForestRegressor
from .linear.RidgeRegression import RidgeRegression
from .linear.LassoRegression import LassoRegression
from .linear.SVR import SVR
from .svm.SVM import SVM
from .linear.ElasticNet import ElasticNet
from .clustering.AgglomerativeClustering import AgglomerativeClustering
from .ensemble.AdaBoost import AdaBoostClassifier
from .ensemble.GradientBoosting import GradientBoostingClassifier, GradientBoostingRegressor
from .clustering.GaussianMixture import GaussianMixture
from .discriminant.LinearDiscriminantAnalysis import LinearDiscriminantAnalysis
from .model_selection.model_selection import CrossValScore, GridSearchCV, RandomizedSearchCV, Pipeline
from .metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report,
    mean_squared_error, mean_absolute_error, root_mean_squared_error,
    r2_score, max_error, median_absolute_error,
    mean_absolute_percentage_error, explained_variance_score,
    roc_auc_score, silhouette_score,
)

@check_sig([0], [])
def linear_regression():
    """
    Create an instance of Linear Regression.
    """
    return LinearRegression()

@check_sig([0], [])
def label_encoder():
    """
    Create an instance of LabelEncoder.
    """
    return LabelEncoder()

@check_sig([0], [])
def one_hot_encoder():
    """
    Create an instance of OneHotEncoder.
    """
    return OneHotEncoder()

@check_sig([0], [])
def ordinal_encoder():
    """
    Create an instance of OrdinalEncoder.
    Encodes categorical features to integers according to a specified order.
    """
    return OrdinalEncoder()

@check_sig([1], [integer_type])
def pca(n_components):
    """
    Creates a PCA instance with specified n_components.
    """
    return PCA(n_components)

@check_sig([0], [])
def standard_scaler():
    """
    Create an instance of StandardScaler.
    """
    return StandardScaler()

@check_sig([0], [])
def minmax_scaler():
    """
    Create an instance of MinMaxScaler.
    """
    return MinMaxScaler()


@check_sig([1], [string_type])
def simple_imputer(strategy):
    """
    Creates a SimpleImputer instance with the specified strategy.
    """
    if strategy == "constant":
        raise Exception("simple_imputer: use machine.simple_imputer_constant(fill_value) for constant strategy")
    return SimpleImputer(strategy)


@check_sig([1], number_types + [string_type])
def simple_imputer_constant(fill_value):
    """
    Create a SimpleImputer instance with constant strategy.
    """
    return SimpleImputer("constant", fill_value)


@check_sig({0: [], 2: [[float_type], [integer_type]]})
def logistic_regression(learning_rate=0.01, max_iter=1000):
    """
    Create an instance of Logistic Regression.
    """
    return LogisticRegression(learning_rate, max_iter)


@check_sig({0: [], 1: [[integer_type]]})
def knn(k=3):
    """
    Create an instance of K-Nearest Neighbors.
    """
    return KNN(k)


@check_sig({0: [], 1: [[string_type]], 2: [[string_type], [integer_type]], 3: [[string_type], [integer_type], [integer_type]], 4: [[string_type], [integer_type], [integer_type], [integer_type]]})
def decision_tree_classifier(criterion="gini", max_depth=0, min_samples_split=2, min_samples_leaf=1):
    """
    Creates an instance of DecisionTreeClassifier.

    criterion: 'gini' o 'entropy'
    max_depth: maximum tree depth (0 = unlimited)
    min_samples_split: minimum number of samples to split a node
    min_samples_leaf: minimum number of samples on one sheet
    """
    return DecisionTreeClassifier(criterion, max_depth, min_samples_split, min_samples_leaf)


@check_sig({0: [], 1: [[integer_type]], 2: [[integer_type], [integer_type]], 3: [[integer_type], [integer_type], [integer_type]]})
def kmeans(n_clusters=3, max_iter=100, random_state=0):
    """
    Create an instance of K-Means clustering.

    n_clusters: number of clusters (k)
    max_iter: maximum iterations
    random_state: seed for reproducibility (0 = random)
    """
    return KMeans(n_clusters, max_iter, random_state)


@check_sig([0], [])
def gaussian_nb():
    """
    Create an instance of Gaussian Naive Bayes.
    """
    return GaussianNB()


@check_sig({0: [], 1: [[float_type, integer_type]], 2: [[float_type, integer_type], [integer_type]]})
def dbscan(eps=0.5, min_samples=5):
    """
    Create an instance of DBSCAN.

    eps: maximum distance between points to be considered neighbors
    min_samples: minimum number of points to form a dense region
    """
    return DBSCAN(eps, min_samples)


@check_sig({0: [], 1: [[integer_type]], 2: [[integer_type], [integer_type]], 3: [[integer_type], [integer_type], [integer_type]], 4: [[integer_type], [integer_type], [integer_type], [integer_type]]})
def random_forest_classifier(n_estimators=10, max_depth=0, min_samples_split=2, min_samples_leaf=1):
    """
    Create an instance of Random Forest Classifier.

    n_estimators: number of trees (default: 10)
    max_depth: maximum depth per tree (0 = unlimited)
    min_samples_split: minimum number of samples to split a node
    min_samples_leaf: minimum number of samples on one sheet
    """
    return RandomForestClassifier(n_estimators, max_depth, min_samples_split, min_samples_leaf)


@check_sig({0: [], 1: [[integer_type]], 2: [[integer_type], [integer_type]], 3: [[integer_type], [integer_type], [integer_type]], 4: [[integer_type], [integer_type], [integer_type], [integer_type]]})
def random_forest_regressor(n_estimators=10, max_depth=0, min_samples_split=2, min_samples_leaf=1):
    """
    Create an instance of Random Forest Regressor.

    n_estimators: number of trees (default: 10)
    max_depth: maximum depth per tree (0 = unlimited)
    min_samples_split: minimum number of samples to split a node
    min_samples_leaf: minimum number of samples on one sheet
    """
    return RandomForestRegressor(n_estimators, max_depth, min_samples_split, min_samples_leaf)


@check_sig({0: [], 1: [[float_type, integer_type]], 2: [[float_type, integer_type], [boolean_type]], 3: [[float_type, integer_type], [boolean_type], [integer_type]]})
def ridge_regression(alpha=1.0, fit_intercept=True, max_iter=1000):
    """
    Create an instance of Ridge Regression (L2 regularized).

    alpha: regularization strength (default: 1.0)
    fit_intercept: if intercept is set (default: True)
    max_iter: maximum iterations (default: 1000)
    """
    return RidgeRegression(alpha, fit_intercept, max_iter)


@check_sig({0: [], 1: [[float_type, integer_type]], 2: [[float_type, integer_type], [boolean_type]], 3: [[float_type, integer_type], [boolean_type], [integer_type]]})
def lasso_regression(alpha=1.0, fit_intercept=True, max_iter=1000):
    """
    Create an instance of Lasso Regression (L1 regularized).

    alpha: regularization strength (default: 1.0)
    fit_intercept: if intercept is set (default: True)
    max_iter: maximum iterations (default: 1000)
    """
    return LassoRegression(alpha, fit_intercept, max_iter)


@check_sig({0: [], 1: [[float_type]], 2: [[float_type], [float_type]], 3: [[float_type], [float_type], [string_type]]})
def svr(C=1.0, epsilon=0.1, kernel='linear'):
    """
    Create an instance of Support Vector Regression.

    C: regularization parameter (default: 1.0)
    epsilon: tube width epsilon-insensitive (default: 0.1)
    kernel: kernel type 'linear', 'rbf', or 'poly' (default: 'linear')
    """
    return SVR(C, epsilon, kernel)


@check_sig({0: [], 1: [[float_type]], 2: [[float_type], [string_type]], 3: [[float_type], [string_type], [integer_type]]})
def svm(C=1.0, kernel='linear', max_iter=1000):
    """
    Creates an instance of Support Vector Machine Classifier.

    C: regularization parameter (default: 1.0)
    kernel: kernel type 'linear', 'rbf', or 'poly' (default: 'linear')
    max_iter: maximum iterations (default: 1000)
    """
    return SVM(C, kernel, max_iter=max_iter)


@check_sig({
    2: [numeric_matrix_types, numeric_vector_types],
    3: [numeric_matrix_types, numeric_vector_types, float_type],
    4: [numeric_matrix_types, numeric_vector_types, float_type, integer_type],
    5: [numeric_matrix_types, numeric_vector_types, float_type, integer_type, boolean_type]
})
def train_test_split(X, y, test_size=0.2, random_state=0, shuffle=True):
    """
    Splits data into training and test sets.

    X: features matrix
    y: target vector
    test_size: proportion for test (0.0 - 1.0, default: 0.2)
    random_state: seed for reproducibility (default: 0)
    shuffle: whether data is shuffled (default: true)
    """
    from .model_selection.model_selection import train_test_split as _tts
    return _tts(X, y, test_size, random_state, shuffle)


@check_sig({
    1: [integer_type],
    2: [integer_type, integer_type],
    3: [integer_type, integer_type, boolean_type],
    4: [integer_type, integer_type, boolean_type, integer_type]
})
def k_fold(n_samples, n_splits=5, shuffle=False, random_state=0):
    """
    Generates indexes for k-fold cross validation.

    n_samples: total number of samples
    n_splits: number of folds (default: 5)
    shuffle: whether data is shuffled (default: false)
    random_state: seed for reproducibility (default: 0)
    """
    from .model_selection.model_selection import k_fold as _kf
    return _kf(n_samples, n_splits, shuffle, random_state)


@check_sig({
    0: [],
    1: [integer_type],
    2: [integer_type, string_type],
    3: [integer_type, string_type, integer_type]
})
def cross_val_score(cv=5, scoring='accuracy', random_state=0):
    """
    Create an instance of CrossValScore to evaluate models with k-fold CV.

    cv: number of folds (default: 5)
    scoring: scoring function 'accuracy', 'r2', or 'mse' (default: 'accuracy')
    random_state: seed for reproducibility (default: 0)
    """
    return CrossValScore(cv, scoring, random_state)


@check_sig({0: [], 1: [[integer_type]], 2: [[integer_type], [string_type]], 3: [[integer_type], [string_type], [integer_type]]})
def grid_search_cv(cv=5, scoring='accuracy', random_state=0):
    """
    Creates an instance of GridSearchCV for exhaustive hyperparameter search.

    cv: number of folds for cross validation (default: 5)
    scoring: evaluation metric 'accuracy', 'r2', or 'mse' (default: 'accuracy')
    random_state: seed for reproducibility (default: 0)
    """
    return GridSearchCV({}, cv, scoring, random_state)


@check_sig({0: [], 1: [[integer_type]], 2: [[integer_type], [integer_type]], 3: [[integer_type], [integer_type], [string_type]], 4: [[integer_type], [integer_type], [string_type], [integer_type]]})
def randomized_search_cv(n_iter=10, cv=5, scoring='accuracy', random_state=0):
    """
    Creates an instance of RandomizedSearchCV for random hyperparameter search.

    n_iter: number of combinations to sample (default: 10)
    cv: number of folds for cross validation (default: 5)
    scoring: evaluation metric 'accuracy', 'r2', or 'mse' (default: 'accuracy')
    random_state: seed for reproducibility (default: 0)
    """
    return RandomizedSearchCV({}, n_iter, cv, scoring, random_state)


def pipeline(*args):
    """
    Create a Pipeline instance to chain preprocessing and models.

    Accepts alternating name and step pairs:
        machine.pipeline("scaler", scaler, "model", lr)
    """
    if len(args) < 2:
        raise Exception("pipeline: requires at least one name-step pair")
    if len(args) % 2 != 0:
        raise Exception("pipeline: requires an even number of arguments (name, step pairs)")

    names = [args[i] for i in range(0, len(args), 2)]
    steps = [args[i] for i in range(1, len(args), 2)]
    return Pipeline(names, steps)


@check_sig({0: [], 1: [[integer_type]], 2: [[integer_type], [boolean_type]]})
def polynomial_features(degree=2, include_bias=True):
    """
    Create an instance of PolynomialFeatures.

    degree: maximum degree of the polynomial (default: 2)
    include_bias: if bias term is included (default: true)
    """
    return PolynomialFeatures(degree, include_bias)


@check_sig({0: [], 1: [[float_type]], 2: [[float_type], [float_type]], 3: [[float_type], [float_type], [boolean_type]], 4: [[float_type], [float_type], [boolean_type], [integer_type]]})
def elastic_net(alpha=1.0, l1_ratio=0.5, fit_intercept=True, max_iter=1000):
    """
    Create an instance of Elastic Net Regression.

    alpha: regularization strength (default: 1.0)
    l1_ratio: L1 vs L2 ratio (default: 0.5)
    fit_intercept: if intercept is set (default: true)
    max_iter: maximum iterations (default: 1000)
    """
    return ElasticNet(alpha, l1_ratio, fit_intercept, max_iter)


@check_sig({0: [], 1: [[integer_type]], 2: [[integer_type], [string_type]]})
def agglomerative_clustering(n_clusters=2, linkage='ward'):
    """
    Create an instance of Agglomerative Clustering.

    n_clusters: number of clusters (default: 2)
    linkage: link criteria 'single', 'complete', 'average', or 'ward' (default: 'ward')
    """
    return AgglomerativeClustering(n_clusters, linkage)


@check_sig({0: [], 1: [[integer_type]], 2: [[integer_type], [float_type]], 3: [[integer_type], [float_type], [integer_type]]})
def ada_boost_classifier(n_estimators=50, learning_rate=1.0, random_state=0):
    """
    Create an instance of AdaBoost Classifier.

    n_estimators: number of weak classifiers (default: 50)
    learning_rate: learning rate (default: 1.0)
    random_state: seed for reproducibility (default: 0)
    """
    return AdaBoostClassifier(n_estimators, learning_rate, random_state)


@check_sig({0: [], 1: [[integer_type]], 2: [[integer_type], [float_type]], 3: [[integer_type], [float_type], [integer_type]]})
def gradient_boosting_classifier(n_estimators=100, learning_rate=0.1, max_depth=3):
    """
    Creates an instance of Gradient Boosting Classifier.

    n_estimators: number of trees (default: 100)
    learning_rate: learning rate (default: 0.1)
    max_depth: maximum depth per tree (default: 3)
    """
    return GradientBoostingClassifier(n_estimators, learning_rate, max_depth)


@check_sig({0: [], 1: [[integer_type]], 2: [[integer_type], [float_type]], 3: [[integer_type], [float_type], [integer_type]]})
def gradient_boosting_regressor(n_estimators=100, learning_rate=0.1, max_depth=3):
    """
    Create an instance of Gradient Boosting Regressor.

    n_estimators: number of trees (default: 100)
    learning_rate: learning rate (default: 0.1)
    max_depth: maximum depth per tree (default: 3)
    """
    return GradientBoostingRegressor(n_estimators, learning_rate, max_depth)


@check_sig({0: [], 1: [[float_type, integer_type]]})
def variance_threshold(threshold=0.0):
    """
    Creates an instance of VarianceThreshold.

    threshold: minimum variance threshold (default: 0.0)
    """
    return VarianceThreshold(threshold)


@check_sig({0: [], 1: [[integer_type]], 2: [[integer_type], [integer_type]]})
def recursive_feature_elimination(n_features=1, max_iter=100):
    """
    Creates an instance of Recursive Feature Elimination.

    n_features: number of features to select (default: 1)
    max_iter: maximum iterations (default: 100)
    """
    return RecursiveFeatureElimination(n_features=n_features)


@check_sig({0: [], 1: [[integer_type]], 2: [[integer_type], [integer_type]], 3: [[integer_type], [integer_type], [integer_type]]})
def robust_scaler(with_centering=1, with_scaling=1, quantile_low=25.0, quantile_high=75.0):
    """
    Create a RobustScaler instance.

    with_centering: center using median (1=yes, 0=no)
    with_scaling: scale using IQR (1=yes, 0=no)
    quantile_low: lower percentile (default: 25.0)
    quantile_high: upper percentile (default: 75.0)
    """
    return RobustScaler(bool(with_centering), bool(with_scaling), (quantile_low, quantile_high))


@check_sig({0: [], 1: [[string_type]], 2: [[string_type], [integer_type]], 3: [[string_type], [integer_type], [integer_type]], 4: [[string_type], [integer_type], [integer_type], [integer_type]]})
def decision_tree_regressor(criterion="mse", max_depth=0, min_samples_split=2, min_samples_leaf=1):
    """
    Creates a Decision Tree Regressor instance.

    criterion: splits criteria (default: 'mse')
    max_depth: maximum depth (default: 0 = no limit)
    min_samples_split: minimum samples to split (default: 2)
    min_samples_leaf: minimum samples per sheet (default: 1)
    """
    return DecisionTreeRegressor(criterion, max_depth, min_samples_split, min_samples_leaf)


@check_sig({0: [], 1: [[integer_type]], 2: [[integer_type], [string_type]]})
def knn_regressor(k=5, weights="uniform"):
    """
    Create an instance of KNN Regressor.

    k: number of neighbors (default: 5)
    weights: weighting type 'uniform' or 'distance' (default: 'uniform')
    """
    return KNNRegressor(k, weights)


@check_sig({0: [], 1: [[integer_type]], 2: [[integer_type], [integer_type]], 3: [[integer_type], [integer_type], [float_type]], 4: [[integer_type], [integer_type], [float_type], [integer_type]]})
def gaussian_mixture(n_components=3, max_iter=100, tol=1e-3, random_state=0):
    """
    Create an instance of Gaussian Mixture Model.

    n_components: number of Gaussian components (default: 3)
    max_iter: maximum EM iterations (default: 100)
    tol: tolerance for convergence (default: 1e-3)
    random_state: seed for reproducibility (default: 0)
    """
    return GaussianMixture(n_components, max_iter, tol, random_state)


@check_sig({0: [], 1: [[integer_type]]})
def linear_discriminant_analysis(n_components=None):
    """
    Creates an instance of Linear Discriminant Analysis.

    n_components: number of components (default: None = min(n_classes-1, n_features))
    """
    return LinearDiscriminantAnalysis(n_components)
