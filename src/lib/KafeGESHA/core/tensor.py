"""Representation of N-dimensional tensors for KafeGESHA.

Tensor is a wrapper over the Python lists that Numk operates on.
Adds Deep Learning semantics: regularity validation, shape metadata.
"""
from lib.KafeNUMK import functions as numk


class Tensor:
    """
    N-dimensional Tensor for Deep Learning.
    
    Stores data as nested Python lists (Numk's native representation).
    Numk operates on this data directly.
    
    Properties:
        data: Python N-D list (operated by Numk)
        shape: dimensions tuple (calculated by numk.shape)
        ndim: number of dimensions
    """

    def __init__(self, data):
        """
        Initializes a tensor with data.

        Args:
            data: Nested structure of lists (1D, 2D, 3D, ...)

        Raises:
            ValueError: If the tensor is irregular
        """
        self.data = data
        self.shape = numk.shape(data)
        self._validate_regular()

    def _validate_regular(self):
        """Validate that the tensor is regular (rectangular)."""
        self._validate_recursive(self.data, self.shape, 0)

    def _validate_recursive(self, data, expected_shape, depth):
        """Recursively validates that all sublists have the expected length."""
        if depth == len(expected_shape) - 1:
            if len(data) != expected_shape[depth]:
                raise ValueError(
                    f"Irregular tensor: sublist at dimension {depth} "
                    f"has length {len(data)}, expected {expected_shape[depth]}"
                )
        else:
            if len(data) != expected_shape[depth]:
                raise ValueError(
                    f"Irregular tensor: dimension {depth} "
                    f"has length {len(data)}, expected {expected_shape[depth]}"
                )
            for i, sublist in enumerate(data):
                if not isinstance(sublist, list):
                    raise ValueError(
                        f"Irregular tensor: expected a sublist at dimension {depth}, "
                        f"found {type(sublist).__name__}"
                    )
                self._validate_recursive(sublist, expected_shape, depth + 1)

    @property
    def ndim(self):
        """Number of dimensions of the tensor."""
        return len(self.shape)

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        return self.data[idx]

    def __setitem__(self, idx, value):
        self.data[idx] = value

    def __repr__(self):
        return f"Tensor(shape={self.shape}, data={self.data})"


def tensor_zeros(shape):
    """Create a zero tensor of the given form using Numk."""
    return Tensor(numk.zeros_nd(shape))


def tensor_ones(shape):
    """Create a ones tensor of the given shape using Numk."""
    return Tensor(numk.ones(shape))


def tensor_random(shape, low=-0.5, high=0.5):
    """Create a tensor with random values ​​using Numk."""
    return Tensor(numk.random_tensor(shape, low, high))
