# Builder Report — KafeKAGGLE: interfaz genérica de ingesta de imágenes

**Date:** 2026-10-13
**Task:** Reemplazar `load_cifar10` por la API genérica `load_image` / `load_images` / `load_image_dataset` (per `.opencode/progress/impact-kafekaggle-images.md`, opción A1).
**Status:** Implemented and verified — handed off to Reviewer for `/dod`.

## Files created / modified

Created:
- `src/lib/KafeKaggle/dataset.py` — contenedor `ImageDataset` (X, y) indexable/iterable/medible.
- `tests/KafeKaggle/kaggle_load_image_wrong_arity.error.kf` + `.error.expec`
- `tests/KafeKaggle/kaggle_load_image_wrong_type.error.kf` + `.error.expec`
- `tests/KafeKaggle/kaggle_load_images_wrong_type.error.kf` + `.error.expec`
- `tests/KafeKaggle/kaggle_load_image_dataset_wrong_arity.error.kf` + `.error.expec`
- `tests/KafeKaggle/kaggle_load_image_color_mode.error.kf` + `.error.expec`
- `tests/KafeKaggle/kaggle_load_images.kf.example` + `.expec.example` (red)
- `tests/KafeKaggle/kaggle_load_image_dataset.kf.example` + `.expec.example` (red)
- `.opencode/progress/builder-kafekaggle-images.md` (este reporte)

Modified:
- `src/lib/KafeKaggle/funciones.py` — eliminado `load_cifar10` y helpers CIFAR; añadidas 3 funciones públicas + helpers de imagen; funciones tabulares intactas.
- `src/lib/KafeKaggle/__init__.py` — exports actualizados.
- `src/Ejemplo.kf` — migrado a `load_image_dataset` + `machine.stratified_train_test_split`.
- `src/lib/KafeMACHINE/funciones.py`, `src/lib/KafeMACHINE/model_selection/model_selection.py` — X de `train_test_split`/`stratified_train_test_split` relajado a `lista_cualquiera_t` (opción A1).
- `tests/test_KafeKaggle_backend.py` — +47 tests offline de imágenes.

Not modified: gramática, parsers ANTLR, `EvalVisitorPrimitivo.py`, `TypeUtils.py`, funciones tabulares de KafeKaggle.

## Public API implemented

```python
@check_sig([2, 3, 4, 5], [cadena_t], [cadena_t], [entero_t], [entero_t], [cadena_t])
def load_image(dataset_name, image_path, height=32, width=32, color_mode="rgb")   # -> List[List[List[FLOAT]]]

@check_sig([1, 2, 3, 4, 5], [cadena_t], [entero_t], [entero_t], [cadena_t], [entero_t])
def load_images(dataset_name, height=32, width=32, color_mode="rgb", limit=0)      # -> List[List[List[List[FLOAT]]]]

@check_sig([2, 3, 4, 5, 6], [cadena_t], [cadena_t], [entero_t], [entero_t], [cadena_t], [entero_t])
def load_image_dataset(dataset_name, labels_file, height=32, width=32, color_mode="rgb", limit=0)  # -> ImageDataset [X, y]
```

Design honored:
- `color_mode` `"rgb"`→3 canales (`convert("RGB")`); `"gray"`/`"grayscale"`→1 canal (`convert("L")`), normalizado en minúsculas; cualquier otro valor→error educativo en español. Validado **antes** de descargar.
- Reescalado con `PIL.Image.resize((width, height))` y normalización $p/255$ a `[0,1]`; layout CHW `[canal][alto][ancho]` que consume GESHA/Conv2D (ADR-0011).
- Descubrimiento recursivo de `.png/.jpg/.jpeg/.bmp` ignorando `__MACOSX` y dotfiles, con rutas relativas ordenadas (mismo criterio que `_extract_table`).
- Extracción de `.zip` anidados con `zipfile` (stdlib) y `.7z` con `py7zr` opcional mediante `_ensure_images_extracted`; idempotente y con guarda contra *path traversal* (`_safe_join` descarta entradas que salen del destino).
- Dependencias opcionales `Pillow`/`py7zr` con `_require_image_dependencies` (auto-instalación y mensaje manual en español, patrón `_require_kagglehub`).
- `load_image` resuelve primero la ruta relativa exacta y, si no existe, por basename, con error de ambigüedad que lista candidatos.
- `load_image_dataset` lee las etiquetas con `csv` estándar (`utf-8-sig`), detecta columnas id/etiqueta por nombre (`id/image/filename/file/name` y `label/class/category/target`), empareja por stem normalizado a cadena (tolera ids enteros `1` y con ceros `0002`) y codifica las clases en orden `0..N-1`.
- `limit=0` = todas; con `limit>0` se cargan imágenes hasta completar `limit` emparejadas.
- **Decisión de emparejamiento (H6/R6):** con `limit=0` se exige que toda imagen tenga etiqueta (error educativo con conteos `emparejadas=`/`no emparejadas=`); con `limit>0` se omiten las imágenes sin etiqueta y se falla sólo si no se empareja ninguna. Permite el flujo CIFAR con `limit=4000` sobre `train.7z` (que contiene imágenes extra sin etiqueta).
- Eliminado el acoplamiento a KafeMACHINE que tenía `load_cifar10`.

