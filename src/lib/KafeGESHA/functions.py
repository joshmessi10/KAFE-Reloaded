"""KafeGESHA public API for the KAFE interpreter.

Features available from KAFE with `import geshaDeep`:

    Model construction:
        geshaDeep.sequential([layers])    → Sequential
        geshaDeep.functional(inputs, outputs) → Functional
        geshaDeep.input_layer(shape) → Symbolic input

    Layer construction:
        geshaDeep.create_dense(units, activation, input_shape, reg, seed)
        geshaDeep.relu_layer()
        geshaDeep.sigmoid_layer()
        geshaDeep.tanh_layer()
        geshaDeep.softmax_layer()
        geshaDeep.dropout_layer(rate, seed)
        geshaDeep.flatten_layer()
        geshaDeep.add_layer() → Add layer for skip-connections

    Tensioner utilities:
        geshaDeep.tensor(data)
        geshaDeep.tensor_zeros(shape)
        geshaDeep.tensor_ones(shape)
        geshaDeep.tensor_random(shape)

    Operations on the model:
        geshaDeep.compile(model, optimizer, loss, metrics)
        geshaDeep.set_lr(model, new_lr)

Expected pipeline from KAFE:

    import geshaDeep;

    -- Data already prepared (preprocessing is out)
    List[List[FLOAT]] X_train = [...];
    List[INT]         y_train = [...];

    GESHA model = geshaDeep.sequential([
        geshaDeep.create_dense(128, "relu", [784], 0.0),
        geshaDeep.create_dense(10,  "softmax", [], 0.0)
    ]);
    model.compile("adam", "categorical_crossentropy", ["accuracy"]);
    model.fit(X_train, y_train, 20, 32);
"""
from global_utils import check_sig
from lib.KafeGESHA.layers.activation_layers import (
    LinearLayer,
    ReLULayer,
    SigmoidLayer,
    SoftmaxLayer,
    TanhLayer,
)
from lib.KafeGESHA.layers.dense import Dense
from lib.KafeGESHA.layers.dropout import Dropout
from lib.KafeGESHA.layers.flatten import Flatten
from lib.KafeGESHA.layers.input_layer import Input
from lib.KafeGESHA.models.functional import Add, Functional
from lib.KafeGESHA.models.sequential import Sequential
from TypeUtils import (
    any_list_types,
    float_type,
    gesha_type,
    integer_type,
    numeric_vector_types,
    string_list_type,
    string_type,
    void_t,
)
from TypeUtils import numeric_matrix_types as numeric_matrix_types

# --------------------------------------------------------------------------
# Layers
# --------------------------------------------------------------------------

@check_sig([4, 5], [integer_type], [string_type, void_t], numeric_vector_types + [void_t], [float_type, integer_type], [integer_type, void_t])
def create_dense(units, activation, input_shape, regularization_lambda, seed=None):
    """Create a Dense layer.

    Args:
        units: Number of neurons.
        activation: Activation function ('relu', 'sigmoid', 'softmax', 'tanh', 'linear', None).
        input_shape: List with the input dimension, or [] for automatic inference.
        regularization_lambda: L2 regularization coefficient (0.0 for none).
        seed: Seed for reproducibility (optional).
    """
    shape = tuple(input_shape) if input_shape else None
    return Dense(units, activation, shape, regularization_lambda, seed=seed)


@check_sig([0], [])
def relu_layer():
    """Create a separate ReLU layer."""
    return ReLULayer()


@check_sig([0], [])
def sigmoid_layer():
    """Create a separate Sigmoid layer."""
    return SigmoidLayer()


@check_sig([0], [])
def tanh_layer():
    """Create a separate Tanh layer."""
    return TanhLayer()


@check_sig([0], [])
def softmax_layer():
    """Create a separate Softmax layer."""
    return SoftmaxLayer()


@check_sig([0], [])
def linear_layer():
    """Create a linear activation (identity) layer."""
    return LinearLayer()


