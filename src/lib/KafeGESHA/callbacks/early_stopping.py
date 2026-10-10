from .base import Callback
from lib.KafeNUMK import funciones as numk

class EarlyStopping(Callback):
    def __init__(self, monitor='val_loss', patience=0, min_delta=0.0, mode='min', restore_best_weights=False):
        if patience < 0: raise ValueError("EarlyStopping patience debe ser no negativo")
        if mode not in ('min','max'): raise ValueError("EarlyStopping mode debe ser min o max")
        self.monitor, self.patience, self.min_delta = monitor, patience, min_delta
        self.mode, self.restore_best_weights = mode, restore_best_weights
    def on_train_begin(self, logs=None):
        self.best = None; self.wait = 0; self.best_weights = None; self.stopped_epoch = 0
    def on_epoch_end(self, epoch, logs=None):
        value = (logs or {}).get(self.monitor)
        if value is None: return
        improved = self.best is None or (value < self.best-self.min_delta if self.mode == 'min' else value > self.best+self.min_delta)
        if improved:
            self.best, self.wait = value, 0
            if self.restore_best_weights: self.best_weights = [numk.tensor(p.data) for p in self.model.parameters()]
        else:
            self.wait += 1
            if self.wait > self.patience:
                self.model.stop_training = True; self.stopped_epoch = epoch + 1
                if self.best_weights:
                    for parameter, value in zip(self.model.parameters(), self.best_weights): parameter.data = numk.tensor(value)
