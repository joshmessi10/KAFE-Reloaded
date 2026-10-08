"""Benchmarks reproducibles para Conv2D y SimpleRNN."""
import statistics
import sys
import time
import tracemalloc
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[2] / "src"))
from lib.KafeGESHA.layers import Conv2D, SimpleRNN
from lib.KafeNUMK import funciones as numk


def measure(action, repeats=3):
    times, peaks = [], []
    for _ in range(repeats):
        tracemalloc.start()
        start = time.perf_counter()
        action()
        times.append(time.perf_counter() - start)
        peaks.append(tracemalloc.get_traced_memory()[1] / 1024)
        tracemalloc.stop()
    return statistics.median(times), max(peaks)


def conv_case(channels, height, width, filters, kernel):
    image = numk.ones([channels, height, width])
    layer = Conv2D(filters, [kernel, kernel], "relu", [channels, height, width], seed=1)
    def action():
        output = layer.forward(image)
        layer.backward(numk.ones(list(numk.shape(output))))
    return measure(action)


def rnn_case(timesteps, features, units):
    sequence = numk.ones([timesteps, features])
    layer = SimpleRNN(units, input_shape=[timesteps, features], seed=1)
    def action():
        layer.forward(sequence)
        layer.backward(numk.ones([units]))
    return measure(action)


if __name__ == "__main__":
    conv_cases = [(1, 8, 8, 2, 3), (1, 16, 16, 4, 3), (3, 16, 16, 4, 3),
                  (3, 24, 24, 8, 3), (3, 32, 32, 8, 5)]
    rnn_cases = [(5, 2, 4), (10, 4, 8), (20, 8, 16), (40, 8, 16), (60, 16, 32)]
    for case in conv_cases:
        elapsed, peak = conv_case(*case)
        print("Conv2D", case, f"{elapsed:.6f}s", f"{peak:.2f}KiB")
    for case in rnn_cases:
        elapsed, peak = rnn_case(*case)
        print("SimpleRNN", case, f"{elapsed:.6f}s", f"{peak:.2f}KiB")
