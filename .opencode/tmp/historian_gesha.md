# Historian Report — Restauración del tipo GESHA y contrato público de KafeGESHA

**Fecha**: 2026-09-24 · **Rol**: Historian (proceso ejecutado directamente; el subagente historian no pudo ejecutarse por error de proveedor)
**Alcance**: solo capas de documentación/conocimiento (`knowledge/`, `memory/`, `history/`, `progress/review.md`). Sin cambios en `src/**` ni `tests/**`.

## Artefactos actualizados

| Archivo | Acción | Contenido |
|---|---|---|
| `.opencode/progress/review.md` | Reescrito | Veredicto oficial del Reviewer: **APPROVED**, DoD check, verificación técnica (TypeUtils reordenado, `_last_z`, activaciones, contrato público, fixtures seed 42), N/A benchmark, nota menor de archivos binarios. Sustituye el review previo de OrdinalEncoder (recuperable en git, commit `3bb4164`). |
| `.opencode/knowledge/dl-library.md` | Actualizado | Estructura real plana de KafeGESHA (`funciones.py`, `core.py`, `layers.py`, `models.py`, `activations.py`, `losses.py`, `optimizers.py`, `__init__.py`) reemplazando la obsoleta (`GeshaDeep.py`, `Gesha.py`, `Dense.py`, `ActivationFunction.py`, `LossFunction.py`, `Optimizer.py`, `utils.py`). Secciones nuevas: **Type GESHA** (orden de `TypeUtils.obtener_tipo_dato()`, GESHA antes de `callable`, ADR-0008), **Functional API** (`Layer.__call__ = connect`), **Public Model contract** (`predict`/`predict_proba`/`predict_label`, formato `fit` con em-dash), **Deterministic fixtures** (seed 42). Sección Tests: usar `pytest tests/`, no `pytest` a secas. |
| `.opencode/history/2026/2026-09.md` | Entrada añadida | `## 2026-09-24: Restauración del tipo GESHA y contrato público de KafeGESHA tras refactor` — resumen, causa raíz, 7 puntos de fix, razón, módulos impactados, **ADR-0008**, validación (números de tests). Sigue el formato del archivo mensual consolidado (Author/Summary/Reason/Impacted Modules/Related ADRs/Validation Performed). |
| `.opencode/memory/current-state.md` | Actualizado | Nuevo bloque "KafeGESHA restored after the Clean Gesha Architecture refactor (2026-09-24, ADR-0008)"; milestone KafeGESHA marcado operativo con contrato restaurado; nota de suite verde (464 passed, 1 skipped); aviso de que `pytest` a secas aborta. |
| `.opencode/memory/active-work.md` | Reescrito | Work item completado; paso actual = Historian; próximo paso = `/close` por el líder + siguiente work item (KafeGESHA Conv2D con `/open-work` + `/impact` + skill `add-dl-layer`). |
| `.opencode/memory/known-issues.md` | Entrada añadida | (1) `test_output.txt` / `test_results.txt` en la raíz (UTF-16) rompen la colección de `pytest` a secas → mover/eliminar, riesgo bajo (tracked en git, workaround: `pytest tests/`). (2) Curva de loss de `and_gate.expec` no estrictamente monótona → esperado por SGD estocástico, determinista. |

## Verificaciones realizadas por el Historian (solo lectura)

- `src/TypeUtils.py:obtener_tipo_dato()` — orden real confirmado: `list` → `isinstance(Gesha, Layer, Node, Input)` → `callable` → PARDOS → `BaseMachine` → `None` → resto. GESHA antes de `callable`, tal como documentado.
- `src/lib/KafeGESHA/layers.py:28` — `__call__ = connect` confirmado (base de `Layer`).
- `src/lib/KafeGESHA/models.py:50-101` — `predict` (batch si `X[0]` es lista, `forward(X)` si no), `predict_proba` = `predict`, `predict_label` (threshold 0.5 / argmax; `INT` o `List[INT]`), `fit` con `msg = f"Epoch {epoch+1}/{epochs} — Loss {loss_pct:.2f}%"`, gradiente por unidad envuelto en lista, shapes de loss planas.
- `src/lib/KafeGESHA/activations.py` — `derivative(x)` con caché (`last_input`/`last_output`) solo como fallback `None`; `Softmax.derivative(vec)` conserva la rama Jacobiana.
- `src/lib/KafeGESHA/__init__.py` — exports públicos verificados (`Model as Gesha`, `Sequential`, `Functional`, `Dense`, `Dropout`, `Flatten`, `Input`, `Add`, `ActivationLayer` + aliases).
- `.opencode/adr/decisions.md:326` — ADR-0008 "Restaurar el Tipo GESHA y el Contrato Público de KafeGESHA tras el Refactor", status accepted, 2026-09-24 (leído, no modificado).
- `.opencode/tmp/gesha_type_fix_report.md` y `.opencode/tmp/tester_gesha_validation.md` — leídos; los números de validación citados en history/review provienen de ahí y coinciden con lo pedido.
- `pytest --collect-only -q` en la raíz — reproducido: `UnicodeDecodeError` en `test_output.txt` y `test_results.txt` ("Interrupted: 2 errors during collection", 465 tests collected), lo que confirma la nota menor del Reviewer.
- `file`/`git ls-files` — ambos archivos raíz son texto UTF-16 (little-endian, CRLF) y están versionados en git.

## No tocado (por instrucción del líder)

`src/**`, `tests/**`, `.opencode/progress/session-commands.md`, `.opencode/progress/current.md`, `.opencode/adr/`.

## Pendiente para el líder

- `/close`: finalizar la sesión en `current.md` / `session-log.md` y abrir el siguiente work item (KafeGESHA Conv2D).
- Opcional: mover/eliminar `test_output.txt` y `test_results.txt` de la raíz (deuda técnica de riesgo bajo, ya registrada en `known-issues.md`).
