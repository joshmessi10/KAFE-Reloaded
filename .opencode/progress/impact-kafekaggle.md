# Impact Analysis — KafeKAGGLE (importación de datasets de Kaggle)

Fecha: 2026-10-08
Feature: nueva librería integrada `kaggle` (src/lib/KafeKaggle), análoga a KafeHF.
Solicitado por: Engineering Lead (usuario). Plantilla: `.opencode/templates/impact-analysis.md`.
Precedente: ADR-0010 (HuggingFace numeric ingestion). Skill asociada: `.opencode/skills/create-library/SKILL.md`.

## Contexto / Objetivo

KAFE permite importar datasets de Hugging Face mediante la librería integrada
`huggingface` (KafeHF). Se solicita una implementación análoga para Kaggle usando la
librería Python `kaggle`, de modo que los programas `.kf` puedan descargar datasets de
Kaggle con la misma superficie de API y el mismo patrón de dependencia opcional.

## Estado Actual (Analysis)

### Cómo funciona KafeHF (patrón a replicar)

- `src/lib/KafeHF/funciones.py`:
  - Import condicional `try: from datasets import load_dataset ... except ImportError` con flag `_HF_AVAILABLE` (líneas 27-32).
  - `_require_hf()` auto-instala vía `subprocess.run([sys.executable, "-m", "pip", "install", "datasets"], check=True, timeout=120, capture_output=True)` y levanta `Exception` con instrucción manual si falla (líneas 35-57).
  - `load_dataset(dataset_name)` → PARDOS `DataFrame` (split "train" por defecto) (líneas 60-108).
  - `load_dataset_split(dataset_name, split)` → PARDOS `DataFrame` (líneas 111-141).
  - `load_dataset_matrix(dataset_name, columns, split, limit)` → `List[List[FLOAT]]` compatible NUMK/GESHA, inferencia de columnas numéricas, `limit=0` = todas, sin DataFrame intermedio (líneas 145-194).
  - Decoradores `@check_sig` de `global_utils` con tipos de `TypeUtils` (`cadena_t`, `lista_cadenas_t`, `entero_t`).
  - `_convert_to_pardos()` importa `lib.KafePARDOS.DataFrame.DataFrame` de forma perezosa (líneas 215, 201-240).
- Registro en `src/EvalVisitorPrimitivo.py`: `import lib.KafeHF.funciones as hf_funcs_module` (línea 51) y `"huggingface": [hf_funcs_module, False]` en `self.libraries` (línea 66).
- Tests: `tests/test_KafeHF.py` (fixtures `.kf` + `.expec` offline, patrón `obtener_parametros`), `tests/test_KafeHF_backend.py` (unit tests con `monkeypatch` de `hf_load_dataset`/`_HF_AVAILABLE` — sin red), fixtures de red en `*.kf.example` (no ejecutados por el discovery).
- Docs: `docs/bibliotecas/huggingface.md`; ADR: `.opencode/adr/0010-huggingface-numeric-ingestion.md`.

### Qué falta

No existe ninguna librería `kaggle` ni módulo `src/lib/KafeKaggle/`. No hay registro,
tests, docs, ADR ni concept record para Kaggle.

## Affected Modules

Modificar:
- `src/EvalVisitorPrimitivo.py` — import del módulo (~línea 51) + registro `"kaggle": [kaggle_funcs_module, False]` (~línea 66).
- `.opencode/knowledge/libraries.md` — entrada en Registry y Library Reference.
- `.opencode/knowledge/ml-library.md` — solo si se documenta el API de ingesta (verificar convención).
- `docs/bibliotecas/kaggle.md` (nuevo, pero dentro de docs ya editables por el lead/builder según permisos).

