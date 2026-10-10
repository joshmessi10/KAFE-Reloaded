"""Long Short-Term Memory."""
from lib.KafeGESHA.core import Parameter
from lib.KafeNUMK import funciones as numk
from lib.KafeMATH.funciones import exp, tanh
from ..base.layer import Layer

def _sigmoid(x):
    return 1.0 / (1.0 + exp(-x))

def _add_inplace(target, value):
    return numk.map_elements(lambda a, b: a + b, target, value)

class LSTM(Layer):
    """LSTM educativa con salida final o secuencia completa."""
    def __init__(self,units,input_shape=None,return_sequences=False,seed=None):
        super().__init__();
        if type(units) is not int or units<=0: raise ValueError("LSTM units inválido")
        self.units,self.return_sequences,self.seed=units,return_sequences,seed; self.kernel=self.bias=None; self._cache=None
        if input_shape: self.build(input_shape[-1])
    def build(self,features):
        if self.kernel is None: self.kernel=Parameter(numk.random_tensor([features+self.units,4*self.units],-.2,.2,self.seed),"lstm_kernel"); self.bias=Parameter(numk.zeros_nd([4*self.units]),"lstm_bias")
    def forward(self,x):
        if len(numk.shape(x))!=2: raise ValueError("LSTM requiere [timesteps, features]")
        self.build(len(x[0])); h=numk.zeros_nd([self.units]); c=numk.zeros_nd([self.units]); states=[]; cache=[]
        for xt in x:
            joined=xt+h; z=numk.broadcast_add(numk.dot_matrix([joined],self.kernel.data)[0],self.bias.data)
            i=[_sigmoid(v) for v in z[:self.units]]; f=[_sigmoid(v) for v in z[self.units:2*self.units]]; g=[tanh(v) for v in z[2*self.units:3*self.units]]; o=[_sigmoid(v) for v in z[3*self.units:]]
            prev_c=c; c=[f[j]*c[j]+i[j]*g[j] for j in range(self.units)]; h=[o[j]*tanh(c[j]) for j in range(self.units)]
            cache.append((joined,prev_c,i,f,g,o,c)); states.append(h)
        self._x,self._cache=x,cache; return states if self.return_sequences else states[-1]
    def backward(self,e,regularization_lambda=0.0):
        tlen=len(self._cache); external=e if self.return_sequences else [numk.zeros_nd([self.units]) for _ in range(tlen)];
        if not self.return_sequences: external[-1]=e
        dw=numk.zeros_nd(list(numk.shape(self.kernel.data))); db=numk.zeros_nd([4*self.units]); dx=numk.zeros_nd(list(numk.shape(self._x))); dh=numk.zeros_nd([self.units]); dc=numk.zeros_nd([self.units]); features=len(self._x[0])
        for t in range(tlen-1,-1,-1):
            joined,prev_c,i,f,g,o,c=self._cache[t]; dh=[dh[j]+external[t][j] for j in range(self.units)]; tc=[tanh(v) for v in c]
            do=[dh[j]*tc[j]*o[j]*(1-o[j]) for j in range(self.units)]; dc=[dc[j]+dh[j]*o[j]*(1-tc[j]*tc[j]) for j in range(self.units)]
            di=[dc[j]*g[j]*i[j]*(1-i[j]) for j in range(self.units)]; df=[dc[j]*prev_c[j]*f[j]*(1-f[j]) for j in range(self.units)]; dg=[dc[j]*i[j]*(1-g[j]*g[j]) for j in range(self.units)]; dz=di+df+dg+do
            dw=_add_inplace(dw,numk.dot_matrix(numk.transpose([joined]),[dz])); db=_add_inplace(db,dz); djoined=numk.dot_matrix([dz],numk.transpose(self.kernel.data))[0]; dx[t]=djoined[:features]; dh=djoined[features:]; dc=[dc[j]*f[j] for j in range(self.units)]
        self.kernel.grad,self.bias.grad=dw,db; return dx
    def parameters(self): return [self.kernel,self.bias] if self.kernel else []
    def summary(self): print(f"LSTM            | units: {self.units}")

__all__ = ['LSTM']
