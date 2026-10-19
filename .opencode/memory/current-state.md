# Current State

## Architecture Status

The engineering system under `.opencode/` is complete.

KafeMACHINE architectural review completed (2026-09-14):
- BaseMachine refactored with unified contract (ADR-0007)
- Flexible `fit()` signatures documented
- Centralized `_validate_matrix_shape()` for dimension validation
- Consistent `_unwrap_data()` usage across all components
- `score()` methods now reuse `metrics.py` functions with optional metric parameter
- `fit_transform()` removed from base, implemented per-transformer
- CrossValScore now inherits from BaseMachine (2026-09-21)
- `train_test_split`/`stratified_train_test_split` now accept `X` of **arbitrary nesting** via `lista_cualquiera_t` (`src/TypeUtils.py`), enabling 4D image tensors `[N,C,H,W]`; `y` remains `vector_numeros_t` (retrocompatible, 2026-10-13, ADR-0018 / ADR-0017 update)

KafeGESHA restored after the "Clean Gesha Architecture" refactor (2026-09-24, ADR-0008):
- Estructura modular: `layers/`, `activations/`, `losses/`, `optimizers/`, `initializers/`, `regularizers/`, `callbacks/`, más `core.py`, `models.py` y `funciones.py`.
- Root cause of `TypeError: Expected GESHA, obtained FUNC` fixed: `TypeUtils.obtener_tipo_dato()` now checks GESHA **before** `callable` (so `Layer.__call__ = connect` no longer shadows the type; plain callables remain `FUNC`)
- Public contract restored: `predict` (single sample vs batch), `predict_proba`, `predict_label` (INT / List[INT]), `fit` format `Epoch N/M — Loss X.XX%`
- Gate fixtures deterministic (seed 42); `.expec` regenerated from real stdout — `or_gate.expec` bit-identical to the pre-refactor contract
- KafeGESHA operational: `pytest tests/ -q` — 464 passed, 1 skipped (28.89s); `src/Ejemplo.kf` runs error-free and AND learns (70.13% → 25.53%)

Dataset ingestion libraries (2026-10-08, ADR-0010 / ADR-0012):
- KafeHF (Hugging Face) and KafeKaggle (Kaggle) registered in `EvalVisitorPrimitivo.py`; optional deps with auto-install (`datasets`, `kaggle`), stdlib `csv`/`zipfile` parsing (no pandas), return `PARDOS` or `LIST[LIST[FLOAT]]`.
- KafeKaggle: credentials via `~/.kaggle/kaggle.json` or `KAGGLE_USERNAME`/`KAGGLE_KEY`; `_download_dataset()` isolated for monkeypatch; network scenarios live in `*.kf.example` (out of suite).
- DoD APPROVED by Reviewer 2026-10-08 (`progress/review-kafekaggle.md`).
- Full suite at close of 2026-10-08: **577 passed, 1 skipped** (baseline 545/1 before session fixes: missing autoencoder fixtures + short `ids=` for Windows env-var limit).
- KafeKAGGLE v2 (`kagglehub` client, anonymous public datasets) closed 2026-10-13 (deferred): 594 passed, 2 skipped.

KafeKAGGLE generic image ingestion (2026-10-13, ADR-0018):
- `load_cifar10` (experimental, dataset-specific, coupled to KafeMACHINE) removed and replaced by a generic image API in `src/lib/KafeKaggle/{funciones,dataset,__init__}.py`.
- Public functions: `load_image` (`[C][H][W]`, arities `[2,3,4,5]`), `load_images` (`List[[C][H][W]]`, deterministic order, arities `[1..5]`), `load_image_dataset` (arities `[2..6]`).
- `load_image_dataset` returns an indexable `ImageDataset` container with `[0]=X`, `[1]=y`; it subclasses `KafeMACHINE.BaseMachine` (KAFE type `MACHINE`) because KAFE rejects binding a heterogeneous `[X, y]` list. It performs **no** split (division stays in `machine.stratified_train_test_split`).
- Layout CHW, pixels normalized `p/255` to `[0,1]` (consumed by GESHA Conv2D, ADR-0011); `color_mode` `"rgb"` (3 channels) / `"gray"`/`"grayscale"` (1 channel); `limit` bounds the number of images.
- Optional deferred deps `Pillow` (decode/resize) and `py7zr` (nested `.7z`; `.zip` uses stdlib `zipfile`); recursive discovery skipping `__MACOSX`/dotfiles; path-traversal validation on extraction; downloads/deps isolated for offline tests.
- No changes to grammar, `TypeUtils.py` or `EvalVisitorPrimitivo.py` (dynamic dispatch by library name).
- Full suite at close 2026-10-13: **629 passed, 2 skipped** (baseline 577/1 before the feature).

