from global_utils import check_sig
from TypeUtils import entero_t, cadena_t, numeros_t, flotante_t
from .LinearRegression import LinearRegression
from .LabelEncoder import LabelEncoder
from .OneHotEncoder import OneHotEncoder
from .PCA import PCA
from .StandardScaler import StandardScaler
from .MinMaxScaler import MinMaxScaler
from .SimpleImputer import SimpleImputer
from .LogisticRegression import LogisticRegression
from .KNN import KNN
from .DecisionTree import DecisionTreeClassifier
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
