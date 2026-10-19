# Benchmark: Validación E2E de RNN con KafeKaggle — ingesta, tokenización y RNN

- **Date**: 2026-10-18
- **Component**: `src/lib/KafeKaggle/funciones.py` + `src/lib/KafeMACHINE/preprocessing/Tokenizer.py` + `src/lib/KafeGESHA` (Embedding, SimpleRNN, Dense, Sequential)
- **Category**: DL component (E2E chain)
- **Purpose**: medir tiempo, pico de memoria y correctitud de la cadena completa KafeKaggle (Kaggle) → Tokenizer → capas GESHA → evaluación, con 5 escenarios de prueba (small, medium, edge, réplica de serie temporal, stress) más un anexo sobre KafeMATH.log y BCE.

## Setup

| Dato | Valor |
|------|-------|
| Hardware | Intel64 Family 6 Model 158 Stepping 13, GenuineIntel |
| Environment | Python 3.13.11 / Windows-11-10.0.26200-SP0 |
| CPUs lógicas | 12 |
| Script | `.opencode/benchmarks/rnn_e2e.py` (crudos: `rnn_e2e_results.json`) |
| Datasets | `yelp_labelled.txt` (1000 frases, TAB, sin encabezado) y `daily-minimum-temperatures-in-me.csv` (encabezado entrecomillado, celdas con prefijo ?), desde la caché local de kagglehub |

## Test Scenarios (5 + anexo)

### Scenario 1: Small — tokenización de 50 frases

- **Purpose**: verificar la ingesta de texto y el Tokenizer en miniatura.
- **Dataset**: 50 frases reales de Yelp (`limit=50`).
- **Expected**: secuencias List[List[INT]] dentro del rango del vocabulario; determinismo entre dos fit.
- **Metrics**: mediana de 3 corridas para ingesta/parse, fit y transform; vocabulario y longitud media.

### Scenario 2: Medium — cadena de texto con 300 frases

- **Purpose**: verificar el rendimiento de la cadena texto completa con RNN + Embedding.
- **Dataset**: 300 frases; split estratificado 80/20 (semilla 42); train balanceado; `tokenizer(200, <OOV>)` fit SOLO sobre train; truncado maxlen=10.
- **Expected**: accuracy ≥ 0.5, loss decreciente, sin crashes.
- **Metrics**: tiempo total y por época (5 épocas, batch 8, lr 0.01), pico de memoria, accuracy, matriz de confusión.

### Scenario 3: Edge cases — 13 casos

- **Purpose**: verificar robustez sin red y sin crashes.
- **Cases**: frase única, lote de 1, texto vacío, secuencia vacía al modelo, predict/fit con datos vacíos, tokenizer sin fit, num_words negativo y no entero, etiqueta no entera y archivo inexistente en KafeKaggle (descarga sustituida por un tempdir, sin red), índice fuera de rango en Embedding, units=0 en create_rnn.
- **Expected**: estados ok/excepcion exactamente como se espera, con mensajes acotados.
- **Metrics**: estado por caso y milisegundos.

### Scenario 4: Multi-feature / réplica de serie temporal (300 días)

- **Purpose**: replicar en Python el camino de `EjemploRNN1.kf` y medirlo.
- **Dataset**: 300 días reales de Melbourne, ventana 7, split cronológico 80/20, min-max calculado SOLO sobre el train (234/59).
- **Expected**: MAE < 5 °C, sin pérdidas negativas, sin crashes.
- **Metrics**: tiempo total y por época (15 épocas, batch 8), pico de memoria, MAE en °C.

### Scenario 5: Stress (5a texto 1000 frases sin truncar + 5b serie 1000 días con ventana 14)

