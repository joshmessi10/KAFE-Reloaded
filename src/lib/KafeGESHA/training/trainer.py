"""Lógica de entrenamiento para modelos de deep learning."""
from lib.KafeGESHA.training.forward import forward_pass
from lib.KafeGESHA.training.backward import backward_pass
from lib.KafeGESHA.training.metrics import accuracy, mse


class Trainer:
    """
    Clase para gestionar el entrenamiento de modelos.
    Encapsula la lógica de epochs, batches y validación.
    """
    
    def __init__(self, model, optimizer, loss_fn):
        """
        Inicializa el trainer.
        
        Args:
            modelo: Modelo a entrenar
            optimizer: Optimizador para actualizar pesos
            loss_fn: Función de pérdida
        """
        self.model = model
        self.optimizer = optimizer
        self.loss_fn = loss_fn
    
    def train_epoch(self, x_train, y_train, batch_size=1):
        """Entrena una época completa."""
        n_samples = len(x_train)
        total_loss = 0.0
        
        for i in range(0, n_samples, batch_size):
            bx = x_train[i:min(i + batch_size, n_samples)]
            by = y_train[i:min(i + batch_size, n_samples)]
            
            for xi, yi in zip(bx, by):
                # Forward pass
                output = forward_pass(self.model, xi)
                
                # Calcular pérdida
                total_loss += self.loss_fn.compute([yi], [output])
                
                # Backward pass
                grad = self.loss_fn.derivative([yi], [output])
                backward_pass(self.model, grad, self.optimizer.lr)
        
        return total_loss / n_samples
    
    def validate(self, x_val, y_val):
        """Valida el modelo."""
        predictions = [forward_pass(self.model, x) for x in x_val]
        return mse(y_val, predictions)