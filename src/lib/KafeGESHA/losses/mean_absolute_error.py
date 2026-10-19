from math import prod
from .base import LossFunction,prediction_shape
from lib.KafeNUMK import funciones as numk
class MeanAbsoluteError(LossFunction):
    def compute(self,y_true,y_pred):
        return numk.sum_all(numk.abs_tensor(numk.broadcast_sub(y_pred,y_true)))/prod(prediction_shape(y_true,y_pred))
    def derivative(self,y_true,y_pred):
        count=prod(prediction_shape(y_true,y_pred)); return numk.map_elements(lambda yt,yp:(0.0 if yp==yt else (1.0 if yp>yt else -1.0))/count,y_true,y_pred)
