"""Benchmark reproducible de KafeKAGGLE (parseo CSV sin red).

El paso de descarga se sustituye por un archivo o directorio local
preparado, de modo que el benchmark mide la parte determinista de la
librería: selección de archivo (directorio con subdirectorios), parseo CSV
y construcción de PARDOS/matriz.
"""
import csv
import os
import statistics
import sys
import tempfile
import time
import tracemalloc
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[2] / "src"))
from lib.KafeKaggle import funciones as kg


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


def write_csv(path, rows, cols, seed=1):
    with open(path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow([f"c{i}" for i in range(cols)])
        for r in range(rows):
            writer.writerow([
                round(((r * (i + 1) * seed) % 97) / 7.0 + i, 4)
                for i in range(cols)
            ])


def fake_download(source):
    def _download(dataset_name):
        return source
    return _download


def run(name, source, action):
    original = kg._download_dataset
    kg._download_dataset = fake_download(source)
    try:
        seconds, peak = measure(action)
    finally:
        kg._download_dataset = original
    print(f"| {name} | {seconds:.6f} s | {peak:.2f} KiB |")


def main():
    with tempfile.TemporaryDirectory(prefix="kafe_bench_") as tmp:
        small = os.path.join(tmp, "small.csv")
        medium = os.path.join(tmp, "medium.csv")
        large = os.path.join(tmp, "large.csv")
        empty = os.path.join(tmp, "empty.csv")
        nested = os.path.join(tmp, "nested_ds")
        os.makedirs(os.path.join(nested, "data"))

        write_csv(small, 50, 4)
        write_csv(medium, 1000, 8)
        write_csv(large, 10000, 10)
        with open(empty, "w", encoding="utf-8") as handle:
            handle.write("a,b\n")
        write_csv(os.path.join(nested, "data", "train.csv"), 500, 6)

        kg._KAGGLEHUB_AVAILABLE = True

        # Calentamiento: la primera llamada importa KafePARDOS de forma perezosa,
        # lo que inflaría el pico de memoria de S1.
        kg._download_dataset = fake_download(small)
        kg.load_dataset("local/warmup")

        run("S1 small: 50x4 load_dataset (PARDOS)", small,
            lambda: kg.load_dataset("local/small"))
        run("S2 medium: 1000x8 load_dataset (PARDOS)", medium,
            lambda: kg.load_dataset("local/medium"))
        run("S3 large: 10000x10 load_dataset_matrix (todas)", large,
            lambda: kg.load_dataset_matrix("local/large"))
        run("S4 large: 10000x10 load_dataset_matrix limit=100", large,
            lambda: kg.load_dataset_matrix(
                "local/large", ["c0", "c1", "c2"], "", 100
            ))
        run("S5 dir: 500x6 selector data/train.csv (PARDOS)", nested,
            lambda: kg.load_dataset("local/nested", "data/train.csv"))
        run("S6 edge: CSV vacío load_dataset", empty,
            lambda: kg.load_dataset("local/empty"))


if __name__ == "__main__":
    main()
