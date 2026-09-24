"""Flatten layer to reshape tensors."""
from global_utils import check_sig
from lib.KafeGESHA.layers.layer import Layer
from TypeUtils import numeric_matrix_types, numeric_vector_types


class Flatten(Layer):
    """Flatten layer that converts multidimensional tensors into 1D vectors.

    Useful for connecting convolutional layers with Dense layers.

    Args:
        input_shape: Expected form of entry (optional, informational).
    """

    def __init__(self, input_shape=None):
        super().__init__()
        self.input_shape = input_shape
        self._original_shape = None

    @check_sig([2], numeric_vector_types + numeric_matrix_types, is_method=True)
    def forward(self, x):
        """Forward propagation: flatten the tensor to 1D."""
        if isinstance(x[0], list):
            self._original_shape = (len(x), len(x[0]))
            return [x[i][j] for i in range(len(x)) for j in range(len(x[0]))]
        else:
            self._original_shape = (len(x),)
            return x[:]

    def backward(self, output_error, learning_rate, regularization_lambda=None):
        """Backward propagation: restore the original shape."""
        if self._original_shape is None:
            return output_error[:]

        if len(self._original_shape) == 1:
            return output_error[:]

        rows, cols = self._original_shape
        return [
            [output_error[i * cols + j] for j in range(cols)]
            for i in range(rows)
        ]

    def summary(self):
        shape_str = f"input_shape={self.input_shape}" if self.input_shape else ""
        print(f"Flatten({shape_str})")