### KafeMACHINE (A1)

`train_test_split` y `stratified_train_test_split` cambian el tipo de su parámetro `X` de `matriz_numeros_t` a `lista_cualquiera_t`, de modo que aceptan tensores 4D de imágenes. Retrocompatible (acepta más tipos); los cuerpos indexan `X[i]`, válido para 4D. El tipo de `y` permanece `vector_numeros_t`.

## Verification (system Python 3.13.11, pytest 9.0.3, desde la raíz)

1. `python -m pytest tests/test_KafeKaggle_backend.py -q` → **64 passed** (sin warnings).
2. `python -m pytest tests/test_KafeKaggle.py -q` → **10 passed**.
3. `python -m pytest tests/test_KafeMACHINE.py -q` → **199 passed**.
4. Gate completo: `python -m pytest tests/ -q` → **628 passed, 2 skipped** (baseline previa del feature: 577 passed, 1 skipped; delta = +51 pruebas). El skip extra es preexistente.

Sin red ni `pip` en ninguna prueba: la descarga y las dependencias se sustituyen con `monkeypatch`.

## Fixtures / tests coverage

Fixtures offline descubiertas por pytest (errores de `check_sig` y de validación previa a la descarga):
- `kaggle_load_image_wrong_arity.error` / `kaggle_load_image_wrong_type.error` / `kaggle_load_images_wrong_type.error` / `kaggle_load_image_dataset_wrong_arity.error` (aridad y tipo).
- `kaggle_load_image_color_mode.error` (`"cmyk"` → falla antes de descargar).

Fixtures de red fuera de pytest (`.kf.example`): `kaggle_load_images.kf.example`, `kaggle_load_image_dataset.kf.example` sobre `ayush1220/cifar10`.

Tests backend (sin red, `tmp_path` + PNG sintéticos de Pillow):
- Forma `[C][H][W]`, rango `[0,1]`, redimensionado a `(width,height)`.
- `rgb`→3 canales; `gray`/`grayscale`→1 canal (parametrizado, incluida caja y espacios).
- Orden determinista y `limit=0` vs `limit=k`.
- `load_image` por ruta relativa exacta, por basename y error de ambigüedad; imagen inexistente.
- `load_image_dataset`: columnas `id/label` y `filename/class`, ids enteros vs con ceros, error con conteos ante etiquetas faltantes, `limit` que omite no etiquetadas, columnas no detectadas, CSV de etiquetas inexistente.
- Validaciones antes de descargar (`color_mode`, dimensiones, `limit`) asertando que `_download_dataset` no se llama.
- `.zip` real con `zipfile` (extracción idempotente), rechazo de *path traversal* (`../`), skip de `__MACOSX`/dotfiles, directorio sin imágenes.

## Gates status

- Suite completa (`pytest tests/ -q`): **PASS** (628 passed, 2 skipped).
- Regeneración ANTLR: **N/A** (gramática intacta).
- Ruff / tipado: **PENDIENTE** — herramientas no instaladas en el intérprete del sistema (gate no implementado en el repo).
- Sin supresiones `# noqa`/`TODO`/`FIXME` en archivos tocados.

## Out of scope for this session

- `docs/bibliotecas/kaggle.md` y ejemplo navegable (Lead/Builder).
- ADR-0018, `.opencode/knowledge/libraries.md`, concept record `kaggle-image-ingestion.md` (Architect).
- Benchmark de imágenes en `.opencode/benchmarks/kafekaggle.py` + `records.md` (Tester).
- History `2026-10.md`, roadmap, session log (Historian).

Nada se desvió del diseño aprobado; sin bloqueadores.
