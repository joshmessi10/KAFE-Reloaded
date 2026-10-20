"""KafeGESHA — Deep Learning library for KAFE.

Exported public API (all names resolve to the redesigned class graph):
    Model — abstract base class
    Gesha — alias of Model (the KAFE runtime GESHA type base)
    Sequential — linear graph model
    Functional — DAG network model
    Dense — fully connected layer
    Dropout — dropout regularization
    Flatten — flatten tensors
    Input — symbolic input (Functional API)
    Add — branch merge (Functional API)
    ReLULayer, SigmoidLayer, TanhLayer, SoftmaxLayer — activations as layers
"""
from lib.KafeGESHA.layers.base.input import Input
from lib.KafeGESHA.layers.core.activation_layer import ActivationLayer
from lib.KafeGESHA.layers.core.dense import Dense
from lib.KafeGESHA.layers.merge.add import Add
from lib.KafeGESHA.layers.regularization.dropout import Dropout
from lib.KafeGESHA.layers.spatial.flatten import Flatten
from lib.KafeGESHA.models_v2 import Functional, Model, Sequential

Gesha = Model


class ReLULayer(ActivationLayer):
    def __init__(self):
        super().__init__("relu")


class SigmoidLayer(ActivationLayer):
    def __init__(self):
        super().__init__("sigmoid")


class TanhLayer(ActivationLayer):
    def __init__(self):
        super().__init__("tanh")


class SoftmaxLayer(ActivationLayer):
    def __init__(self):
        super().__init__("softmax")


class LinearLayer(ActivationLayer):
    def __init__(self):
        super().__init__("linear")


__all__ = [
    "Model",
    "Gesha",
    "Sequential",
    "Functional",
    "Add",
    "Dense",
    "Dropout",
    "Flatten",
    "Input",
    "ReLULayer",
    "SigmoidLayer",
    "TanhLayer",
    "SoftmaxLayer",
    "LinearLayer",
]
