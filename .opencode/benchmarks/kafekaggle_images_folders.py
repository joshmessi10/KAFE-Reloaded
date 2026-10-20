# Benchmark local de la API de imagenes por carpetas de KafeKAGGLE.
# Mide tiempo y pico de memoria de load_image_folder_dataset sobre el dataset
# REAL CIFAR-10 (ayush1220/cifar10) presente en la cache de kagglehub.
# No toca la red ni instala paquetes: _download_dataset se sustituye por la
# raiz cacheada y _require_image_dependencies por (PIL.Image, None).
# Uso: python .opencode/benchmarks/kafekaggle_images_folders.py
import os
import platform
import statistics
import sys
import time
import tracemalloc
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[2] / 'src'))

from lib.KafeKaggle import funciones as kg

try:
    from PIL import Image
except ImportError:
    print('[ERROR] Pillow (PIL) no esta instalado.')
    raise SystemExit(1)

SALIDA = Path(__file__).with_name('kafekaggle_folders_results.md')
CACHE = (
    Path(os.path.expanduser('~'))
    / '.cache'
    / 'kagglehub'
    / 'datasets'
    / 'ayush1220'
    / 'cifar10'
)


def raiz_dataset():
    if not CACHE.is_dir():
        return None
    for version in sorted(CACHE.glob('versions/*')):
        for candidato in version.rglob('cifar10'):
            if (candidato / 'train').is_dir():
                return candidato
    return None


def medir_tiempo(action, repeats=5):
    tiempos = []
    for _ in range(repeats):
        inicio = time.perf_counter()
        action()
        tiempos.append(time.perf_counter() - inicio)
    return statistics.median(tiempos)


def medir_memoria(action):
    tracemalloc.start()
    action()
    pico = tracemalloc.get_traced_memory()[1]
    tracemalloc.stop()
    return pico


def main():
    raiz = raiz_dataset()
    if raiz is None:
        print('[SKIP] Cache de CIFAR-10 no disponible en', CACHE)
        raise SystemExit(2)

    kg._KAGGLEHUB_AVAILABLE = True
    kg._require_kagglehub = lambda: None
    kg._require_image_dependencies = lambda: (Image, None)
    kg._download_dataset = lambda name: str(raiz)

    entorno = (
        f'Python {platform.python_version()} | {platform.platform()} | '
        f'Pillow {Image.__version__} | CPUs {os.cpu_count()}'
    )
    print(entorno)
    print()

    # Calentamiento: evita medir el import perezoso de ImageDataset.
    kg.load_image_folder_dataset('ayush1220/cifar10', 32, 32, 'rgb', 1, 'train')

    escenarios = [
        ('S1 train rgb 32x32 limit=100', 32, 32, 'rgb', 100, 'train'),
        ('S2 train rgb 32x32 limit=500', 32, 32, 'rgb', 500, 'train'),
        ('S3 test rgb 32x32 limit=100', 32, 32, 'rgb', 100, 'test'),
        ('S4 train gray 32x32 limit=100', 32, 32, 'gray', 100, 'train'),
        ('S5 todas rgb 8x8 limit=200', 8, 8, 'rgb', 200, ''),
    ]

    lineas = [
        '| Escenario | N | Canales | Tiempo mediana (ms, 5 reps) | Pico memoria (MB) | img/s |',
        '|---|---:|---:|---:|---:|---:|',
    ]
    filas = []
    for nombre, alto, ancho, modo, limite, split in escenarios:

        def accion():
            return kg.load_image_folder_dataset(
                'ayush1220/cifar10', alto, ancho, modo, limite, split
            )

        segundos = medir_tiempo(accion)
        pico = medir_memoria(accion)
        ms = segundos * 1000.0
        mb = pico / (1024 * 1024)
        ips = limite / segundos if segundos > 0 else 0.0
        canales = 3 if modo == 'rgb' else 1
        fila = (
            f'| {nombre} | {limite} | {canales} | {ms:.3f} | '
            f'{mb:.3f} | {ips:.1f} |'
        )
        print(fila)
        filas.append(fila)

    nota = ('Metodología: tiempo = mediana de 5 repeticiones con time.perf_counter '
            'sin instrumentación; memoria = pico de tracemalloc en una pasada '
            'separada. El tiempo incluye el descubrimiento de archivos y el '
            'filtrado por split en cada llamada.')
    contenido = '\n'.join([entorno, '', *lineas, *filas, '', nota, ''])
    SALIDA.write_text(contenido, encoding='utf-8')
    print()
    print('Resultados escritos en', SALIDA)


if __name__ == '__main__':
    main()