Crear:
- `src/lib/KafeKaggle/__init__.py`
- `src/lib/KafeKaggle/funciones.py`
- `tests/KafeKaggle/` — fixtures `.kf`/`.expec` offline + `.kf.example` para red
- `tests/test_KafeKaggle.py` — patrón `obtener_parametros`
- `tests/test_KafeKaggle_backend.py` — unit tests con `monkeypatch` (sin red, sin credenciales)
- `docs/bibliotecas/kaggle.md`
- `.opencode/adr/0012-kaggle-dataset-ingestion.md`
- `.opencode/knowledge/concepts/kaggle-dataset-ingestion.md` (concept record)
- `.opencode/benchmarks/records.md` (registro de benchmark si aplica; la ingesta de red hace difícil 5 escenarios estables → justificar alternativa: escenarios con dataset local/mock)

No modificar:
- Gramática (`Kafe_Grammar.g4`, `Kafe_Lexer.g4`) — sin cambios de sintaxis; `import <lib>` ya es soportado.
- Archivos generados ANTLR.
- Número/orden de `src/lib/KafeHF/*` (referencia intacta).

## Risks

1. **Credenciales Kaggle (ALTO)** — la librería Python `kaggle` exige `~/.kaggle/kaggle.json` o `KAGGLE_USERNAME`/`KAGGLE_KEY`. Sin ellas, cualquier llamada real falla. *Mitigación*: fixtures de red como `.kf.example` (no descubiertas por pytest, precedente HF) + `_require_kaggle()` con mensaje de error claro que incluya el comando de configuración; unit tests con `monkeypatch` que no toquen red.
2. **Red/CI (ALTO)** — `.github/workflows/tests.yml` corre en ubuntu sin credenciales ni garantía de red. *Mitigación*: ningún test descubierto debe requerir red; skip/marcado `.example`.
3. **Auto-instalación en CI (MEDIO)** — `pip install kaggle` dentro de un test rompería la reproducibilidad. *Mitigación*: misma estrategia que HF — la auto-instalación solo se ejerce vía `.example`, no en la suite.
4. **Sistema de tipos (MEDIO)** — retorno PARDOS debe ser `DataFrame` real para que `TypeUtils.obtener_tipo_dato()` clasifique `PARDOS`; `load_dataset_matrix` retorna lista anidada (NUMK/GESHA). *Mitigación*: reutilizar `_convert_to_pardos()` con `lib.KafePARDOS.DataFrame.DataFrame`.
5. **Política de dependencias (MEDIO)** — dependencias prohibidas por defecto. *Justificación*: dependencia opcional de runtime con auto-instalación, precedente ADR-0010 (`datasets`); no es implementación de algoritmo ML externo (es un cliente de API de datos), no viola la regla de "no importar implementaciones de algoritmos".
6. **Encoding Windows (BAJO)** — mensajes de error en español + `subprocess` con `text=True`; el suite ya usa UTF-8. *Mitigación*: escribir fixtures con `encoding="utf-8"`.
7. **Colisión de nombre de clave (BAJO)** — clave de import `kaggle` coincide con el paquete Python homónimo; está confinado dentro de `src/lib/KafeKaggle/funciones.py`. Verificar que no exista ya otra librería con esa clave (Registry de `libraries.md`).

## Compatibility Impact

- API pública: adición pura (`import kaggle;` + 3 funciones). Sin breaking changes, sin migración.
- Gramática: sin cambios (no requiere regenerar parsers).
- Fixtures existentes: intactos. Baseline de suite hoy: **545 passed, 1 skipped**.

## Documentation Impact

- `docs/bibliotecas/kaggle.md` — guía análoga a `huggingface.md` (código KAFE + Python, auth, limitaciones de memoria).
- `.opencode/knowledge/libraries.md` — Registry + Library Reference.
- `.opencode/adr/0012-kaggle-dataset-ingestion.md` — decisión (usar librería `kaggle` oficial, dependencia opcional con auto-install, patrón espejo de ADR-0010).
- `.opencode/knowledge/concepts/kaggle-dataset-ingestion.md` — concept record (qué es Kaggle, datasets, splits, API de datos, auth, streaming/limit).
- `.opencode/history/2026/2026-10.md` — registro de evento significativo.
- `.opencode/progress/roadmap.md` — marcar ítem completado.
- Ejemplo `.kf` bajo `docs/ejemplos/` si aplica (precedente: `gesha-huggingface-clustering.kf`).

