"""Funciones de activación Identidad y Escalonada."""
from lib.KafeGESHA.activations.activation import ActivationFunction


class Identidad(ActivationFunction):
    def activate(self, x):
        return x

    def derivative(self, x):
        return 1.0


class Escalonada(ActivationFunction):
    def activate(self, x):
        return 1 if x >= 0 else 0

    def derivative(self, x):
        return 0.0