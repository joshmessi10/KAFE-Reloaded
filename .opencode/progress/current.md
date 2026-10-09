# Current Work

## Feature: KafeKAGGLE v2 — cliente `kagglehub` (datasets públicos sin credenciales)

**Status:** Implemented, verified and DoD APPROVED (Reviewer, 2026-10-08 → `progress/review-kafekaggle-v2.md`); pendiente `/close`

**Feature:** Rediseñar el cliente por debajo de KafeKAGGLE: reemplazar la librería oficial `kaggle` (KaggleApi, credenciales obligatorias) por **`kagglehub`** (cliente oficial moderno, el que usa Colab), de modo que los datasets **públicos** se descarguen **sin credenciales** (verificado en vivo: descarga fría anónima de `uciml/iris` desde un `.kf`, stdout limpio). Las credenciales (`kaggle.json`, `KAGGLE_USERNAME`/`KAGGLE_KEY`, Colab secrets) siguen siendo opcionales y solo necesarias para datasets privados. API pública KAFE intacta: `import kaggle;`, `load_dataset`, `load_dataset_split`, `load_dataset_matrix`.

**Changes (Builder + Lead):**
- `src/lib/KafeKaggle/funciones.py`: cliente `kagglehub` (`_KAGGLEHUB_AVAILABLE`, `_require_kagglehub()` auto-install, `_tiene_credenciales()` predicate, `_download_dataset(dataset_name)` → directorio extraído con `redirect_stdout` + `_silenciar_logs_kagglehub()` — fix del leak de `logger.info` a stdout (kagglehub ata un `StreamHandler(sys.stdout)` al importarse), `_extract_table` con walk recursivo (sin `zipfile`/`tempfile`), docstrings actualizados
- `tests/test_KafeKaggle_backend.py`: 27 → 35 unit tests offline (dir-based, predicado de credenciales, hint de error, subdirectorios, stdout limpio, logs del cliente silenciados); fixtures `.kf` intactos
- Docs/ADR: `docs/bibliotecas/kaggle.md` (públicos sin credenciales + caché), **ADR-0013** (supresión parcial de ADR-0012), concept record, `libraries.md`, `CLAUDE.md`, history `2026-10.md`, roadmap
- Benchmark: `kafekaggle.py` a firma nueva (S5 directorio), re-ejecutado, `records.md` actualizado

**Test results:** enfocados `tests/test_KafeKaggle*.py` → **40 passed** (5 fixtures + 35 unit). Suite completa `pytest tests/ -q` → **585 passed, 1 skipped** (baseline 577/1, +8). Demo en vivo sin credenciales: descarga fría anónima OK, stdout solo con la salida del programa.

**Current step:** `/dod` aprobado (CHANGES_REQUESTED → 3 fixes documentales → APPROVED)
**Next step:** Historian `/close` (session-log, reset de current.md)
**Blockers:** Ninguno
**Related ADRs:** ADR-0013 (nueva; ADR-0012 queda parcialmente supresada)

---

## Notes:

- Evidencia previa (2026-10-08, sesión KafeKAGGLE v1): suite 577 passed, 1 skipped; DoD APPROVED.
- Hallazgos en vivo que motivan este cambio: gate de credenciales bloqueaba datasets públicos (la API los sirve anónimos: HTTP 200 verificado); `kaggle 2.2.4` imprimía ayuda en inglés al importar sin credenciales; `kagglehub` funciona anónimo y soporta las mismas fuentes de credenciales (kaggle.json, env vars, Colab secrets).
- Bug latente encontrado y corregido en la demo en vivo: los `logger.info` de kagglehub escribían a stdout porque el handler se crea con el objeto stdout al importar; corregido con `_silenciar_logs_kagglehub()` + test.
