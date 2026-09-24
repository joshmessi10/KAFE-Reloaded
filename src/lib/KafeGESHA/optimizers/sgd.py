"""SGD and RMSprop optimizers."""
from lib.KafeGESHA.optimizers.optimizer import Optimizer
from lib.KafeMATH.functions import pow_, sqrt


class SGD(Optimizer):
    def __init__(self, lr=0.01):
        self.lr = lr

    def step(self, params, grads):
        return [p - self.lr * g for p, g in zip(params, grads, strict=False)]


class RMSprop(Optimizer):
    def __init__(self, lr=0.001, rho=0.9, epsilon=1e-8):
        self.lr = lr
        self.rho = rho
        self.epsilon = epsilon
        self.cache = None

    def step(self, params, grads):
        if self.cache is None:
            self.cache = [0 for _ in grads]
        new_params = []
        for i in range(len(params)):
            self.cache[i] = self.rho * self.cache[i] + (1 - self.rho) * pow_(grads[i], 2)
            update = self.lr * grads[i] / (sqrt(self.cache[i]) + self.epsilon)
            new_params.append(params[i] - update)
        return new_params