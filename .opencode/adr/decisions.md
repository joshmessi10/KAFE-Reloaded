# Architecture Decision Records

This file consolidates all ADRs for the KAFE project. Individual ADR files have been merged here to reduce file accumulation.

## ADR-0001: Adopt `.opencode/` as the Authoritative Engineering System

- **Status**: accepted
- **Date**: 2026-08-03

### Context

KAFE is an educational DSL for Machine Learning and Deep Learning (Python + ANTLR 4, Visitor pattern). Before this decision, engineering rules lived in a single AGENTS.md and nothing was persisted: no memory, no session recovery, no ADR/benchmark process, no Definition of Done enforcement.

### Decision

Adopt `.opencode/` as the authoritative engineering system with a three-layer separation:
- `OPENCODE.md` — operating manual
- `AGENTS.md` — engineering constitution
- `.opencode/` — source of operational knowledge

Source of Truth precedence: **ADRs > Knowledge Layer > History > Progress**.

### Rationale

- Separates governance (stable) from operations (procedural) from knowledge (living)
- Makes engineering processes executable via commands
- An educational project benefits from durable, traceable knowledge

### Consequences

- Significant changes must be traceable through ADRs, history, and the session log
- AGENTS.md stays lean; detail lives in `.opencode/knowledge/`
- Session memory files and bitácora must be updated on close

---

## ADR-0002: Roles como Subagentes OpenCode (SUPERSEDED)

- **Status**: superseded by ADR-0005
- **Date**: 2026-08-03
- **Superseded**: 2026-08-04

### Context (Original)

AGENTS.md define cinco roles de ingeniería que originalmente fueron diferidos como subagentes porque el volumen de trabajo no justificaba la sobrecarga de orquestación.

### Decision (Original)

Mantener los cinco roles como responsabilidades documentadas y diferir su implementación.

### Decision (Actualizada — 2026-08-04)

Los cinco roles ahora están implementados como subagentes OpenCode en `.opencode/agents/`. Reemplazado por ADR-0005.

---

## ADR-0003: Local Verification Gates Instead of CI Hooks

- **Status**: accepted
- **Date**: 2026-08-03

### Context

The engineering system requires that an agent proves work rather than asserting it. The reference subagent-harness used agent-local hooks to enforce verification.

### Decision

Use explicit local gates through commands instead of CI hooks:
- `/init` runs the full test suite and validates progress consistency
- `/close` requires `/init` green before closing
- No `PostToolUse`/`Stop` agent hooks are configured
- Quality framing documented in `.opencode/knowledge/verifications.md`

### Rationale

- Verification is explicit, auditable, and executed at a defined gate
- No dependency on agent-hook mechanisms
- CI continues to verify on push/PR

### Consequences

- No session closes with a red suite
- Agent must run gates consciously
- Anti-patterns are documented as review failures

---

## ADR-0004: Session Lifecycle (Bitácora + `/close`)

- **Status**: accepted
- **Date**: 2026-08-03

### Context

Without an end-of-session lifecycle, `current.md` accumulated state across sessions and there was no historical record of sessions.

### Decision

Implement a session lifecycle with two mechanisms:
- Append-only bitácora `.opencode/progress/session-log.md`
- `/close` command with hard gates

### Rationale

- Reproducible closure: a red suite never closes a session
- Append-only log preserves session history
- Complements the history layer without duplicating it

### Consequences

- `/resume` and session-recovery template read `session-log.md`
- `/init` validates closure consistency
- `current.md` is reset to template on close

---

## ADR-0005: Agent System Implementation

- **Status**: accepted
- **Date**: 2026-08-04

### Context

AGENTS.md define cinco roles de ingeniería que originalmente fueron diferidos como subagentes (ADR-0002). El sistema de ingeniería ha madurado y el volumen de trabajo justifica la implementación.

### Decision

Implementar los cinco roles como subagentes OpenCode en `.opencode/agents/`:

| Archivo | Modo | Responsabilidad |
|---------|------|-----------------|
| `engineering-lead.md` | primary | Orquestador |
| `architect.md` | subagent | Diseño + ADR |
| `builder.md` | subagent | Implementación + tests |
| `reviewer.md` | subagent | Quality gates + DoD |
| `historian.md` | subagent | History/knowledge/memory |
| `tester.md` | subagent | Validation + benchmarks |

