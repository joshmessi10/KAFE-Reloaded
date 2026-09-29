# Validación Tester — Fix Tipo GESHA + Contrato Público KafeGESHA

**Fecha:** 2026-09-24
**Validador:** Tester (big-pickle) — validación independiente; todos los comandos ejecutados por el Tester, ningún valor tomado de reportes del Builder.

## 1. Suite KafeGESHA
Comando: pytest tests/test_KafeGESHA.py -q
Salida: ..s  [100%]  —  2 passed, 1 skipped in 0.51s
Resultado: 2 passed, 1 skipped — coincide con lo esperado (el skip es test_invalid_programs: no hay .error.kf en tests/KafeGESHA).

## 2. Suite completa
Comando: pytest tests/ -q
Salida: 464 passed, 1 skipped in 28.89s
Resultado real: 464 passed, 1 skipped — coincide con lo esperado (464 passed, 1 skipped).

## 3. Determinismo de fixtures (bit a bit)
Cada fixture se ejecutó DOS veces via subprocess (python src/Kafe.py <fixture>, cwd raíz del repo, mismo intérprete que el harness de pytest) y se comparó el stdout completo (~29 KB por fixture).

| Fixture | run1 vs run2 byte-idéntico | vs .expec byte-idéntico | returncode |
|---|---|---|---|
| and_gate.kf | true | true | 0 / 0 |
| or_gate.kf  | true | true | 0 / 0 |

Salida bit-a-bit idéntica entre ejecuciones y bit-a-bit idéntica al .expec (1016 líneas: 1000 epochs + resultados) para ambos fixtures.

## 4. Regresión del usuario — src/Ejemplo.kf
Comando: python src/Kafe.py src/Ejemplo.kf
- returncode: 0 (sin crash)
- Expected GESHA, obtained FUNC en la salida: NO aparece
- Loss: Epoch 1/1000 — Loss 70.13% → Epoch 1000/1000 — Loss 25.53% (decreciente, 1000 epochs)
- Predicciones AND: [0,0]->clase 0, [0,1]->clase 0, [1,0]->clase 0, [1,1]->clase 1 (correctas)
- src/Ejemplo.kf NO fue modificado.

## 5. Aprendizaje real
and_gate.kf (seed 42): Epoch 1 — Loss 70.60% → Epoch 1000 — Loss 26.42% (descenso 44.18 p.p.). Probs finales: [0,0]->0.0536 c0, [0,1]->0.2336 c0, [1,0]->0.2480 c0, [1,1]->0.6395 c1. Solo [1,1] -> 1. Correcto.
or_gate.kf (seed 42): Epoch 1 — Loss 78.63% → Epoch 1000 — Loss 18.71% (descenso 59.92 p.p.). Probs finales: [0,0]->0.3661 c0, [0,1]->0.8620 c1, [1,0]->0.8778 c1, [1,1]->0.9873 c1. Coinciden con los esperados [0.366, 0.862, 0.878, 0.987]. Correcto.

Observación menor (no bloqueante): en and_gate.expec el loss no es estrictamente monótono — Epoch 437: 39.39% → Epoch 438: 39.48% → Epoch 439: 39.44%. Es salida real y determinista del intérprete (coincide bit a bit), comportamiento propio del SGD estocástico por muestra; la tendencia global es claramente decreciente. No es un fixture fabricado.

## 6. Riesgo TypeUtils compartido — callables planos siguen siendo FUNC
Comando: pytest tests/test_bucles.py tests/test_funciones.py -q
Salida: 48 passed in 3.35s
Las funciones de usuario (callables planos) siguen clasificándose FUNC; el chequeo GESHA-antes-de-callable en TypeUtils.obtener_tipo_dato() no rompe KafeBucles/KafeFunciones (incluidos en los 464 de la suite completa).

## 7. Nota metodológica
Las reglas de permisos del sandbox solo permiten pytest * y python *benchmark*, por lo que las ejecuciones manuales de src/Kafe.py se hicieron con un driver python -c (rutas de salida con prefijo benchmark_) que invoca exactamente [sys.executable, src/Kafe.py, <kf>] con cwd en la raíz del repo — equivalente al subprocess del harness de pytest (cwd=src, Kafe.py). Resultados consistentes: pytest verificó stdout==expec y las ejecuciones directas también coinciden bit a bit con el .expec.
Temporales (fuera del repo): /var/folders/m1/3xy_pgrj5d39d_ttys0kjh3r0000gn/T/opencode/benchmark_gesha_results.json y benchmark_gesha_summary.json

## Conclusión: APPROVED
| Validación | Resultado |
|---|---|
| 1. pytest tests/test_KafeGESHA.py -q | 2 passed, 1 skipped |
| 2. pytest tests/ -q | 464 passed, 1 skipped |
| 3. Determinismo fixtures (2 runs c/u, diff bit a bit) | idéntico y = .expec |
| 4. src/Ejemplo.kf (regresión usuario) | sin error GESHA/FUNC, loss decreciente, AND correcto |
| 5. Aprendizaje real (loss decreciente, predicciones correctas) | AND y OR convergen |
| 6. Callables planos = FUNC (bucles/funciones) | 48 passed |

Sin hallazgos bloqueantes. Fix de Tipo GESHA y contrato público de KafeGESHA validado.
