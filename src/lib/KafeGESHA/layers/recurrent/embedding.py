"""Tabla entrenable de embeddings."""
from lib.KafeGESHA.core import Parameter
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer

class Embedding(Layer):
    def __init__(self,input_dim,output_dim,seed=None):
        super().__init__()
        if input_dim<=0 or output_dim<=0: raise ValueError("Embedding dimensiones positivas requeridas")
        self.input_dim,self.output_dim=input_dim,output_dim; self.embeddings=Parameter(numk.random_tensor([input_dim,output_dim],-.05,.05,seed),"embeddings"); self._indices=None
    def forward(self,indices):
        if any(type(i) is not int or i<0 or i>=self.input_dim for i in indices): raise ValueError("Embedding índice fuera de rango")
        self._indices=indices[:]; return [self.embeddings.data[i][:] for i in indices]
    def backward(self,e,regularization_lambda=0.0):
        grad=numk.zeros_nd([self.input_dim,self.output_dim])
        for i,g in zip(self._indices,e): grad[i]=numk.broadcast_add(grad[i],g)
        self.embeddings.grad=grad; return numk.zeros_nd([len(self._indices)])
    def parameters(self): return [self.embeddings]
    def summary(self): print(f"Embedding       | vocab: {self.input_dim} | dim: {self.output_dim}")

__all__ = ['Embedding']
