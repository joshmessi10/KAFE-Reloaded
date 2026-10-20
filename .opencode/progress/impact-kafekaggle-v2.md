# Impact Analysis — KafeKAGGLE v2: swap de cliente `kaggle` → `kagglehub`

**Date:** 2026-10-08
**Feature:** KafeKAGGLE v2 — datasets públicos de Kaggle sin credenciales
**Run by:** Lead en rol Architect (el subagente `architect` falló por restricción de tier, segunda vez consecutiva)
**Related:** ADR-0012 (decisión de cliente, a ser supresada parcialmente), ADR-0013 (nueva)

## Contexto empírico (verificado en vivo, 2026-10-08)

- `kagglehub 1.0.2` descargó y extrajo `uciml/iris` **sin** `KAGGLE_USERNAME`/`KAGGLE_KEY`/`kaggle.json` → `C:\Users\Luzmy\.cache\kagglehub\datasets\uciml\iris\versions\2`.
- GET anónimo a `https://www.kaggle.com/api/v1/datasets/download/uciml/iris` → HTTP 200 `application/zip`.
- `kagglehub.config` soporta las **mismas** fuentes de credenciales que `kaggle`: `kaggle.json`, env vars `KAGGLE_USERNAME`/`KAGGLE_KEY` y **Colab secrets** → datasets privados siguen soportados (credenciales opcionales).
- `kagglehub.dataset_download(handle)` retorna el **directorio extraído** (cache persistente), no un ZIP en un directorio elegido.
- `kaggle 2.2.4` imprime una ayuda en inglés ("Authentication required…") a stdout al importar sin credenciales → contamina la salida de los programas KAFE.
- `_check_credentials()` actual bloquea **antes** de descargar → datasets públicos imposibles sin credenciales.

## Affected Modules

- `src/lib/KafeKaggle/funciones.py` — swap completo del cliente (único módulo `src/` afectado):
  - import de módulo: `from kaggle import KaggleApi` → `import kagglehub` (guard `try/except ImportError`, patrón idéntico)
  - `_KAGGLE_AVAILABLE`/`KaggleApi` → `_KAGGLEHUB_AVAILABLE`/`kagglehub`
  - `_require_kaggle()` → `_require_kagglehub()` (auto-install vía pip, espejo de `_require_hf()`)
  - `_download_dataset(dataset_name, dest_dir)` → `_download_dataset(dataset_name)` retorna el directorio extraído por `kagglehub.dataset_download` (elimina `TemporaryDirectory`/ZIP)
  - `_check_credentials()` pre-gate → `_tiene_credenciales()` **predicate** usado solo en la ruta de error (hint en español para datasets privados)
  - `_extract_table(archivo, ...)` → opera sobre **directorio** (walk recursivo, skip `__MACOSX`/dotfiles) + rama CSV suelto; se elimina la rama `zipfile` (con kagglehub ya no hay ZIP)
  - imports: baja `zipfile`/`redirect_stdout` (si ya no se usan), permanece `subprocess` (auto-install)
- `src/EvalVisitorPrimitivo.py` — **sin cambios** (registro `"kaggle": [module, False]` intacto)
- `tests/test_KafeKaggle_backend.py` — rework de la mayoría de los 27 unit tests (ver Testing Impact)
- `tests/test_KafeKaggle.py` + `tests/KafeKaggle/*.kf` — **sin cambios** (los 5 fixtures no tocan red: validación de nombre, `check_sig`, no-importado, función desconocida, import)
- `.opencode/benchmarks/kafekaggle.py` — `fake_download` usa la firma vieja `_download_dataset(dataset_name, dest_dir)`; ajustar a la nueva (2 líneas)
- Docs/conocimiento: `docs/bibliotecas/kaggle.md`, `mkdocs.yml` (sin cambios de nav), `.opencode/knowledge/libraries.md`, `.opencode/knowledge/concepts/kaggle-dataset-ingestion.md`, `CLAUDE.md` (fila de tabla)
- Registro: `.opencode/adr/decisions.md` (ADR-0013), `.opencode/history/2026/2026-10.md`, `.opencode/progress/roadmap.md` (anotar v2), `progress/report`/`review` de esta feature

## Risks

- **Red en CI**: kagglehub no está en `requirements.txt` (igual que `datasets`/`kaggle`); los tests unitarios deben parchear `_require_kagglehub` **y** `_download_dataset` para que ningún test toque red ni dispare pip. Mitigación: mismo patrón que ya probó verde en CI con `kaggle`.
- **Import del módulo en CI sin kagglehub instalado**: guard `try/except ImportError` → `_KAGGLEHUB_AVAILABLE=False`; los fixtures `.kf` solo hacen `import kaggle;` (registro del intérprete, no del paquete) → verificado que pasan sin el paquete.
- **Deriva de versión**: auto-install sin pin (política existente de `datasets`/`kaggle`); documentado en ADR-0013.
- **Subdirectorios / múltiples CSV**: `_select_file` ya resuelve ambigüedad con error claro; el walk recursivo replica la semántica de `zipfile.namelist()` (rutas relativas con `/`).
- **Salida stderr de progreso** (tqdm de kagglehub): no contamina stdout; se mantiene/añade asersión `capsys.readouterr().out == ""`.
- **Windows**: rutas relativas con `os.path` al listar; matching de miembros en formato posix (como hacía `namelist()`); los tests ya cubren BOM/encoding.
- **Cache del usuario**: `~/.cache/kagglehub` persiste entre corridas (ventaja: descargas repetidas instantáneas); los benchmarks usan fake download y no la tocan.

