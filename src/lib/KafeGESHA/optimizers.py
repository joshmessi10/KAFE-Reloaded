"""Optimizadores para KafeGESHA.

    Optimizer  — clase base abstracta
    SGD        — descenso de gradiente estocástico
    RMSprop    — RMS Propagation
    Adam       — Adaptive Moment Estimation
    AdamW      — Adam con weight decay desacoplado
"""
from abc import ABC, abstractmethod
from lib.KafeMATH.funciones import sqrt
from lib.KafeNUMK import funciones as numk


class Optimizer(ABC):
    """Clase base para optimizadores.

    Actualiza las estructuras de datos de los parámetros in-place
    a partir de sus gradientes.
    """

    @abstractmethod
    def step(self, parameters):
        """Aplica un paso de optimización sobre una lista de objetos Parameter.
        Cada Parameter debe tener .data y .grad.
        Actualiza .data in-place.
        """
        raise NotImplementedError()

    def update(self, layers):
        """Actualiza capas entrenables usando el contrato público de Layer."""
        parameters = []
        seen = set()
        for layer in layers:
            for parameter in layer.parameters():
                if id(parameter) not in seen:
                    parameters.append(parameter)
                    seen.add(id(parameter))
        self.step(parameters)


class SGD(Optimizer):
    def __init__(self, lr=0.01):
        self.lr = lr

    def step(self, parameters):
        for param in parameters:
            if param.grad is None:
                continue
            def op(p_val, g_val):
                return p_val - self.lr * g_val
            param.data = numk.map_elements(op, param.data, param.grad)


class RMSprop(Optimizer):
    def __init__(self, lr=0.001, rho=0.9, epsilon=1e-8):
        self.lr = lr
        self.rho = rho
        self.epsilon = epsilon
        self.cache = {}

    def step(self, parameters):
        for param in parameters:
            if param.grad is None:
                continue
            pid = id(param)
            if pid not in self.cache:
                self.cache[pid] = numk.zeros_nd(list(numk.shape(param.grad)))
            
            def cache_op(c_val, g_val):
                return self.rho * c_val + (1 - self.rho) * g_val ** 2
            
            self.cache[pid] = numk.map_elements(cache_op, self.cache[pid], param.grad)
            
            def update_op(p_val, g_val, c_val):
                return p_val - self.lr * g_val / (sqrt(c_val) + self.epsilon)
            param.data = numk.map_elements(update_op, param.data, param.grad, self.cache[pid])


class Adam(Optimizer):
    def __init__(self, lr=0.001, beta1=0.9, beta2=0.999, epsilon=1e-8):
        self.lr = lr
        self.beta1 = beta1
        self.beta2 = beta2
        self.epsilon = epsilon
        self.m = {}
        self.v = {}
        self.t = 0

    def step(self, parameters):
        self.t += 1
        for param in parameters:
            if param.grad is None:
                continue
            pid = id(param)
            if pid not in self.m:
                self.m[pid] = numk.zeros_nd(list(numk.shape(param.grad)))
                self.v[pid] = numk.zeros_nd(list(numk.shape(param.grad)))
            
            def m_op(m_val, g_val): return self.beta1 * m_val + (1 - self.beta1) * g_val
            def v_op(v_val, g_val): return self.beta2 * v_val + (1 - self.beta2) * g_val ** 2
            
            self.m[pid] = numk.map_elements(m_op, self.m[pid], param.grad)
            self.v[pid] = numk.map_elements(v_op, self.v[pid], param.grad)
            
            def update_op(p, m_val, v_val):
                # Los exponentes son enteros: no usar exp(t * log(beta)),
                # cuya aproximación puede volver negativo el denominador.
                m_hat = m_val / (1 - self.beta1 ** self.t)
                v_hat = v_val / (1 - self.beta2 ** self.t)
                return p - self.lr * m_hat / (sqrt(v_hat) + self.epsilon)
            
            param.data = numk.map_elements(update_op, param.data, self.m[pid], self.v[pid])


class AdamW(Adam):
    def __init__(self, lr=0.001, beta1=0.9, beta2=0.999, epsilon=1e-8, weight_decay=0.01):
        super().__init__(lr, beta1, beta2, epsilon)
        self.weight_decay = weight_decay

    def step(self, parameters):
        super().step(parameters)
        for param in parameters:
            def decay_op(p_val): return p_val - self.lr * self.weight_decay * p_val
            if param.grad is not None:
                param.data = numk.map_elements(decay_op, param.data)
