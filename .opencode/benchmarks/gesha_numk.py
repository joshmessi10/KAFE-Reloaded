"""Ejecutar: python .opencode/benchmarks/gesha_numk.py (solo biblioteca estándar)."""
import contextlib
import io
import json
from pathlib import Path
import platform
import statistics
import sys
import time
import tracemalloc

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "src"))
from lib.KafeGESHA.layers import Dense
from lib.KafeGESHA.models import Sequential
from lib.KafeNUMK import funciones as numk


def measure(name, samples, features, classes, batch_size):
    x = numk.random_tensor([samples, features], -1.0, 1.0, 42)
    y = numk.zeros_nd([samples, classes])
    for i, row in enumerate(y):
        row[i % classes] = 1.0
    timings, peaks = [], []
    for _ in range(3):
        model = Sequential([Dense(classes, "softmax", seed=42)])
        model.compile("adam", "categorical_crossentropy")
        tracemalloc.start()
        start = time.perf_counter()
        with contextlib.redirect_stdout(io.StringIO()):
            model.fit(x, y, epochs=2, batch_size=batch_size)
        timings.append(time.perf_counter() - start)
        peaks.append(tracemalloc.get_traced_memory()[1])
        tracemalloc.stop()
        predictions = model.predict(x)
        assert all(abs(sum(row) - 1.0) < 1e-10 for row in predictions)
    return dict(scenario=name, samples=samples, features=features, classes=classes,
                batch_size=batch_size, seconds_median=round(statistics.median(timings), 6),
                peak_kib=round(max(peaks) / 1024, 2))


if __name__ == "__main__":
    scenarios = [("small", 32, 3, 3, 8), ("medium", 128, 8, 4, 16),
                 ("single_sample_feature", 1, 1, 2, 8),
                 ("multiclass", 64, 12, 5, 16), ("stress", 1024, 16, 8, 32)]
    print(json.dumps(dict(python=platform.python_version(), platform=platform.platform())))
    for scenario in scenarios:
        print(json.dumps(measure(*scenario)), flush=True)
