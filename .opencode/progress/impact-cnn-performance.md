# Impact Analysis (reconstrucción) — GESHA/NUMK: optimización del entrenamiento de CNN

> Nota: este archivo se reconstruyó el 2026-10-17 durante la sesión de validación RNN. El impact analysis original se ejecutó en la sesión 2026-10-17 (ADR-0020) pero su archivo no llegó a escribirse. Se documenta aquí a partir de la entrada de history `.opencode/history/2026/2026-10.md` (sección "Optimización del entrenamiento de CNN en GESHA/NUMK") y del ADR-0020.

## Feature

Reducir el coste de entrenamiento de la CNN de `src/Ejemplo.kf` (Conv2D→MaxPool→Conv2D→GAP→Dense; 4000 imágenes × 5 épocas; ≈2 h 19 min) eliminando trabajo redundante, con requisito duro de resultados bit-idénticos (mismo orden de acumulación en coma flotante).

## Módulos afectados

- `src/lib/KafeNUMK/funciones.py` — F1 (forma del backward calculada aritméticamente, `expected` como tupla) y F5 (hoisting de filas/kernels, `kx_start`/`kx_end`).
- `src/lib/KafeGESHA/models.py` — F2 (`batch_parameters` deduplicado tras el primer forward) y F3 (acumulación in-place `_acumular_en`).
- `src/lib/KafeGESHA/optimizers/adam.py` — F4 (helper `_adam_actualizar` con una sola pasada y correcciones de sesgo precalculadas).

## Riesgos

- Regresión numérica por cambio de orden de acumulación → descartado con verificación bit-idéntica (288/288 combinaciones, igualdad exacta sin tolerancias).
- Padding con ceros con signo negativo → pre-padding descartado deliberadamente.
- F6 (one-hot en SparseCategoricalCrossEntropy) descartado: <0.01 % de impacto frente a riesgo en API compartida de pérdidas.

## Plan de verificación

1. Equivalencia naive vs optimizada (forward y backward) sobre shapes reales de Ejemplo.kf.
2. Contratos de error preservados (9/9).
3. Suite completa `pytest tests/ -q` sin regresiones.
4. Benchmark de 5 escenarios con mediana de 5 repeticiones.

## Resultado

Implementado y validado el 2026-10-17: 288/288 bit-idénticas, 9/9 contratos, suite 645 passed / 2 skipped, benchmark en `.opencode/benchmarks/gesha_cnn_optimization_results.md`. Decisión: ADR-0020.
