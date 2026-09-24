"""Optimizadores para KafeGESHA.

    Optimizer  — clase base abstracta
    SGD        — descenso de gradiente estocástico
    RMSprop    — RMS Propagation
    Adam       — Adaptive Moment Estimation
    AdamW      — Adam con weight decay desacoplado
"""
from abc import ABC, abstractmethod
from lib.KafeMATH.funciones import pow_, sqrt


def _apply_op(p, g, op):
    """Aplica una operación recursivamente a dos estructuras (listas o escalares)."""
    if isinstance(p, list):
        return [_apply_op(pi, gi, op) for pi, gi in zip(p, g)]
    return op(p, g)


def _apply_unary(g, op):
    """Aplica una operación unaria recursivamente a una estructura."""
    if isinstance(g, list):
        return [_apply_unary(gi, op) for gi in g]
    return op(g)


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


class SGD(Optimizer):
    def __init__(self, lr=0.01):
        self.lr = lr

    def step(self, parameters):
        for param in parameters:
            if param.grad is None:
                continue
            def op(p_val, g_val):
                return p_val - self.lr * g_val
            param.data = _apply_op(param.data, param.grad, op)


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
                self.cache[pid] = _apply_unary(param.grad, lambda x: 0.0)
            
            def cache_op(c_val, g_val):
                return self.rho * c_val + (1 - self.rho) * pow_(g_val, 2)
            
            self.cache[pid] = _apply_op(self.cache[pid], param.grad, cache_op)
            
            def update_op(args):
                p_val, g_val, c_val = args
                return p_val - self.lr * g_val / (sqrt(c_val) + self.epsilon)
            
            def recursive_update(p, g, c):
                if isinstance(p, list):
                    return [recursive_update(pi, gi, ci) for pi, gi, ci in zip(p, g, c)]
                return update_op((p, g, c))
            
            param.data = recursive_update(param.data, param.grad, self.cache[pid])


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
                self.m[pid] = _apply_unary(param.grad, lambda x: 0.0)
                self.v[pid] = _apply_unary(param.grad, lambda x: 0.0)
            
            def m_op(m_val, g_val): return self.beta1 * m_val + (1 - self.beta1) * g_val
            def v_op(v_val, g_val): return self.beta2 * v_val + (1 - self.beta2) * pow_(g_val, 2)
            
            self.m[pid] = _apply_op(self.m[pid], param.grad, m_op)
            self.v[pid] = _apply_op(self.v[pid], param.grad, v_op)
            
            def recursive_update(p, m_val, v_val):
                if isinstance(p, list):
                    return [recursive_update(pi, mi, vi) for pi, mi, vi in zip(p, m_val, v_val)]
                m_hat = m_val / (1 - pow_(self.beta1, self.t))
                v_hat = v_val / (1 - pow_(self.beta2, self.t))
                return p - self.lr * m_hat / (sqrt(v_hat) + self.epsilon)
            
            param.data = recursive_update(param.data, self.m[pid], self.v[pid])


class AdamW(Adam):
    def __init__(self, lr=0.001, beta1=0.9, beta2=0.999, epsilon=1e-8, weight_decay=0.01):
        super().__init__(lr, beta1, beta2, epsilon)
        self.weight_decay = weight_decay

    def step(self, parameters):
        super().step(parameters)
        for param in parameters:
            def decay_op(p_val): return p_val - self.lr * self.weight_decay * p_val
            param.data = _apply_unary(param.data, decay_op)
