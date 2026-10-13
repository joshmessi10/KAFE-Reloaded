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

## Current Milestone

KafeMACHINE machine learning library — ✔ Complete. 11 models, preprocessing, metrics, model selection.
KafeGESHA deep learning library — ◐ In Progress. Dense (operational, contract restored 2026-09-24), activations, optimizers; LSTM/Transformer pending (Conv2D y SimpleRNN ✔ 2026-10-08).
KafeHF / KafeKaggle dataset ingestion — ✔ Complete (2026-10-08). KafeKAGGLE generic image API — ✔ Complete (2026-10-13, ADR-0018).

## Current Priorities

1. KafeGESHA: LSTM, Transformer layers (per roadmap); Conv2D operativo.
2. Legacy review tasks (BaseMachine, LinearRegression, LogisticRegression, KNN, Metrics).
3. Performance optimization (vectorization, parallel execution).
4. Documentation — remaining component documentation cycles.

## Current Blockers

None identified. Historical blocker H2 (image split rejected X 4D) is **resolved** — decision A1 relaxed `X` typing in KafeMACHINE's split (ADR-0018/ADR-0017) and is covered by a regression fixture. Note: run the suite as `pytest tests/` — a bare `pytest` at the repo root aborts collection on legacy UTF-16 files (`test_output.txt`, `test_results.txt`).
## Actualización 2026-10-10 — entrenamiento GESHA

GESHA dispone de inicializadores, regularizadores L1/L2/L1L2, EarlyStopping y ModelCheckpoint. Dense y Conv2D aceptan los nuevos objetos de forma opcional y mantienen sus valores iniciales históricos por compatibilidad. NUMK incluye generación normal N-dimensional.
