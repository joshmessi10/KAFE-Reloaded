# SimpleRNN

## Fundamento matemático

Una RNN de Elman actualiza su estado mediante

$$h_t=\phi(x_tW_x+h_{t-1}W_h+b).$$

Puede devolver $h_T$ o toda la secuencia $(h_1,\ldots,h_T)$. BPTT aplica la
regla de la cadena desde $T$ hasta 1. El costo es
$O(T(FU+U^2))$ y el caché de entrenamiento ocupa $O(TU)$.

## Algoritmo KAFE

1. Inicializar $h_0=0$.
2. Recorrer los pasos y guardar estado y contexto de activación.
3. Devolver el último estado o todos los estados.
4. Recorrer hacia atrás, sumar el gradiente futuro y acumular gradientes de
   entrada, pesos de entrada, pesos recurrentes y bias.

## Ventajas y limitaciones

Ventajas: procesa longitudes variables, comparte parámetros en el tiempo y
modela orden temporal. También sirve como base educativa para LSTM/GRU.
Limitaciones: BPTT completo consume memoria lineal en $T$ y puede sufrir
gradientes desvanecidos o explosivos. No tiene masking ni estado persistente.

Se recomienda para secuencias cortas y enseñanza. Para dependencias largas o
producción convienen LSTM, GRU o Transformers.

## Relación con KAFE y referencias

`SimpleRNN` usa matrices NUMK y una activación independiente por timestep. Sus
pesos son parámetros GESHA compatibles con SGD/Adam. Referencias: Elman,
“Finding Structure in Time” (1990); Rumelhart, Hinton y Williams, “Learning
Representations by Back-Propagating Errors” (1986).

## Flujo E2E en KAFE (2026-10-18)

Desde 2026-10-18 la cadena RNN está ejercitada de punta a punta con datos
reales de Kaggle (validación E2E, ADR-0021). El flujo completo es:

1. **Ingesta**: para series numéricas, `kaggle.load_dataset_matrix`
   (p. ej. temperaturas mínimas de Melbourne,
   `paulbrabban/daily-minimum-temperatures-in-melbourne`). Para texto
   etiquetado en `.txt` tabulado sin encabezado,
   `kaggle.load_text_dataset` → PARDOS con columnas `text`/`label`.
2. **Preparación de secuencias** `[T,F]`: para series, ventanas
   deslizantes de longitud $T$ construidas con `while` (target: valor
   siguiente); para texto, `machine.tokenizer` (fit **solo sobre train**)
   produce `List[INT]` de longitud variable.
3. **Split correcto**: **cronológico** para series temporales (barajar
   filtra el futuro → data leakage temporal); **estratificado**
   (`machine.stratified_train_test_split`) para clasificación de texto.
4. **Construcción del modelo**: `gesha.create_rnn(units, activation)`
   (+ `gesha.embedding(num_embeddings, embedding_dim)` para texto),
   `gesha.create_dense`, `sequential`, `compile`/`fit`/`predict`/
   `predict_label`.
5. **Limitación conocida de `predict`**: en secuencias, `Model.predict`
   confunde muestra única con lote; los ejemplos siempre predicen por
   lote (envolviendo la muestra en una lista de una fila). Fix como
   follow-up.

Referencias en código: `src/EjemploRNN1.kf` (serie Melbourne, ventana
[7,1], `SimpleRNN(16,tanh)+Dense(1,linear)`, MAE 2.71 °C) y
`src/EjemploRNN2.kf` (sentimiento Yelp, `Embedding+SimpleRNN(8)+
Dense(1,sigmoid)`, accuracy test 0.5823). Fixtures de regresión:
`tests/KafeGESHA/rnn_sintetico.kf` y
`tests/KafeGESHA/rnn_embedding_sintetico.kf`.
