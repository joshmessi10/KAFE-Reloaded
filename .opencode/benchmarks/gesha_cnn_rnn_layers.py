"""Cinco escenarios representativos de las capas CNN/RNN avanzadas."""
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[2] / "src"))
from lib.KafeGESHA.layers import (
    Conv1D, DepthwiseConv2D, Conv2DTranspose, LSTM, GRU,
)
from lib.KafeNUMK import funciones as numk


def measure(action):
    start = time.perf_counter()
    action()
    return time.perf_counter() - start


def run_layer(layer, value):
    output = layer.forward(value)
    layer.backward(numk.ones(list(numk.shape(output))))


if __name__ == "__main__":
    cases = [
        ("Conv1D C4 L128 F8 K3", lambda: run_layer(Conv1D(8, 3, input_shape=[4, 128], seed=1), numk.ones([4, 128]))),
        ("Depthwise C8 32x32 K3", lambda: run_layer(DepthwiseConv2D([3, 3], 1, input_shape=[8, 32, 32], seed=1), numk.ones([8, 32, 32]))),
        ("Conv2DTranspose C4 16x16 F8", lambda: run_layer(Conv2DTranspose(8, [3, 3], input_shape=[4, 16, 16], seed=1), numk.ones([4, 16, 16]))),
        ("LSTM T40 F8 U16", lambda: run_layer(LSTM(16, [40, 8], seed=1), numk.ones([40, 8]))),
        ("GRU T40 F8 U16", lambda: run_layer(GRU(16, [40, 8], seed=1), numk.ones([40, 8]))),
    ]
    for name, action in cases:
        print(name, f"{measure(action):.6f}s")
