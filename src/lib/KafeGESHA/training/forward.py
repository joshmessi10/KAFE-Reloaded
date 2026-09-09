"""Implementaciones de forward pass."""


def forward_pass(model, x):
    """
    Realiza un forward pass a través del modelo.
    
    Args:
        model: Modelo con capas
        x: Entrada
        
    Returns:
        Salida del modelo
    """
    output = x
    for layer in model.layers:
        output = layer.forward(output)
    return output


def forward_pass_batch(model, x_batch):
    """
    Realiza un forward pass para un batch de datos.
    
    Args:
        model: Modelo con capas
        x_batch: Lista de entradas
        
    Returns:
        Lista de salidas
    """
    return [forward_pass(model, x) for x in x_batch]