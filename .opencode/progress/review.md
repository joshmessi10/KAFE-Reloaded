# Review — Validación E2E de RNN con KafeKaggle (ADR-0021)

**Veredicto:** APPROVED — todo el work material del feature está verificado en disco, la suite está verde (691 passed, 2 skipped, ejecutada por el Reviewer el 2026-10-18) y los 3 cambios documentales exigidos en el review previo (CHANGES_REQUESTED) quedaron materializados y verificados leyendo disco el 2026-10-18. El DoD queda íntegro: implementation, validation, tests, docs (`docs/` + `.opencode/knowledge/`), history, ADR, benchmark 5 escenarios, concept record, examples y context saving (incl. roadmap) — todo presente.

- **Fecha**: 2026-10-18 · **Rol**: Reviewer · **Comando**: `/dod`
- **Criterio único**: `.opencode/knowledge/verifications.md` + `conventions.md` + `architecture.md` (+ checklist de `/dod`, `templates/dod-checklist.md` y `engineering.md` que éste invoca).

## Cambios aplicados tras CHANGES_REQUESTED (2026-10-18)

Los tres puntos del review previo fueron verificados leyendo disco:

- [x] **Cambio #1 — `.opencode/knowledge/ml-library.md`**: 
  - **L12** (Structure): `Tokenizer.py` añadido al final de la lista `Preprocessing:` (`…, RecursiveFeatureElimination.py, Tokenizer.py`).
  - **L36** (Public API factories): `machine.tokenizer(num_words=0, oov_token="")` — convierte texto en `List[List[INT]]` con vocabulario determinista y OOV opcional, en el mismo formato que `machine.label_encoder()` / `machine.one_hot_encoder()` (L35).
  - **L81** (Tests): fixtures nuevos mencionados — `test_tokenizer_{basic,oov,num_words}.kf` + `.expec`, `test_tok_{empty,not_fitted,not_string}.error.kf` + `.expec`, y `tests/KafeGESHA/rnn_sintetico.kf` + `rnn_embedding_sintetico.kf`. (Glob en disco confirma los 3 tokenizer `.kf` en `tests/KafeMACHINE/preprocessing/`.)
- [x] **Cambio #2 — `.opencode/progress/roadmap.md`**: 
  - **L45**: `✔ Validación E2E RNN — EjemploRNN1 (serie temporal) + EjemploRNN2 (texto) con KafeKaggle (2026-10-18)`.
  - **L72**: `✔ KafeKAGGLE — load_text_dataset (texto etiquetado, TAB/sin encabezado) + machine.tokenizer (2026-10-18, ADR-0021)`.
- [x] **Cambio #3 (baja prioridad) — `.opencode/progress/impact-rnn-e2e.md` reconciliado**: 
  - **L55 (F1)**: nota de reconciliación — la implementación final usó `_leer_filas` + `_parse_text_labels` + `_select_file_texto` (misma semántica que el helper planificado `_parse_table`) y `load_text_dataset` quedó en L1245-1331 de `src/lib/KafeKaggle/funciones.py` (verificado en disco).
  - **L16 (Hallazgo 2)**: referencias de línea actualizadas — `_select_file` L257-269, `_parse_csv`/`_leer_filas` L295-329.
  - **L62-64**: nueva sección `## Reconciliación` con la nota fechada 2026-10-18 y confirmación de que D1-D3 no cambian.
- [x] **Verificación de no-regresión tras los cambios**: los 3 archivos tocados por el Builder son exclusivamente documentales/progress (knowledge + progress). Comprobación puntual en disco: `src/lib/KafeKaggle/funciones.py` L1245-1331 (`load_text_dataset` con `@check_sig` y firmas intactas), `src/lib/KafeMACHINE/preprocessing/Tokenizer.py` L28-47 (`_tokenizar` con stdlib `re` y `class Tokenizer(BaseMachine)` intactos), fixtures tokenizer presentes en `tests/KafeMACHINE/preprocessing/`. Nada de lo que estaba `[x]` en el review previo cambió; no corresponde re-lanzar la suite completa.

## DoD Checklist

### Requeridos (todas las tareas)

