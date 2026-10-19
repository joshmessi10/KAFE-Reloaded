# Builder Report — Validación E2E de RNN con KafeKaggle (F1–F5)

Fecha: 2026-10-18 · Rol: Builder · Feature: Validación E2E de KafeGESHA RNN con KafeKaggle
Impact: `.opencode/progress/impact-rnn-e2e.md` · Scope del Builder: F1–F5 (F6 docs/ADR/benchmark/history queda fuera del Builder)

**Estado: implementada y verificada.** Suite completa verde: `691 passed, 2 skipped` (433.01 s).

---

## 1. Archivos creados / modificados

### F1 — KafeKaggle `load_text_dataset` (ya implementado en sesión anterior, verificado)
- `src/lib/KafeKaggle/funciones.py` — `_leer_filas`, `_parse_text_labels`, `_select_file_texto`, `load_text_dataset` (L1246+)
- `src/lib/KafeKaggle/__init__.py` — export
- `tests/test_KafeKaggle_backend.py` — tests backend (monkeypatch de descarga, sin red)

### F2 — Tokenizer en KafeMACHINE
- `src/lib/KafeMACHINE/preprocessing/Tokenizer.py` — clase `Tokenizer` (`_tokenizar`, `fit`, `fit_transform`, `transform`, `word_index`, `index_word`, `vocabulary_size`)
- `src/lib/KafeMACHINE/funciones.py` — fábrica `machine.tokenizer(num_words=0, oov_token="")` (L73-83)
- `src/lib/KafeMACHINE/__init__.py`, `src/lib/KafeMACHINE/preprocessing/__init__.py` — exports
- `tests/test_KafeMACHINE.py` — 15 tests backend (determinismo, OOV, num_words, errores, fábrica)
- Fixtures `.kf` en `tests/KafeMACHINE/preprocessing/`:
  - `test_tokenizer_basic.kf` + `.expec` (fit/transform determinista, índice 0 reservado, transform vacío)
  - `test_tokenizer_oov.kf` + `.expec` (OOV en índice 1, desconocidas ignoradas sin OOV)
  - `test_tokenizer_num_words.kf` + `.expec` (acotamiento de vocabulario)
  - `test_tok_empty.error.kf`, `test_tok_not_fitted.error.kf`, `test_tok_not_string.error.kf` + `.expec`

### F5 — Fixtures RNN sintéticos sin red (KafeGESHA)
- `tests/KafeGESHA/rnn_sintetico.kf` + `.expec` — 16 secuencias `[5,1]` construidas en el propio `.kf`, etiqueta binaria derivada de la SUMA (≥2.5), `SimpleRNN(4,tanh)` + `Dense(1,sigmoid)`, adam/bce, `set_lr(0.01)`, 25 épocas, batch 4 → **accuracy 1.0, loss 75.82% → 0.77%**
- `tests/KafeGESHA/rnn_embedding_sintetico.kf` + `.expec` — secuencias enteras `[3]` hechas a mano, `Embedding(10→4)` + `SimpleRNN(4,tanh)` + `Dense(1,sigmoid)`, 40 épocas → **accuracy 1.0, loss 69.31% → 65.09%**

### F5 — Ejemplos de red en `tests/KafeKaggle/` (fuera de la suite por `.example`)
- `kaggle_load_text_dataset.kf.example` + `.expec.example` — `[1000, 2]`, primer texto/etiqueta (ruta completa del archivo)
- `kaggle_load_dataset_temperaturas.kf.example` + `.expec.example` — `[3651, 2]` (twin de EjemploRNN1)

### F3/F4 — Ejemplos
- `src/EjemploRNN1.kf` — serie temporal Melbourne (ver §4)
- `src/EjemploRNN2.kf` — sentimiento Yelp (ver §5)

### Utilidades
- `scripts/generar_expec.py` — genera `.expec` desde el intérprete real, exige dos corridas byte-idénticas, aplica el filtro de métricas de progreso de `tests/test_KafeGESHA.py` a los fixtures GESHA

---

## 2. Comandos y resultados (timings reales)

| Comando | Resultado |
|---|---|
| `python scripts/generar_expec.py` | 10 fixtures OK, todas deterministas (dos corridas idénticas) |
| `Kafe.py EjemploRNN1.kf` (cwd=src) ×2 | rc=0, **115.84 s / 115.76 s**, salidas idénticas |
| `Kafe.py EjemploRNN2.kf` (cwd=src) ×2 | rc=0, **77.49 s / 78.07 s**, salidas idénticas |
| `pytest tests/test_KafeKaggle_backend.py tests/test_KafeMACHINE.py tests/test_KafeGESHA.py -q` | **331 passed, 1 skipped** (232.08 s) |
| `pytest tests/ -q` | **691 passed, 2 skipped** (433.01 s) — verde |

Ambos ejemplos < 5 min (puerta de la feature). Sin red la suite no se rompe (los `.example` quedan fuera de la recolección; los fixtures de Kaggle usan cache o monkeypatch).

## 3. Decisiones y desviaciones respecto del plan

