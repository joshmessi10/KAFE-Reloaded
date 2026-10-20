# Impact Analysis — KafeKAGGLE: interfaz genérica de ingesta de imágenes (reemplaza `load_cifar10`)

**Fecha:** 2026-10-13
**Feature:** KafeKAGGLE — interfaz genérica de ingesta de imágenes
**Run by:** Lead/Arquitecto (comando `/impact`)
**Related:** ADR-0013 (`kagglehub`), ADR-0017 (split estratificado), ADR-0011/0012 (Conv2D / datos de imagen en formato CHW)
**Estado:** diseño propuesto formalizado; **1 conflicto de compatibilidad bloqueante detectado** (ver Hallazgos H2) que exige una decisión antes de implementar.

---

## Contexto

El backlog registra la apertura de la feature "KafeKAGGLE — interfaz genérica de ingesta de imágenes (reemplaza `load_cifar10`)" (`.opencode/progress/backlog.md:24`). Existe hoy un cargador experimental `load_cifar10` en `src/lib/KafeKaggle/funciones.py:441` con helpers específicos de CIFAR (`_require_cifar_image_dependencies`, `_find_file_by_name`, `_extract_7z_if_needed`, `_find_cifar_train_directory`, `_read_cifar_labels`, `_load_cifar_image`), sin tests ni documentación; sólo lo referencia `src/Ejemplo.kf:17` y `src/lib/KafeKaggle/__init__.py:2`. El objetivo es sustituirlo por una API de imágenes desacoplada de datasets concretos.

## Diseño propuesto (a formalizar)

Se reemplaza `load_cifar10` por **tres funciones públicas** en `src/lib/KafeKaggle/funciones.py`, con retorno compatible con GESHA/Conv2D en formato `[C,H,W]` (canal, alto, ancho, ADR-0011) y píxeles normalizados a `[0,1]`:

1. `load_image(dataset_name, image_path, height=32, width=32, color_mode="rgb") → List[List[List[FLOAT]]]` (una imagen `[C,H,W]`).
2. `load_images(dataset_name, height=32, width=32, color_mode="rgb", limit=0) → List[List[List[List[FLOAT]]]]` (todas las imágenes, orden determinista; `limit=0` = todas).
3. `load_image_dataset(dataset_name, labels_file, height=32, width=32, color_mode="rgb", limit=0) → [X, y]` (X imágenes `[C,H,W]` alineadas con `y` etiquetas `INT` codificadas ordenadamente; el usuario divide después).

Detalles a conservar del diseño: `color_mode` `"rgb"`→3 canales (`convert("RGB")`), `"gray"`/`"grayscale"`→1 canal (`convert("L")`), otro valor→error educativo en español; descubrimiento recursivo de `.png/.jpg/.jpeg/.bmp` ignorando `__MACOSX` y dotfiles (política de `_extract_table`, `funciones.py:249`), ordenando rutas relativas; extracción de archivos comprimidos anidados (`.zip` con `zipfile` stdlib, `.7z` con `py7zr` opcional) vía `_ensure_images_extracted`/`_find_images`; redimensionado con `PIL.Image.resize` a `(width, height)` con verificación de tamaño; dependencias opcionales `Pillow` y `py7zr` con auto-instalación (patrón `_require_cifar_image_dependencies`, renombrado `_require_image_dependencies`); etiquetas en `load_image_dataset` leídas con `csv` estándar, detección de columnas id/etiqueta por nombre, emparejamiento por stem y codificación 0..N-1 con error educativo si no se detectan; eliminación de `load_cifar10` y helpers CIFAR; actualización de `__init__.py` y `src/Ejemplo.kf`.

El diseño se considera **correcto en su objetivo** (desacoplar KafeKAGGLE de datasets concretos y reutilizar `_download_dataset`/ADR-0013). Se formaliza con dos correcciones justificadas (H1, H2) y se recomiendan alternativas donde aplica.

## Hallazgos de verificación en código

