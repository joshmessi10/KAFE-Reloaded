# GESHA: redes recurrentes y secuencias

Las **redes recurrentes** (RNN) están hechas para **secuencias**: temperaturas día tras día, palabras de una frase, notas de una canción. Leen un elemento a la vez y llevan una **memoria** de lo que ya vieron.

## La red recurrente: leer y recordar { #rnn }

### La idea en una frase

Una RNN usa **la misma celda** en cada paso. La celda recibe el dato de ese paso **y su memoria anterior** (el **estado oculto** $h$), y produce una memoria nueva. Al final, la última memoria resume toda la secuencia.

### Una comparación de la vida diaria

Cuando lees un cuento, no lo entiendes palabra por palabra por separado: cada palabra nueva la interpretas con lo que **recuerdas** de las anteriores. Al terminar, tienes un resumen en la cabeza.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-rnn-unrolled.svg"
<figcaption>Tres copias de la misma celda RNN, una por paso. Los valores 0.1, 0.2 y 0.3 entran de a uno por abajo. Después de cada paso, la celda le pasa su memoria (el estado oculto h) a la derecha. Tras el tercer paso, la última memoria sube a la salida, que dice que la serie va en subida.</figcaption>
</figure>

Una secuencia en KAFE es `[pasos][rasgos]`: una lista de pasos, y en cada paso una lista de números. La serie `0.1, 0.2, 0.3` es `[[0.1], [0.2], [0.3]]`: 3 pasos de 1 rasgo.

### Tu primera red recurrente { #first-rnn }

¿La serie va **en subida** (`1`) o **en bajada** (`0`)?