- [x] **Implementation exists** — verificado leyendo disco:
  - `src/lib/KafeKaggle/funciones.py`: `load_text_dataset` **L1245-1331** (`@check_sig` L1245, firma L1246-1248, validaciones pre-red L1297-1312 — delimiter de 1 carácter, columnas ≥ 0, limit ≥ 0; construcción PARDOS `text`/`label` L1326-1331); helpers `_select_file_texto` **L272-292** (acepta `.txt`/`.tsv`/`.csv`), `_leer_filas` **L295-310**, `_parse_text_labels` **L341-368** (filas incompletas y etiqueta no entera con mensajes acotados), `_extract_text_table` **L371-390**. La API CSV previa intacta: `_select_file` L257-269, `_parse_csv` reutiliza `_leer_filas` (L320).
  - `src/lib/KafeKaggle/__init__.py`: import L6, `__all__` L17.
  - `src/lib/KafeMACHINE/preprocessing/Tokenizer.py`: `_tokenizar` L28-37 (stdlib `re`), `class Tokenizer(BaseMachine)` **L40**, `fit` L85-120 con vocabulario ordenado por `(-frecuencia, primera aparición)` L106-108, mensajes en español L56-65/L72-83.
  - `src/lib/KafeMACHINE/funciones.py`: fábrica `def tokenizer(num_words=0, oov_token="")` **L74**.
  - `src/EjemploRNN1.kf` (163 líneas; dataset real L40, split cronológico justificado L20-26) y `src/EjemploRNN2.kf` (201 líneas; `load_text_dataset(..., 400)` L52, fit del tokenizer solo sobre train L25-29, nota honesta de overfitting L36-41).
  - **Arquitectura/convenciones**: funciones públicas planas en `funciones.py` y clase stateful en módulo hermano (architecture.md §Library Architecture); despacho vía `check_sig` sin mecanismos paralelos; docstrings/comentarios en español; snake_case; **sin dependencias nuevas** (stdlib `re`/`csv`; `kagglehub` ya era opcional autoinstalable).
- [x] **Validation passed** — E2E del Tester (`.opencode/benchmarks/tester-rnn-e2e.md`, salidas completas embebidas):
  - `EjemploRNN1.kf`: rc=0 en 2/2 corridas (119.86 s / 121.72 s), pérdidas 7.77 % → 1.56 % (7/14 pasos decrecientes, 0 negativas), **MAE 2.7147498390716023 °C < 5**, determinismo byte a byte.
  - `EjemploRNN2.kf`: rc=0 en 2/2 corridas (85.80 s / 85.26 s), pérdidas 69.16 % → 10.55 % (0 negativas), **accuracy test 0.5822784810126582 ≥ 0.5** (baseline de clase ~0.557), matriz `[[18,17],[16,28]]`, 3/3 frases nuevas coherentes, determinismo byte a byte.
- [x] **Tests passed** — **ejecutados por mí**: `pytest tests/ -q` desde la raíz → **691 passed, 2 skipped in 417.09s (0:06:57)**, 2026-10-18, **0 failed**. Los 2 skips son preexistentes. (Re-verificación puntual 2026-10-18 tras cambios documentales: sin tocar `src/**` ni `tests/**`, la suite no necesita re-ejecutarse.)
- [x] **Documentation updated (`docs/`)** — `docs/bibliotecas/kaggle.md` sección *"Datasets de texto etiquetado (`load_text_dataset`)"* **L91-143** (tabla L102, parámetros L104-125, ejemplo KAFE L127-137, enlace al flujo completo L141-143); `docs/bibliotecas/machine.md` sección *"Tokenizer"* **L2340-2418** (constructor L2346-2356, métodos L2358-2364, propiedades L2366-2372, reglas del vocabulario L2374-2387, ejemplo L2389-2405, limitaciones L2407-2414) + registro de fábrica en la tabla L30.
- [x] **Documentation updated (`.opencode/knowledge/`)** — concepts, `libraries.md` y ahora también **`ml-library.md`** (Structure L12 con `Tokenizer.py`, Public API L36 con `machine.tokenizer(num_words=0, oov_token="")`, Tests L81 con los fixtures nuevos) — ver *Cambios aplicados* #1.
- [x] **History updated** — `.opencode/history/2026/2026-10.md` entrada **L251-261 (2026-10-18)**: Contexto / Cambio (5 puntos) / Archivos / Validación (691-2, métricas exactas, hallazgo KafeMATH.log) / Decisión ADR-0021.

### Aplicable (componentes ML/DL)

