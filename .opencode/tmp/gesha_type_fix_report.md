# Reporte: Fix tipo GESHA + contrato público KafeGESHA tras refactor

Fecha: 2026-09-24 · Builder: session KAFE

## Síntoma reportado

`python Kafe.py Ejemplo.kf` → `TypeError: Expected GESHA, obtained FUNC` en
`GESHA layer = geshaDeep.create_dense(1, "sigmoid", [2]);`

## Causa raíz

El refactor `ccb6053 "Update: Clean Gesha Architecture"` introdujo
`Layer.__call__ = connect` (src/lib/KafeGESHA/layers.py). Toda capa (Dense,
Input, etc.) se volvió callable, y `TypeUtils.obtener_tipo_dato()` chequeaba
`callable(dato)` ANTES de `isinstance(dato, (Gesha, Layer, Node, Input))`.
Consecuencia: toda capa GESHA se clasificaba `FUNC` y el type-checking de la
declaración `GESHA layer = ...` fallaba antes de llegar al chequeo GESHA.
Además, el refactor dejó la cadena de entrenamiento rota: activación escalar
sobre listas (`exp(-lista)`), `Dense.backward` con `derivative(None)`,
`predict` con semántica de batch, ausencia de `predict_label`/`predict_proba`,
formato de `fit` fuera del contrato (`- loss: X.XXXX` vs `— Loss 78.63%`) y
gradiente de loss escalar alimentando `Sequential.backward` (`float[:]` → TypeError).

## Cambios por archivo

### src/TypeUtils.py (FIX 1 — crítico)
`obtener_tipo_dato()`: se reordenaron los chequeos. Orden actual:

1. `type(dato) is list` (sin cambios)
2. `isinstance(dato, (Gesha, Layer, Node, Input))` → GESHA (ahora PRIMERO)
3. `callable(dato)` → FUNC
4. PARDOS / MACHINE / void / resto (sin cambios)

Verificado: las funciones de usuario KAFE (callables Python planos que no son
Layer/Model) siguen clasificándose FUNC; objetos MACHINE/PARDOS intactos.
Esto clasifica correctamente Dense, Input, Layer, Node y Model (Gesha) como
GESHA aunque sean callables por `__call__ = connect`.

### src/lib/KafeGESHA/layers.py (FIX 2 y 3)
- `Dense.__init__`: se inicializa `self._last_z = None`.
- `Dense.forward`: se guarda `self._last_z = z`; la activación se aplica POR
  ELEMENTO (`[self.activation.activate(v) for v in z]`) EXCEPTO para Softmax
  (usa `isinstance(self.activation, Softmax)`, importado desde activations),
  que opera sobre el vector completo.
- `Dense.backward`: la derivada de la activación se computa desde `_last_z`
  por elemento — Softmax: `derivative(self._last_z)` (rama jacobiana);
  resto: `act_grad = [self.activation.derivative(self._last_z[j]) for j in range(self.units)]`.
  Se mantiene el branching jacobiano vs vector existente.

### src/lib/KafeGESHA/activations.py (FIX 3 — derivada por elemento)
El caché `last_output` (Sigmoide/Tanh) y `last_input` (ReLU) se depositaba con
la activación del ÚLTIMO elemento, de modo que `derivative(z[j])` devolvía la
derivada del último elemento para TODAS las unidades. Cambio: cuando `x` no es
`None`, la derivada se computa DIRECTAMENTE desde `x` (Sigmoide:
`s(x)*(1-s(x))` con `s(x)=1/(1+exp(-x))`); el caché queda solo como fallback
para `derivative(None)` (usado todavía por `ActivationLayer.backward`).
Para un perceptron de 1 unidad con sigmoid, la derivada devuelta es
exactamente `s*(1-s)` sobre el `z` real del forward.

### src/lib/KafeGESHA/models.py (FIX 4, 5 y 6)
- `Model.predict`: semántica de sample único restaurada. Si `X[0]` es escalar
  (un vector = un sample) → `return self.forward(X)` (devuelve el vector de
  salida `[σ]`). Si `X[0]` es lista (matriz = batch) → `[self.forward(x) for x in X]`.
  Esto restaura el contrato usado por fixtures y docs:
  `List[FLOAT] prob = model.predict(p)` con `prob[0]`.
- `Model.predict_proba(X)`: `return self.predict(X)` (contrato viejo).
- `Model.predict_label(X)`: label escalar 0/1 con threshold 0.5 (salida de
  1 unidad) o argmax (multi-unidad). Para sample único devuelve `int`;
  para batch devuelve `List[INT]` — el type-checking de KAFE pasa en ambos.