Configuración en `opencode.json`:
- `default_agent: "engineering-lead"`
- `subagent_depth: 2`
- Permisos granulares por agente

### Rationale

- Separación de responsabilidades
- Orquestación paralela
- Permisos granulares
- Enforcement del protocolo anti-telephone

### Consequences

- 7 skills actualizados con Agent Ownership
- ADR-0002 superseded
- Lead orquesta via Task tool
- Subagentes siguen protocolo anti-telephone

---

## ADR-0006: Hard Enforcement via Command Log

- **Status**: accepted
- **Date**: 2026-08-04

### Context

The engineering system had soft enforcement (advisory instructions) for command sequence. Only `/close` had hard gates. Commands like `/open-work` and `/impact` could be skipped or run out of order.

### Decision

Implement hard enforcement via session-scoped command log:
- `.opencode/progress/session-commands.md` tracks which commands have run
- `/resume` resets the command log at session start
- `/open-work` verifies `/resume` ran first (aborts if not)
- `/impact` verifies `/open-work` ran first (aborts if not)
- Each command appends its execution to the log

### Rationale

- Enforces the command sequence: `/init` → `/resume` → `/open-work` → `/impact` → ...
- Provides audit trail for command invocations
- Prevents skipping required steps

### Consequences

- Command sequence is enforced, not just documented
- Reviewer can verify command sequence was followed
- Session state is explicitly tracked

---

## ADR-0007: BaseMachine Architectural Review — Unified Contract

- **Status**: accepted
- **Date**: 2026-09-14

### Context

KafeMACHINE's `BaseMachine` serves as the common abstraction for all ML models and preprocessing transformers. An architectural review identified multiple inconsistencies:

1. **`fit()` signature inconsistency**: Supervised models use `fit(X, y)`, unsupervised use `fit(X)`, transformers use `fit(data)`, and OneHotEncoder/OrdinalEncoder use `fit(df, columns)`. No child class calls `super().fit()`.
2. **DataFrame support inconsistency**: Only some transformers use `_unwrap_data()`. Models never use it. Some transformers extract DataFrame data manually in `fit()`.
3. **Dimension validation duplication**: Each class validates matrix shapes independently. KMeans rejects 1D data while all supervised models convert it.
4. **`score()` metric duplication**: LinearRegression.score() reimplements r2_score; LogisticRegression, KNN, and DecisionTreeClassifier all reimplement accuracy_score from `metrics.py`.
5. **`fit_transform()` broken for encoders**: BaseMachine.fit_transform(X) calls self.fit(X), but OneHotEncoder.fit requires two arguments.
6. **`predict_proba()` not in BaseMachine**: Only LogisticRegression and KNN have it.

### Decision

Adopt the following architectural decisions:

#### 1. Flexible `fit()` Contract (Alternative B)
`BaseMachine.fit()` defines no implementation beyond setting `_is_fitted`. Each category defines its own signature:
- Supervised models: `fit(X, y)`
- Unsupervised models: `fit(X)`
- Transformers: `fit(data)` — may accept DataFrame or matrix
- Encoders: `fit(df, columns)` — DataFrame-specific

The contract is **semantic** (documented), not syntactic (enforced by signature).

#### 2. Centralized `_is_fitted` in BaseMachine
`BaseMachine.fit()` sets `self._is_fitted = True` and returns `self`. Child classes call `super().fit()` at the end of their fit logic, or set `_is_fitted` directly if they override fit completely.

#### 3. DataFrame Support Where It Makes Sense
- **Transformers**: Must support DataFrame via `_unwrap_data()`
- **Supervised models**: `fit(X, y)` may accept X as DataFrame (extract via `_unwrap_data`)
- **KMeans**: May accept DataFrame
- **LabelEncoder**: Operates on 1D data; DataFrame does not apply directly
- No forced support where it doesn't make sense.

#### 4. Rename boolean to `is_dataframe`
`_unwrap_data()` already returns `(matrix, columns, is_dataframe)`. The name is explicit. Document the return tuple clearly.

#### 5. Centralized Dimension Validation
Add `_validate_matrix_shape(X, expected_features=None)` to BaseMachine:
- Converts 1D to 2D
- Validates all rows have same length
- Optionally validates number of features
- Each class uses this + its own specific rules

