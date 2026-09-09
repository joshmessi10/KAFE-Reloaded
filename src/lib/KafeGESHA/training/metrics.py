"""Métricas de evaluación para modelos de deep learning."""


def accuracy(y_true, y_pred):
    """
    Calcula la precisión de clasificación.
    
    Args:
        y_true: Valores verdaderos
        y_pred: Predicciones
        
    Returns:
        Precisión (0.0 a 1.0)
    """
    if len(y_true) != len(y_pred):
        raise ValueError("Las listas deben tener la misma longitud")
    
    correct = sum(1 for yt, yp in zip(y_true, y_pred) if yt == yp)
    return correct / len(y_true)


def mse(y_true, y_pred):
    """
    Calcula el Error Cuadrático Medio.
    
    Args:
        y_true: Valores verdaderos
        y_pred: Predicciones
        
    Returns:
        MSE
    """
    if len(y_true) != len(y_pred):
        raise ValueError("Las listas deben tener la misma longitud")
    
    errors = [(yt - yp) ** 2 for yt, yp in zip(y_true, y_pred)]
    return sum(errors) / len(errors)


def mae(y_true, y_pred):
    """
    Calcula el Error Absoluto Medio.
    
    Args:
        y_true: Valores verdaderos
        y_pred: Predicciones
        
    Returns:
        MAE
    """
    if len(y_true) != len(y_pred):
        raise ValueError("Las listas deben tener la misma longitud")
    
    errors = [abs(yt - yp) for yt, yp in zip(y_true, y_pred)]
    return sum(errors) / len(errors)