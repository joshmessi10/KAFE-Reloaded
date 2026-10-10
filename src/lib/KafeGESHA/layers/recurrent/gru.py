"""Gated Recurrent Unit."""
from lib.KafeGESHA.core import Parameter
from lib.KafeNUMK import funciones as numk
from lib.KafeMATH.funciones import exp, tanh
from ..base.layer import Layer

def _sigmoid(x):
    return 1.0 / (1.0 + exp(-x))

def _add_inplace(target, value):
    return numk.map_elements(lambda a, b: a + b, target, value)

class GRU(Layer):
    """GRU educativa; backward usa BPTT sobre sus compuertas."""
    def __init__(self,units,input_shape=None,return_sequences=False,seed=None):
        super().__init__();
        if type(units) is not int or units<=0: raise ValueError("GRU units inválido")
        self.units,self.return_sequences,self.seed=units,return_sequences,seed; self.wz=self.wr=self.wh=self.bias=None
        if input_shape: self.build(input_shape[-1])
    def build(self,features):
        if self.wz is None:
            size=features+self.units; self.wz=Parameter(numk.random_tensor([size,self.units],-.2,.2,self.seed),"gru_wz"); self.wr=Parameter(numk.random_tensor([size,self.units],-.2,.2,None if self.seed is None else self.seed+1),"gru_wr"); self.wh=Parameter(numk.random_tensor([size,self.units],-.2,.2,None if self.seed is None else self.seed+2),"gru_wh"); self.bias=Parameter(numk.zeros_nd([3*self.units]),"gru_bias")
    def forward(self,x):
        if len(numk.shape(x))!=2: raise ValueError("GRU requiere [timesteps, features]")
        self.build(len(x[0])); h=numk.zeros_nd([self.units]); states=[]; cache=[]
        for xt in x:
            joined=xt+h; z=[_sigmoid(v+self.bias.data[j]) for j,v in enumerate(numk.dot_matrix([joined],self.wz.data)[0])]; r=[_sigmoid(v+self.bias.data[self.units+j]) for j,v in enumerate(numk.dot_matrix([joined],self.wr.data)[0])]; cand_join=xt+[r[j]*h[j] for j in range(self.units)]; n=[tanh(v+self.bias.data[2*self.units+j]) for j,v in enumerate(numk.dot_matrix([cand_join],self.wh.data)[0])]; prev=h; h=[(1-z[j])*n[j]+z[j]*h[j] for j in range(self.units)]; cache.append((joined,cand_join,prev,z,r,n)); states.append(h)
        self._x,self._cache=x,cache; return states if self.return_sequences else states[-1]
    def backward(self,e,regularization_lambda=0.0):
        tlen=len(self._cache); external=e if self.return_sequences else [numk.zeros_nd([self.units]) for _ in range(tlen)];
        if not self.return_sequences: external[-1]=e
        features=len(self._x[0]); dx=numk.zeros_nd(list(numk.shape(self._x))); dwz=numk.zeros_nd(list(numk.shape(self.wz.data))); dwr=numk.zeros_nd(list(numk.shape(self.wr.data))); dwh=numk.zeros_nd(list(numk.shape(self.wh.data))); db=numk.zeros_nd([3*self.units]); dh=numk.zeros_nd([self.units])
        for t in range(tlen-1,-1,-1):
            joined,cand_join,prev,z,r,n=self._cache[t]; dh=[dh[j]+external[t][j] for j in range(self.units)]; dn=[dh[j]*(1-z[j])*(1-n[j]*n[j]) for j in range(self.units)]; dz=[dh[j]*(prev[j]-n[j])*z[j]*(1-z[j]) for j in range(self.units)]
            d_cand=numk.dot_matrix([dn],numk.transpose(self.wh.data))[0]; dr=[d_cand[features+j]*prev[j]*r[j]*(1-r[j]) for j in range(self.units)]
            dwz=_add_inplace(dwz,numk.dot_matrix(numk.transpose([joined]),[dz])); dwr=_add_inplace(dwr,numk.dot_matrix(numk.transpose([joined]),[dr])); dwh=_add_inplace(dwh,numk.dot_matrix(numk.transpose([cand_join]),[dn])); db=_add_inplace(db,dz+dr+dn)
            djz=numk.dot_matrix([dz],numk.transpose(self.wz.data))[0]; djr=numk.dot_matrix([dr],numk.transpose(self.wr.data))[0]; dx[t]=[d_cand[j]+djz[j]+djr[j] for j in range(features)]; dh=[dh[j]*z[j]+d_cand[features+j]*r[j]+djz[features+j]+djr[features+j] for j in range(self.units)]
        self.wz.grad,self.wr.grad,self.wh.grad,self.bias.grad=dwz,dwr,dwh,db; return dx
    def parameters(self): return [self.wz,self.wr,self.wh,self.bias] if self.wz else []
    def summary(self): print(f"GRU             | units: {self.units}")

__all__ = ['GRU']
