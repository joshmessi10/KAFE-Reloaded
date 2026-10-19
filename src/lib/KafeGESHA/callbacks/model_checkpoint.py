from .base import Callback
class ModelCheckpoint(Callback):
    def __init__(self, filepath, monitor='val_loss', save_best_only=False, mode='min'):
        if not filepath: raise ValueError("ModelCheckpoint requiere filepath")
        if mode not in ('min','max'): raise ValueError("ModelCheckpoint mode debe ser min o max")
        self.filepath, self.monitor, self.save_best_only, self.mode = filepath, monitor, save_best_only, mode
        self.best = None
    def on_epoch_end(self, epoch, logs=None):
        value = (logs or {}).get(self.monitor)
        improved = value is not None and (self.best is None or (value < self.best if self.mode == 'min' else value > self.best))
        if not self.save_best_only or improved:
            self.model.save_weights(self.filepath)
        if improved: self.best = value
