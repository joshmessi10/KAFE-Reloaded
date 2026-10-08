# Builder Report — KafeKAGGLE (import Kaggle)

**Date:** 2026-10-08
**Task:** Implement new built-in library KafeKAGGLE (`import kaggle;`), mirroring KafeHF, per `.opencode/progress/impact-kafekaggle.md`.
**Status:** Implemented and verified — handed off to Reviewer for `/dod`.

## Files created / modified

Created:
- `src/lib/KafeKaggle/__init__.py`
- `src/lib/KafeKaggle/funciones.py`
- `tests/KafeKaggle/kaggle_import_works.kf` + `.expec`
- `tests/KafeKaggle/kaggle_empty_dataset_name.error.kf` + `.error.expec`
- `tests/KafeKaggle/kaggle_load_dataset_wrong_type.error.kf` + `.error.expec`
- `tests/KafeKaggle/kaggle_load_dataset.kf.example` + `.expec.example` (red)
- `tests/KafeKaggle/kaggle_load_dataset_matrix.kf.example` + `.expec.example` (red)
- `tests/KafeKaggle/kaggle_load_dataset_auto_install.kf.example` + `.expec.example` (auto-install)
- `tests/test_KafeKaggle.py` (fixture runner, `ids=` cortos como `test_KafeGESHA.py`)
- `tests/test_KafeKaggle_backend.py` (27 unit tests, monkeypatch/FakeApi, sin red ni credenciales)
- `.opencode/progress/report-kafekaggle.md` (este reporte)

Modified:
- `src/EvalVisitorPrimitivo.py` — `import lib.KafeKaggle.funciones as kaggle_funcs_module` (tras KafeHF) + `"kaggle": [kaggle_funcs_module, False]` en `self.libraries`
- `.opencode/progress/current.md` — estado de implementación del feature

Not modified (as required): grammar files, generated ANTLR parsers, KafeHF, existing tests/fixtures.

## Public API implemented

```python
@check_sig([1, 2], [cadena_t], [cadena_t])
def load_dataset(dataset_name, file_name="")            # -> PARDOS DataFrame

@check_sig([2, 3], [cadena_t], [cadena_t], [cadena_t])
def load_dataset_split(dataset_name, file_name, split="")   # -> PARDOS DataFrame

@check_sig([1, 2, 3, 4], [cadena_t], [lista_cadenas_t], [cadena_t], [entero_t])
def load_dataset_matrix(dataset_name, columns=None, split="", limit=0)  # -> List[List[FLOAT]]
```

Decided design honored:
- Optional dependency: `try: from kaggle import KaggleApi ... except ImportError` with `_KAGGLE_AVAILABLE`; `_require_kaggle()` auto-installs with the exact `_require_hf()` mirror (`subprocess.run([sys.executable, "-m", "pip", "install", "kaggle"], check=True, timeout=120, stdout/stderr=PIPE, text=True)`) and raises Spanish `Exception` with the manual command on failure.
- stdlib `csv` + `zipfile` only; NO pandas of our own. CSV read with `utf-8-sig` (BOM tolerance), rows padded/truncated to header like `pardos.read_csv`.
- `load_dataset*` return PARDOS `DataFrame` via lazy `from lib.KafePARDOS.DataFrame import DataFrame` (cells typed with `inferir_tipo`, same as `pardos.read_csv`).
- `load_dataset_matrix` mirrors `KafeHF/funciones.py:145-194`: column selection (`LIST[STR]` or auto-infer numeric from first row), `limit` (0 = all), non-numeric/null rejection, `Columnas inexistentes`, no intermediate DataFrame; returns `List[List[FLOAT]]` (every value passed through `float()`).
- `@check_sig` from `global_utils` + `cadena_t`/`lista_cadenas_t`/`entero_t` from `TypeUtils` exactly like KafeHF.
- Download step isolated in `_download_dataset(dataset_name, dest_dir)` (credentials check + KaggleApi + zip location) so tests monkeypatch it — `KaggleApi` is never constructed with real credentials. It also redirects the API's informational stdout (`Dataset URL: ...`) so program output stays deterministic.

### Semantic deviations (documented in docstrings)

1. **`split` semantics (the requested decision):** Kaggle has no train/test/validation splits. `split` is accepted as a **split-like file selector**: `"train"` resolves to `train.csv` (also exact names `train.csv`, `data/train.csv`); resolution failure raises a clear error listing available files. Chosen over raising an educational "Kaggle has no splits" error because it keeps API symmetry with KafeHF (a HF-shaped call ports to Kaggle).
2. **`load_dataset_split(dataset_name, file_name, split="")` arity `[2, 3]`** (not `[3]`): the 2-arg form mirrors HF (`load_dataset_split("ds", "train")` — second arg works as selector), the 3-arg form adds the explicit `file_name`. Selection rules: `file_name` has priority when non-empty, else `split`, else auto-select the single CSV (error lists candidates if several). Documented in the docstring.
3. **`load_dataset_matrix` default `split=""`** (HF defaults `"train"`): Kaggle has no canonical split, so the default is auto-selection of the single CSV; passing `"train"` etc. uses the split-like selector.
4. **`load_dataset` has arity `[1, 2]`** (HF is `[1]`) because Kaggle datasets usually contain several files and need `file_name` (`""` = single CSV, else error listing candidates).

