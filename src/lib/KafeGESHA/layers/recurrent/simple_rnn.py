"""RNN de Elman."""
from lib.KafeGESHA.core import Parameter
from lib.KafeGESHA.activations import ActivationFunctionLoader
from lib.KafeNUMK import funciones as numk
from ..base.layer import Layer

class SimpleRNN(Layer):
    """Capa recurrente Elman con BPTT completo para [T,F]."""

    def __init__(self, units, activation="tanh", input_shape=None,
                 return_sequences=False, seed=None, name=None):
        super().__init__()
        if type(units) is not int or units <= 0:
            raise ValueError("SimpleRNN requiere units entero positivo")
        if type(return_sequences) is not bool:
            raise ValueError("SimpleRNN return_sequences debe ser BOOL")
        self.units = units
        self.activation_name = activation
        ActivationFunctionLoader.get(activation)
        self.input_shape = tuple(input_shape) if input_shape else None
        self.return_sequences = return_sequences
        self.seed = seed
        self.name = name or f"SimpleRNN_{units}"
        self.w_input = None
        self.w_recurrent = None
        self.bias = None
        self._inputs = None
        self._states = None
        self._step_activations = None
        if self.input_shape:
            self.build(self.input_shape[-1])

    def build(self, features):
        if type(features) is not int or features <= 0:
            raise ValueError("SimpleRNN requiere features positivos")
        if self.w_input is not None:
            if len(self.w_input.data) != features:
                raise ValueError("SimpleRNN: features de entrada incompatibles")
            return
        self.w_input = Parameter(
            numk.random_tensor([features, self.units], -0.25, 0.25, self.seed),
            name=f"{self.name}_w_input")
        recurrent_seed = None if self.seed is None else self.seed + 1
        self.w_recurrent = Parameter(
            numk.random_tensor([self.units, self.units], -0.25, 0.25, recurrent_seed),
            name=f"{self.name}_w_recurrent")
        self.bias = Parameter(numk.zeros_nd([self.units]), name=f"{self.name}_bias")

    def forward(self, input_data):
        input_shape = numk.shape(input_data)
        if len(input_shape) != 2 or 0 in input_shape:
            raise ValueError("SimpleRNN requiere entrada [timesteps, features]")
        self.build(input_shape[1])
        self._inputs = numk.tensor(input_data)
        self._states = [numk.zeros_nd([self.units])]
        self._step_activations = []
        for timestep in self._inputs:
            x_part = numk.dot_matrix([timestep], self.w_input.data)[0]
            h_part = numk.dot_matrix([self._states[-1]], self.w_recurrent.data)[0]
            z = numk.broadcast_add(numk.broadcast_add(x_part, h_part), self.bias.data)
            activation = ActivationFunctionLoader.get(self.activation_name)
            state = activation.forward(z)
            self._step_activations.append(activation)
            self._states.append(state)
        return self._states[1:] if self.return_sequences else self._states[-1]

    def backward(self, output_error, regularization_lambda=0.0):
        if self._inputs is None:
            raise RuntimeError("SimpleRNN.backward requiere forward")
        timesteps = len(self._inputs)
        external = output_error if self.return_sequences else [numk.zeros_nd([self.units]) for _ in range(timesteps)]
        if self.return_sequences and numk.shape(external) != (timesteps, self.units):
            raise ValueError("SimpleRNN: gradiente de secuencia incompatible")
        if not self.return_sequences:
            if numk.shape(output_error) != (self.units,):
                raise ValueError("SimpleRNN: gradiente incompatible")
            external[-1] = output_error
        dw_input = numk.zeros_nd(list(numk.shape(self.w_input.data)))
        dw_recurrent = numk.zeros_nd(list(numk.shape(self.w_recurrent.data)))
        db = numk.zeros_nd([self.units])
        dx = numk.zeros_nd(list(numk.shape(self._inputs)))
        dh_next = numk.zeros_nd([self.units])
        for t in range(timesteps - 1, -1, -1):
            dh = numk.broadcast_add(external[t], dh_next)
            dz = self._step_activations[t].backward(dh)
            x_outer = numk.dot_matrix(numk.transpose([self._inputs[t]]), [dz])
            h_outer = numk.dot_matrix(numk.transpose([self._states[t]]), [dz])
            dw_input = numk.broadcast_add(dw_input, x_outer)
            dw_recurrent = numk.broadcast_add(dw_recurrent, h_outer)
            db = numk.broadcast_add(db, dz)
            dx[t] = numk.dot_matrix([dz], numk.transpose(self.w_input.data))[0]
            dh_next = numk.dot_matrix([dz], numk.transpose(self.w_recurrent.data))[0]
        if regularization_lambda > 0:
            dw_input = numk.broadcast_add(dw_input, numk.scalar_mul(regularization_lambda, self.w_input.data))
            dw_recurrent = numk.broadcast_add(dw_recurrent, numk.scalar_mul(regularization_lambda, self.w_recurrent.data))
        self.w_input.grad = dw_input
        self.w_recurrent.grad = dw_recurrent
        self.bias.grad = db
        return dx

    def parameters(self):
        return [self.w_input, self.w_recurrent, self.bias] if self.w_input else []

    def summary(self):
        features = len(self.w_input.data) if self.w_input else 0
        params = features * self.units + self.units * self.units + self.units if features else 0
        print(f"{self.name:15} | units: {self.units:<5} | params: {params:<6} | sequences: {self.return_sequences}")

__all__ = ['SimpleRNN']