- **H1 — Aridad de `load_image` inconsistente con sus defaults.** El diseño declara aridades `[4,5]` para `load_image`, pero la firma propuesta tiene sólo 2 argumentos obligatorios (`dataset_name`, `image_path`) con `height/width/color_mode` por defecto. Con `@check_sig([4,5], ...)` las llamadas de 2 o 3 argumentos fallarían pese a los defaults. **Corrección propuesta: aridades `[2,3,4,5]`** con tipos `[cadena_t, cadena_t, entero_t, entero_t, cadena_t]` (formato posicional de `check_sig`, `src/global_utils.py:79`). Las de `load_images` `[1..5]` y `load_image_dataset` `[2..6]` sí son consistentes con sus firmas.
- **H2 — CONFLICTO BLOQUEANTE: `machine.stratified_train_test_split` no acepta X de 4 dimensiones.** El diseño encomienda al usuario dividir con `machine.stratified_train_test_split(X, y, test_size, seed)`, pero esa función está decorada con `@check_sig({2:[matriz_numeros_t, vector_numeros_t], 3:[...], 4:[...]})` (`src/lib/KafeMACHINE/funciones.py:265`), donde `matriz_numeros_t = [List[List[INT]], List[List[FLOAT]]]` (`src/TypeUtils.py:54`). Un tensor de imágenes `List[List[List[List[FLOAT]]]]` **no** coincide con `List[List[FLOAT]]`; `esTipoCorrecto` (`src/global_utils.py:4`) compara tipos construidos por anidamiento, por lo que la llamada lanzará `raiseFunctionIncorrectArgumentType`. **Conclusión: el uso declarado en `Ejemplo.kf` tal como está redactado NO funciona hoy.** Ver "Alternativas consideradas" (A1/A2/A3).
- **H3 — Acoplamiento preexistente a KafeMACHINE.** `load_cifar10` importa `TrainTestSplit` de `KafeMACHINE` (`funciones.py:498`). La propuesta lo elimina: eliminar ese import es una mejora real de desacoplamiento (bueno), pero sólo es utilizable si se resuelve H2.
- **H4 — Formato de retorno correcto.** GESHA/Conv2D consume CHW/FCHW (ADR-0011; `.opencode/knowledge/dl-library.md:65`), de modo que `[C,H,W]` con píxeles en `[0,1]` es el contrato correcto. `Model.fit` (`src/lib/KafeGESHA/models.py:124`) no valida forma con `check_sig`, por lo que el 4D de imágenes es admisible en el entrenamiento.
- **H5 — Descubrimiento/extracción reutilizable.** La política de `_extract_table` (walk recursivo, skip `__MACOSX`/dotfiles, rutas relativas con `/`, ordenadas) es reutilizable para imágenes; `_extract_7z_if_needed` y `_find_file_by_name` son la base para `_ensure_images_extracted`/`_find_images`.
- **H6 — `@check_sig` valida antes del cuerpo.** Los errores de aridad/tipo se producen antes de cualquier acceso a red; en cambio, la validación de `color_mode` y de parámetros de etiquetas ocurriría **después** de `_download_dataset` si se implementa ingenuamente. Para poder tener fixtures de error offline, esas validaciones deben hacerse **antes** de la descarga (ver Testing Impact).
- **H7 — Sin cambios de gramática ni de registro.** El dispatch de librerías es dinámico por nombre (`src/componentes_lenguaje/librerias/funciones.py`); `EvalVisitorPrimitivo.py:52,68` sólo importa el módulo y registra `"kaggle"`. Añadir/quitar funciones no toca `EvalVisitorPrimitivo.py` ni la gramática. `TypeUtils.py` no necesita cambios (las imágenes son listas anidadas genéricas).

## Affected Modules