- [x] **ADR exists** — ADR-0021 en `.opencode/adr/decisions.md` **L709-743**: Status accepted, Contexto (2 bloqueantes), D1-D4 (D4 = limitación `Model.predict` aceptada y documentada), 5 alternativas rechazadas, Consecuencias con follow-ups.
- [x] **Benchmark con 5 escenarios y medidas reales** — `.opencode/benchmarks/rnn_e2e_results.md` (S1 tokenización 50 frases · S2 300 frases · S3 13 edge cases · S4 réplica serie 300 días · S5 estrés 1000 frases/1000 días + Anexo H) con métricas crudas por escenario (L56-241) y 8/8 cheques (L285-294). Registro en `records.md`: índice **L35** y sección **L1384-1426**. Crudos: `rnn_e2e_results.json`, script `rnn_e2e.py`.
- [x] **Concept record enriquecido** — `.opencode/knowledge/concepts/tokenizer.md` (nuevo, 191 líneas): Mathematical Foundation con fórmulas y complejidad L21-53 ✓; Step-by-Step Algorithm L55-75 ✓; Advantages **4** (L87-98) ✓ / Limitations **4** (L100-113) ✓; When to Use / NOT to Use L115-128 ✓; Relationship with KAFE L142-153 ✓; References L185-191 ✓. Extendidos: `simple-rnn.md` L47-68 (flujo E2E + fixtures) y `kaggle-dataset-ingestion.md` L189-211 (API + sección `load_text_dataset`, ADR-0021).
- [x] **Examples exist** — `src/EjemploRNN1.kf`, `src/EjemploRNN2.kf` (precedente ADR-0019: el review aceptó `src/Ejemplo.kf` como evidencia de ejemplos) + snippets ejecutables en `docs/bibliotecas/machine.md` L2391-2405 y `docs/bibliotecas/kaggle.md` L127-137.
- [x] **Context saving — `concepts/<name>.md`** — `tokenizer.md` presente y enriquecido.
- [x] **Context saving — `history/YYYY-MM.md`** — `2026-10.md` L251-261.
- [x] **Context saving — `tests/KafeMACHINE/<category>/` (7+ fixtures)** — categoría `tests/KafeMACHINE/preprocessing/` con **100+ archivos** (glob 2026-10-18); aportados por el feature: `test_tokenizer_{basic,oov,num_words}.kf` + `.expec` (3 válidos) y `test_tok_{empty,not_fitted,not_string}.error.kf` + `.expec` (3 errores) = 6 fixtures tokenizer. Además `tests/KafeGESHA/rnn_sintetico.kf`+`.expec` y `rnn_embedding_sintetico.kf`+`.expec` presentes, y `tests/KafeKaggle/kaggle_load_text_dataset.kf.example`.
- [x] **Context saving — `benchmarks/records.md` (5 escenarios)** — índice L35 + sección L1384-1426.
- [x] **Context saving — `docs/bibliotecas/machine.md`** — sección Tokenizer L2340-2418.
- [x] **Context saving — `roadmap.md` refleja completado** — L45 `✔ Validación E2E RNN … (2026-10-18)` y L72 `✔ KafeKAGGLE — load_text_dataset … + machine.tokenizer (2026-10-18, ADR-0021)` — ver *Cambios aplicados* #2. Obligatorio: `engineering.md` L131 + AGENTS.md DoD *"Roadmap updated"* + `templates/dod-checklist.md` L31 — satisfecho.

### Tests backend (evidencia adicional)

- [x] **`load_text_dataset`** — `tests/test_KafeKaggle_backend.py` **L911-1057**: 17 tests (TAB sin encabezado, CSV con coma, delimiter/columnas personalizados, limit/limit=0, selección automática, candidatos acotados, etiqueta no entera, columna fuera de rango, dataset sin archivos, sin archivos de texto, extensión no texto, nombre vacío, validaciones pre-descarga, arity, tipo) — todos con `monkeypatch` de descarga (sin red).
- [x] **`Tokenizer`** — `tests/test_KafeMACHINE.py` **L79-185**: 16 tests (determinismo intra/entre instancias, OOV=1, sin OOV, `num_words`, transform vacío, sin fit, fit vacío, no-STR, reajuste sin estado residual, `num_words` inválido ×2, fábrica con/sin argumentos, arity/tipo inválidos).

### No regressions

- [x] **No regressions** — suite completa verde con la API previa intacta (`load_dataset`/`_select_file` sin cambios de comportamiento); baseline del history 645/2 → 691/2 (+46 tests, 0 rotos). API aditiva, sin cambios de gramática ni `TypeUtils` (ADR-0021 D3). Re-verificado tras los cambios documentales: los 3 archivos tocados son docs/progress, no `src/**` ni `tests/**`.

## Hallazgos

**Fortalezas**

