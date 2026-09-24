"""Activation function loader."""
from global_utils import check_sig
from lib.KafeGESHA.activations.relu import ReLU
from lib.KafeGESHA.activations.sigmoid import SigmoidActivation
from lib.KafeGESHA.activations.softmax import Softmax
from lib.KafeGESHA.activations.step import IdentityActivation, StepActivation
from lib.KafeGESHA.activations.tanh import Tanh
from TypeUtils import string_type, void_t


class ActivationFunctionLoader:
    @staticmethod
    @check_sig([1], [string_type, void_t])
    def get(name):
        if not name:
            return IdentityActivation()
        n = name.lower()
        if n == "sigmoid":
            return SigmoidActivation()
        if n == "relu":
            return ReLU()
        if n == "tanh":
            return Tanh()
        if n in ("linear", "identity"):
            return IdentityActivation()
        if n == "step":
            return StepActivation()
        if n == "softmax":
            return Softmax()
        from warnings import warn
        warn(f"Activation function '{name}' was not recognized. Identity will be used by default.", stacklevel=2)
        return IdentityActivation()