#### 6. `score()` with Optional Metric Parameter
- `score(X, y, metric=None)` — accepts an optional metric function
- Each model defines a `_default_metric` used when `metric=None`:
  - LinearRegression → `r2_score`
  - LogisticRegression → `accuracy_score`
  - KNN → `accuracy_score`
  - DecisionTreeClassifier → `accuracy_score`
- Users can pass any metric function: `model.score(X, y, metric=f1_score)`
- All metrics come from `metrics.py` — no duplication

#### 7. Remove `fit_transform()` from BaseMachine
Each transformer that needs fit_transform implements it with its own signature. No common default because `fit` has different signatures across categories.

#### 8. `predict_proba()` Not in BaseMachine
Only probabilistic classifiers (LogisticRegression, KNN) implement it. It is not part of the general contract.

### Rationale

- Respects the reality of the domain: models and transformers have different contracts
- Centralizes common logic (fitted state, dimension validation) without forcing uniformity
- Eliminates metric duplication
- Removes broken `fit_transform()` default
- Keeps the codebase clean and educational

### Consequences

- All child classes must be updated to use centralized validation and metrics
- `_unwrap_data()` must be used consistently in transformers' `fit()` methods
- Tests must verify the new validation behavior
- Documentation must reflect the flexible contract
- History and knowledge layers must be updated

#### 9. PCA `n_components` Validation in `fit()`
Validate `n_components <= n_features` in `fit()` when `n_features` is known. Raises a clear error instead of failing later in `transform()` with a cryptic message.

#### 10. OneHotEncoder `handle_unknown` Parameter
- New parameter: `handle_unknown="error"` (default)
- `handle_unknown="error"` → raises exception on unseen categories in `transform()`
- `handle_unknown="ignore"` → returns all-zeros row for unseen categories
- User must explicitly choose to ignore unknown categories

#### 11. OneHotEncoder `inverse_transform` Strict Validation
- Raises exception if no active category found (all zeros)
- Raises exception if multiple active categories found (data corruption)
- No silent fallback to first category — invalid input must fail explicitly

#### 12. SimpleImputer Type Validation for `mean`/`median`
- In `_compute_statistic()`, validate that values are numeric when strategy is `mean` or `median`
- Raises clear error: "strategy 'mean' requires numeric data"
- Prevents confusing `TypeError` from `sum()` on non-numeric data

#### 13. Preprocessing Dimension Validation Decision
- Preprocessors do NOT use `_validate_matrix_shape()` in `fit()` — it is redundant
- Each transformer validates dimensions in `transform()` against learned state (`self.mean_`, `self.data_min_`, etc.)
- This is sufficient: `fit()` learns dimensions from data, `transform()` validates against learned dimensions
- `_validate_matrix_shape()` is primarily for models where fit/predict are separate operations

#### 14. Dimension Validation in predict()
All models validate feature dimensions in `predict()` against the fitted state:
- LinearRegression: validates `len(row) == len(self.coef_)`
- LogisticRegression: validates via `predict_proba()` which checks `len(row) == len(self.coef_)`
- KNN: validates `len(row) == len(self.X_train[0])`
- DecisionTreeClassifier: validates `len(row) == self.n_features_`
- KMeans: validates `len(row) == len(self.cluster_centers_[0])`

Prevents silent truncation from `zip()` and `IndexError` from feature index access.

#### 15. X and y Length Validation in fit()
All supervised models validate `len(X) == len(y)` in `fit()`:
- LinearRegression: already validated
- LogisticRegression: added validation
- KNN: added validation
- DecisionTreeClassifier: added validation

Produces clear error message instead of cryptic IndexError during training.

#### 16. LogisticRegression Hyperparameter Validation
Validate hyperparameters in `__init__()`:
- `learning_rate > 0` — zero or negative values prevent convergence
- `max_iter > 0` — zero or negative values prevent training

Fails fast at construction time instead of silently producing a broken model.

---

## ADR-0008: Restaurar el Tipo GESHA y el Contrato Público de KafeGESHA tras el Refactor

- **Status**: accepted
- **Date**: 2026-09-24

### Context

El refactor "Clean Gesha Architecture" reestructuró KafeGESHA aplanando el paquete en `src/lib/KafeGESHA/{layers,models,core,activations,losses,optimizers}.py` y añadió `Layer.__call__ = connect` para soportar la API Functional. Este refactor introdujo una regresión de contrato público:

- El usuario reportó `TypeError: Expected GESHA, obtained FUNC` en `python Kafe.py Ejemplo.kf` en la línea `GESHA layer = geshaDeep.create_dense(1, "sigmoid", [2]);`.
- **Causa raíz**: `TypeUtils.obtener_tipo_dato()` evaluaba `callable(dato)` **antes** de `isinstance(dato, (Gesha, Layer, Node, Input))`. Con `Layer.__call__ = connect`, toda capa es callable, por lo que cualquier capa/modelo GESHA se clasificaba como `FUNC` en lugar de `GESHA`.
- `TypeUtils` es un módulo compartido por todo el lenguaje: regresión, asignación de tipos, dispatch de librerías y la gramática dependen de la clasificación correcta del tipo GESHA.

Además, se observaron otras desviaciones del contrato pre-refactor: `Model.fit` emitía un formato de salida distinto, `predict`/`predict_label`/`predict_proba` cambiaron la semántica de muestras, el entrenamiento fijaba semillas ad-hoc y los fixtures `.expec` de las compuertas quedaron desalineados con la salida real (suite KafeGESHA en rojo: baseline 2 failed).

### Decision

Restaurar el contrato público pre-refactor de KafeGESHA:

1. **Orden del chequeo GESHA en `TypeUtils.obtener_tipo_dato()`** — decisión central del ADR: validar `isinstance(dato, (Gesha, Layer, Node, Input))` **antes** del chequeo `callable(dato)`. Así `Layer.__call__ = connect` no interfiere con la clasificación de tipos de capas, nodos ni modelos como `GESHA`.
2. **`Dense.forward`** — activación aplicada por elemento (con caché de `_last_z`); Softmax conserva la excepción vectorial (requiere el vector completo).
3. **`Dense.backward`** — derivada por elemento recuperada desde `_last_z` (con manejo de Jacobiana para Softmax), corrigiendo el gradiente propagado.
4. **`activations.py`** — `derivative(x)` calcula a partir de `x` cuando se provee; la caché (`last_input`/`last_output`) queda solo como fallback para `None`.
5. **`Model.predict`** — vector → `forward(X)` directo; matriz → batch con `forward` por muestra.
6. **`predict_label`/`predict_proba`** — restaurados (threshold 0.5 para salida unitaria, argmax multiclase; `INT` para muestra única, `List[INT]` para batch).
7. **`Model.fit`** — formato `Epoch N/M — Loss X.XX%` (em-dash) restaurado, gradiente por unidad, shapes de loss planas.
8. **Fixtures deterministas** — `and_gate.kf` y `or_gate.kf` fijados con seed `42` en `create_dense` (reproducible) y `.expec` regenerados desde stdout real (`or_gate.expec` bit-a-bit idéntico al contrato pre-refactor).

### Rationale

- **Consistencia de contrato**: los programas educativos (`Ejemplo.kf`, `and_gate.kf`, `or_gate.kf`) y la documentación asumen el tipo `GESHA` y el formato de salida pre-refactor. Restaurar el contrato preserva compatibilidad sin migrar documentación ni ejemplos.
- **Corrección del chequeo de tipos**: la causalidad es estructural — `callable` es un superconjunto de "es una capa GESHA" desde que `Layer` es callable. El chequeo específico debe preceder al genérico.
- **Determinismo**: la semilla 42 hace que los tests de compuertas sean reproducibles entre ejecuciones y máquinas, condición necesaria para fixtures estables.
- `TypeUtils` es compartido por todo el lenguaje; restaurarlo sin tocar otras clasificaciones minimiza el riesgo colateral.

### Consequences

**Positivas:**

- `src/Ejemplo.kf` ya no produce `TypeError` y el perceptrón AND aprende (loss decreciente hasta ~26.42%).
- Contrato público de KafeGESHA restaurado: tipo `GESHA`, `predict`/`predict_label`/`predict_proba` y formato de `fit` consistentes con los ejemplos y documentación.
- Determinismo con seed 42: fixtures `and_gate.expec`/`or_gate.expec` reproducibles.
- Suite KafeGESHA en verde: `pytest tests/test_KafeGESHA.py` → 2 passed, 1 skipped; suite completa 464 passed, 1 skipped.

**Riesgos y consideraciones:**