1. **API aditiva con validación pre-red y compatibilidad total**: `load_text_dataset` valida delimiter/columnas/limit *antes* de llamar a kagglehub (funciones.py L1297-1312) y `_select_file_texto`/`_parse_text_labels` replican las reglas acotadas de la API tabular (L272-292, L352-367); `load_dataset` quedó intacto → la suite previa completa sigue verde.
2. **Tokenizer determinista y sin dependencias**: vocabulario ordenado por `(-frecuencia, primera aparición)` (Tokenizer.py L106-108) y tokenización con `re` de la stdlib (L28-37) — cumple la Dependency Policy y garantiza fixtures `.expec` estables; contrato `BaseMachine` + `check_sig` igual que el resto de transformers.
3. **Profundidad de tests sin red**: 33 tests backend nuevos (17 kaggle + 16 tokenizer) + 6 fixtures `.kf`/`.expec` + 2 fixtures RNN sintéticos, todos con `monkeypatch`/datos sintéticos — nada depende de internet en la suite.
4. **E2E honesto y didáctico**: las cabeceras enseñan *por qué* (no barajar una serie = data leakage temporal, EjemploRNN1 L20-26; tokenizer fit solo sobre train, EjemploRNN2 L25-29) y declaran la limitación real del modelo (overfitting con ~284 frases, L36-41) en lugar de maquillar el 0.582 de accuracy.
5. **Benchmark riguroso y autocorrector**: S4 replica `EjemploRNN1.kf` con MAE **2.71475** idéntico al .kf y las mismas 15 losses y 5 predicciones (rnn_e2e_results.md L63, L113-135) — demuestra equivalencia bit a bit entre camino Python y camino intérprete; además documenta que la memoria se mide en pasada separada con `tracemalloc` (L246) para no inflar los tiempos.
6. **Disciplina de hallazgos**: el bug de `KafeMATH.log` se midió con números exactos (Anexo H: `log(0.999)` = +0.0031168935 vs −0.0010005003) y se **delimitó** su impacto (BCE.compute sí, `BCE.derivative` no → el entrenamiento no se afecta), quedando registrado en `known-issues.md` L23 y `technical-debt.md` L19 con dirección de fix.

**Riesgos / no bloqueantes**

- **`Model.predict` con muestra única en secuencias** (`models.py` L112-118, `isinstance(X[0], list)` insuficiente para `[T,F]`): mitigado en los ejemplos (siempre predicen por lote) y documentado en ADR-0021 D4 + `known-issues.md` L22. Fix como follow-up (riesgo de regresión en fixtures Dense/CNN).
- **`KafeMATH.log` con error de signo cerca de 1** → `BinaryCrossEntropy.compute` puede imprimirse negativa (−0.0031 con p=0.999); registrado en `technical-debt.md` L19. No bloquea: el gradiente no usa `log`.
- **Mensajes en inglés en rutas educativas en español** (Tester §4.2): `Tokenizer: Must call fit before transform` (Tokenizer.py) y los `TypeError: Function tokenizer expects argument of type INT, got type STR` de `check_sig`. Deuda menor de consistencia.
- **S5b (estrés) MAE 6.30 °C > 5 °C**: es solo con 2 épocas (extrapolación documentada); a 15 épocas el .kf alcanza 2.71 °C. No es regresión, está explicado en `rnn_e2e_results.md` L154.
- **`current.md` desactualizado** (L5 "pendiente de review", L12 "ADR-0021 (por crear)", L10 F6 pendiente pese a que docs/concepts/benchmark/ADR/history ya existen): se resuelve al cerrar la sesión (`/close`), no bloquea el `/dod`. *(El `impact-rnn-e2e.md` ya no está desactualizado: reconciliado el 2026-10-18.)*

## Follow-ups

1. **Fix de `Model.predict` single-sample en secuencias** — distinguir lote de muestra única por profundidad de anidamiento (no `isinstance(X[0], list)`), con tests de regresión para Dense/CNN antes de tocar fixtures (ADR-0021 D4; `known-issues.md` L22). Prioridad alta: es una trampa para estudiantes.
2. **Fix de `KafeMATH.log` cerca de 1** — mejorar la reducción del argumento (p. ej. m ∈ [√2/2, √2] o más términos de Taylor) + ADR/registro; añadir test que compare contra `math.log` en [0.9, 1.0) y un caso de BCE no negativa (`technical-debt.md` L19). Prioridad media: afecta a la impresión de losses, no al gradiente.
3. **Unificar al español los mensajes de `Tokenizer`/`check_sig` en la ruta educativa** (Tester §4.2) o documentar la convención de mensajes mixtos en `conventions.md`. Prioridad baja.

*(El follow-up previo "reconciliar `impact-rnn-e2e.md`" se cierra con este review: materializado y verificado — ver Cambios aplicados #3.)*
