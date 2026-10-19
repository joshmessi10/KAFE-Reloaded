Python 3.13.11 | Windows-11-10.0.26200-SP0 | Pillow 12.3.0 | CPUs 12

| Escenario | N | Canales | Tiempo mediana (ms, 5 reps) | Pico memoria (MB) | img/s |
|---|---:|---:|---:|---:|---:|
| S1 train rgb 32x32 limit=100 | 100 | 3 | 1243.858 | 14.054 | 80.4 |
| S2 train rgb 32x32 limit=500 | 500 | 3 | 1697.118 | 54.072 | 294.6 |
| S3 test rgb 32x32 limit=100 | 100 | 3 | 1225.172 | 14.035 | 81.6 |
| S4 train gray 32x32 limit=100 | 100 | 1 | 1306.790 | 9.123 | 76.5 |
| S5 todas rgb 8x8 limit=200 | 200 | 3 | 1391.668 | 10.149 | 143.7 |

Metodología: tiempo = mediana de 5 repeticiones con time.perf_counter sin instrumentación; memoria = pico de tracemalloc en una pasada separada. El tiempo incluye el descubrimiento de archivos y el filtrado por split en cada llamada.