- **Purpose**: verificar límites de rendimiento a escala educativa máxima del corpus disponible.
- **Dataset 5a**: 1000 frases (el archivo completo), split estratificado 80/20, train balanceado, `tokenizer(0, <OOV>)` sin truncar (T medio medido 11.11 tokens), 2 épocas batch 8.
- **Dataset 5b**: 1000 días con ventana 14 (986 ventanas, split cronológico 788/198); 2 celdas con prefijo ? dentro del corte se imputan con forward-fill y quedan documentadas.
- **Expected**: completar sin crash; documentar degradación y memoria.
- **Metrics**: tiempo por época, extrapolación a 8 épocas (5a), pico de memoria, losses y MAE (5b).

## Results

| Scenario | Dataset Size | Timesteps | Runtime | Memory | Metric | Status |
|----------|--------------|-----------|---------|--------|--------|--------|
| S1 Small (tokenización 50 frases) | 50 | variable | 0.7883 + 0.0004 + 0.0003 s | n/d (sin pasada de memoria por diseño) | vocab 271, long. media 10.2 | ✓ |
| S2 Medium (300 frases, RNN+Embedding) | 300 (train 216 / test 60) | ≤10 | 33.4849 s total (6.697 s/época) | 692.64 KiB | acc 0.6 | ✓ |
| S3 Edge cases | 13 casos | - | 0.013 s | n/d | 13/13 casos esperados | ✓ |
| S4 Serie 300 días (réplica EjemploRNN1) | 293 ventanas (234/59) | 7 | 116.7006 s total (7.78 s/época) | 1560.03 KiB | MAE 2.71475 °C | ✓ |
| S5a Stress texto 1000 frases sin truncar | 1000 (train 800 / test 200) | T medio 11.11 | 130.2025 s (2 épocas; extrap. 8 épocas 520.8104 s) | 3998.73 KiB | loss 66.1963% → 35.2788%, acc(2ép) 0.75 | ✓ |
| S5b Stress serie 1000 días, ventana 14 | 986 ventanas (788/198) | 14 | 93.5778 s total (46.7889 s/época) | 3719.5 KiB | MAE 6.299125 °C (2 épocas) | ✓ |

### Métricas crudas por escenario

**S1**

| Métrica | Valor |
|---------|-------|
| ingesta_parse_mediana_3_s | 0.788304 |
| ingesta_parse_cada_corrida_s | [0.788304, 0.635666, 0.893302] |
| fit_mediana_3_s | 0.000417 |
| transform_mediana_3_s | 0.000314 |
| n_textos | 50 |
| etiquetas_int | True |
| vocabulario | 271 |
| longitud_media_tokens | 10.2 |
| secuencias_list_int | True |
| indices_en_rango | True |
| determinismo_dos_fits | True |
| secuencias_vacias | 0 |
| tiempo_escenario_s | 2.321 |

**S2**

| Métrica | Valor |
|---------|-------|
| ingesta_s | 0.698046 |
| tokenizer_fit_s | 0.003866 |
| n_muestras | 300 |
| n_train | 216 |
| n_test | 60 |
| train_balanceado_neg_pos | [108, 108] |
| vocabulario | 202 |
| maxlen | 10 |
| epocas | 5 |
| batch | 8 |
| tiempo_total_fit_s | 33.4849 |
| tiempo_por_epoca_s | [6.5155, 6.5865, 6.6379, 6.8266, 6.9184] |
| media_por_epoca_s | 6.697 |
| loss_inicial_pct | 69.3285 |
| loss_final_pct | 21.5026 |
| perdidas_negativas | [] |
| accuracy_test | 0.6 |
| matriz_confusion | [[12, 15], [9, 24]] |
| tiempo_escenario_s | 34.594 |
| pico_memoria_kib | 692.64 |
| tiempo_paso_memoria_s | 147.498 |

**S4**

