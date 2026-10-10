"""Normalización por canal."""
from lib.KafeGESHA.core import Parameter
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer

class BatchNormalization(Layer):
    """Normalización por canal sobre las posiciones de una muestra CHW."""
    def __init__(self,epsilon=1e-5,momentum=.9):
        super().__init__(); self.epsilon,self.momentum=epsilon,momentum; self.gamma=self.beta=None; self.running_mean=self.running_var=None; self._cache=None
    def build(self,channels):
        if self.gamma is None:
            self.gamma=Parameter(numk.ones([channels]),"batchnorm_gamma"); self.beta=Parameter(numk.zeros_nd([channels]),"batchnorm_beta"); self.running_mean=numk.zeros_nd([channels]); self.running_var=numk.ones([channels])
    def forward(self,x):
        if len(numk.shape(x))!=3: raise ValueError("BatchNormalization requiere CHW")
        self.build(len(x)); out=numk.zeros_nd(list(numk.shape(x))); cache=[]
        for c,channel in enumerate(x):
            flat=[v for row in channel for v in row]; mean=sum(flat)/len(flat); var=sum((v-mean)**2 for v in flat)/len(flat)
            if self._training: self.running_mean[c]=self.momentum*self.running_mean[c]+(1-self.momentum)*mean; self.running_var[c]=self.momentum*self.running_var[c]+(1-self.momentum)*var
            else: mean,var=self.running_mean[c],self.running_var[c]
            inv=(var+self.epsilon)**-0.5; norm=[[(v-mean)*inv for v in row] for row in channel]; cache.append((norm,inv))
            out[c]=[[self.gamma.data[c]*v+self.beta.data[c] for v in row] for row in norm]
        self._cache=cache; return out
    def backward(self,e,regularization_lambda=0.0):
        dx=numk.zeros_nd(list(numk.shape(e))); dg=numk.zeros_nd([len(e)]); db=numk.zeros_nd([len(e)])
        for c,channel in enumerate(e):
            n=len(channel)*len(channel[0]); norm,inv=self._cache[c]; flat_g=[v for row in channel for v in row]; flat_n=[v for row in norm for v in row]
            dg[c]=sum(g*v for g,v in zip(flat_g,flat_n)); db[c]=sum(flat_g)
            for y,row in enumerate(channel):
                for x,g in enumerate(row): dx[c][y][x]=self.gamma.data[c]*inv*(n*g-db[c]-norm[y][x]*dg[c])/n
        self.gamma.grad,self.beta.grad=dg,db; return dx
    def parameters(self): return [self.gamma,self.beta] if self.gamma else []
    def summary(self): print("BatchNormalization")

__all__ = ['BatchNormalization']
