"""Envoltura recurrente bidireccional."""
import copy
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer
from .simple_rnn import SimpleRNN
from .lstm import LSTM
from .gru import GRU

class Bidirectional(Layer):
    def __init__(self,layer):
        super().__init__()
        if not isinstance(layer,(LSTM,GRU)):
            if not isinstance(layer,SimpleRNN): raise ValueError("Bidirectional requiere una capa recurrente")
        self.forward_layer=layer; self.backward_layer=copy.deepcopy(layer); self._sequence_output=layer.return_sequences
    def forward(self,x):
        left=self.forward_layer.forward(x); right=self.backward_layer.forward(list(reversed(x)))
        if self._sequence_output: return [a+b for a,b in zip(left,list(reversed(right)))]
        return left+right
    def backward(self,e,regularization_lambda=0.0):
        u=len(e[0])//2 if self._sequence_output else len(e)//2
        if self._sequence_output: le=[v[:u] for v in e]; re=list(reversed([v[u:] for v in e]))
        else: le,re=e[:u],e[u:]
        ldx=self.forward_layer.backward(le,regularization_lambda); rdx=list(reversed(self.backward_layer.backward(re,regularization_lambda)))
        return numk.broadcast_add(ldx,rdx)
    def parameters(self): return self.forward_layer.parameters()+self.backward_layer.parameters()
    def summary(self): print(f"Bidirectional   | {self.forward_layer.__class__.__name__}")

__all__ = ['Bidirectional']
