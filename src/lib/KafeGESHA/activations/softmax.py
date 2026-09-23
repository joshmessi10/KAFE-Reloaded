"""Softmax activation function."""
from lib.KafeMATH.functions import exp
from lib.KafeGESHA.activations.activation import ActivationFunction


class Softmax(ActivationFunction):
    def __init__(self):
        self.last_output = None

    def activate(self, vec):
        exp_vec = [exp(x) for x in vec]
        s = sum(exp_vec)
        output = [v / s for v in exp_vec]
        self.last_output = output[:]
        return output

    def derivative(self, vec):
        s = self.activate(vec)
        size = len(s)
        jacobian = [[0.0 for _ in range(size)] for _ in range(size)]
        for i in range(size):
            for j in range(size):
                if i == j:
                    jacobian[i][j] = s[i] * (1.0 - s[i])
                else:
                    jacobian[i][j] = - s[i] * s[j]
        return jacobian