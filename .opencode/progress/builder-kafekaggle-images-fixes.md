# Builder Report — KafeKAGGLE: fixes del review `/dod` (bloqueante A1)

**Date:** 2026-10-13
**Task:** Resolver el ítem bloqueante del review `/dod` de "KafeKAGGLE — API genérica de imágenes": faltaba una **prueba** que demostrara que la relajación de tipo de `X` (decisión A1, ADR-0018) permite dividir tensores de imagen 4D `[N,C,H,W]` en `machine.stratified_train_test_split`.
**Status:** Implementado y verificado — pasa a Reviewer para cierre del `/dod`.

## Archivos creados / editados

Creados:
- `tests/KafeMACHINE/model_selection/test_stratified_train_test_split_4d.kf` — fixture que llama `machine.stratified_train_test_split` con `X` 4D `[N][C][H][W]`.
- `tests/KafeMACHINE/model_selection/test_stratified_train_test_split_4d.expec` — salida esperada `6 / 2 / 6 / 2 / 1 / 2`.
- `.opencode/progress/builder-kafekaggle-images-fixes.md` (este reporte).

Editados:
- `.opencode/adr/decisions.md` — párrafo **Actualización (2026-10-13, ADR-0018)** insertado al final de ADR-0017, antes del separador `---` con ADR-0018. No se tocó ADR-0018.

No modificados: `src/**` (el cambio A1 ya estaba aplicado en el árbol de trabajo), gramática, parsers ANTLR, `TypeUtils.py`, `tests/test_KafeMACHINE.py` (el subdir `model_selection` ya está en `SUBDIRS`).

## Verificación empírica del resultado

Ejecución directa de la fixture desde `src/`:

```
python Kafe.py tests/KafeMACHINE/model_selection/test_stratified_train_test_split_4d.kf
```

Salida real:
```
6
2
6
2
1
2
```

Cálculo manual del algoritmo de `stratified_train_test_split` (`y = [0,0,0,0,1,1,1,1]`, `test_size=0.25`, `random_state=42`):
- Por clase hay 4 muestras; `test_count = int(4 * 0.25) = 1` (con `len > 1` → `max(1, min(3, 1)) = 1`).
- 2 clases → test = 2, train = 6.
- `X_train` = 6, `X_test` = 2, `y_train` = 6, `y_test` = 2.
- Primera imagen `[C][H][W]` con `C=1`, `H=2` → `len(split[0][0]) = 1`, `len(split[0][0][0]) = 2`.

La salida real coincide con el cálculo manual: **`6/2/6/2/1/2`**. No hubo diferencias que documentar en el `.expec`.

## Comandos ejecutados y resultados

1. `python Kafe.py <fixture>` (desde `src/`) → `6, 2, 6, 2, 1, 2` (coincide con el cálculo manual).
2. `python -m pytest tests/test_KafeMACHINE.py -q` → **200 passed**.
3. `python -m pytest tests/test_KafeMACHINE.py -q -k "stratified_train_test_split_4d"` → **1 passed, 199 deselected** (confirma que la fixture se recolecta desde `model_selection`).
4. `python -m pytest tests/ -q` → **629 passed, 2 skipped** (204.12 s).

El total de la suite es **629 passed, 2 skipped**, consistente con el esperado (el conteo previo de 628 pasa a 629 al añadirse esta fixture).

## Desviaciones

- Ninguna. No se añadieron dependencias, no se cambió `src/**` (el split 4D no falla: la prueba lo demuestra) y no se tocó ADR-0018.
