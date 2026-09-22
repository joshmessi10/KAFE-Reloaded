"""KafeGESHA — Deep Learning library for KAFE.

API pública exportada:
    Model      — clase base abstracta
    Sequential — modelo de grafo lineal
    Functional — modelo de grafo DAG
    Dense      — capa totalmente conectada
    Dropout    — regularización por dropout
    Flatten    — aplanar tensores
    Input      — entrada simbólica (API Functional)
    Add        — merge de ramas (API Functional)
    ReLULayer, SigmoidLayer, TanhLayer, SoftmaxLayer — activaciones como capas
"""
from lib.KafeGESHA.core.model import Model, Gesha
from lib.KafeGESHA.models.sequential import Sequential
from lib.KafeGESHA.models.functional import Functional, Add
from lib.KafeGESHA.layers.dense import Dense
from lib.KafeGESHA.layers.dropout import Dropout
from lib.KafeGESHA.layers.flatten import Flatten
from lib.KafeGESHA.layers.input_layer import Input
from lib.KafeGESHA.layers.activation_layers import (
    ReLULayer, SigmoidLayer, TanhLayer, SoftmaxLayer, LinearLayer
)