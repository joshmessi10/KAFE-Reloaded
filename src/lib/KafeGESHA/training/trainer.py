"""Trainer class — encapsulates the training loop.

Trainer is an alternative to model.fit() for users who want
greater control over the training process (custom callbacks, etc.).
"""


class Trainer:
    """Manage the training of a model with granular control.

    For most cases model.fit() is sufficient.
    Trainer is useful when you need step-by-step access to the loop.

    Args:
        model: Compiled Model instance.
    """

    def __init__(self, model):
        self.model = model

    def train_epoch(self, x_train, y_train, batch_size=1):
        """Train a full era.

        Args:
            x_train: Input matrix.
            y_train: Labels.
            batch_size: Mini-batch size.

        Returns:
            Average loss of the time.
        """
        n_samples = len(x_train)
        total_loss = 0.0

        for i in range(0, n_samples, batch_size):
            end = min(i + batch_size, n_samples)
            bx = x_train[i:end]
            by = y_train[i:end]

            for xi, yi in zip(bx, by, strict=False):
                out = self.model.forward(xi)
                loss_val, grad = self.model._compute_loss_and_grad(out, yi)
                total_loss += loss_val
                self.model.backward(grad)

        return total_loss / n_samples

    def validate(self, x_val, y_val):
        """Validate the model by calculating the loss on the validation set.

        Args:
            x_val: Validation data.
            y_val: Validation tags.

        Returns:
            Average validation loss.
        """
        total = 0.0
        n = len(x_val)
        for xi, yi in zip(x_val, y_val, strict=False):
            out = self.model.forward(xi)
            loss_val, _ = self.model._compute_loss_and_grad(out, yi)
            total += loss_val
        return total / n