## Testing Impact

- `tests/KafeKaggle/*.kf` + `.expec` — solo tests offline: import + errores por credenciales faltantes (mensaje determinista) + funciones con datos inyectados si el API lo permite sin red.
- `tests/KafeKaggle/*.kf.example` — escenarios con descarga real (requieren credenciales), fuera del discovery.
- `tests/test_KafeKaggle.py` — patrón `obtener_parametros(get_programs(...))`, con `ids=` cortos (lección aplicada hoy en `test_KafeGESHA.py`: los IDs largos rompen Windows por el límite de 32767 caracteres de variables de entorno).
- `tests/test_KafeKaggle_backend.py` — unit tests con `monkeypatch` (columnas, limit, no-numérico, splits, auto-install simulado), espejo de `test_KafeHF_backend.py`.
- Verificación: `pytest tests/test_KafeKaggle.py -q` y `pytest tests/ -q` (regresión = 0).

## Implementation Plan

1. Builder: crear `src/lib/KafeKaggle/funciones.py` espejo de KafeHF (`_KAGGLE_AVAILABLE`, `_require_kaggle()`, `load_dataset`, `load_dataset_split`, `load_dataset_matrix`) usando el cliente `kaggle` (KaggleApi) para descargar a un directorio temporal y leer CSVs con `csv` de la stdlib (evitar pandas como dependencia nueva — verificar qué expone la librería `kaggle`; si requiere pandas, documentarlo en el ADR como dependencia transitiva).
2. Builder: registrar en `src/EvalVisitorPrimitivo.py` (import + `self.libraries["kaggle"]`).
3. Builder: fixtures offline en `tests/KafeKaggle/` + `tests/test_KafeKaggle.py` + `tests/test_KafeKaggle_backend.py` (monkeypatch, sin red).
4. Verificación: `pytest tests/test_KafeKaggle.py -q` → nuevo tests en verde; `pytest tests/ -q` → 0 regresiones vs baseline 545/1.
5. Lead/Builder: `docs/bibliotecas/kaggle.md` + ejemplo `.kf`.
6. Architect: ADR-0012; concept record; `libraries.md` actualizado.
7. Tester: `/benchmark` si procede (escenarios con dataset local/mock si la red impide 5 escenarios reales — justificar).
8. Historian: history `2026-10.md`, roadmap, session-log al `/close`.
9. Reviewer: `/dod`.

### Verification steps

- `pytest tests/test_KafeKaggle.py -q`
- `pytest tests/test_KafeKaggle_backend.py -q`
- `pytest tests/ -q` (baseline 545 passed, 1 skipped)
- Smoke manual: `python src/Kafe.py tests/KafeKaggle/<fixture>.kf` desde `src/`

## Open Questions — RESUELTOS (Lead, 2026-10-08)

1. **Cliente**: librería oficial `kaggle` (KagleApi + credenciales). Decidido.
2. **Formato**: CSV (y ZIP con un único CSV vía `zipfile` stdlib).
3. **Lectura**: `csv` de stdlib → construir `DataFrame` de KafePARDOS para validar/retornar (sin pandas como dependencia propia).
4. **Tests de red**: fuera de la suite — fixtures `.kf.example` + unit tests con `monkeypatch` (CI nunca toca red ni credenciales).
5. **Benchmark**: escenarios con datos locales/cacheados o justificación "no aplica" si la red impide 5 escenarios reales (decidir con Tester en `/benchmark`).
6. **Fixture de red (.example)**: dataset público pequeño en Kaggle (definir con el Builder al implementar; candidato tipo iris).