- `src/lib/KafeKaggle/funciones.py` (único módulo `src/` con cambios funcionales):
  - **Añadir** 3 funciones públicas (`load_image`, `load_images`, `load_image_dataset`) y helpers (`_require_image_dependencies`, `_ensure_images_extracted`, `_find_images`, `_load_image_nd`/conversión `[C,H,W]`, `_read_image_labels`, `_detect_label_columns`).
  - **Eliminar** `load_cifar10` y los helpers CIFAR (`_require_cifar_image_dependencies`, `_find_cifar_train_directory`, `_read_cifar_labels`, `_load_cifar_image`); conservar/renombrar `_find_file_by_name` y `_extract_7z_if_needed` como base de `_find_images`/`_ensure_images_extracted`.
  - **Reutilizar sin cambios** `_download_dataset`, `_validate_dataset_name`, `_require_kagglehub`, `_tiene_credenciales`, `_silenciar_logs_kagglehub`, y la política de walk de `_extract_table`.
- `src/lib/KafeKaggle/__init__.py` — actualizar imports/`__all__` (quitar `load_cifar10`, añadir las 3 nuevas).
- `src/Ejemplo.kf` — migrar de `kaggle.load_cifar10(...)` a `kaggle.load_image_dataset(...)` + división estratificada (sujeto a H2).
- `src/lib/KafeMACHINE/funciones.py` + `src/lib/KafeMACHINE/model_selection/model_selection.py` — **sólo si se elige la alternativa A1** (relajar `check_sig` de `train_test_split`/`stratified_train_test_split` para aceptar X de anidamiento arbitrario). En caso contrario, sin cambios.
- `tests/test_KafeKaggle_backend.py` — nuevos tests unitarios de imágenes (offline).
- `tests/KafeKaggle/` — nuevos fixtures `.kf`/`.error.kf` (aridad, tipo, `color_mode`) y `.kf.example` de red.
- Docs/conocimiento/registro: `docs/bibliotecas/kaggle.md`, `mkdocs.yml` (si se añade ejemplo navegable), `.opencode/knowledge/concepts/kaggle-dataset-ingestion.md` (o nuevo `kaggle-image-ingestion.md`), `.opencode/knowledge/libraries.md`, `.opencode/adr/decisions.md` (nuevo ADR), `.opencode/history/2026/2026-10.md`, `.opencode/progress/roadmap.md`, `.opencode/benchmarks/kafekaggle.py` + `records.md`.
- `src/EvalVisitorPrimitivo.py`, `src/TypeUtils.py`, `src/Kafe_Grammar.g4`, `src/Kafe_Lexer.g4` — **sin cambios** (confirmado en H7).

## Risks

