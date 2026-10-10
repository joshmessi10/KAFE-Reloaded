"""Producto elemento a elemento de ramas Functional."""
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer

class Multiply(Layer):
    def forward(self,inputs):
        if len(inputs)<2:
            raise ValueError("Multiply requiere dos entradas")
        self._last_inputs=inputs
        out=numk.tensor(inputs[0])
        for value in inputs[1:]: out=numk.emul(out,value)
        return out
    def backward(self,e,regularization_lambda=0.0):
        grads=[]
        for i in range(len(self._last_inputs)):
            grad=numk.tensor(e)
            for j,value in enumerate(self._last_inputs):
                if i!=j: grad=numk.emul(grad,value)
            grads.append(grad)
        return grads
    def summary(self): print("Multiply")

__all__ = ['Multiply']