- `Model.fit`:
  1. Gradiente: `loss_grad = self._loss.derivative(y, y_pred)[0]`; si el
     resultado es escalar (caso 1 unidad) se envuelve en lista para que
     `Sequential.backward` reciba una lista por unidad (`float[:]` ya no ocurre).
  2. Shapes de loss: se llama `compute(y, y_pred)` y `derivative(y, y_pred)`
     con listas PLANAS por sample (y=[0], y_pred=[σ]) en lugar de `[y], [y_pred]`
     anidados. Con el anidamiento, `BinaryCrossEntropy` recibía `yt=[0]`
     (lista) y `yt * log(...)` / `1 - yt` rompían o producían multiplicación
     de listas. Con la forma plana se reproduce exactamente el cálculo del
     contrato viejo (que converge y cuyos valores coinciden con los .expec).
  3. Formato de salida restaurado: `Epoch {epoch+1}/{epochs} — Loss {loss_pct:.2f}%`
     con `loss_pct = avg_loss * 100.0` (em-dash U+2014, "Loss" mayúscula,
     porcentaje). El bloque `val_data` se mantiene detrás de ese formato
     (ningún fixture de GESHA usa val_data; se mantuvo simple).

### tests/KafeGESHA/PerceptronSimple/and_gate.kf (FIX 7.1)
`geshaDeep.create_dense(1, "sigmoid", [2])` →
`geshaDeep.create_dense(1, "sigmoid", [2], 0.0, 42)` (semilla fija, espejo de
or_gate.kf).

### tests/KafeGESHA/PerceptronSimple/and_gate.expec (FIX 7.2)
Regenerado desde el stdout REAL del intérprete (1016 líneas). La versión
anterior tenía una línea fantasma `❯ python Kafe.py Ejemplo.kf` al inicio y
estaba truncada (faltaban las secciones `Esperado:`). Con la semilla 42 la
salida es determinista (2 ejecuciones idénticas).

### tests/KafeGESHA/PerceptronSimple/or_gate.expec (FIX 7.2)
La salida real regenerada es BIT-A-BIT idéntica al .expec existente
(validación fuerte: el entrenamiento refactorizado reproduce exactamente el
contrato numérico pre-refactor). Sin cambios efectivos.

### .opencode/progress/session-commands.md
Fila agregada: `| /impact | GESHA type regression + KafeGESHA auth-back | done |`

### .opencode/progress/current.md
Work item marcado `in_progress`: "Fix: Tipo GESHA + contrato público
KafeGESHA tras refactor".

## Verificación: ¿el entrenamiento APRENDE?

- `or_gate.kf` (seed 42): Epoch 1 Loss 78.63% → Epoch 1000 Loss 18.71%
  (monótonamente decreciente). Predicciones finales:
  [0,0]→0.366→clase 0 · [0,1]→0.862→1 · [1,0]→0.878→1 · [1,1]→0.987→1 ✓
- `and_gate.kf` (seed 42): Epoch 1 Loss 70.60% → Epoch 1000 Loss 26.42%
  (decreciente). Predicciones: [0,0]→0.054→0 · [0,1]→0.234→0 ·
  [1,0]→0.248→0 · [1,1]→0.640→1 ✓
- `src/Ejemplo.kf` (usuario, sin seed → no determinista, no modificado del
  estado actual en working tree): ya NO da "Expected GESHA, obtained FUNC";
  entrena con loss decreciente (≈69.5% → ≈25.9% en la corrida verificada) y
  predice AND correctamente. No fue necesario modificarlo para correr.

## Resultados pytest

| Comando | Resultado |
|---|---|
| `pytest tests/test_KafeGESHA.py -q` (baseline pre-fix) | 2 failed, 1 skipped |
| `pytest tests/test_KafeGESHA.py -q` (post-fix) | **2 passed, 1 skipped** |
| `pytest tests/ -q` (suite completa post-fix) | **464 passed, 1 skipped** |

El skip es el parametrize vacío de `test_invalid_programs` (no hay
`.error.kf` en tests/KafeGESHA) — pre-existente. Sin regresiones:
TypeUtils es compartido y las funciones KAFE siguen FUNC, MACHINE/PARDOS
intactos (la suite completa de MACHINE/PARDOS/bucles/funciones pasa).

## Notas de alcance

- Sin dependencias externas nuevas (todo built-in / KafeMATH).
- Comentarios en español, estilo de archivo respetado.
- `src/Ejemplo.kf` no se modificó (ya estaba modificado en el working tree
  antes de esta sesión — cambio AND vs OR del usuario).
- El valor `or_gate.expec` no aparece en `git diff` porque la salida real es
  idéntica al archivo existente.