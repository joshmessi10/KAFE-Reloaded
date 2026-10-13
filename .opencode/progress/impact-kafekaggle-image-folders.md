# Impact Analysis — KafeKAGGLE: ingesta robusta de datasets de imágenes (etiquetas por carpetas)

## Affected Modules

- `src/lib/KafeKaggle/funciones.py` — nueva función pública `load_image_folder_dataset`; helper de recorte de listas; acotado de mensajes en `_resolve_member`/`_resolve_file`/`_select_file`; verificación de descarga no vacía en `_download_dataset`.
- `src/lib/KafeKaggle/__init__.py` — reexportar `load_image_folder_dataset`.
- `src/Ejemplo.kf` — migrar al flujo por carpetas.
- `tests/test_KafeKaggle_backend.py` — tests herméticos nuevos.
- `tests/KafeKaggle/` — nuevas fixtures `.kf.example` + `.expec.example`.
- Docs/records: `docs/bibliotecas/kaggle.md`, `.opencode/knowledge/libraries.md`, `.opencode/knowledge/concepts/`, `.opencode/adr/decisions.md` (ADR-0019), `.opencode/history/2026/2026-10.md`, `.opencode/progress/roadmap.md`, `.opencode/benchmarks/records.md`.

No cambian: gramática (`*.g4`), `EvalVisitorPrimitivo.py`, `TypeUtils.py` (dispatch dinámico por nombre de librería).

## Risks

- **Muestreo no representativo**: rutas ordenadas → `limit` tomaría una sola clase. Mitigado con shuffle determinista (semilla fija) antes de decodificar.
- **Etiqueta ambigua por anidamiento**: carpetas wrapper (`cifar10/train/<clase>`). Mitigado derivando la etiqueta del directorio inmediato padre y filtrando por `split`.
- **Mensajes truncados** podrían romper tests que asertan contenido. Mitigado conservando los prefijos actuales.
- **Descarga vacía/parcial** (caché corrupta, extracción fallida). Mitigado verificando directorio no vacío y error educativo.
- **Memoria**: decodificar N imágenes `[3,32,32]` es O(N·C·H·W); `limit` acota.

## Compatibility Impact

- Cambio **aditivo**: nueva función pública; no se elimina ni cambia la firma de `load_image`/`load_images`/`load_image_dataset`/`load_dataset*`.
- Los mensajes de error cambian de longitud, no de prefijo → compatible con tests existentes.
- `src/Ejemplo.kf` cambia de `load_image_dataset` (CSV) a `load_image_folder_dataset`.
- Sin cambios de gramática ni de API del core.

## Documentation Impact

- `docs/bibliotecas/kaggle.md` — documentar la nueva función y el layout por carpetas.
- `.opencode/knowledge/libraries.md` — añadir la función al catálogo de KafeKAGGLE.
- `.opencode/knowledge/concepts/` — actualizar/crear el concept record de ingesta de imágenes con el modo carpetas.
- `.opencode/adr/decisions.md` — ADR-0019.
- `.opencode/history/2026/2026-10.md` — registro del evento.
- `.opencode/progress/roadmap.md` — marcar progreso.

## Testing Impact

- Nuevos tests en `tests/test_KafeKaggle_backend.py` (herméticos, con `_download_dataset` monkeypatcheado a un árbol temporal): etiquetas por carpeta y filtro `split`; basenames duplicados entre carpetas sin ambigüedad; `limit` determinista y representativo (varias clases); mensaje acotado al pedir un archivo inexistente en un dataset grande; `_download_dataset` con directorio vacío → error; extracción real de `.7z` con py7zr (skip si no está); e2e `load_image_folder_dataset` → `ImageDataset`, `X` `[N,3,H,W]` en [0,1], `y` en `[0,N-1]`.
- Fixtures de red: `tests/KafeKaggle/kaggle_load_image_folder_dataset.kf.example` + `.expec.example` (limit=4).
- Comandos: `pytest tests/test_KafeKaggle_backend.py -q` y `pytest tests/ -q`.

## Implementation Plan

1. Añadir helper de recorte de listas y usarlo en `_resolve_member`/`_resolve_file`/`_select_file` (conservar prefijos). Verificar: tests existentes verdes.
2. Verificar descarga/extracción en `_download_dataset` (dir existente y no vacío). Verificar: test de directorio vacío.
3. Implementar `load_image_folder_dataset` (etiqueta = padre; filtro `split`; shuffle determinista antes de `limit`; `_encode_labels`; `ImageDataset`; `@check_sig`). Exportar en `__init__.py`. Verificar: tests nuevos e2e.
4. Actualizar `src/Ejemplo.kf` y añadir fixtures. Verificar: e2e sobre caché CIFAR-10.
5. `pytest tests/ -q` verde.
6. Documentación + ADR + history + roadmap + benchmark.