@check_sig([0, 1, 2], [float_type, integer_type], [integer_type, void_t])
def dropout_layer(rate=0.5, seed=None):
    """Create a Dropout layer.

    Args:
        rate: Proportion of neurons to deactivate (0.0 to 1.0).
        seed: Seed for reproducibility.
    """
    return Dropout(rate=rate, seed=seed)


@check_sig([0, 1], [numeric_vector_types, void_t])
def flatten_layer(input_shape=None):
    """Create a Flatten layer."""
    shape = tuple(input_shape) if input_shape else None
    return Flatten(input_shape=shape)


@check_sig([0], [])
def add_layer():
    """Create an Add layer to merge branches (skip-connections).

    Usage in Functional API:
        merged = add_layer()([branch_a, branch_b])
    """
    return Add()


# --------------------------------------------------------------------------
# Models
# --------------------------------------------------------------------------

@check_sig([0, 1], any_list_types + ["List[GESHA]", void_t])
def sequential(layers=None):
    """Create a Sequential model.

    Args:
        layers: List of initial layers (optional).

    Example:
        GESHA model = geshaDeep.sequential([
            geshaDeep.create_dense(128, "relu", [784], 0.0),
            geshaDeep.create_dense(10, "softmax", [], 0.0)
        ]);
    """
    return Sequential(layers=layers)


@check_sig([2], [gesha_type], [gesha_type])
def functional(inputs, outputs):
    """Create a Functional model from symbolic tensors.

    Args:
        inputs: Symbolic input tensor (Input).
        outputs: Symbolic output node of the graph.

    Example:
        GESHA inputs  = geshaDeep.input_layer([784]);
        GESHA x       = geshaDeep.create_dense(128, "relu", [], 0.0)(inputs);
        GESHA outputs = geshaDeep.create_dense(10, "softmax", [], 0.0)(x);
        GESHA model   = geshaDeep.functional(inputs, outputs);
    """
    return Functional(inputs=inputs, outputs=outputs)


@check_sig([1], [numeric_vector_types])
def input_layer(shape):
    """Creates an input symbolic tensor for the Functional API.

    Args:
        shape: List with the input dimensions (e.g., [784] or [28, 28]).
    """
    return Input(shape=tuple(shape))


# --------------------------------------------------------------------------
# Operations on the model
# --------------------------------------------------------------------------

@check_sig([4], [gesha_type], [string_type], [string_type], [string_list_type])
def compile(model, optimizer, loss, metrics):
    """Configure the optimizer and model loss function."""
    model.compile(optimizer=optimizer, loss=loss, metrics=metrics)


@check_sig([2], [gesha_type], [float_type, integer_type])
def set_lr(model, new_lr):
    """Updates the learning rate of the optimizer."""
    model.set_lr(new_lr)


# --------------------------------------------------------------------------
# Tensor Utilities
# --------------------------------------------------------------------------

@check_sig([1], numeric_vector_types)
def tensor_zeros(shape):
    """Create a zero tensor with the given form. Delegate to KafeNUMK."""
    from lib.KafeGESHA.core.tensor import tensor_zeros as _tz
    return _tz(shape)


@check_sig([1], numeric_vector_types)
def tensor_ones(shape):
    """Create a ones tensor with the given shape. Delegate to KafeNUMK."""
    from lib.KafeGESHA.core.tensor import tensor_ones as _to
    return _to(shape)


@check_sig([1], numeric_vector_types)
def tensor_random(shape):
    """Create a tensor with random values. Delegate to KafeNUMK."""
    from lib.KafeGESHA.core.tensor import tensor_random as _tr
    return _tr(shape)


@check_sig([1], any_list_types)
def tensor(data):
    """Create a tensor from data. Delegate to KafeNUMK."""
    from lib.KafeGESHA.core.tensor import Tensor as _Tensor
    return _Tensor(data)