KafeKAGGLE ingesta robusta por carpetas (2026-10-13, ADR-0019):
- Nueva función `load_image_folder_dataset(dataset_name, height=32, width=32, color_mode="rgb", limit=0, split="train")`: la etiqueta es el nombre de la carpeta padre (`.../<split>/<clase>/img.png`, el esquema de CIFAR-10 que no trae CSV); `split` filtra por subdirectorio ancestro (`""` = todas); mezcla determinista con semilla 42 antes de `limit` para que la muestra contenga varias clases; clases codificadas `0..N-1` en orden alfabético.
- Errores acotados: `_formatear_lista` trunca listas en los mensajes (`… y N más (total M)`); `_download_dataset` verifica que la descarga produzca archivos.
- `src/Ejemplo.kf` migrado de `load_image_dataset(..., "trainLabels.csv", ...)` — que volcaba ~60000 rutas a stdout sobre CIFAR-10 — a `load_image_folder_dataset`.
- Sin cambios de gramática, `TypeUtils.py` ni `EvalVisitorPrimitivo.py`; API aditiva (no rompe ADR-0018).
- Full suite at close 2026-10-13: **645 passed, 2 skipped** (baseline 629/2 before the feature).

KafeKAGGLE text ingestion + KafeMACHINE Tokenizer + RNN E2E (2026-10-18, ADR-0021):
- Nueva API de texto en KafeKaggle: `kaggle.load_text_dataset(dataset_name, file_name="", delimiter="\t", text_column=0, label_column=1, limit=0)` → PARDOS con columnas `text`/`label`; acepta `.txt`/`.tsv`/`.csv` (`_select_file_texto`, `_leer_filas`, `_parse_text_labels`); la API CSV anterior intacta.
- Nuevo transformer en KafeMACHINE: `machine.tokenizer(num_words=0, oov_token="")` (`src/lib/KafeMACHINE/preprocessing/Tokenizer.py`, hereda `BaseMachine`); tokenización `re` (minúsculas + no-alfanuméricos), vocabulario determinista por (-frecuencia, primera aparición), índice 0 reservado, OOV opcional en índice 1; métodos `fit`/`transform`/`fit_transform`, atributos `word_index`/`index_word`/`vocabulary_size`.
- Cadena RNN de KafeGESHA validada E2E con datos reales: `src/EjemploRNN1.kf` (serie Melbourne, MAE 2.71 °C) y `src/EjemploRNN2.kf` (sentimiento Yelp, accuracy 0.5823); fixtures de regresión `tests/KafeGESHA/rnn_sintetico.kf` y `rnn_embedding_sintetico.kf`. Limitación conocida: `Model.predict` confunde muestra única con lote en secuencias → ejemplos predicen por lote (follow-up).
- Full suite at close 2026-10-18: **691 passed, 2 skipped** (baseline 645/2 before the feature). DoD APPROVED por Reviewer; sesión cerrada 2026-10-18 (`/close`).