- `TypeUtils.obtener_tipo_dato()` es compartido por todo el lenguaje; el reordenamiento afecta la clasificación global de tipos. Cualquier futuro objeto introducido en KafeGESHA que sea callable debe mantener esta precedencia (GESHA → PARDOS → MACHINE → callable → ...).
- `Layer.__call__ = connect` sigue presente: es intencional para la API Functional, pero cualquier código que dependa de `callable()` para detectar funciones debe blindarse contra tipos GESHA.
- Los `.expec` fueron regenerados desde stdout real; cambios futuros en el formato numérico, la semilla o el orden de entrenamiento romperán los fixtures (a diferencia de los fixtures de texto es determinista con seed 42).

### Alternatives Considered

**Mantener la semántica batch nueva + migrar fixtures y documentación.** Se evaluó quedarse con el comportamiento del refactor (predict/predict_label batch, formato nuevo de fit) y actualizar `Ejemplo.kf`, las compuertas y la documentación al nuevo contrato.

- **Rechazado** porque: (a) rompería la compatibilidad con los ejemplos educativos publicados y el material didáctico que enseñan `GESHA`, comprometiendo el valor educativo; (b) exigiría migrar documentación y todos los ejemplos existentes; (c) la causa funcional primaria (`TypeError: Expected GESHA, obtained FUNC`) es un bug de clasificación de tipos, no una mejora intencional del refactor. La decisión de restaurar el contrato pre-refactor es la de menor costo y mayor consistencia.

Mantener `callable` antes de `isinstance` y corregir solo `Layer` (eliminar `__call__`). Se descartó porque la API Functional depende de la callability de las capas (`layer(inbound)`), y eliminar `__call__` rompería el patrón added por el refactor; el reordenamiento en `TypeUtils` resuelve la colisión sin sacrificar la API.

## ADR-0009: Contratos incrementales para el backend GESHA

- **Status**: accepted
- **Date**: 2026-09-30

### Context

GESHA ya tenía implementaciones operativas y una API pública utilizada por los
fixtures KAFE. Reemplazar sus clases habría roto `Gesha`, la API Functional y
los resultados deterministas.

### Decision

Se añaden contratos compatibles sobre las clases existentes: `forward` y
`backward` para activaciones y pérdidas, `update(layers)` para optimizadores,
validación lazy de Dense y Softmax estable. Los métodos históricos permanecen
como adaptadores. No se añade un motor tensorial nuevo.

### Consequences

La arquitectura puede evolucionar hacia capas y entrenamiento por contratos
sin migrar los programas KAFE existentes. Las formas de lote completo,
minibatches y la fusión especializada Softmax-entropía cruzada quedan como
siguiente fase y requieren pruebas matemáticas específicas.

---

## ADR-0012: Ingesta de datasets de Kaggle con la librería oficial `kaggle`

- **Status**: partially superseded by ADR-0013 (2026-10-08: cliente `kagglehub`, credenciales opcionales)
- **Date**: 2026-10-08

### Context

KafeHF ya permitía importar datasets de Hugging Face (`huggingface.load_dataset*`,
ADR-0010). Se solicitó una capac análoga para Kaggle. Kaggle no usa splits sino
archivos (normalmente un CSV dentro de un ZIP) y su API exige credenciales,
lo que diferencia el caso de uso de Hugging Face.

### Decision

Se añade la librería integrada `src/lib/KafeKaggle/` con clave de import
`kaggle`, espejo de KafeHF: `load_dataset`, `load_dataset_split` y
`load_dataset_matrix` con retorno PARDOS/matriz numérica, dependencia opcional
`kaggle` con auto-instalación (`pip install kaggle` vía `subprocess`) y
validación previa de credenciales en español (`~/.kaggle/kaggle.json` o
`KAGGLE_USERNAME`/`KAGGLE_KEY`). Los CSV se leen con la librería estándar
`csv` (ZIP con `zipfile`), sin pandas. El parámetro `split` se interpreta como
**selector de archivo con forma de split** (`"train"` → `train.csv`) para
mantener la simetría de API con KafeHF. El paso de descarga queda aislado en
`_download_dataset()` para poder sustituirlo en tests sin red ni credenciales.

### Rationale

- La librería oficial `kaggle` es la API mantenida por la plataforma; usarla
  evita reimplementar autenticación y endpoints (la política de dependencias
  prohíbe implementaciones de algoritmos ML externos, no clientes de datos;
  precedente: `datasets` en ADR-0010).
- `csv`/`zipfile` de la estándar evitan añadir pandas como dependencia propia
  y cumplen la política de dependencias.
