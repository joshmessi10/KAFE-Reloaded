from math import prod
from .base import LossFunction,prediction_shape
from lib.KafeNUMK import funciones as numk
class MeanSquaredError(LossFunction):
    def compute(self,y_true,y_pred):
        count=prod(prediction_shape(y_true,y_pred)); return numk.sum_all(numk.map_elements(lambda yt,yp:(yt-yp)**2,y_true,y_pred))/count
    def derivative(self,y_true,y_pred):
        count=prod(prediction_shape(y_true,y_pred)); return numk.map_elements(lambda yt,yp:2*(yp-yt)/count,y_true,y_pred)