Lote de ingeniería post-cierre RNN (2026-10-18, ver history):
- Helpers privados de KafeKaggle/KafeMACHINE/KafeGESHA en **inglés** desde 2026-10-18 (`_formatear_lista`→`_format_list`, `_elegir_archivo`→`_choose_file`, `_select_file_texto`→`_select_file_text`, `_leer_filas`→`_read_rows`, `_es_entero`→`_is_integer`, `_tokenizar`→`_tokenize`, `_validar_texts`→`_validate_texts`, `_acumular_en`→`_accumulate_into`, `_adam_actualizar`→`_adam_update`, + params de 4 funciones de KafeKaggle); mapeo completo y verificación en `.opencode/progress/impact-english-names.md` (grep de nombres viejos → 0 hits). Constantes de tipos (`entero_t`, `flotante_t`, `vector_numeros_t`, `matriz_numeros_t`, `lista_cadenas_t`...) y helpers del núcleo TypeUtils/global_utils (`obtener_tipo_dato`, `construir_tipo_lista`, `obtener_nivel_anidamiento`...) siguen en español — deuda acotada y aceptada (ver `technical-debt.md`).
- `.opencode/tmp/` **eliminada**: `conv_equiv.py`/`conv_equiv_results.md`/`builder-rnn-e2e.md`/`tester-rnn-e2e.md` reubicados en `.opencode/benchmarks/`; herramienta de generación de `.expec` en `scripts/generar_expec.py`; ADR-0020 escrito en `.opencode/adr/decisions.md` y benchmark CNN registrado en `.opencode/benchmarks/records.md` (evidencia de benchmarks CNN/RNN consolidada en `.opencode/benchmarks/`).
- Ejemplos maestros copiados verbatim a `docs/ejemplos/` con `README.md` índice: `ejemplo-cnn-cifar10.kf` (de `src/Ejemplo.kf`), `ejemplo-rnn1-series.kf` (de `src/EjemploRNN1.kf`), `ejemplo-rnn2-sentimiento.kf` (de `src/EjemploRNN2.kf`); canónicos siguen en `src/`.
- Full suite 2026-10-18 tras el lote: **692 passed, 2 skipped** (el +1 es el fixture huérfano conservado `tests/KafeMACHINE/model_selection/test_train_test_split_container.kf`, sin atribución, verde).

## Current Milestone

KafeMACHINE machine learning library — ✔ Complete. 11 models, preprocessing, metrics, model selection. Tokenizer ✔ 2026-10-18 (ADR-0021).
KafeGESHA deep learning library — ◐ In Progress. Dense (operational, contract restored 2026-09-24), activations, optimizers; LSTM/Transformer pending (Conv2D y SimpleRNN ✔ 2026-10-08; cadena RNN validada E2E 2026-10-18).
KafeHF / KafeKaggle dataset ingestion — ✔ Complete (2026-10-08). KafeKAGGLE generic image API — ✔ Complete (2026-10-13, ADR-0018). Etiquetas por carpetas (`load_image_folder_dataset`) — ✔ Complete (2026-10-13, ADR-0019). Text ingestion (`load_text_dataset`) — ✔ Complete (2026-10-18, ADR-0021).

## Current Priorities

1. Follow-ups ADR-0021: fix `Model.predict` single-sample en secuencias (prioridad alta); fix `KafeMATH.log` error de signo cerca de 1 (prioridad media).
2. KafeGESHA: LSTM, Transformer layers (per roadmap); Conv2D operativo.
3. Legacy review tasks (BaseMachine, LinearRegression, LogisticRegression, KNN, Metrics).
4. Performance optimization (vectorization, parallel execution).
5. Documentation — remaining component documentation cycles.

## Current Blockers

None identified. Historical blocker H2 (image split rejected X 4D) is **resolved** — decision A1 relaxed `X` typing in KafeMACHINE's split (ADR-0018/ADR-0017) and is covered by a regression fixture. Note: run the suite as `pytest tests/` — a bare `pytest` at the repo root aborts collection on legacy UTF-16 files (`test_output.txt`, `test_results.txt`).
## Actualización 2026-10-10 — entrenamiento GESHA

GESHA dispone de inicializadores, regularizadores L1/L2/L1L2, EarlyStopping y ModelCheckpoint. Dense y Conv2D aceptan los nuevos objetos de forma opcional y mantienen sus valores iniciales históricos por compatibilidad. NUMK incluye generación normal N-dimensional.
