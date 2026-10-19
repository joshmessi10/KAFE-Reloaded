"""Contrato común de pérdidas GESHA."""
from abc import ABC, abstractmethod
from lib.KafeNUMK import funciones as numk

def prediction_shape(y_true,y_pred):
    shape=numk.shape(y_pred)
    if len(shape) not in (1,2) or 0 in shape or numk.shape(y_true)!=shape:
        raise ValueError("Loss requiere predicciones y etiquetas de igual forma no vacia")
    return shape

class LossFunction(ABC):
    @abstractmethod
    def compute(self,y_true,y_pred): pass
    @abstractmethod
    def derivative(self,y_true,y_pred): pass
    def forward(self,y_pred,y_true):
        value=self.compute(y_true,y_pred); self._y_true=numk.tensor(y_true); self._y_pred=numk.tensor(y_pred); return value
    def backward(self):
        if not hasattr(self,'_y_true'): raise RuntimeError("Loss.backward requiere forward")
        return self.derivative(self._y_true,self._y_pred)
Loss=LossFunction
