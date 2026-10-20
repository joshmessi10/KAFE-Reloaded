# Benchmark offline de la API de imagenes de KafeKAGGLE.
# Mide tiempo y pico de memoria de load_images / load_image_dataset SIN tocar
# la red ni instalar paquetes: _download_dataset se sustituye por un
# directorio temporal con PNG sinteticos (Pillow) y _require_image_dependencies
# por un doble que devuelve (PIL.Image, None) para no requerir py7zr.
# Uso: python .opencode/benchmarks/kafekaggle_images.py
import csv
import os
import platform
import statistics
import sys
import tempfile
import time
import tracemalloc
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[2] / 'src'))

from lib.KafeKaggle import funciones as kg

try:
    from PIL import Image
except ImportError:
    print('[ERROR] Pillow (PIL) no esta instalado.')
    print('Este benchmark NO instala dependencias. Instala Pillow manualmente')
    print('(pip install Pillow) y vuelve a ejecutar el script.')
    raise SystemExit(1)


def generar_imagenes(directory, n, size=32):
    for i in range(n):
        color = ((i * 37) % 256, (i * 91) % 256, (i * 17) % 256)
        Image.new('RGB', (size, size), color).save(
            os.path.join(directory, f'{i:04d}.png')
        )


def escribir_etiquetas(path, n):
    with open(path, 'w', newline='', encoding='utf-8') as handle:
        writer = csv.writer(handle)
        writer.writerow(['id', 'label'])
        for i in range(n):
            writer.writerow([f'{i:04d}', 'cat' if i % 2 == 0 else 'dog'])


def fake_download(directory):
    def _download(dataset_name):
        return directory
    return _download


def medir(action, repeats=3):
    tiempos, picos = [], []
    for _ in range(repeats):
        tracemalloc.start()
        inicio = time.perf_counter()
        action()
        tiempos.append(time.perf_counter() - inicio)
        picos.append(tracemalloc.get_traced_memory()[1])
        tracemalloc.stop()
    return statistics.median(tiempos), max(picos)


def escenario(nombre, directory, n, canales, action):
    original = kg._download_dataset
    kg._download_dataset = fake_download(directory)
    try:
        segundos, pico = medir(action)
    finally:
        kg._download_dataset = original
    ms = segundos * 1000.0
    mb = pico / (1024 * 1024)
    print(f'| {nombre} | {n} | {canales} | {ms:.3f} | {mb:.3f} |')


def main():
    print(
        f'Python {platform.python_version()} | {platform.platform()} | '
        f'Pillow {Image.__version__} | CPUs {os.cpu_count()}'
    )
    print()
    print('| Escenario | N | Canales | Tiempo (ms) | Pico (MB) |')
    print('|---|---:|---:|---:|---:|')

    kg._KAGGLEHUB_AVAILABLE = True
    kg._require_kagglehub = lambda: None
    kg._require_image_dependencies = lambda: (Image, None)

    with tempfile.TemporaryDirectory(prefix='kafe_img_bench_') as tmp:
        def preparar(nombre, n, con_etiquetas=False):
            d = os.path.join(tmp, nombre)
            os.makedirs(d, exist_ok=True)
            generar_imagenes(d, n)
            if con_etiquetas:
                escribir_etiquetas(os.path.join(d, 'labels.csv'), n)
            return d

        # Calentamiento: evita medir el import perezoso de ImageDataset.
        caliente = preparar('warmup', 1, con_etiquetas=True)
        kg._download_dataset = fake_download(caliente)
        kg.load_images('local/warmup', 32, 32, 'rgb', 0)
        kg.load_image_dataset('local/warmup', 'labels.csv', 32, 32, 'rgb', 0)

        d8 = preparar('rgb8', 8)
        d64 = preparar('rgb64', 64)
        d256 = preparar('rgb256', 256)
        dgray = preparar('gray256', 256)
        dds = preparar('ds256', 256, con_etiquetas=True)

        escenario('load_images rgb N=8', d8, 8, 3,
                  lambda: kg.load_images('local/rgb8', 32, 32, 'rgb', 0))
        escenario('load_images rgb N=64', d64, 64, 3,
                  lambda: kg.load_images('local/rgb64', 32, 32, 'rgb', 0))
        escenario('load_images rgb N=256', d256, 256, 3,
                  lambda: kg.load_images('local/rgb256', 32, 32, 'rgb', 0))
        escenario('load_images gray N=256', dgray, 256, 1,
                  lambda: kg.load_images('local/gray256', 32, 32, 'gray', 0))
        escenario('load_image_dataset N=256 (rgb)', dds, 256, 3,
                  lambda: kg.load_image_dataset(
                      'local/ds256', 'labels.csv', 32, 32, 'rgb', 0))


if __name__ == '__main__':
    main()
