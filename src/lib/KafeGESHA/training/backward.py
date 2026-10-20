"""Backward pass implementations (backpropagation).

The backward pass is now delegated directly to model.backward(grad).
These features are maintained for compatibility with Trainer.
"""


def backward_pass(model, error, learning_rate):
    """Perform a backward pass through the model.

    Args:
        model: Model instance (Sequential or Functional).
        error: Output layer gradient.
        learning_rate: Learning rate (ignored if the model handles lr internally).

    Returns:
        Gradient propagated to the input.
    """
    return model.backward(error)


def backward_pass_with_regularization(model, error, learning_rate, regularization_lambda=0.0):
    """Perform a backward pass. Regularization is handled by each Dense layer individually."""
    return model.backward(error)