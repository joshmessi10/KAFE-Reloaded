"""Forward pass implementations.

The forward pass is now delegated directly to model.forward(x).
These auxiliary functions are maintained for compatibility with Trainer.
"""


def forward_pass(model, x):
    """Perform a forward pass through the model.

    Args:
        model: Model instance (Sequential or Functional).
        x: Input (vector).

    Returns:
        Model output.
    """
    return model.forward(x)


def forward_pass_batch(model, x_batch):
    """Perform a forward pass for a batch of data.

    Args:
        model: Model instance.
        x_batch: List of entries.

    Returns:
        Exit list.
    """
    return [forward_pass(model, x) for x in x_batch]