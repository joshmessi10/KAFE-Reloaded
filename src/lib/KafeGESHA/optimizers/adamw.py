"""Adam con decaimiento de pesos desacoplado."""
from lib.KafeNUMK import funciones as numk
from .adam import Adam


class AdamW(Adam):
    def __init__(self, lr=0.001, beta1=0.9, beta2=0.999, epsilon=1e-8, weight_decay=0.01):
        super().__init__(lr, beta1, beta2, epsilon)
        self.weight_decay = weight_decay

    def step(self, parameters):
        super().step(parameters)
        for parameter in parameters:
            if parameter.grad is None:
                continue
            parameter.data = numk.map_elements(
                lambda value: value - self.lr * self.weight_decay * value,
                parameter.data,
            )
