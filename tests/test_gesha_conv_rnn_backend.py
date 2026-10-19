import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))

from lib.KafeGESHA.layers import Conv2D, SimpleRNN
from lib.KafeNUMK import funciones as numk


def test_conv2d_known_forward():
    layer = Conv2D(1, [2, 2], "linear", [1, 3, 3], seed=1)
    layer.kernels.data = [[[[1.0, 0.0], [0.0, -1.0]]]]
    layer.bias.data = [0.0]
    result = layer.forward([[[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]]])
    assert result == [[[-4.0, -4.0], [-4.0, -4.0]]]


def test_conv2d_same_preserves_spatial_shape():
    layer = Conv2D(2, [3, 3], "relu", [1, 4, 5], padding="same", seed=2)
    output = layer.forward([[[1.0] * 5 for _ in range(4)]])
    assert numk.shape(output) == (2, 4, 5)


def test_conv2d_backward_kernel_gradient_matches_finite_difference():
    layer = Conv2D(1, [2, 2], "linear", [1, 3, 3], seed=3)
    image = [[[1.0, 2.0, 0.0], [0.0, 1.0, 3.0], [2.0, 0.0, 1.0]]]
    output = layer.forward(image)
    layer.backward(numk.ones(list(numk.shape(output))))
    analytic = layer.kernels.grad[0][0][0][0]
    original = layer.kernels.data[0][0][0][0]
    eps = 1e-6
    layer.kernels.data[0][0][0][0] = original + eps
    plus = sum(sum(row) for row in layer.forward(image)[0])
    layer.kernels.data[0][0][0][0] = original - eps
    minus = sum(sum(row) for row in layer.forward(image)[0])
    layer.kernels.data[0][0][0][0] = original
    assert analytic == pytest.approx((plus - minus) / (2 * eps), rel=1e-5)


def test_rnn_returns_last_state_or_sequence():
    sequence = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]
    last = SimpleRNN(4, input_shape=[3, 2], seed=4)
    full = SimpleRNN(4, input_shape=[3, 2], return_sequences=True, seed=4)
    assert numk.shape(last.forward(sequence)) == (4,)
    assert numk.shape(full.forward(sequence)) == (3, 4)
    assert last.forward(sequence) == pytest.approx(full.forward(sequence)[-1])


def test_rnn_backward_shapes_and_parameter_gradients():
    layer = SimpleRNN(3, input_shape=[4, 2], seed=5)
    layer.forward([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0], [0.5, 0.5]])
    dx = layer.backward([1.0, 1.0, 1.0])
    assert numk.shape(dx) == (4, 2)
    assert numk.shape(layer.w_input.grad) == (2, 3)
    assert numk.shape(layer.w_recurrent.grad) == (3, 3)
    assert numk.shape(layer.bias.grad) == (3,)


def test_rnn_input_gradient_matches_finite_difference():
    layer = SimpleRNN(2, input_shape=[2, 1], seed=6)
    sequence = [[0.25], [0.75]]
    layer.forward(sequence)
    analytic = layer.backward([1.0, 1.0])[0][0]
    eps = 1e-6
    plus = layer.forward([[0.25 + eps], [0.75]])
    minus = layer.forward([[0.25 - eps], [0.75]])
    numeric = (sum(plus) - sum(minus)) / (2 * eps)
    assert analytic == pytest.approx(numeric, rel=1e-5, abs=1e-6)


def test_layers_reject_invalid_shapes():
    with pytest.raises(ValueError, match="canales, alto, ancho"):
        Conv2D(1, [3, 3]).forward([[1.0, 2.0]])
    with pytest.raises(ValueError, match="timesteps, features"):
        SimpleRNN(2).forward([1.0, 2.0])
