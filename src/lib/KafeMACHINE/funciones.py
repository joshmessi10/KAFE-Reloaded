from global_utils import check_sig
from TypeUtils import entero_t, cadena_t, numeros_t, flotante_t, booleano_t
from .LinearRegression import LinearRegression
from .preprocessing.LabelEncoder import LabelEncoder
from .preprocessing.OneHotEncoder import OneHotEncoder
from .preprocessing.OrdinalEncoder import OrdinalEncoder
from .preprocessing.PCA import PCA
from .preprocessing.StandardScaler import StandardScaler
from .preprocessing.MinMaxScaler import MinMaxScaler
from .preprocessing.SimpleImputer import SimpleImputer
from .LogisticRegression import LogisticRegression
from .KNN import KNN
from .DecisionTree import DecisionTreeClassifier
from .GaussianNB import GaussianNB
from .KMeans import KMeans
from .DBSCAN import DBSCAN
from .RandomForest import RandomForestClassifier, RandomForestRegressor
from .RidgeRegression import RidgeRegression
from .LassoRegression import LassoRegression
from .SVR import SVR
from .metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report,
    mean_squared_error, mean_absolute_error, root_mean_squared_error,
    r2_score, max_error, median_absolute_error,
    mean_absolute_percentage_error, explained_variance_score,
)

@check_sig([0], [])
def linear_regression():
    """
    Crea una instancia de Regresión Lineal.
    """
    return LinearRegression()

@check_sig([0], [])
def label_encoder():
    """
    Crea una instancia de LabelEncoder.
    """
    return LabelEncoder()

@check_sig([0], [])
def one_hot_encoder():
    """
    Crea una instancia de OneHotEncoder.
    """
    return OneHotEncoder()

@check_sig([0], [])
def ordinal_encoder():
    """
    Crea una instancia de OrdinalEncoder.
    Codifica características categóricas a enteros según un orden especificado.
    """
    return OrdinalEncoder()

@check_sig([1], [entero_t])
def pca(n_components):
    """
    Crea una instancia de PCA con n_components especificados.
    """
    return PCA(n_components)

@check_sig([0], [])
def standard_scaler():
    """
    Crea una instancia de StandardScaler.
    """
    return StandardScaler()

@check_sig([0], [])
def minmax_scaler():
    """
    Crea una instancia de MinMaxScaler.
    """
    return MinMaxScaler()


@check_sig([1], [cadena_t])
def simple_imputer(strategy):
    """
    Crea una instancia de SimpleImputer con la estrategia especificada.
    """
    if strategy == "constant":
        raise Exception("simple_imputer: use machine.simple_imputer_constant(fill_value) for constant strategy")
    return SimpleImputer(strategy)


@check_sig([1], numeros_t + [cadena_t])
def simple_imputer_constant(fill_value):
    """
    Crea una instancia de SimpleImputer con estrategia constante.
    """
    return SimpleImputer("constant", fill_value)


@check_sig({0: [], 2: [[flotante_t], [entero_t]]})
def logistic_regression(learning_rate=0.01, max_iter=1000):
    """
    Crea una instancia de Regresión Logística.
    """
    return LogisticRegression(learning_rate, max_iter)


@check_sig({0: [], 1: [[entero_t]]})
def knn(k=3):
    """
    Crea una instancia de K-Nearest Neighbors.
    """
    return KNN(k)


@check_sig({0: [], 1: [[cadena_t]], 2: [[cadena_t], [entero_t]], 3: [[cadena_t], [entero_t], [entero_t]], 4: [[cadena_t], [entero_t], [entero_t], [entero_t]]})
def decision_tree_classifier(criterion="gini", max_depth=0, min_samples_split=2, min_samples_leaf=1):
    """
    Crea una instancia de DecisionTreeClassifier.

    criterion: 'gini' o 'entropy'
    max_depth: profundidad máxima del árbol (0 = ilimitada)
    min_samples_split: mínimo de muestras para dividir un nodo
    min_samples_leaf: mínimo de muestras en una hoja
    """
    return DecisionTreeClassifier(criterion, max_depth, min_samples_split, min_samples_leaf)