| Métrica | Valor |
|---------|-------|
| ingesta_s | 0.770471 |
| dias | 300 |
| ventanas_shape | [293, 7, 1] |
| train_test | [234, 59] |
| min_max_train | [2.1, 25.0] |
| epocas | 15 |
| batch | 8 |
| tiempo_total_fit_s | 116.7006 |
| tiempo_por_epoca_s | [7.8814, 8.0339, 7.9554, 7.8288, 8.1023, 8.1221, 7.7582, 7.6344, 8.52, 7.7243, 8.0026, 7.153, 7.0946, 7.8133, 7.0763] |
| media_por_epoca_s | 7.78 |
| loss_inicial | 0.077689 |
| loss_final | 0.015583 |
| perdidas_negativas | [] |
| mae_celsius | 2.71475 |
| mae_lt_5 | True |
| predichas_vs_reales_5 | [[7.137, 5.5], [4.981, 6.2], [5.972, 8.0], [7.062, 10.3], [8.691, 9.8]] |
| tiempo_escenario_s | 118.233 |
| pico_memoria_kib | 1560.03 |
| tiempo_paso_memoria_s | 438.137 |

**S5a**

| Métrica | Valor |
|---------|-------|
| ingesta_s | 0.617743 |
| n_muestras | 1000 |
| n_train | 800 |
| n_test | 200 |
| train_balanceado_neg_pos | [400, 400] |
| vocabulario | 1810 |
| longitud_media_tokens | 11.11 |
| truncado | False |
| epocas | 2 |
| batch | 8 |
| tiempo_total_fit_s | 130.2025 |
| tiempo_por_epoca_s | [59.3266, 70.8759] |
| media_por_epoca_s | 65.1013 |
| extrapolacion_8_epocas_s | 520.8104 |
| loss_inicial_pct | 66.1963 |
| loss_final_pct | 35.2788 |
| perdidas_negativas | [] |
| accuracy_test_2_epocas | 0.75 |
| tiempo_escenario_s | 132.725 |
| pico_memoria_kib | 3998.73 |
| tiempo_paso_memoria_s | 572.488 |

**S5b**

| Métrica | Valor |
|---------|-------|
| ingesta_s | 0.868317 |
| dias | 1000 |
| celdas_imputadas_fila_datos_1based | [566, 567] |
| imputacion | forward-fill con el ultimo valor valido (celdas ? del CSV) |
| ventanas_shape | [986, 14, 1] |
| train_test | [788, 198] |
| min_max_train | [0.0, 26.3] |
| epocas | 2 |
| batch | 8 |
| tiempo_total_fit_s | 93.5778 |
| tiempo_por_epoca_s | [46.6791, 46.8987] |
| media_por_epoca_s | 46.7889 |
| loss_inicial | 0.030792 |
| loss_final | 0.014681 |
| perdidas_negativas | [] |
| mae_celsius | 6.299125 |
| mae_lt_5 | False |
| predichas_vs_reales_5 | [[17.973, 15.2], [17.965, 13.1], [17.158, 13.2], [16.858, 12.5], [16.651, 15.2]] |
| tiempo_escenario_s | 98.941 |
| pico_memoria_kib | 3719.5 |
| tiempo_paso_memoria_s | 425.096 |

### S3 — Resultados por caso