1. **Archivo del dataset de temperaturas**: el real se llama `daily-minimum-temperatures-in-me.csv` (no `daily-minimum-temperatures.csv` como decía el impact). Al ser el único CSV, la selección automática de `load_dataset` funciona.
2. **Columna de temperatura tipada como STR**: el CSV tiene 3 celdas envenenadas (`?0.2`, `?0.8`, `?0.1`) y una fila residual de encabezado sin comillas al final (por eso `shape` = `[3651, 2]`). `df.col(...)` devuelve `List[STR]`; el ejemplo acota con `while` a las primeras DIAS filas (limpias) y convierte con `float()`. El plan asumía columna numérica.
3. **Selector de sentimiento con ruta completa**: `yelp_labelled.txt` solo es ambiguo (el zip trae una copia anidada: `sentiment labelled sentences/sentiment labelled sentences/yelp_labelled.txt`). Se usa `sentiment labelled sentences/yelp_labelled.txt` (desviación documentada de la spec).
4. **`rnn_sintetico.kf`: `modelo.set_lr(0.01)` añadido** (desviación). Sin él, con lr default 0.001 y 25 épocas el modelo no supera 0.5 (todas las salidas quedan ~0.5 → umbral → 1 siempre). Con lr 0.01 converge: loss 75.82%→0.77%, accuracy 1.0, predicciones correctas.
5. **`EjemploRNN1`: DIAS 500→300 y épocas 20→15** (desviación permitida por la puerta de 5 min): 255.61 s → ~116 s. MAE test = **2.71 °C**; split cronológico 80/20 (234/59), min-max con stats del train `[2.1, 25.0]`.
6. **`EjemploRNN2`: `machine.stratified_train_test_split`** en vez de `machine.train_test_split` del plan (desviación): conserva la proporción 0/1 y devuelve `TrainTestSplit` indexable (`MACHINE split = ...; split[0..3]`), patrón ya probado en fixtures. Además: `limit=400` de ingesta (con 1000 frases el fit no terminaba en 600 s), truncado manual a MAXLEN=10 tokens, vocabulario acotado `tokenizer(200,"<OOV>")` y train balanceado a mano (142/142). Historial de tuning:
   | Config | Tiempo | Test acc |
   |---|---|---|
   | lr 0.01, vocab completo, seq completa | 179.8 s | 0.6076 |
   | lr 0.001, vocab completo, seq completa | 178.3 s | 0.5316 |
   | lr 0.01, vocab completo, trunc 10 | 151.9 s | 0.5570 |
   | lr 0.01, vocab 200, trunc 10 | 86.1 s | 0.5823 |
   | **lr 0.01, vocab 200, trunc 10, balanceado (final)** | **77.5 s** | **0.5823** (baseline mayoría 0.557; 2/3 frases nuevas correctas) |
   Con una SimpleRNN pura y ~284 secuencias de train el modelo memoriza el train (96%+) y generaliza poco: queda documentado en la cabecera del ejemplo como lección de overfitting; el valor del ejemplo es el flujo completo E2E.
7. **Fixtures de tokenizer en 3 válidos + 3 errores** con los nombres de la spec (`test_tokenizer_basic/oov/num_words`, `test_tok_*`).

## 4. EjemploRNN1 — resultado (melbourne, sin red de calidad)

`load_dataset` → acotado a 300 días (`while` + `float`) → ventanas `[7, 1]` → objetivo t+7 → split cronológico 80/20 → min-max con stats del train → `SimpleRNN(16,tanh)` + `Dense(1,linear)`, adam/mse, lr 0.01, 15 épocas batch 8 → desnormaliza → MAE 2.71 °C + 5 predicciones vs reales. Pérdida: 7.77% → 1.56%. Determinista (dos corridas idénticas).

## 5. EjemploRNN2 — resultado (yelp)

`load_text_dataset` (ruta completa, limit 400) → split estratificado 0.2/42 (321/79) → balanceo 142/142 → `tokenizer(200,"<OOV>")` fit SOLO con train → truncado 10 → `Embedding(202→8)` + `SimpleRNN(8,tanh)` + `Dense(1,sigmoid)`, adam/bce, lr 0.01, 8 épocas batch 8 → accuracy test 0.582, matriz de confusión `[[18,17],[16,28]]`, 3 frases nuevas (2/3 correctas). Demo de OOV incluida (6 palabras OOV en el primer texto de test). Determinista.

## 6. Hallazgo fuera de scope (no corregido — candidato a known-issue)

**`KafeMATH.log` tiene error de signo cerca de 1**: la serie de Taylor con 99 términos sobre `t = m−1 ∈ [0,1)` converge mal en los bordes del bin de reducción; medido: `log(0.999) → +0.0031` (debería ser `−0.0010`), `log(0.99999999) → +0.0050` (debería ser `≈ −1e−8`). Efecto visible: la pérdida BCE impresa por `fit` puede volverse levemente NEGATIVA cuando el modelo se vuelve muy confiado (corridas intermedias de EjemploRNN2 con vocabulario completo mostraron `Loss −0.30%`). **No afecta el entrenamiento** (el `derivative` de BCE no usa `log`). La config final del ejemplo no lo manifiesta. Recomendación: registrar en `known-issues.md` y corregir `KafeMATH.log` (mejor reducción de argumento, p. ej. `m ∈ [√2/2, √2]`, o más términos/racional) como follow-up de otra feature.

## 7. Pendiente (fuera del scope del Builder)

F6: docs (`docs/bibliotecas/kaggle.md`, `machine.md`), concept records (`tokenizer.md`, `simple-rnn.md`), benchmark de 5 escenarios, ADR-0021, history, roadmap. Los hace el rol correspondiente tras el review.