### Observed pre-existing behavior (not introduced by this feature)

The interpreter's `visitObjectFunctionCall` re-raises library errors as `f"{object_name}: {msg}"`, so messages already prefixed `kaggle:` (as mandated by the task and mirrored from `huggingface:`) appear **doubled** at KAFE level: `Exception: kaggle: kaggle: El nombre del dataset...`. This is identical to existing HF behavior and to enshrined fixtures (`tests/KafeNUMK/tensor_axis.error.expec` = `Exception: numk: NUMK: eje fuera de rango`). The `.error.expec` fixtures capture the actual output; verified byte-exact via `subprocess` + `ascii()` round-trip (accents í/ñ survive the cp1252 pipe on Windows).

## Verification (system Python, from repo root, cwd=src for the interpreter as configured in `tests/utils.py`)

1. Focused: `& "C:\Python314\python.exe" -m pytest tests/test_KafeKaggle.py tests/test_KafeKaggle_backend.py -q` → **30 passed in 0.96s**
2. Full suite: `& "C:\Python314\python.exe" -m pytest tests/ -q` → **575 passed, 1 skipped in 106.52s** — **0 failed, 0 errors**. Baseline before the change: `545 passed, 1 skipped` (verified myself before implementing). Delta = +30 new tests; the 1 skipped is the pre-existing skip (unchanged).
3. Manual smoke: ran all three `.kf` fixtures through `src/Kafe.py` (exit 0/1 and messages match the `.expec` contents).
4. All fixture/expec files written UTF-8 **without BOM** (verified programmatically; BOM breaks the lexer).
5. No `# noqa:` / `# pyright:` / `TODO` / `FIXME` suppressions in any touched file.

## Fixtures / tests coverage

- Offline (discovered by pytest): import dispatch + `show`, empty `dataset_name` validation (`kaggle:` message, exit 1), `check_sig` type rejection (`STR` vs `INT`).
- Network/credentials: only in `*.kf.example` (not discovered): real iris download, matrix with `split` selector, auto-install failure message.
- Backend unit tests (no network, no credentials, real temp ZIP/CSV files, `monkeypatch` only): matrix column selection + auto-infer + non-numeric + null cell + missing column + `limit=0`; DataFrame conversion (typed cells); explicit/auto/missing/multiple-CSV selection; non-CSV rejection; nested-path selector; UTF-8 BOM; split selector + `file_name` precedence + 2-arg form; wrong arity; `_parse_csv` helper; plain-CSV extraction; `_download_dataset` with `FakeApi` (incl. stdout suppression and API-error wrapping with `kaggle:`); `_require_kaggle` available (no pip call) and install-failure (pip argv + Spanish message); `_check_credentials` missing (Spanish `kaggle:` message naming `kaggle.json`/`KAGGLE_USERNAME`/`KAGGLE_KEY`) and both accepted sources (env vars, real config file).

## Gates status

- Full pytest suite (subprocess/warning/stream semantics): **PASS** (575 passed, 1 skipped).
- ANTLR regeneration: **N/A** (grammar untouched; generated outputs present in checkout).
- uv locked run (`uv run --locked --group dev pytest tests/ -q`): **NOT RUN** — the task brief mandates verification with system Python and explicitly forbids uv for this verification.
- Ruff: **PENDING** — `ruff` not installed in the system interpreter and no `pyproject.toml`/`ruff.toml` configuration exists in the repo (gate unimplemented).
- Typing (pyright/mypy): **PENDING** — tool not installed; gate unimplemented.
- Dependency audit / spelling-in-CI / suppression-policy: **PENDING** — no implemented runner in this session's scope (suppression scan for this change done manually: clean).

## Out of scope for this session (assigned to later steps in the impact analysis)

- `docs/bibliotecas/kaggle.md` + example under `docs/ejemplos/` (step 5, Lead/Builder)
- ADR-0012, `.opencode/knowledge/libraries.md` registry/reference, concept record (step 6, Architect)
- Benchmark decision with Tester (step 7) — network constraint justifies local/mock scenarios or documented "not applicable"
- History `2026-10.md`, roadmap, session log (step 8, Historian); `/dod` (step 9, Reviewer)

Nothing was deviated from the decided design; no blockers.

## Addendum (Lead, 2026-10-08 — tras los pasos 5-9)

Los pasos anteriores fueron completados por el Lead: docs + ejemplo, nav de
mkdocs, ADR-0012, concept record, benchmark de 6 escenarios, history y
roadmap. Se añadieron 2 fixtures de dispatch (`kaggle_not_imported.error`,
`kaggle_unknown_function.error`) para cumplir la validación "un-imported usage
raises correctly" de la skill create-library. Corrección de revisión: los
snippets `machine.kmeans(datos, 3)` de `docs/bibliotecas/kaggle.md`,
`huggingface.md` y el concept record se corrigieron a
`MACHINE model = machine.kmeans(3); model.fit(...);` (la fábrica no acepta la
matriz como argumento).

**Cifras definitivas** (tras los 2 fixtures de dispatch): suite completa
`pytest tests/ -q` → **577 passed, 1 skipped**; enfocada
`tests/test_KafeKaggle.py tests/test_KafeKaggle_backend.py -q` → **32 passed**.
Los números 575/30 de este informe describen el estado previo a ese addendum.
