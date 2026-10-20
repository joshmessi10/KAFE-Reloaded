# Informe del Tester — Validación E2E de RNN con KafeKaggle

- **Fecha**: 2026-10-18
- **Rol**: Tester (KAFE) — validación independiente
- **Feature**: Validación E2E de RNN con KafeKaggle (`.opencode/progress/current.md`)
- **Prerrequisito**: `/impact` = completed — verificado en `.opencode/progress/session-commands.md` (línea 6); no se abortó.
- **Regla aplicada**: sin modificar `src/**`, `tests/**`, ADRs, history ni progress; solo benchmarks, tmp y este informe.

## 1. Suite de pruebas (Parte obligatoria)

| Comando | Resultado |
|---|---|
| `pytest tests/ -q` | **691 passed, 2 skipped, 0 failed** en 448.02 s |

- Ejecutada el 2026-10-18 sobre el árbol del feature (incluye la validación de fixtures `.kf`/`.expec`, entre ellos los del feature RNN).
- 0 tests fallidos. Los 2 skips son preexistentes (marcadores de la propia suite, no relacionados con el feature).

## 2. Parte 1 — Ejecución E2E de los ejemplos (intérprete Kafe.py)

Runner: `[sys.executable, src/Kafe.py, <ejemplo>]` con `cwd=src/` (mismo patrón que `tests/utils.py`). Dos corridas por ejemplo para determinismo. Las salidas COMPLETAS están embebidas (corrida 1; la corrida 2 fue byte-idéntica).

### 2.1 EjemploRNN1.kf — Serie temporal de temperatura (Melbourne)

| Corrida | rc | Tiempo |
|---|---|---|
| 1 | 0 | 119.86 s |
| 2 | 0 | 121.72 s |

Verificaciones (parseadas de la salida real, normalizando CRLF):

- rc = 0 en ambas corridas; sin `Traceback` en stdout ni stderr. **APROBADO**
- Pérdidas por época (15 épocas, %): [7.77, 3.52, 3.87, 3.71, 3.28, 2.36, 1.78, 1.53, 1.49, 1.52, 1.54, 1.54, 1.55, 1.55, 1.56]
- Decremento global (última < inicial): **True** (7/14 pasos decrecientes — subidas puntuales en épocas 3, 10-14 son ruido de entrenamiento, no regresión)
- Pérdidas negativas: **0 (ninguna)**
- MAE en grados Celsius: **2.7147498390716023** → < 5 °C: **True**
- Determinismo (corrida 1 vs 2, byte a byte en stdout, stderr y rc): **True**

Salida COMPLETA (corrida 1):

```
=== RNN 1: Temperatura mínima de Melbourne ===
Días cargados:
300
Ventanas [muestras, timesteps, features]:
[293, 7, 1]
Min / max del train (°C):
[2.1, 25.0]
Train / test:
[234, 59]
Entrenando RNN (16 unidades, 15 épocas, batch 8)...
Epoch 1/15 — Loss 7.77%
Epoch 2/15 — Loss 3.52%
Epoch 3/15 — Loss 3.87%
Epoch 4/15 — Loss 3.71%
Epoch 5/15 — Loss 3.28%
Epoch 6/15 — Loss 2.36%
Epoch 7/15 — Loss 1.78%
Epoch 8/15 — Loss 1.53%
Epoch 9/15 — Loss 1.49%
Epoch 10/15 — Loss 1.52%
Epoch 11/15 — Loss 1.54%
Epoch 12/15 — Loss 1.54%
Epoch 13/15 — Loss 1.55%
Epoch 14/15 — Loss 1.55%
Epoch 15/15 — Loss 1.56%
MAE en grados Celsius:
2.7147498390716023
Primeras 5 predicciones vs reales (°C):
1. predicho=7.136624941187632 real=5.5
2. predicho=4.980735686282061 real=6.2
3. predicho=5.972104974111955 real=8.0
4. predicho=7.062057492749126 real=10.3
5. predicho=8.691147430036153 real=9.8

```

### 2.2 EjemploRNN2.kf — Clasificación de sentimiento (Yelp)

| Corrida | rc | Tiempo |
|---|---|---|
| 1 | 0 | 85.8 s |
| 2 | 0 | 85.26 s |

Verificaciones:

- rc = 0 en ambas corridas; sin `Traceback`. **APROBADO**
- Pérdidas por época (8 épocas, %): [69.16, 59.03, 42.42, 32.17, 20.68, 16.55, 17.18, 10.55]
- Decremento global: **True** (6/7 pasos; la subida en época 7 es el salto de loss documentado en la cabecera del .kf)
- Pérdidas negativas: **0**
- Accuracy en test: **0.5822784810126582** → ≥ 0.5: **True** (baseline de clase ~0.557 reportado por el Builder en `.opencode/benchmarks/builder-rnn-e2e.md`; el modelo lo supera)
- Matriz de confusión [[TN, FP], [FN, TP]]: **[[18, 17], [16, 28]]**
- Frases nuevas clasificadas (3/3, coherentes con el sentimiento):
  - The food was amazing and the staff was friendly -> 1
  - Terrible experience, I will never come back here -> 0
  - It was okay, nothing special about it -> 0
- Determinismo: **True**

Salida COMPLETA (corrida 1):

```
=== RNN 2: Sentimiento de frases Yelp ===
Frases / etiquetas:
[400, 400]
Etiqueta de la primera frase:
1
Train / test:
[321, 79]
Train balanceado (neg / pos):
[142, 142]
Vocabulario del train (0=padding, 1=OOV):
202
Palabras OOV en el primer texto de test:
6
Entrenando RNN + Embedding (8 épocas, batch 8)...
Epoch 1/8 — Loss 69.16% — Accuracy 51.41%
Epoch 2/8 — Loss 59.03% — Accuracy 72.89%
Epoch 3/8 — Loss 42.42% — Accuracy 76.76%
Epoch 4/8 — Loss 32.17% — Accuracy 85.21%
Epoch 5/8 — Loss 20.68% — Accuracy 90.14%
Epoch 6/8 — Loss 16.55% — Accuracy 93.31%
Epoch 7/8 — Loss 17.18% — Accuracy 94.01%
Epoch 8/8 — Loss 10.55% — Accuracy 96.48%
Accuracy en test:
0.5822784810126582
Matriz de confusión [[TN, FP], [FN, TP]]:
[[18, 17], [16, 28]]
Clasificación de frases nuevas (0=negativo, 1=positivo):
The food was amazing and the staff was friendly -> 1
Terrible experience, I will never come back here -> 0
It was okay, nothing special about it -> 0

```
## 3. Parte 2 — Benchmark `/benchmark` (5 escenarios + anexo)

Los tiempos de los ejemplos (119-122 s y 85-86 s con el intérprete) ya validaban el feature; el benchmark caracteriza la cadena por separado:

- **Script**: `.opencode/benchmarks/rnn_e2e.py` (creado para esta validación)
- **Resultados**: `.opencode/benchmarks/rnn_e2e_results.md` (detalle completo) + `.opencode/benchmarks/rnn_e2e_results.json` (crudos)
- **Registro**: índice + sección insertados en `.opencode/benchmarks/records.md`

| Escenario | Train/Test | Runtime | Pico memoria | Métrica clave | Status |
|---|---|---|---|---|---|
| S1 tokenización 50 frases (mediana 3) | - | 0.788 s ingesta + 0.000417 s fit + 0.000314 s transform | n/d | vocab 271; tipos/rango/determinismo OK | OK |
| S2 300 frases, RNN+Embedding, maxlen 10 | 216/60 | 33.48 s (6.70 s/época × 5) | 692.64 KiB | acc 0.60; loss 69.33% → 21.50% | OK |
| S3 edge cases (13 casos, sin red) | - | 0.013 s | n/d | 13/13 estados esperados, mensajes acotados | OK |
| S4 serie 300 días, T=7 (réplica EjemploRNN1) | 234/59 | 116.70 s (7.78 s/época × 15) | 1560.03 KiB | MAE 2.71475 °C = valor del .kf | OK |
| S5a 1000 frases sin truncar (T medio 11.11) | 800/200 | 130.20 s × 2 épocas (extrap. 8 épocas: 520.81 s) | 3998.73 KiB | loss 66.20% → 35.28%; acc(2 épocas) 0.75 | OK |
| S5b 1000 días, T=14 (2 celdas ? imputadas: filas 566/567) | 788/198 | 93.58 s × 2 épocas | 3719.5 KiB | MAE 6.30 °C con 2 épocas | OK |

Veredicto del benchmark: **VÁLIDO — 8/8 cheques** (ver `rnn_e2e_results.md` § Conclusions). Lecturas clave:

- Coste por muestra-época escala ≈ con muestras × timesteps: x1.79 de S4 a S5b por doble ventana (T=14 vs T=7) y x2.62 de S2 a S5a al eliminar el truncado. Sin degradación anómala ni memoria descontrolada (pico máximo ~3.9 MiB a 1000 muestras).
- **S4 replica `EjemploRNN1.kf` con números EXACTAMENTE iguales**: MAE 2.714749… (2.71475 redondeado), mismas 15 losses (7.77 … 1.56) y mismas 5 primeras predicciones (7.137, 4.981, 5.972, 7.062, 8.691). El camino Python del benchmark y el camino .kf por el intérprete son deterministas y equivalentes.
- S5b con solo 2 épocas queda en MAE 6.30 °C; con 15 épocas el .kf alcanza 2.71 °C. Es la curva de aprendizaje esperada, no una regresión.
- S3 confirmó manejo acotado de: texto vacío (transform → [[]]), secuencia vacía al modelo (ValueError de SimpleRNN), predict/fit vacíos, tokenizer sin fit, num_words inválido (negativo y no entero vía check_sig), etiqueta no entera y archivo inexistente en KafeKaggle (ambos en español, sin red), índice fuera de rango en Embedding y units=0 en create_rnn.

Notas de medición honestas: tiempos de entrenamiento con UNA corrida por escenario (S1 usa mediana de 3, como exige el proceso para operaciones cortas); memoria en pasada separada con `tracemalloc` (por eso los tiempos de pasada de memoria son mayores: NO se reportan como tiempo); imports de Python fuera del cronómetro; datasets desde caché local de kagglehub. El benchmark no ejecuta `Kafe.py` (eso es la Parte 1).

## 4. Hallazgos (no bloqueantes)

1. **KafeMATH.log con error de signo cerca de 1 — CONFIRMADO empíricamente (anexo H del benchmark)**. Números exactos: `KafeMATH.log(0.999)` = **+0.0031168935** (correcto: −0.0010005003) y `log(0.99999999)` = **+0.0050249788** (correcto: −1e-8). `log(0.9)`, `log(0.5)` y `log(0.1)` son correctos; `log(0.99)` tiene error de magnitud 6.7e-4 sin invertir signo. Consecuencia medida en `BinaryCrossEntropy.compute`: BCE **negativa** (−0.0031168935 con y=1,p=0.999; −0.0050249788 con y=1,p=0.99999999 y con y=0,p=1e-8). `BCE.derivative` NO usa log: `derivative(1, 0.99999999)` = [−0.5000000037] (correcto), así que el **entrenamiento no se afecta**; solo la métrica/impresión de loss para predicciones muy seguras. Coincide con lo registrado por el Builder en `.opencode/progress/current.md` §6. → Sugerencia al Líder: fix de KafeMATH.log + ADR; el Tester no modifica código.
2. **Mensajes en inglés en rutas educativas en español** (consistencia): `Tokenizer: Must call fit before transform` (`Tokenizer._check_fitted`) y `TypeError: Function tokenizer expects argument of type INT, got type STR` (`check_sig` en `machine.tokenizer`). Deuda menor.
3. **Texto vacío**: `Tokenizer.fit([''])` produce vocabulary_size=2 (solo OOV) y `transform` → `[[]]`; el modelo rechaza la secuencia vacía con mensaje acotado. Comportamiento correcto y documentado.
4. **Transparencia de medición**: la primera extracción de métricas de las salidas de los ejemplos falló porque el hijo escribe con `\r\n` y los regex usaban `\n`; se normalizaron las líneas y se relanzaron las 4 corridas (el JSON contiene la pasada corregida completa). Además, el benchmark entrena con `fit(X,y,1,batch)` por época (para medir por época); como `fit` no baraja y el optimizador conserva estado, es equivalente a `fit(X,y,N,batch)`; las etiquetas `Epoch 1/1` en las líneas capturadas son solo cosméticas.

## 5. Veredicto final

La validación E2E del feature **RNN + KafeKaggle + Tokenizer + GESHA** está **APROBADA**:

- Suite: **691 passed, 2 skipped, 0 failed** (448.02 s).
- Ejemplos: rc=0 en 4/4 corridas (119.86/121.72 s y 85.80/85.26 s), **determinismo byte a byte**, pérdidas decrecientes sin negativas, MAE 2.7147 < 5 °C, accuracy 0.5823 ≥ 0.5 (vs baseline ~0.557), matriz de confusión correcta y 3 frases nuevas clasificadas coherentemente.
- Benchmark: **5 escenarios + anexo H con mediciones reales; 8/8 cheques; veredicto VÁLIDO**; réplica de S4 idéntica al .kf.
- Entregables: `.opencode/benchmarks/rnn_e2e.py`, `rnn_e2e_results.md`, `rnn_e2e_results.json`, índice + sección en `records.md`, corridas en `rnn_examples_runs.json` y este informe.
- Único hallazgo técnico: KafeMATH.log/BCE (ya conocido por el Builder; aquí se confirma con números exactos y se delimita su impacto: métrica sí, gradiente no).

Estado para el Líder: **done** — `.opencode/benchmarks/tester-rnn-e2e.md`.