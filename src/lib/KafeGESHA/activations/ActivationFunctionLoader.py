"""Activation function loader."""
from lib.KafeGESHA.activations.sigmoid import SigmoidActivation
from lib.KafeGESHA.activations.relu import ReLU
from lib.KafeGESHA.activations.tanh import Tanh
from lib.KafeGESHA.activations.step import IdentityActivation, StepActivation
from lib.KafeGESHA.activations.softmax import Softmax
from global_utils import check_sig
from TypeUtils import string_type, void_t


class ActivationFunctionLoader:
    @staticmethod
    @check_sig([1], [string_type, void_t])
    def get(name):
        if not name:
            return IdentityActivation()
        n = name.lower()
        if n in ("sigmoid", "sigmoide"):
            return SigmoidActivation()
        if n == "relu":
            return ReLU()
        if n in ("tanh", "tangente"):
            return Tanh()
        if n in ("linear", "identity", "identidad"):
            return IdentityActivation()
        if n in ("step", "escalon", "escalonada"):
            return StepActivation()
        if n == "softmax":
            return Softmax()
        from warnings import warn
        warn(f"Activation function '{name}' was not recognized. Identity will be used by default.", stacklevel=2)
        return IdentityActivation()