- La simetría con KafeHF reduce la carga cognitiva: un programa con forma
  Hugging Face se porta a Kaggle cambiando el import y el nombre del dataset.
- Los tests de red/credenciales viven en `*.kf.example` (fuera del
  discovery de pytest) y la suite se cubre con `monkeypatch`, de modo que CI
  nunca toca red.

### Consequences

- API pública nueva sin breaking changes; gramática sin cambios.
- Cada llamada descarga el dataset completo a un directorio temporal; para
  datasets grandes debe usarse `limit` o `load_dataset_matrix`.
- Solo se admiten archivos CSV.
- `docs/bibliotecas/kaggle.md`, concept record
  `kaggle-dataset-ingestion.md` y fixtures `tests/KafeKaggle/` acompañan la
  decisión.

### Alternatives Considered

- **Descarga directa por HTTP con urllib contra `kaggle.com/api/v1`**: elimina
  la dependencia pip pero reimplementa autenticación y manejo de errores de la
  API; más código propio que mantener y peor para un proyecto educativo.
- **pandas para leer los CSV**: añade una dependencia propia pesada; se descarta
  por la política de dependencias (la estándar `csv` es suficiente).
- **Rechazar `split` con un error educativo ("Kaggle no tiene splits")**:
  se descarta porque rompe la simetría con KafeHF sin ganancia pedagógica;
  en su lugar `split` actúa como selector de archivo y el docstring explica la
  diferencia de modelado.
- **`kagglehub`**: cliente alternativo de comunidad; se descarta por usar la
  librería oficial solicitada. *(Actualización: `kagglehub` resultó ser el
  cliente oficial moderno de Kaggle y sustituyó a `kaggle` en ADR-0013.)*

## ADR-0013: KafeKAGGLE usa `kagglehub` como cliente (datasets públicos sin credenciales)

- **Status**: accepted
- **Date**: 2026-10-08

### Context

Durante la validación en vivo de KafeKAGGLE (ADR-0012) se comprobó que:

1. El gate de credenciales de ADR-0012 bloquea datasets **públicos** que en
   realidad se descargan de forma anónima: GET anónimo a
   `https://www.kaggle.com/api/v1/datasets/download/uciml/iris` → HTTP 200
   `application/zip`, y `kagglehub.dataset_download('uciml/iris')` sin
   `KAGGLE_USERNAME`/`KAGGLE_KEY`/`kaggle.json` descarga y extrae
   correctamente (verificado en este entorno).
2. `kaggle 2.2.4` imprime una ayuda en inglés ("Authentication required…")
   a stdout al importar sin credenciales, contaminando la salida del
   programa KAFE.
3. El flujo educativo de referencia (Google Colab) usa `kagglehub`, que
   además soporta las mismas fuentes de credenciales (`kaggle.json`, env
   vars `KAGGLE_USERNAME`/`KAGGLE_KEY` y secrets de Colab — verificado en
   `kagglehub/config.py`).

La premisa de ADR-0012 ("su API exige credenciales") y su descarte de
`kagglehub` ("cliente de comunidad") resultaron incorrectas: `kagglehub` es
el cliente oficial moderno (`github.com/Kaggle/kagglehub`).

### Decision

Reemplazar el cliente por debajo de KafeKAGGLE — `kaggle`/`KaggleApi` →
`kagglehub` — manteniendo intacta la API pública KAFE:

- Descarga **anónima** para datasets públicos: se elimina el gate previo de
  credenciales; `_check_credentials()` pasa a ser el predicado
  `_tiene_credenciales()`, usado solo para enriquecer el mensaje de error
  cuando la descarga falla sin credenciales (datasets privados).
- `_download_dataset(dataset_name)` retorna el **directorio extraído** por
  `kagglehub.dataset_download()` (caché persistente en
  `~/.cache/kagglehub`) en vez de un ZIP en un directorio temporal; la
  salida de progreso del cliente se redirige con `redirect_stdout`.
- `_extract_table` recorre el directorio recursivamente (skip
  `__MACOSX`/dotfiles); se eliminan `zipfile` y `tempfile`.
- Auto-instalación vía `_require_kagglehub()` (mismo patrón que
  `_require_hf`).
- `import kaggle;`, las tres funciones públicas, `@check_sig` y la semántica
  de `split` como selector de archivo **no cambian**.

