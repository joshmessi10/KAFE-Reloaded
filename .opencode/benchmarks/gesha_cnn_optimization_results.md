# Benchmark: optimización de conv2d y del entrenamiento de la CNN (GESHA/NUMK)

- Fecha: 2026-10-17
- Python: 3.13.11 | Windows-11-10.0.26200-SP0
- Script: `.opencode/benchmarks/gesha_cnn_optimization.py`
- Metodología: tiempo = mediana de 5 repeticiones con `time.perf_counter`  SIN `tracemalloc` activo; memoria = pico de `tracemalloc` en una pasada separada (nunca junto al cronómetro). Datos sintéticos deterministas con `random.Random(1234)` y floats `round(uniform(-1,1),12)`. Ejecución aislada, sin nada más en paralelo.

## Resultados

| Escenario | Antes (ms) | Después (ms) | Mejora | Memoria pico (MB) |
|---|---:|---:|---:|---:|
| S1 forward conv1 [3,32,32] -> [8,32,32] same | 45.123 | 28.993 | 1.56x | 0.260 |
| S2 backward conv1 (incluye su forward interno) | 114.703 | 49.369 | 2.32x | 0.109 |
| S3 forward conv2 [8,16,16] -> [16,16,16] same | 57.459 | 39.261 | 1.46x | 0.136 |
| S4 backward conv2 (incluye su forward interno) | 145.268 | 63.295 | 2.30x | 0.137 |
| S5 fit end-to-end (ms/muestra, 64 muestras) | 521.949 | 384.789 | 1.36x | 1.777 |

S1-S4: `Antes` = implementación naive original (copia literal de `conv2d_chw`/`conv2d_chw_backward` previa a la optimización); `Después` = versión actual de `src/lib/KafeNUMK/funciones.py`. S5: `Antes` = baseline registrado de 521.949 ms/muestra (medido en esta misma máquina antes de la optimización, con datos sintéticos idénticos); `Después` = medición actual de `fit(X, y, epochs=1, batch_size=16)` con 64 muestras. `Memoria pico` = pico de tracemalloc de la versión `Después` en su pasada separada.

## Interpretación

- **F1 — forward redundante eliminado**: `conv_backward_naive` ejecutaba una convolución forward completa (`conv_naive`) dentro del backward solo para calcular `expected`; la versión actual deriva esa forma directamente de las dimensiones de entrada/kernels, por lo que S2/S4 dejan de pagar un forward extra por cada backward.
- **F5 — hoisting y rango `kx` sin comprobaciones por iteración**: las referencias anidadas (`kernels[f]`, `output[f][oy]`, `input_data[c]`, filas, etc.) se cachean una vez por nivel de bucle y los límites `kx_start`/`kx_end` se precalculan por celda de salida, eliminando las comprobaciones de borde `0 <= ix < width` en cada iteración interna.
- **F2 — `batch_parameters` una vez por `fit`**: la lista de parámetros deduplicada se resuelve tras el primer forward (construcción lazy) y se reutiliza en todos los minibatches en lugar de reconstruirse por muestra.
- **F3 — acumulación in-place**: los gradientes del minibatch se suman sobre el tensor acumulado (`_acumular_en`) sin crear un tensor nuevo por muestra.
- **F4 — Adam en una pasada con correcciones precomputadas**: `step` calcula `1 - beta1**t` y `1 - beta2**t` una sola vez y una única pasada recursiva actualiza momentos y parámetros in-place, en vez de pasadas separadas con correcciones recalculadas por elemento.
- **F6 descartado (one-hot de la loss)**: evitar la reconstrucción del one-hot en `SparseCategoricalCrossEntropy` cuesta O(clases)=10 por muestra, una fracción despreciable (<0.01%) frente a las ≥221k operaciones de conv1 por muestra; eliminarlo exige cambiar la API compartida de `LossFunction.compute/derivative` (usada por todas las pérdidas y sus fixtures) con el riesgo de alterar el orden de acumulación en coma flotante que el requisito duro exige preservar. F1-F5 atacan el camino caliente; F6 no.

## Equivalencia bit-idéntica

El resultado es **bit-idéntico**: **288/288 casos verificados** con igualdad exacta `==` de floats (sin tolerancias) en `.opencode/benchmarks/conv_equiv_results.md` — forward `output` y backward `dx`, `dw`, `db` de la versión naive contra la versión optimizada.

## Limitación

Implementación en **Python puro sobre listas anidadas, sin dependencias externas** (sin numpy/scipy; política de dependencias del proyecto). Los valores absolutos dependen de la CPU y de la carga de la máquina; las comparaciones antes/después se miden en la misma sesión y máquina.

## Proyección del ejemplo real (`src/Ejemplo.kf`: 4000 imágenes × 5 épocas = 16000 muestras)

| | ms/muestra | Total 16000 muestras |
|---|---:|---:|
| Antes | 521.949 | 8,351,184 ms = 8,351.2 s = 2.32 h |
| Después | 384.789 | 6,156,624 ms = 6,156.6 s = 1.71 h |

Aceleración proyectada del ejemplo completo: 1.36x.
