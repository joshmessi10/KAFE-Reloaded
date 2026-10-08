"""KafeGESHA — Deep Learning library for KAFE.

API pública exportada:
    Model      — clase base abstracta
    Sequential — modelo de grafo lineal
    Functional — modelo de grafo DAG
    Dense      — capa totalmente conectada
    Conv2D     — capa convolucional para imágenes CHW
    SimpleRNN  — capa recurrente Elman para secuencias
    Dropout    — regularización por dropout
    Flatten    — aplanar tensores
    Input      — entrada simbólica (API Functional)
    Add        — merge de ramas (API Functional)
    ReLULayer, SigmoidLayer, TanhLayer, SoftmaxLayer — activaciones como capas
"""
from lib.KafeGESHA.models import Model as Gesha, Model, Sequential, Functional
from lib.KafeGESHA.layers import (
    Dense, Conv2D, SimpleRNN, Dropout, Flatten, Input, Add, ActivationLayer,
)
# Alias para mantener compatibilidad
ReLULayer = lambda: ActivationLayer("relu")
SigmoidLayer = lambda: ActivationLayer("sigmoid")
TanhLayer = lambda: ActivationLayer("tanh")
SoftmaxLayer = lambda: ActivationLayer("softmax")
LinearLayer = lambda: ActivationLayer("linear")