- **R1 (bloqueante, H2) — División estratificada de imágenes no tipable.** `machine.stratified_train_test_split` rechaza X 4D por `check_sig`. Mitigación: decidir A1/A2/A3 antes de implementar (ver Alternativas). No implementar el `Ejemplo.kf` propuesto sin resolver esto, o fallará en tiempo de ejecución con error de tipo KAFE.
- **R2 — Dependencias nuevas `Pillow` y `py7zr` con auto-instalación.** Permitidas bajo la Dependency Policy: no son implementaciones de algoritmos ML, sino utilidades de E/S; precedente `kagglehub`/`datasets` (ADR-0012/0013). `Pillow` es la vía estándar de decodificación/redimensionado de imágenes (la stdlib no decodifica PNG/JPG) y `py7zr` es necesario sólo para `.7z` anidado. Mitigación: mantenerlas opcionales y diferidas, con mensaje en español y fallback manual; documentar en el ADR. Riesgo residual: deriva de versión sin pin (política existente) y que `Pillow` es relativamente pesada.
- **R3 — Memoria O(N·C·H·W) con listas anidadas de Python.** Cada píxel es un `float` boxed; ~4000 imágenes CIFAR 3×32×32 ≈ cientos de MB, y el train completo (50k) ≈ GBs. `load_images`/`load_image_dataset` materializan todo. Mitigación: `limit` (default 0 documentado con advertencia), documentar la residencia en memoria, recomendar `limit` en conjuntos grandes; el benchmark debe medir el pico con `tracemalloc`.
- **R4 — Descarga/caché de `kagglehub`.** Primera descarga de CIFAR-10 puede ser pesada (decenas–cientos de MB) y `~/.cache/kagglehub` no tiene evicción (limitación ya documentada en el concept record). Mitigación: se reutiliza `_download_dataset`/caché de ADR-0013; documentar.
- **R5 — Extracción de `.7z` lenta y seguridad de archivos no confiables.** `py7zr` (y `zipfile`) sobre archivos publicados por terceros: extracción lenta y riesgo de *path traversal* (entradas `../` o absolutas). Mitigación: extraer sólo bajo un destino controlado, normalizar/validar rutas y descartar entradas fuera del destino; documentar. (El benchmark debe registrar el costo de extracción.)
- **R6 — Etiquetas no emparejadas.** `load_image_dataset` empareja por stem contra la columna id; riesgo de desajustes por tipo (ids enteros `1` vs stems con ceros a la izquierda `00001`), duplicados, filas de etiqueta sin imagen o imágenes sin etiqueta. Mitigación: normalizar a cadena antes de comparar, reportar en el error educativo los conteos (emparejadas/no emparejadas) y fallar cuando falten etiquetas para las imágenes cargadas.
- **R7 — Ambigüedad de `image_path` en `load_image`.** El usuario pasa una ruta; si sólo se usa el basename (como `_find_file_by_name`), pueden existir homónimos en subdirectorios. Mitigación: resolver primero como ruta relativa exacta dentro del directorio extraído y, sólo si no existe, por nombre, con error de ambigüedad (mismo criterio que `_resolve_file`, `funciones.py:162`).
- **R8 — Determinismo.** El orden debe derivarse de rutas relativas ordenadas; la extracción de archivos anidados podría introducir orden dependiente del sistema. Mitigación: ordenar explícitamente la lista de imágenes antes de devolver y documentar el criterio.
- **R9 — `color_mode` inválido y modos con alfa.** PNG en paleta/RGBA: `convert("RGB")` descarta alfa correctamente; un `color_mode` desconocido debe producir error educativo. Mitigación: validar y normalizar `color_mode` (minúsculas) **antes** de descargar (H6), y verificar el número de canales final.
- **R10 — Divergencia de política de skip.** Reutilizar la política `__MACOSX`/dotfiles es consistente con `_extract_table`; cualquier desvío (p. ej. aceptar dotfiles) rompería homogeneidad. Mitigación: extraer la política a un helper compartido o replicarla idénticamente y cubrirla con test.

## Compatibility Impact

- **API pública KAFE:** se **elimina** `load_cifar10` — *breaking change*, pero de un símbolo **experimental, sin tests ni docs**, referenciado sólo por `src/lib/KafeKaggle/__init__.py:2` y `src/Ejemplo.kf:17`. Migración: reescribir `Ejemplo.kf` y el `__init__.py`. Aceptable.
- **API tabular intacta:** `load_dataset`, `load_dataset_split`, `load_dataset_matrix` no cambian de firma ni semántica.
- **Gramática y registro:** sin cambios (H7). `EvalVisitorPrimitivo.py` y `TypeUtils.py` no se tocan.
- **Nuevas funciones:** añaden API; no rompen programas existentes. Los tipos/aridades (`@check_sig`) deben ser consistentes con los defaults (H1).
- **`requirements.txt`:** sin cambios (dependencias opcionales on-demand, como `kagglehub`/`datasets`).
- **Si se elige A1:** relajar `check_sig` de `train_test_split`/`stratified_train_test_split` para aceptar X de anidamiento arbitrario es **retrocompatible** (acepta más tipos), pero modifica el contrato público de KafeMACHINE ⇒ requiere actualizar ADR-0017 y pruebas; y hay que confirmar que `model_selection.py` no asume 2D en el cuerpo (usa `X[i]` por índice, que sirve también para 4D).
- **`Ejemplo.kf`:** el flujo CIFAR-10 sólo es válido si se resuelve H2; en caso contrario, el ejemplo debe ajustarse a la alternativa elegida.

## Documentation Impact

