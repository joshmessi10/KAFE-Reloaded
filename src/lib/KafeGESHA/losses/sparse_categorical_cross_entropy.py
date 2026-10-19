from .categorical_cross_entropy import CategoricalCrossEntropy
from lib.KafeNUMK import funciones as numk
class SparseCategoricalCrossEntropy(CategoricalCrossEntropy):
    def _one_hot(self,labels,predictions):
        shape=numk.shape(predictions)
        if len(shape) not in (1,2) or 0 in shape: raise ValueError("Sparse CCE requiere predicciones no vacias")
        samples,classes=(1,shape[0]) if len(shape)==1 else shape; labels=labels if isinstance(labels,list) else [labels]
        if len(labels)!=samples: raise ValueError("Sparse CCE: numero de etiquetas incompatible")
        targets=numk.zeros_nd([samples,classes])
        for row,label in zip(targets,labels):
            if type(label) is not int or not 0<=label<classes: raise ValueError("Sparse CCE: indice de clase invalido")
            row[label]=1.0
        return targets[0] if len(shape)==1 else targets
    def compute(self,y_true,y_pred): return super().compute(self._one_hot(y_true,y_pred),y_pred)
    def derivative(self,y_true,y_pred): return super().derivative(self._one_hot(y_true,y_pred),y_pred)
