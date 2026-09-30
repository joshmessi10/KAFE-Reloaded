"""Operaciones ND verificadas con resultados independientes de GESHA."""
import math
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from lib.KafeNUMK import funciones as numk


def test_tensor_is_a_validated_independent_list():
    source = [[[1, 2], [3, 4]]]
    result = numk.tensor(source)
    assert type(result) is list
    assert numk.shape(result) == (1, 2, 2)
    result[0][0][0] = 99
    assert source[0][0][0] == 1
    assert numk.tensor(2.0) == 2.0
    assert numk.tensor([]) == []


@pytest.mark.parametrize("data", [[[1], [2, 3]], [1, [2]], [[1, "x"]]])
def test_tensor_rejects_irregular_or_non_numeric_data(data):
    with pytest.raises(ValueError):
        numk.tensor(data)


@pytest.mark.parametrize("left,right,expected", [
    ([[1, 2]], [3, 4], [[4, 6]]),
    ([[1, 2], [3, 4]], [[10], [20]], [[11, 12], [23, 24]]),
    ([[[1, 2]], [[3, 4]]], [10, 20], [[[11, 22]], [[13, 24]]]),
    ([[[1], [2]]], [[10, 20, 30]], [[[11, 21, 31], [12, 22, 32]]]),
    (2, [[[1, 2]]], [[[3, 4]]]),
    ([], [1], []),
])
def test_broadcast_all_axes(left, right, expected):
    assert numk.broadcast_add(left, right) == expected


def test_broadcast_division_and_negative_axis():
    assert numk.broadcast_div([[2.0, 4.0], [6.0, 9.0]], [[2.0], [3.0]]) == [[1, 2], [2, 3]]
    assert numk.sum_axis([[[1, 2], [3, 4]]], -1) == [[3, 7]]
    assert numk.max_axis([[[1, 2], [3, 4]]], 1) == [[3, 4]]
    assert numk.emul([[[2, 3]]], [[[4, 5]]]) == [[[8, 15]]]
    assert numk.scalar_mul(2, [[[2, 3]]]) == [[[4, 6]]]


def test_reshape_nd_and_scalar():
    assert numk.reshape([[[1, 2]], [[3, 4]]], [2, 2]) == [[1, 2], [3, 4]]
    assert numk.reshape([3.0], []) == 3.0
    assert numk.reshape(3.0, [1, 1]) == [[3.0]]
    assert numk.reshape([], [0]) == []
    assert numk.zeros_nd([2, 0]) == [[], []]


@pytest.mark.parametrize("operation", [
    lambda: numk.broadcast_add([[1, 2]], [1, 2, 3]),
    lambda: numk.emul([1, 2], [3]),
    lambda: numk.map_elements(lambda x, y: x + y, [1, 2], [3]),
    lambda: numk.sum_axis([[1]], 2),
    lambda: numk.max_axis([[1]], -3),
    lambda: numk.zeros_nd([-1]),
    lambda: numk.random_tensor([1.5]),
    lambda: numk.reshape([1, 2], [3]),
])
def test_invalid_shapes_fail_instead_of_truncating(operation):
    with pytest.raises(ValueError):
        operation()


def test_exp_and_seeded_generation():
    result = numk.exp_tensor([[[0.0, 1.0, -1.0]]])
    assert result[0][0] == pytest.approx([1, math.e, 1 / math.e])
    assert numk.random_tensor([2, 3], -0.5, 0.5, 42) == numk.random_tensor([2, 3], -0.5, 0.5, 42)
    with pytest.raises(ZeroDivisionError):
        numk.broadcast_div([1.0], [0.0])