```kafe
--8<-- "tests/DocsExamples/gesha/rnn-trend.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/rnn-trend.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `gesha.create_rnn(4, "tanh", [3, 1], False, 5)` crea una celda con **4** números de memoria, activación `"tanh"`, para secuencias de **3 pasos de 1 rasgo**. `False` significa "devuelve solo la última memoria".
    2. Una neurona `"sigmoid"` lee esa memoria y decide.
    3. En 10 épocas la pérdida baja a `0.0219`. Acierta las 6 series y dos nuevas: `0.3, 0.5, 0.8` sube y `0.7, 0.4, 0.0` baja.

### ¿Solo la última memoria o todas? { #return-sequences }

```kafe
--8<-- "tests/DocsExamples/gesha/rnn-shapes.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/rnn-shapes.expec"
```

Con `False`, la capa devuelve **una** memoria de `4` números. Con `True` devuelve **una por paso**: `[3, 4]`. Usa `True` cuando la siguiente capa también es recurrente y necesita la secuencia completa.

??? info "Para curiosos 🤓"
    La celda simple calcula $h_t = \tanh(W_x x_t + W_h h_{t-1} + b)$, con los **mismos** $W_x$, $W_h$ y $b$ en todos los pasos. Para entrenar, la red se "desenrolla" como en el dibujo y el gradiente viaja hacia atrás por todos los pasos (*backpropagation through time*). En secuencias largas, ese gradiente se multiplica muchas veces y puede achicarse hasta desaparecer o crecer sin control. Por eso existen LSTM y GRU.

## LSTM y GRU: memoria con puertas { #gates }

**LSTM** (*Long Short-Term Memory*) y **GRU** (*Gated Recurrent Unit*) agregan **puertas**: pequeñas neuronas sigmoide que deciden, en cada paso, **cuánto olvidar**, **cuánto guardar** y **cuánto mostrar** de la memoria. Así recuerdan cosas de muchos pasos atrás.

| Capa | Mecanismo | Úsala para |
|---|---|---|
| `gesha.create_rnn(unidades, activación, [T, F], todas, semilla)` | Memoria simple. | Secuencias cortas. |
| `gesha.create_lstm(unidades, [T, F], todas, semilla)` | Puertas de entrada, olvido y salida. | Dependencias largas. |
| `gesha.create_gru(unidades, [T, F], todas, semilla)` | Puertas de actualización y reinicio (menos que LSTM). | Lo mismo, con menos parámetros. |
| `gesha.bidirectional(capa)` | Lee la secuencia hacia adelante y hacia atrás, y junta las dos memorias. | Cuando tienes la secuencia completa (por ejemplo, una frase). Duplica el tamaño: `2 × unidades`. |

??? info "Para curiosos 🤓"
    En una LSTM, la puerta de olvido $f_t = \sigma(W_f[h_{t-1}, x_t] + b_f)$ multiplica la memoria anterior $c_{t-1}$; la de entrada $i_t$ decide cuánto de la propuesta nueva $\tilde{c}_t = \tanh(\ldots)$ se suma: $c_t = f_t \odot c_{t-1} + i_t \odot \tilde{c}_t$; y la de salida $o_t$ decide qué se muestra: $h_t = o_t \odot \tanh(c_t)$. Como $c_t$ se actualiza **sumando**, el gradiente puede viajar lejos sin desaparecer.

## Embedding: palabras como vectores { #embedding }

### La idea en una frase

Una red no entiende palabras. Un [Tokenizer](../machine/preprocessing.md#tokenizer) las convierte en números (`"gato"` → `4`), y una capa **Embedding** convierte cada número en un **vector** que se aprende: palabras que se usan parecido terminan con vectores parecidos.

```kafe
--8<-- "tests/DocsExamples/gesha/rnn-embedding.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/rnn-embedding.expec"
```

`gesha.embedding(5, 3, 7)` acepta números del 0 al 4 y da un vector de **3** números por palabra. La frase `[2, 4, 2]` se convierte en 3 vectores, y la palabra `2` recibe siempre **el mismo** vector (`True`).

??? warning "Error común: un número fuera del vocabulario"
    ```kafe
    --8<-- "tests/DocsExamples/gesha/rnn-embedding-range.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/gesha/rnn-embedding-range.error.stderr.expec"
    ```

## Capas para unir ramas { #merge }

| Función | Qué hace |
|---|---|
| `gesha.add_layer()` | Suma dos entradas elemento a elemento (conexiones "atajo"). |
| `gesha.concatenate_layer(eje)` | Pega varias entradas una al lado de otra. |
| `gesha.multiply_layer()` | Multiplica dos entradas elemento a elemento. |

Se usan con modelos `gesha.functional` (ver [modelos y entrenamiento](models-training.md#details)).

## Preparar las secuencias { #data }

1. Arma ventanas con la misma cantidad de pasos y rasgos.
2. Para pronosticar, separa por **tiempo**: entrena con el pasado y prueba con el futuro. Una división al azar deja ver el futuro.
3. Ajusta el escalado o el vocabulario **solo** con los datos de entrenamiento.
4. Para predecir **una** secuencia, envuélvela: `model.predict([secuencia])`.

Ejemplos completos: [temperaturas con RNN](../../ejemplos/gesha/rnn-temperature.md) y [sentimiento con Embedding y RNN](../../ejemplos/gesha/rnn-sentiment.md).

## Detalles técnicos { #details }

- Una muestra de RNN/LSTM/GRU es `[T, F]`; la salida final es `[unidades]` y con todas las memorias es `[T, unidades]`.
- `bidirectional` solo envuelve SimpleRNN, LSTM o GRU.
- Cada índice de Embedding debe estar entre 0 y `input_dim − 1`; la salida es `[T, output_dim]`.
- Las capas no tienen `stateful`, `return_state`, `mask_zero` ni dropout propio: cada secuencia empieza con la memoria en cero.
- El costo crece con el largo de la secuencia; LSTM y GRU tienen más parámetros que una RNN simple.

| 👍 Ventajas | 👎 Límites |
|---|---|
| Leen secuencias de cualquier largo con los mismos pesos. | Lentas: procesan un paso a la vez. |
| LSTM y GRU recuerdan lo importante por mucho tiempo. | La RNN simple olvida rápido en secuencias largas. |
