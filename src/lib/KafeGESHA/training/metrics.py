"""Evaluation metrics for deep learning models."""


def accuracy(y_true, y_pred):
    """
    Calculate the classification accuracy.
    
    Args:
        y_true: Valores verdaderos
        y_pred: Predicciones
        
    Returns:
        Accuracy (0.0 to 1.0)
    """
    if len(y_true) != len(y_pred):
        raise ValueError("Lists must have the same length")
    
    correct = sum(1 for yt, yp in zip(y_true, y_pred) if yt == yp)
    return correct / len(y_true)


def mse(y_true, y_pred):
    """
    Calculate the Mean Square Error.
    
    Args:
        y_true: Valores verdaderos
        y_pred: Predicciones
        
    Returns:
        MSE
    """
    if len(y_true) != len(y_pred):
        raise ValueError("Lists must have the same length")
    
    errors = [(yt - yp) ** 2 for yt, yp in zip(y_true, y_pred)]
    return sum(errors) / len(errors)


def mae(y_true, y_pred):
    """
    Calculate the Mean Absolute Error.
    
    Args:
        y_true: Valores verdaderos
        y_pred: Predicciones
        
    Returns:
        MAE
    """
    if len(y_true) != len(y_pred):
        raise ValueError("Lists must have the same length")
    
    errors = [abs(yt - yp) for yt, yp in zip(y_true, y_pred)]
    return sum(errors) / len(errors)