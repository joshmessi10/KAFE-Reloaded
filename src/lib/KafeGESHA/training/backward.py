"""Implementaciones de backward pass (backpropagation).

El backward pass ahora se delega directamente a model.backward(grad).
Estas funciones se mantienen para compatibilidad con Trainer.
"""


def backward_pass(model, error, learning_rate):
    """Realiza un backward pass a través del modelo.

    Args:
        model: Instancia de Model (Sequential o Functional).
        error: Gradiente de la capa de salida.
        learning_rate: Tasa de aprendizaje (ignorada si el modelo gestiona lr internamente).

    Returns:
        Gradiente propagado a la entrada.
    """
    return model.backward(error)


def backward_pass_with_regularization(model, error, learning_rate, regularization_lambda=0.0):
    """Realiza un backward pass. La regularización la gestiona cada capa Dense individualmente."""
    return model.backward(error)