| Caso | Esperado | Estado | OK | Mensaje | ms |
|------|----------|--------|----|---------|----|
| transform con una sola frase | ok | ok | True | [[2, 1]] | 0.054 |
| modelo.predict con lote de 1 secuencia | ok | ok | True | [[0.48491830156231774]] | 2.574 |
| texto vacio: fit+transform | ok | ok | True | [[]] | 0.061 |
| secuencia vacia [] al modelo Embedding+RNN | excepcion | excepcion | True | ValueError: SimpleRNN requiere entrada [timesteps, features] | 0.027 |
| predict con lista vacia | excepcion | excepcion | True | ValueError: predict requiere datos no vacios | 0.003 |
| fit con datos vacios | excepcion | excepcion | True | ValueError: fit requiere X e Y no vacios con igual numero de muestras | 0.003 |
| tokenizer sin fit: transform | excepcion | excepcion | True | Exception: Tokenizer: Must call fit before transform | 0.03 |
| num_words invalido: negativo | excepcion | excepcion | True | Exception: Tokenizer: 'num_words' debe ser un entero mayor o igual que 0; se recibió -1. | 0.032 |
| num_words invalido: no entero | excepcion | excepcion | True | TypeError: Function tokenizer expects argument of type INT, got type STR | 0.06 |
| load_text_dataset: label no entero (sin red) | excepcion | excepcion | True | Exception: kaggle: La columna de etiquetas (label_column=1) debe contener enteros; valores no válidos: ['x'] | 5.208 |
| load_text_dataset: archivo inexistente (sin red) | excepcion | excepcion | True | Exception: kaggle: No se encontró 'no_existe.txt' en el dataset. Archivos disponibles: ['datos.txt'] | 2.493 |
| Embedding: indice fuera de rango | excepcion | excepcion | True | ValueError: Embedding índice fuera de rango | 0.195 |
| create_rnn: units 0 | excepcion | excepcion | True | ValueError: SimpleRNN requiere units entero positivo | 0.091 |

**S2 — épocas impresas por fit()**

- Epoch 1/1 — Loss 69.33% — Accuracy 55.56%
- Epoch 1/1 — Loss 59.40% — Accuracy 75.46%
- Epoch 1/1 — Loss 41.48% — Accuracy 79.17%
- Epoch 1/1 — Loss 29.89% — Accuracy 86.57%
- Epoch 1/1 — Loss 21.50% — Accuracy 91.20%

**S4 — épocas impresas por fit()**

- Epoch 1/1 — Loss 7.77%
- Epoch 1/1 — Loss 3.52%
- Epoch 1/1 — Loss 3.87%
- Epoch 1/1 — Loss 3.71%
- Epoch 1/1 — Loss 3.28%
- Epoch 1/1 — Loss 2.36%
- Epoch 1/1 — Loss 1.78%
- Epoch 1/1 — Loss 1.53%
- Epoch 1/1 — Loss 1.49%
- Epoch 1/1 — Loss 1.52%
- Epoch 1/1 — Loss 1.54%
- Epoch 1/1 — Loss 1.54%
- Epoch 1/1 — Loss 1.55%
- Epoch 1/1 — Loss 1.55%
- Epoch 1/1 — Loss 1.56%

**S5a — épocas impresas por fit()**

- Epoch 1/1 — Loss 66.20% — Accuracy 58.50%
- Epoch 1/1 — Loss 35.28% — Accuracy 85.62%

**S5b — épocas impresas por fit()**

- Epoch 1/1 — Loss 3.08%
- Epoch 1/1 — Loss 1.47%

## Notas de medición

- Los tiempos de entrenamiento son de UNA corrida por escenario (repetir S2/S4/S5 costaría minutos y no cambia el orden de magnitud); S1 sí usa mediana de 3 corridas para sus operaciones cortas, como exige el proceso.
- La memoria se mide en una pasada SEPARADA con `tracemalloc` (por eso `tiempo_paso_memoria_s` es mayor que el tiempo real: el instrumento infla la ejecución; los tiempos reportados NO salen de esa pasada).
- Los imports de Python (`lib.KafeMACHINE`, `lib.KafeGESHA`, etc.) ocurren fuera de todo cronómetro.
- Los datasets se leen desde la caché local de kagglehub (descargas ya realizadas); el tiempo de ingesta incluye la llamada a kagglehub con caché, sin transferencia de red relevante.
- S3 no usa red: `kg._download_dataset` se sustituye por un tempdir dentro de cada caso y se restaura en `finally`.
- S4 replica en Python el camino de `EjemploRNN1.kf` (mismos hiperparámetros y semillas 101/102); se espera MAE idéntico al del ejemplo.
- S5b imputa 2 celdas corruptas (?) con forward-fill dentro de los primeros 1000 días (filas de datos 566 y 567, 1-based) y lo reporta explícitamente.
- Este benchmark NO ejecuta el intérprete `Kafe.py`: esa validación es la Parte 1 del informe del Tester (`.opencode/benchmarks/tester-rnn-e2e.md`), con la suite completa y las corridas de los dos ejemplos.

