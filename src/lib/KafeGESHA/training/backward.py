"""Implementaciones de backward pass (backpropagation)."""


def backward_pass(model, error, learning_rate):
    """
    Realiza un backward pass a través del modelo.
    
    Args:
        model: Modelo con capas
        error: Error de la capa de salida
        learning_rate: Tasa de aprendizaje
        
    Returns:
        Error propagado a la entrada
    """
    if not isinstance(error, list):
        error = [error]
    
    for layer in reversed(model.layers):
        error = layer.backward(error, learning_rate=learning_rate)
    
    return error


def backward_pass_with_regularization(model, error, learning_rate, regularization_lambda=0.0):
    """
    Realiza un backward pass con regularización L2.
    
    Args:
        model: Modelo con capas
        error: Error de la capa de salida
        learning_rate: Tasa de aprendizaje
        regularization_lambda: Coeficiente de regularización
        
    Returns:
        Error propagado a la entrada
    """
    if not isinstance(error, list):
        error = [error]
    
    for layer in reversed(model.layers):
        error = layer.backward(error, learning_rate=learning_rate, regularization_lambda=regularization_lambda)
    
    return error