## Compatibility Impact

- **API pública KAFE: intacta.** `import kaggle;`, `load_dataset(ds, file="")`, `load_dataset_split(ds, file, split="")`, `load_dataset_matrix(ds, cols, split, limit)` — mismas firmas y `@check_sig`. Gramática sin cambios.
- Cambios visibles para el usuario:
  1. Datasets **públicos sin credenciales** (antes: error bloqueante).
  2. Datasets privados: credenciales opcionales; el error, si ocurre, incluye hint en español (`kaggle.json` / env vars / Colab secrets).
  3. Descargas cacheadas en `~/.cache/kagglehub` (segunda corrida sin red aparente).
  4. Desaparece el texto de ayuda en inglés que `kaggle 2.2.4` imprimía al importar sin credenciales.
  5. Los `.kf` ya escritos siguen funcionando igual (firma idéntica).
- `requirements.txt`: **sin cambios** (kagglehub es dependencia opcional on-demand, como `datasets`).

## Documentation Impact

- `docs/bibliotecas/kaggle.md` — sección de credenciales reescrita: "datasets públicos: ninguna credencial; privados: opcionales"; snippet de ejemplo ya no implica credenciales; nota Colab.
- `.opencode/knowledge/concepts/kaggle-dataset-ingestion.md` — algoritmo paso a paso (paso de descarga: cliente kagglehub + cache), límite de credenciales actualizado.
- `.opencode/knowledge/libraries.md` — entrada de referencia: cliente `kagglehub`.
- `CLAUDE.md` — fila `KafeKaggle`: "optional `kaggle` dependency" → `kagglehub`.
- `.opencode/adr/decisions.md` — **ADR-0013** (nueva): cliente kagglehub; supresión parcial de ADR-0012 (la decisión "librería oficial `kaggle`" queda reemplazada; se conservan stdlib-csv, retorno PARDOS y semántica de `split`).
- `.opencode/history/2026/2026-10.md` — entrada nueva (cambio significativo).
- `.opencode/progress/roadmap.md` — anotar v2 junto a la fila existente.

## Testing Impact

- **Fixtures `.kf` (5): sin cambios** — no tocan el cliente.
- **Unit tests (`test_KafeKaggle_backend.py`, 27)** — mapeo:
  - *Sobreviven casi sin cambio*: `_parse_csv` (BOM, vacíos, recorte), `_select_file`/`_resolve_file` (nombre exacto, split, ambigüedad, no-CSV), `_validate_dataset_name`, conversión a PARDOS, límites de `load_dataset_matrix`.
  - *Reescribir*: tests de `FakeApi`/`KaggleApi` → parchear `kagglehub.dataset_download` (o `kg._download_dataset`) para que retorne un **directorio** preparado con `tmp_path`.
  - *Reescribir*: tests de `_check_credentials` → `_tiene_credenciales()` predicate + ruta de error: download falla sin credenciales ⇒ mensaje en español con hint.
  - *Reescribir*: `_require_kaggle` + `SubprocessFalso` → `_require_kagglehub` (mismo truco de subprocess falso).
  - *Añadir*: test de que `_extract_table` camina subdirectorios; test de que la salida stdout queda limpia (`capsys`) con el cliente nuevo.
- **Benchmark**: actualizar `fake_download` a la firma nueva; los 6 escenarios no cambian (siguen sin red).
- **Suite completa**: `pytest tests/ -q` debe mantener **577 passed, 1 skipped** (los tests reescritos conservan el conteo o lo incrementan).
- **Demo en vivo** (fuera de suite): `.kf` real con `uciml/iris` **sin credenciales** → PARDOS en stdout.

## Implementation Plan

1. Persistir este análisis (este archivo) y aprobar el diseño: `_download_dataset(dataset_name)` → directorio; `_tiene_credenciales()` como predicate de la ruta de error; walk recursivo en `_extract_table`; auto-install `_require_kagglehub`.
2. **Builder** (subagente, `src/**`): reescribir `src/lib/KafeKaggle/funciones.py` + adaptar `tests/test_KafeKaggle_backend.py` (y `tests/test_KafeKaggle.py` solo si hiciera falta); verificar con `pytest tests/test_KafeKaggle.py tests/test_KafeKaggle_backend.py -q`.
3. **Lead**: ajustar `.opencode/benchmarks/kafekaggle.py` (firma), docs (`kaggle.md`), concept record, `libraries.md`, `CLAUDE.md`, ADR-0013, history, roadmap.
4. **Lead/Tester**: suite completa `pytest tests/ -q` (gate: ≥577 passed, 1 skipped) + demo en vivo sin credenciales.
5. **Reviewer**: `/dod`.
6. Historian: cierre de sesión.

**Verification steps por paso:** cada paso deja la suite verde antes de pasar al siguiente; la demo final es la validación de extremo a extremo del requisito "datasets públicos sin credenciales".
