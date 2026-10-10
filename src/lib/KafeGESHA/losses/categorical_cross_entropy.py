from .base import LossFunction,prediction_shape
from lib.KafeMATH.funciones import log
from lib.KafeNUMK import funciones as numk
class CategoricalCrossEntropy(LossFunction):
    def __init__(self,epsilon=1e-8): self.epsilon=epsilon
    def compute(self,y_true,y_pred):
        shape=prediction_shape(y_true,y_pred); samples=shape[0] if len(shape)==2 else 1
        return numk.sum_all(numk.map_elements(lambda yt,p:-yt*log(p+self.epsilon),y_true,y_pred))/samples
    def derivative(self,y_true,y_pred):
        shape=prediction_shape(y_true,y_pred); samples=shape[0] if len(shape)==2 else 1
        return numk.map_elements(lambda yt,p:-yt/(p+self.epsilon)/samples,y_true,y_pred)
