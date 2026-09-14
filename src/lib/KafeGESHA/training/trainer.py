"""Clase Trainer — encapsula el loop de entrenamiento.

Trainer es una alternativa a model.fit() para usuarios que quieren
mayor control sobre el proceso de entrenamiento (custom callbacks, etc.).
"""
from lib.KafeGESHA.training.metrics import accuracy, mse


class Trainer:
    """Gestiona el entrenamiento de un modelo con control granular.

    Para la mayoría de los casos, model.fit() es suficiente.
    Trainer es útil cuando se necesita acceso paso a paso al loop.

    Args:
        model: Instancia de Model compilado.
    """

    def __init__(self, model):
        self.model = model

    def train_epoch(self, x_train, y_train, batch_size=1):
        """Entrena una época completa.

        Args:
            x_train: Matriz de entrada.
            y_train: Etiquetas.
            batch_size: Tamaño del mini-batch.

        Returns:
            Loss promedio de la época.
        """
        n_samples = len(x_train)
        total_loss = 0.0

        for i in range(0, n_samples, batch_size):
            end = min(i + batch_size, n_samples)
            bx = x_train[i:end]
            by = y_train[i:end]

            for xi, yi in zip(bx, by):
                out = self.model.forward(xi)
                loss_val, grad = self.model._compute_loss_and_grad(out, yi)
                total_loss += loss_val
                self.model.backward(grad)

        return total_loss / n_samples

    def validate(self, x_val, y_val):
        """Valida el modelo calculando la loss sobre el conjunto de validación.

        Args:
            x_val: Datos de validación.
            y_val: Etiquetas de validación.

        Returns:
            Loss promedio de validación.
        """
        total = 0.0
        n = len(x_val)
        for xi, yi in zip(x_val, y_val):
            out = self.model.forward(xi)
            loss_val, _ = self.model._compute_loss_and_grad(out, yi)
            total += loss_val
        return total / n