from global_utils import check_sig
from TypeUtils import machine_t, vector_numeros_t, flotante_t, entero_t

class LinearRegression:
    def __init__(self):
        self.slope = 0.0
        self.intercept = 0.0

    @check_sig([3], vector_numeros_t, vector_numeros_t, is_method=True)
    def train(self, x, y):
    
        n = len(x)
        if n == 0 or len(y) != n:
            raise Exception("LinearRegression: Input lengths must match and be > 0")
        
        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(xi * yi for xi, yi in zip(x, y))
        sum_x2 = sum(xi**2 for xi in x)
        
        denominator = (n * sum_x2 - sum_x**2)
        if denominator == 0:
            self.slope = 0.0
            self.intercept = sum_y / n
        else:
            self.slope = (n * sum_xy - sum_x * sum_y) / denominator
            self.intercept = (sum_y - self.slope * sum_x) / n

    @check_sig([2], [flotante_t, entero_t], is_method=True)
    def predict(self, val):
        return self.slope * val + self.intercept

    def __repr__(self):
        return f"LinearRegression(slope={self.slope:.4f}, intercept={self.intercept:.4f})"