**Supresión parcial de ADR-0012**: se conserva todo lo demás (lectura con
`csv` estándar sin pandas, retorno PARDOS/matriz, selector de split con
forma de split, seam `_download_dataset()` para tests offline); se
reemplazan la elección del cliente y el gate de credenciales.

### Rationale

- `kagglehub` es el cliente oficial de Kaggle y el que usan los ejemplos de
  Colab: paridad con el flujo que encuentran los estudiantes.
- Habilita el requisito verificado empíricamente: datasets públicos sin
  credenciales (elimina la configuración única de aula).
- Elimina el texto de autenticación que `kaggle` imprimía al importar.
- Caché persistente: el segundo acceso es instantáneo (mejora respecto a la
  re-descarga por llamada de ADR-0012).
- Cumple la política de dependencias: cliente oficial de datos, dependencia
  opcional con auto-install; no es una implementación ML externa.

### Consequences

- Los datasets **privados** siguen requiriendo credenciales (mensaje en
  español con las tres fuentes al fallar la descarga).
- La caché de `kagglehub` crece en disco sin evicción automática (limitación
  documentada en el concept record).
- Los 35 unit tests de `tests/test_KafeKaggle_backend.py` se reescribieron
  para el nuevo seam; los 5 fixtures `.kf` no cambiaron; el benchmark S5
  pasó de ZIP a directorio (registro actualizado en `records.md`).
- `docs/bibliotecas/kaggle.md`, concept record `kaggle-dataset-ingestion.md`,
  `libraries.md`, `CLAUDE.md` y history actualizados.

### Alternatives Considered

- **Mantener `kaggle` con el gate de credenciales**: descartado porque
  bloquea datasets públicos sin razón técnica (la API los sirve anónimos) y
  añade una configuración innecesaria al aula.
- **Soportar ambos clientes (`kagglehub` primario + `kaggle` fallback)**:
  descartado por complejidad: `kagglehub` ya cubre públicos y privados con
  las mismas fuentes de credenciales.
- **HTTP directo con `urllib` contra el endpoint de descarga**: descartado
  por las mismas razones que en ADR-0012 (reimplementar versionado,
  extracción, caché y manejo de errores).
- **Leer credenciales desde el programa KAFE**: descartado: expondría
  secretos en código educativo; las gestiona el cliente como en Colab.
## ADR-0014 — Utilidades de entrenamiento como objetos GESHA (2026-10-10)

**Status:** Accepted.

**Context:** GESHA necesitaba inicialización dependiente del fan, penalizaciones reutilizables y control del ciclo de entrenamiento sin introducir Tensor ni dependencias externas.

**Decision:** Implementar paquetes independientes `initializers`, `regularizers` y `callbacks`; reconocer sus objetos mediante el tipo existente `GESHA`; delegar creación N-dimensional a NUMK; asociar regularizadores a `Parameter`; ejecutar callbacks en `Model.fit`; persistir pesos como JSON.

**Consequences:** La API previa continúa válida. Los checkpoints son portables y legibles, pero no incluyen arquitectura ni estado del optimizador.

**Alternatives:** Cadenas solamente limitaban configuración; incorporar NumPy violaba la política de dependencias; crear un tipo nuevo ampliaba innecesariamente la gramática.
## ADR-0015 — Activaciones y pérdidas como paquetes (2026-10-10)

**Status:** Accepted.

**Context:** Los módulos monolíticos de activaciones y pérdidas dificultaban localizar cada implementación; `advanced_layers.py` duplicaba exports ya presentes en `layers`.

**Decision:** Usar un archivo por activación y pérdida, con contratos base y `__init__.py` compatibles. Exportar todas las capas únicamente desde `layers` y eliminar el adaptador avanzado.

**Consequences:** La estructura refleja cada responsabilidad sin cambiar imports públicos. Añadir un componente ya no amplía un archivo central, salvo su export en `__init__.py` y el registro cuando corresponda.
## ADR-0016 — Optimizadores como paquete (2026-10-10)

**Status:** Accepted.

**Context:** SGD, RMSprop, Adam y AdamW compartían un módulo creciente pese a tener estado y reglas de actualización independientes.

**Decision:** Separar el contrato `Optimizer` y cada implementación en archivos propios bajo `optimizers/`, manteniendo los exports históricos en el paquete.

**Consequences:** Cada algoritmo puede evolucionar aisladamente y los imports públicos permanecen estables. AdamW sigue reutilizando Adam antes de aplicar weight decay desacoplado.
