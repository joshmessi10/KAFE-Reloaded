from math import prod
from .base import LossFunction,prediction_shape
from lib.KafeMATH.funciones import log
from lib.KafeNUMK import funciones as numk
class BinaryCrossEntropy(LossFunction):
    def __init__(self,epsilon=1e-8): self.epsilon=epsilon
    def _clip(self,value): return max(self.epsilon,min(1.0-self.epsilon,value))
    def compute(self,y_true,y_pred):
        count=prod(prediction_shape(y_true,y_pred)); p=numk.map_elements(self._clip,y_pred)
        return numk.sum_all(numk.map_elements(lambda yt,x:-(yt*log(x)+(1-yt)*log(1-x)),y_true,p))/count
    def derivative(self,y_true,y_pred):
        count=prod(prediction_shape(y_true,y_pred)); p=numk.map_elements(self._clip,y_pred)
        return numk.map_elements(lambda yt,x:(x-yt)/(x*(1-x)+self.epsilon)/count,y_true,p)