- `docs/bibliotecas/kaggle.md` — nueva sección "Ingesta de imágenes": 3 funciones, formato `[C,H,W]`, `color_mode`, `limit`, dependencias opcionales (`Pillow`/`py7zr`), memoria y determinismo; aclarar que la división se hace fuera de KafeKAGGLE.
- `.opencode/knowledge/concepts/kaggle-dataset-ingestion.md` — ampliar con el caso imagen (o crear `kaggle-image-ingestion.md`): fundamento (decodificación → reescalado → normalización `[0,1]` → transposición a `[C,H,W]`; $\frac{p}{255}$), complejidad tiempo/espacio $O(N\cdot C\cdot H\cdot W)$, algoritmo paso a paso, ventajas/límites, relación con KAFE.
- `.opencode/knowledge/libraries.md:36` — actualizar la entrada de `KafeKaggle` (nuevas funciones y dependencias opcionales `Pillow`/`py7zr`).
- `.opencode/adr/decisions.md` — **ADR nuevo** (obligatorio): nueva API pública, dependencias opcionales aceptadas, eliminación de `load_cifar10`, y la decisión sobre la división (H2/A1). Si se toca KafeMACHINE, referenciar/actualizar ADR-0017.
- `.opencode/history/2026/2026-10.md` — entrada del cambio significativo.
- `.opencode/progress/roadmap.md` — anotar la feature al completarse.
- `mkdocs.yml` — sólo si se añade un ejemplo de imágenes navegable en `docs/ejemplos/`.
- `.opencode/benchmarks/kafekaggle.py` + `records.md` — escenarios de imagen con mediciones reales (recomendado; la feature es sensible a rendimiento/memoria).

## Testing Impact

- **Unitarios offline (`tests/test_KafeKaggle_backend.py`)** con `monkeypatch`:
  - Parchear `_download_dataset` a un directorio `tmp_path` preparado y `_require_image_dependencies` a no-op con un doble de módulo de imagen; **nunca** red ni `pip`.
  - Generar PNG sintéticos (con Pillow en `tmp_path`): verificar forma `[C,H,W]`, rango `[0,1]`, `color_mode="rgb"`→3 canales, `"gray"`/`"grayscale"`→1 canal, redimensionado a `(width,height)`, orden determinista, `limit=0` vs `limit=k`, y `image_path` (ruta exacta y ambigüedad por nombre).
  - `load_image_dataset`: detección de columnas id/etiqueta, emparejamiento por stem (ids enteros vs string), codificación ordenada `0..N-1`, y **error** ante etiquetas no emparejadas / columnas no detectadas.
  - Extracción anidada: `.zip` real con `zipfile`; `.7z` con fake de `py7zr` (o `skipif` si `py7zr` no está instalado) y verificación de seguridad (rutas fuera del destino rechazadas).
  - Skip de `__MACOSX`/dotfiles y error de directorio vacío.
  - `color_mode` inválido y parámetros inválidos deben fallar **antes** de `_download_dataset` (H6): asertar que la descarga no se llamó.
- **Fixtures `.kf`**:
  - `load_image`/`load_images`/`load_image_dataset` con aridad incorrecta y tipo incorrecto (errores de `check_sig`, sin red).
  - `color_mode` inválido: falla por validación previa a la descarga (sin red). *Requiere implementar H6.*
- **Escenarios de red** fuera de pytest: `tests/KafeKaggle/kaggle_load_images.kf.example`, `kaggle_load_image_dataset.kf.example` (+ `.expec.example`) usando `ayush1220/cifar10`.
- **Benchmark (recomendado):** ampliar `.opencode/benchmarks/kafekaggle.py` con escenarios de imágenes (p. ej. `load_images` con N=8/64/256 en `tmp_path`, `gray` vs `rgb`, `limit`), midiendo tiempo y pico de memoria; registrar en `records.md`.
- **Suite completa:** `pytest tests/ -q` debe quedar verde (baseline actual); los fixtures/unit nuevos no deben tocar red. Verificación por paso antes de continuar.

