"""Optimizadores Adam y AdamW."""
from lib.KafeMATH.funciones import pow_, sqrt
from lib.KafeGESHA.optimizers.optimizer import Optimizer


class Adam(Optimizer):
    def __init__(self, lr=0.001, beta1=0.9, beta2=0.999, epsilon=1e-8):
        self.lr = lr
        self.beta1 = beta1
        self.beta2 = beta2
        self.epsilon = epsilon
        self.m = None
        self.v = None
        self.t = 0

    def step(self, params, grads):
        if self.m is None:
            self.m = [0 for _ in grads]
            self.v = [0 for _ in grads]
        self.t += 1
        new_params = []
        for i in range(len(params)):
            self.m[i] = self.beta1 * self.m[i] + (1 - self.beta1) * grads[i]
            self.v[i] = self.beta2 * self.v[i] + (1 - self.beta2) * pow_(grads[i], 2)

            m_hat = self.m[i] / (1 - pow_(self.beta1, self.t))
            v_hat = self.v[i] / (1 - pow_(self.beta2, self.t))

            update = self.lr * m_hat / (sqrt(v_hat) + self.epsilon)
            new_params.append(params[i] - update)
        return new_params


class AdamW(Adam):
    def __init__(self, lr=0.001, beta1=0.9, beta2=0.999, epsilon=1e-8, weight_decay=0.01):
        super().__init__(lr, beta1, beta2, epsilon)
        self.weight_decay = weight_decay

    def step(self, params, grads):
        updated_params = super().step(params, grads)
        return [p - self.lr * self.weight_decay * p for p in updated_params]