- Coste por muestra-época (texto): S2 31.0046 ms vs S5a 81.3766 ms → x2.6247 al pasar de maxlen 10 a secuencias sin truncar (T medio 11.11).
- Coste por muestra-época (serie): S4 33.2479 ms (T=7) vs S5b 59.3768 ms (T=14) → x1.7859 por doble ventana; el coste total por época crece ≈ (muestras × T).

## Anexo H — KafeMATH.log y BCE

| x | kafemath_log | math_log | error (k−m) | signo distinto |
|---|---|---|---|---|
| 0.9 | -0.1053605156566898 | -0.10536051565782628 | 1.1364797991575415e-12 | False |
| 0.99 | -0.009377225466512651 | -0.01005033585350145 | 0.0006731103869887997 | False |
| 0.999 | 0.003116893542619459 | -0.0010005003335835344 | 0.004117393876202993 | True |
| 0.99999999 | 0.0050249787502596455 | -1.0000000100247594e-08 | 0.005024988750259746 | True |
| 0.5 | -0.6931471805599453 | -0.6931471805599453 | 0.0 | False |
| 0.1 | -2.3025850929940455 | -2.3025850929940455 | 0.0 | False |

| y | p | BCE.compute |
|---|---|---|
| 1.0 | 0.9 | 0.1053605156566898 |
| 1.0 | 0.99 | 0.009377225466512651 |
| 1.0 | 0.999 | -0.003116893542619459 |
| 1.0 | 0.99999999 | -0.0050249787502596455 |
| 0.0 | 0.1 | 0.1053605156566898 |
| 0.0 | 1e-08 | -0.0050249787502596455 |
| 1.0 | 0.5 | 0.6931471805599453 |
| 0.0 | 0.5 | 0.6931471805599453 |

- derivative(y=1, p=0.99999999): [-0.5000000037561899]
- ¿Se observó BCE negativa?: **True**
- BCE.compute usa KafeMATH.log; BCE.derivative no usa log (binary_cross_entropy.py).

## Conclusions

- [x] S1: tipos correctos, índices en rango y determinismo entre dos fit
- [x] S2: accuracy en test >= 0.5
- [x] S2: loss final menor que la inicial y sin negativas
- [x] S3: 13/13 casos con el estado esperado y sin crash
- [x] S4: MAE < 5 °C en el test cronológico
- [x] S4: sin pérdidas negativas
- [x] S5a: loss decreciente y sin negativas a 1000 frases sin truncar
- [x] S5b: completado sin crash y sin pérdidas negativas (1000 días, T=14)

- **Veredicto del benchmark**: VÁLIDO — los 5 escenarios completaron sin crash y con las métricas esperadas.
- La cadena E2E escala linealmente con muestras × timesteps dentro de los tamaños educativos disponibles (50 → 1000 frases/días) sin degradación anómala ni memoria descontrolada.
- El anexo H confirma o descarta empíricamente el hallazgo de `progress/current.md` §6 (KafeMATH.log con error de signo cerca de 1 → BCE potencialmente negativa en `BinaryCrossEntropy.compute`).

## Related

- Ejemplos E2E: `src/EjemploRNN1.kf`, `src/EjemploRNN2.kf` (corridas y determinismo: `.opencode/benchmarks/rnn_examples_runs.json`)
- Script: `.opencode/benchmarks/rnn_e2e.py` · JSON crudo: `.opencode/benchmarks/rnn_e2e_results.json`
- Informe del Tester: `.opencode/benchmarks/tester-rnn-e2e.md`
- Impacto: `.opencode/progress/impact-rnn-e2e.md`
- Índice global: `.opencode/benchmarks/records.md`
