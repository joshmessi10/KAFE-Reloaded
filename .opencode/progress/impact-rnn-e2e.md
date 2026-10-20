# Impact Analysis — Validación E2E de RNN con KafeKaggle: series temporales y texto

Fecha: 2026-10-17 · Lead: Engineering Lead · Significativo: sí (core RNN + API pública KafeKaggle + nuevo componente ML)

## Feature

Crear `src/EjemploRNN1.kf` (RNN sobre serie temporal numérica, temperaturas mínimas diarias de Melbourne) y `src/EjemploRNN2.kf` (RNN sobre texto, frases con sentimiento), de modo que el flujo completo **importar dataset con KafeKaggle → preparar datos → entrenar RNN → predecir** funcione de punta a punta. Los ajustes necesarios que se detecten se implementan en la misma sesión.

Datasets elegidos (verificados 2026-10-17):
- `paulbrabban/daily-minimum-temperatures-in-melbourne` → `daily-minimum-temperatures.csv` (CSV coma, encabezado `Date,Daily minimum temperature`, 3650 filas, 1981-1990). Legible con la API tabular actual.
- `marklvl/sentiment-labelled-sentences-data-set` → `yelp_labelled.txt` (1000 frases, formato `frase<TAB>0|1`, SIN encabezado, UTF-8). NO legible con la API actual.

## Hallazgos del análisis (estado actual verificado en disco)

1. **RNN sin cobertura E2E en KAFE.** `SimpleRNN` (`src/lib/KafeGESHA/layers/recurrent/simple_rnn.py`), `Embedding` (`embedding.py`), LSTM, GRU y Bidirectional existen y tienen unit tests Python (`tests/test_gesha_cnn_rnn_layers.py`), pero **ningún fixture `.kf` ejercita `geshaDeep.create_rnn`** en el intérprete. Riesgo: fallos en despacho/`check_sig`/tipos no detectados.
2. **KafeKaggle solo admite CSV con coma y encabezado.** `_select_file` (`src/lib/KafeKaggle/funciones.py` L257-269) rechaza cualquier extensión distinta de `.csv`; `_parse_csv`/`_leer_filas` (L295-329) fija delimitador `,` y trata la primera fila como encabezado. El dataset de sentimiento es `.txt` tabulado sin encabezado → bloqueante para `EjemploRNN2`.
3. **No existe tokenizador (texto → índices enteros).** `Embedding.forward` exige `List[INT]` de índices en rango; sin `Tokenizer` no hay puente entre el texto crudo y la capa → bloqueante para `EjemploRNN2`. KafeMACHINE ya tiene `LabelEncoder`/`OneHotEncoder`/`OrdinalEncoder` como precedente de transformers de codificación.
4. **`Model.predict` confunde muestra única con lote en secuencias.** `src/lib/KafeGESHA/models.py` L112-118 distingue por `isinstance(X[0], list)`: una única secuencia `[T,F]` se iteraría como si fuera un lote de timesteps → salida incorrecta. Mitigación en este feature: los ejemplos siempre predicen sobre lotes (≥2 muestras) y la limitación queda documentada en known-issues; el fix (distinguir por profundidad de anidamiento) queda como follow-up por riesgo de regresión en fixtures Dense/CNN existentes.
5. **Coste de entrenamiento.** `fit` es por muestra en Python puro (medido 384.789 ms/muestra para la CNN de Ejemplo.kf tras ADR-0020). Un RNN pequeño sobre secuencias cortas debe ser mucho más barato, pero hay que medirlo antes de fijar tamaños de los ejemplos.

## Módulos afectados

- `src/lib/KafeKaggle/funciones.py` + `__init__.py` — generalización del lector tabular (delimiter configurable, sin asumir encabezado) y nueva función pública `load_text_dataset`.
- `src/lib/KafeMACHINE/preprocessing/` — nuevo `Tokenizer.py` (sigue el contrato BaseMachine, ADR-0007) + fábrica `machine.tokenizer(...)` en `funciones.py` + export en `__init__.py`.
- `src/EjemploRNN1.kf`, `src/EjemploRNN2.kf` — nuevos (en `src/`, junto a `Ejemplo.kf`).
- `tests/test_KafeKaggle_backend.py`, `tests/test_KafeMACHINE.py`, fixtures `tests/KafeMACHINE/preprocessing/`, fixture RNN sintético sin red en `tests/KafeGESHA/`, ejemplos de red `tests/KafeKaggle/*.kf.example`.
- Docs: `docs/bibliotecas/kaggle.md`, `docs/bibliotecas/machine.md`; concept records: `concepts/tokenizer.md` (nuevo), `concepts/simple-rnn.md` (extender con el flujo E2E), `concepts/kaggle-dataset-ingestion.md` (sección de texto).
- `.opencode/adr/decisions.md` — ADR-0021. `.opencode/benchmarks/` — benchmark de 5 escenarios.

## Decisiones de diseño

