from .base import ActivationFunction
from lib.KafeNUMK import funciones as numk
class Softmax(ActivationFunction):
    def __init__(self): self.last_output = None
    def activate(self, vec):
        shape=numk.shape(vec)
        if len(shape) not in (1,2) or 0 in shape: raise ValueError("Softmax requiere un vector o una matriz no vacia")
        rows=[vec] if len(shape)==1 else vec
        maxima=numk.reshape(numk.max_axis(rows,1),[len(rows),1])
        exps=numk.exp_tensor(numk.broadcast_sub(rows,maxima))
        totals=numk.reshape(numk.sum_axis(exps,1),[len(rows),1])
        self.last_output=numk.broadcast_div(exps,totals)
        if len(shape)==1: self.last_output=self.last_output[0]
        return numk.tensor(self.last_output)
    def forward(self,z): self.z_cache=numk.tensor(z); self.output_cache=self.activate(z); return numk.tensor(self.output_cache)
    def backward(self,g):
        if not hasattr(self,'output_cache'): raise RuntimeError("Softmax.backward requiere forward")
        p=self.output_cache; product=numk.emul(g,p)
        projection=numk.sum_all(product) if len(numk.shape(p))==1 else numk.reshape(numk.sum_axis(product,1),[len(product),1])
        return numk.emul(p,numk.broadcast_sub(g,projection))
    def derivative(self,vec):
        s=self.last_output if vec is None else self.activate(vec); n=len(s)
        return [[s[i]*(1-s[i]) if i==j else -s[i]*s[j] for j in range(n)] for i in range(n)]
