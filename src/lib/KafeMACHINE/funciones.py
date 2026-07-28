from global_utils import check_sig
from TypeUtils import entero_t, cadena_t, numeros_t
from .LinearRegression import LinearRegression
from .LabelEncoder import LabelEncoder
from .OneHotEncoder import OneHotEncoder
from .PCA import PCA
from .StandardScaler import StandardScaler
from .MinMaxScaler import MinMaxScaler
from .SimpleImputer import SimpleImputer

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
        raise Exception("machine.simple_imputer: use machine.simple_imputer_constant(fill_value) for constant strategy")
    return SimpleImputer(strategy)


@check_sig([1], numeros_t + [cadena_t])
def simple_imputer_constant(fill_value):
    """
    Crea una instancia de SimpleImputer con estrategia constante.
    """
    return SimpleImputer("constant", fill_value)