## Implementation Plan

1. **Aprobar el diseño formalizado** con H1 (aridades `[2,3,4,5]` en `load_image`) y **decidir H2** (A1/A2/A3). Persistir el ADR base (API, dependencias, eliminación).
2. **Resolver H2.** Si A1: extender `@check_sig` de `train_test_split`/`stratified_train_test_split` para aceptar X de anidamiento arbitrario, con su propio impacto/ADR-0017 y tests; verificar `pytest tests/test_KafeMACHINE.py -q`. Si A2/A3: ajustar el diseño de `Ejemplo.kf`.
3. **Builder:** reescribir `src/lib/KafeKaggle/funciones.py` (3 funciones + helpers; validar `color_mode`/labels/params **antes** de `_download_dataset`; extracción segura de archivos anidados; orden determinista). Verificar con `pytest tests/test_KafeKaggle_backend.py -q`.
4. **Actualizar** `src/lib/KafeKaggle/__init__.py` (exports) y `src/Ejemplo.kf` (nuevo flujo CIFAR-10). Verificar que `import kaggle;` y el ejemplo compilan.
5. **Añadir fixtures** `.kf`/`.error.kf` y `.kf.example`; ejecutar `pytest tests/test_KafeKaggle.py tests/test_KafeKaggle_backend.py -q`.
6. **Documentación:** `docs/bibliotecas/kaggle.md`, concept record, `libraries.md`, `history/2026/2026-10.md`, `roadmap.md`, y benchmark `kafekaggle.py` + `records.md`.
7. **Gate completo:** `pytest tests/ -q` en verde.
8. **Reviewer:** `/dod`; luego cierre con `/close`.

**Verificación por paso:** cada paso debe dejar su subconjunto de pruebas en verde antes de pasar al siguiente; el paso 7 es el gate de suite completa; el escenario de red `*.kf.example` es la validación de extremo a extremo (fuera de CI).

## Alternativas consideradas

- **A1 (recomendada, si se quiere mantener el desacoplamiento y el `Ejemplo.kf` propuesto) — Relajar el tipo de X en el split de KafeMACHINE.** Añadir a `check_sig` de `train_test_split`/`stratified_train_test_split` un tipo que admita listas de anidamiento arbitrario (p. ej. reutilizar `lista_cualquiera_t` de `TypeUtils.py:68` para X, manteniendo `vector_numeros_t` para y). Pros: conserva KafeKAGGLE desacoplado y hace el split utilizable con imágenes; el cuerpo indexa `X[i]`, válido para 4D. Contras: toca el contrato público de KafeMACHINE ⇒ requiere impacto/ADR-0017 y pruebas; hay que confirmar que no se relaja de más la validación de tipos.
- **A2 — Mantener la división dentro de KafeKAGGLE (una cuarta función o que `load_image_dataset` devuelva `TrainTestSplit`).** Pros: funciona hoy sin tocar KafeMACHINE. Contras: **contradice el objetivo explícito** de desacoplar KafeKAGGLE de KafeMACHINE (reintroduce el acoplamiento que tenía `load_cifar10`, H3) y duplica responsabilidades. No recomendada.
- **A3 (interina, sin cambios en KafeMACHINE) — `load_image_dataset` devuelve `[X, y]` y el usuario divide las etiquetas/índices.** Pros: desacoplado. Contras: KAFE no ofrece una primitiva de *gather* por índices, por lo que alinear imágenes y etiquetas tras el split sobre y no es viable sin A1; implicaría exponer índices o una función adicional. Sólo como plan B si no se aprueba A1.
- **Carga perezosa de imágenes (evitar R3).** Un iterador/generador no encaja con el retorno `List[...]` de KAFE; se descarta en favor de `limit` + documentación.
- **Decodificar imágenes sin Pillow.** No hay decodificación de PNG/JPG en la stdlib; se descarta por inviable. `py7zr` sólo se usa para `.7z` anidado y queda como dependencia opcional con fallback.
