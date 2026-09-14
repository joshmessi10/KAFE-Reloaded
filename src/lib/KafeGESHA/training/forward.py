"""Implementaciones de forward pass.

El forward pass ahora se delega directamente a model.forward(x).
Estas funciones auxiliares se mantienen para compatibilidad con Trainer.
"""


def forward_pass(model, x):
    """Realiza un forward pass a través del modelo.

    Args:
        model: Instancia de Model (Sequential o Functional).
        x: Entrada (vector).

    Returns:
        Salida del modelo.
    """
    return model.forward(x)


def forward_pass_batch(model, x_batch):
    """Realiza un forward pass para un batch de datos.

    Args:
        model: Instancia de Model.
        x_batch: Lista de entradas.

    Returns:
        Lista de salidas.
    """
    return [forward_pass(model, x) for x in x_batch]