@check_sig({0: [], 1: [[entero_t]], 2: [[entero_t], [entero_t]], 3: [[entero_t], [entero_t], [entero_t]]})
def kmeans(n_clusters=3, max_iter=100, random_state=0):
    """
    Crea una instancia de K-Means clustering.

    n_clusters: número de clusters (k)
    max_iter: máximo de iteraciones
    random_state: semilla para reproducibilidad (0 = aleatorio)
    """
    return KMeans(n_clusters, max_iter, random_state)


@check_sig([0], [])
def gaussian_nb():
    """
    Crea una instancia de Gaussian Naive Bayes.
    """
    return GaussianNB()


@check_sig({0: [], 1: [[flotante_t, entero_t]], 2: [[flotante_t, entero_t], [entero_t]]})
def dbscan(eps=0.5, min_samples=5):
    """
    Crea una instancia de DBSCAN.

    eps: distancia máxima entre puntos para ser considerados vecinos
    min_samples: mínimo de puntos para formar una región densa
    """
    return DBSCAN(eps, min_samples)


@check_sig({0: [], 1: [[entero_t]], 2: [[entero_t], [entero_t]], 3: [[entero_t], [entero_t], [entero_t]], 4: [[entero_t], [entero_t], [entero_t], [entero_t]]})
def random_forest_classifier(n_estimators=10, max_depth=0, min_samples_split=2, min_samples_leaf=1):
    """
    Crea una instancia de Random Forest Classifier.

    n_estimators: número de árboles (default: 10)
    max_depth: profundidad máxima por árbol (0 = ilimitada)
    min_samples_split: mínimo de muestras para dividir un nodo
    min_samples_leaf: mínimo de muestras en una hoja
    """
    return RandomForestClassifier(n_estimators, max_depth, min_samples_split, min_samples_leaf)


@check_sig({0: [], 1: [[entero_t]], 2: [[entero_t], [entero_t]], 3: [[entero_t], [entero_t], [entero_t]], 4: [[entero_t], [entero_t], [entero_t], [entero_t]]})
def random_forest_regressor(n_estimators=10, max_depth=0, min_samples_split=2, min_samples_leaf=1):
    """
    Crea una instancia de Random Forest Regressor.

    n_estimators: número de árboles (default: 10)
    max_depth: profundidad máxima por árbol (0 = ilimitada)
    min_samples_split: mínimo de muestras para dividir un nodo
    min_samples_leaf: mínimo de muestras en una hoja
    """
    return RandomForestRegressor(n_estimators, max_depth, min_samples_split, min_samples_leaf)


@check_sig({0: [], 1: [[flotante_t, entero_t]], 2: [[flotante_t, entero_t], [booleano_t]], 3: [[flotante_t, entero_t], [booleano_t], [entero_t]]})
def ridge_regression(alpha=1.0, fit_intercept=True, max_iter=1000):
    """
    Crea una instancia de Ridge Regression (L2 regularized).

    alpha: fuerza de regularización (default: 1.0)
    fit_intercept: si se ajusta intercepto (default: True)
    max_iter: máximo de iteraciones (default: 1000)
    """
    return RidgeRegression(alpha, fit_intercept, max_iter)


@check_sig({0: [], 1: [[flotante_t, entero_t]], 2: [[flotante_t, entero_t], [booleano_t]], 3: [[flotante_t, entero_t], [booleano_t], [entero_t]]})
def lasso_regression(alpha=1.0, fit_intercept=True, max_iter=1000):
    """
    Crea una instancia de Lasso Regression (L1 regularized).

    alpha: fuerza de regularización (default: 1.0)
    fit_intercept: si se ajusta intercepto (default: True)
    max_iter: máximo de iteraciones (default: 1000)
    """
    return LassoRegression(alpha, fit_intercept, max_iter)


@check_sig({0: [], 1: [[flotante_t]], 2: [[flotante_t], [flotante_t]], 3: [[flotante_t], [flotante_t], [cadena_t]]})
def svr(C=1.0, epsilon=0.1, kernel='linear'):
    """
    Crea una instancia de Support Vector Regression.

    C: parámetro de regularización (default: 1.0)
    epsilon: ancho del tubo epsilon-insensitive (default: 0.1)
    kernel: tipo de kernel 'linear', 'rbf', o 'poly' (default: 'linear')
    """
    return SVR(C, epsilon, kernel)