- **D1 — `kaggle.load_text_dataset(dataset_name, file_name, delimiter="\t", text_column=0, label_column=1, limit=0)` → PARDOS con columnas `text` (STR) y `label` (INT).** API aditiva dedicada a datasets de texto etiquetado (patrón ya usado por `load_image_folder_dataset`: una función semántica por formato de origen). Internamente reutiliza un lector tabular generalizado `_parse_table(handle, delimiter)` que `_parse_csv` pasa a usar con `","` (comportamiento existente intacto). Alternativa rechazada: añadir `delimiter`/`header` a `load_dataset` (sobrecarga la firma de la API tabular genérica y fuerza nombres de columna sintéticos cuando no hay encabezado).
- **D2 — `machine.tokenizer(num_words=0, oov_token="")` en KafeMACHINE (preprocessing).** Tokenización con stdlib: minúsculas, separación por no-alfanuméricos, frecuencia ordenada por (-count, primera aparición) para determinismo, índice 0 reservado a padding/neutral, índice 1 a OOV si se configura, `num_words` acota el vocabulario. Métodos `fit(texts)`, `transform(texts)` → `List[List[INT]]`; atributos `word_index`, `vocabulary_size`. Alternativas rechazadas: tokenizar en el `.kf` con bucles (KAFE no tiene split de cadenas, no reutilizable), en KafePARDOS (no es manipulación tabular sino representación para ML), librería externa (prohibido por AGENTS.md).
- **D3 — sin cambios de gramática.** Todo se resuelve en librerías; `check_sig` cubre las firmas nuevas.

## Riesgos

- Tiempo de entrenamiento RNN en Python puro → tamaños acotados (`limit` en ingesta, nº de muestras medido) y medición real antes de fijar parámetros de los ejemplos.
- `predict` con una sola muestra en secuencias (Hallazgo 4) → mitigado en ejemplos + known-issue + follow-up.
- Determinismo de fixtures `.expec` → semillas explícitas en todas las capas y muestreo estable.
- Descarga real vía kagglehub (anónima, cacheada) → los ejemplos reales quedan como `.kf.example` fuera de la suite; la validación E2E con red la ejecuta el Tester y se registra.
- Labels del dataset de sentimiento deben validarse como 0/1 antes de entrenar.
- API pública de KafeKaggle cambia (aditiva) → ADR-0021.

## Criterios de aceptación

1. `pytest tests/ -q` verde (baseline 645 passed / 2 skipped + tests nuevos).
2. `src/EjemploRNN1.kf` y `src/EjemploRNN2.kf` ejecutan sin error, con pérdida decreciente y métrica de prueba razonable (MAE y accuracy respectivamente).
3. Benchmark de 5 escenarios con medidas reales registrado en `.opencode/benchmarks/records.md`.
4. Concept records enriquecidos (tokenizer, simple-rnn) y docs de kaggle/machine actualizadas.
5. ADR-0021, history y roadmap actualizados; DoD APPROVED.

## Plan de implementación

- F1 — KafeKaggle: `_parse_table` + `load_text_dataset` + export + tests backend (monkeypatch de descarga, sin red). *Nota: la implementación final usó `_leer_filas` + `_parse_text_labels` + `_select_file_texto` (misma semántica que el helper planificado); `load_text_dataset` quedó en L1245-1331 de `src/lib/KafeKaggle/funciones.py`.*
- F2 — KafeMACHINE: `Tokenizer` + fábrica `machine.tokenizer` + tests backend + fixtures `.kf`.
- F3 — `src/EjemploRNN1.kf`: ventanas deslizantes T=7 con bucles KAFE, normalización min-max con estadísticas del train, split cronológico 80/20, `create_rnn(16,"tanh")` + `create_dense(1,"linear")`, loss MAE/MSE, Adam, predicción del día siguiente y MAE sobre test.
- F4 — `src/EjemploRNN2.kf`: `load_text_dataset` → `machine.tokenizer` → `machine.train_test_split` → `geshaDeep.embedding` + `create_rnn` + `create_dense(1,"sigmoid")`, BCE, `predict_label` sobre lote, `machine.accuracy_score`.
- F5 — Fixture RNN sintético sin red (secuencia determinista, fit + predict_label) + `*.kf.example` para los dos ejemplos.
- F6 — Docs, concept records, benchmark 5 escenarios, ADR-0021, history, roadmap.

## Reconciliación

Reconciliado el 2026-10-18 tras la implementación: el helper planificado `_parse_table` se materializó como `_leer_filas` + `_parse_text_labels` + `_select_file_texto` (misma semántica, ver F1) y las referencias de línea de KafeKaggle (L16) se actualizaron a los valores actuales de `src/lib/KafeKaggle/funciones.py` (`_select_file` L257-269, `_parse_csv`/`_leer_filas` L295-329, `load_text_dataset` L1245-1331). Las decisiones D1-D3 no cambian.
