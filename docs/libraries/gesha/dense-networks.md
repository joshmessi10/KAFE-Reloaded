# GESHA: redes densas y activaciones

La **capa densa** es la pieza básica de casi todas las redes: cada una de sus neuronas recibe **todos** los datos de entrada. Con capas densas y las **funciones de activación** correctas puedes clasificar, predecir números y resolver problemas que una sola neurona no puede.

Si todavía no lo hiciste, lee primero el [resumen de GESHA](../gesha.md): ahí está tu primera red y cómo aprende por dentro.

## La capa densa { #dense }

### La idea en una frase

Una **capa densa** de `m` neuronas con `n` entradas hace `m` sumas con pesos a la vez, una por neurona, y pasa cada una por la misma activación.

### Una comparación de la vida diaria

Piensa en un jurado de 3 personas que mira las mismas 4 notas de un concursante. Cada jurado da su propia importancia a cada nota (sus **pesos**) y además tiene su propia exigencia (su **sesgo**). Cada uno entrega su propio puntaje.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-dense-layer.svg"
<figcaption>Cuatro entradas a la izquierda y tres neuronas a la derecha. Las conexiones de cada neurona se encienden por turno: cada neurona recibe las cuatro entradas. La cuenta da 4 × 3 = 12 pesos, más 3 sesgos: 15 parámetros.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/gesha/dense-parameters.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/dense-parameters.expec"
```

`layer.weights` es una tabla de **4 filas** (una por entrada) y **3 columnas** (una por neurona), y `layer.biases` tiene **3** números. En total, 15 números para aprender.

??? info "Para curiosos 🤓"
    En forma de matrices, una capa densa calcula $a = f(xW + b)$, con $x$ de $1 \times n$, $W$ de $n \times m$ y $b$ de $1 \times m$. Cuesta del orden de $n \cdot m$ multiplicaciones por ejemplo. La primera capa de una red para imágenes de 28 × 28 píxeles (784 entradas) con 128 neuronas ya tiene $784 \times 128 + 128 = 100\,480$ parámetros.

### Crear la capa: `gesha.create_dense` { #create_dense }

| Posición | Parámetro | Qué significa |
|---|---|---|
| 1 | `units` (`INT`) | Cuántas neuronas tiene la capa. |
| 2 | `activation` (`STR`) | La activación: `"sigmoid"`, `"relu"`, `"tanh"`, `"softmax"` o `"linear"`. |
| 3 | `input_shape` (`List[INT]`) | Cuántos datos recibe, por ejemplo `[2]`. Con `[]` lo descubre en la primera predicción. |
| 4 | `regularization_lambda` (`FLOAT`, opcional) | Cuánto se castigan los pesos grandes. `0.0` = nada. |
| 5 | `seed` (`INT`, opcional) | La semilla de los pesos iniciales: con la misma semilla, el mismo resultado. |
| 6 | `kernel_initializer` (opcional) | Cómo se eligen los pesos iniciales. Ver [herramientas](training-tools.md). |
| 7 | `kernel_regularizer` (opcional) | Un regularizador. Ver [herramientas](training-tools.md). |

Propiedades: `layer.weights` y `layer.biases` (los números aprendidos), y `layer.d_weights`, `layer.d_biases` (los gradientes del último paso).

## Por qué hacen falta capas ocultas: XOR { #xor }

### La idea en una frase

Una sola neurona solo puede separar los datos con **una recta**. Algunos problemas, como la compuerta **XOR** ("o exclusivo"), necesitan una frontera que se doble, y para eso hace falta una **capa oculta**: neuronas entre la entrada y la salida.

### Una comparación de la vida diaria

XOR es la regla de un interruptor de escalera: la luz se enciende si **solo uno** de los dos interruptores está arriba, pero no si están los dos arriba o los dos abajo. Ninguna recta separa esas cuatro posibilidades.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-xor.svg"
<figcaption>Los cuatro puntos de XOR: cuadrados en (0, 1) y (1, 0), círculos en (0, 0) y (1, 1). Una recta punteada prueba varios ángulos y siempre deja algún punto del lado equivocado. Después aparecen dos rectas de una capa oculta que encierran a los cuadrados en una franja diagonal.</figcaption>
</figure>

Con **una sola neurona**, la red no logra aprender XOR por más que lo intente. La pérdida se queda en 0.72:

```kafe
--8<-- "tests/DocsExamples/gesha/dense-xor-one-neuron.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/dense-xor-one-neuron.expec"
```

Con una **capa oculta** de 4 neuronas `"tanh"`, la pérdida baja a 0.07 y acierta las cuatro:

```kafe
--8<-- "tests/DocsExamples/gesha/dense-xor.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/dense-xor.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. La capa oculta `hidden` tiene 4 neuronas que miran los 2 datos. Cada una dibuja **su propia recta**.
    2. La capa de salida `output` tiene 1 neurona que mira las 4 salidas de la oculta (por eso su `input_shape` es `[4]`) y **combina** esas rectas.
    3. Con `"adam"`, el optimizador ajusta el tamaño de cada paso solo. En la época 2 la pérdida sube antes de bajar: es normal que el camino no sea recto.

## Funciones de activación { #activations }

### La idea en una frase

La activación **dobla** el resultado de la suma. Sin ella, apilar capas no serviría: una suma de sumas sigue siendo una suma, y la red completa seguiría trazando solo rectas.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-activations.svg"
<figcaption>Tres curvas: sigmoid, una S entre 0 y 1; tanh, una S entre −1 y 1; y ReLU, plana en 0 para los negativos y recta para los positivos. Los puntos marcan sigmoid y tanh en −2, 0 y 2.</figcaption>
</figure>

| Activación | Fórmula | Rango | Se usa en |
|---|---|---|---|
| `"sigmoid"` | $\frac{1}{1 + e^{-z}}$ | 0 a 1 | La salida de un sí o no. |
| `"tanh"` | $\frac{e^{z} - e^{-z}}{e^{z} + e^{-z}}$ | −1 a 1 | Capas ocultas. |
| `"relu"` | $\max(0, z)$ | 0 a ∞ | Capas ocultas (la más común). |
| `"softmax"` | $\frac{e^{z_i}}{\sum_j e^{z_j}}$ | 0 a 1, suman 1 | La salida de varias clases. |
| `"linear"` | $z$ | cualquiera | La salida de un número. |

Las activaciones también existen como capas sueltas, y puedes probarlas directamente:

```kafe
--8<-- "tests/DocsExamples/gesha/dense-activations.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/dense-activations.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. Sigmoid lleva −2, 0 y 2 a `0.12`, `0.5` y `0.88`: siempre entre 0 y 1.
    2. Tanh los lleva a `-0.96`, `0.0` y `0.96`: entre −1 y 1, con el 0 en el centro.
    3. ReLU deja pasar los positivos tal cual.
    4. Softmax convierte `[1, 2, 3]` en `[0.09, 0.24, 0.67]`: probabilidades que suman 1.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-softmax.svg"
<figcaption>Tres barras con puntajes 1, 2 y 3 se transforman en probabilidades 0.09, 0.24 y 0.67: el puntaje más alto se lleva la mayor parte, y las tres suman 1.</figcaption>
</figure>

??? warning "Límite conocido: ReLU con negativos fuera de una capa densa"
    Una capa ReLU suelta convierte un negativo en el **entero** `0`. Si la lista de salida mezcla ese `0` con decimales, KAFE la rechaza porque sus listas deben tener un solo tipo. Dentro de una red (por ejemplo, con `create_dense(..., "relu", ...)`) esto no pasa.

    ```kafe
    --8<-- "tests/DocsExamples/gesha/dense-relu-negative.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/gesha/dense-relu-negative.error.stderr.expec"
    ```

??? info "Para curiosos 🤓"
    Para aprender, cada activación necesita su **derivada**: sigmoid $\sigma'(z) = \sigma(z)(1 - \sigma(z))$, tanh $1 - \tanh^2(z)$ y ReLU $1$ si $z > 0$ y $0$ si no. La derivada de sigmoid es como mucho 0.25: con muchas capas de sigmoid, los gradientes se achican capa tras capa (**desvanecimiento del gradiente**). Por eso las capas ocultas suelen usar ReLU o tanh. Las activaciones viven en `src/lib/KafeGESHA/activations/`. Un nombre desconocido produce una advertencia y KAFE usa la identidad en su lugar, así que escribe siempre uno de la tabla.

## Elegir la última capa { #output }

La última capa y la pérdida dependen de **qué quieres predecir**:

| Tarea | Última capa | Pérdida en `compile` | Respuestas `y` |
|---|---|---|---|
| Sí o no | 1 neurona `"sigmoid"` | `"binary_crossentropy"` | `0` o `1` |
| Varias clases | 1 neurona por clase, `"softmax"` | `"sparse_categorical_crossentropy"` | El número de la clase |
| Un número | 1 neurona `"linear"` | `"mse"` o `"mae"` | Un número |

### Varias clases con softmax { #softmax-example }

Puntos en tres zonas, clases `0`, `1` y `2`:

```kafe
--8<-- "tests/DocsExamples/gesha/dense-softmax.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/dense-softmax.expec"
```

La capa de salida tiene **3** neuronas, una por clase. `predict_label` devuelve la clase con la probabilidad más alta. Acertó las 6 de entrenamiento y las 3 nuevas.

### Un número con salida lineal { #regression-example }

La regla escondida es $y = 2x + 1$:

```kafe
--8<-- "tests/DocsExamples/gesha/dense-regression.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/dense-regression.expec"
```

Una neurona `"linear"` con pérdida `"mse"` es una [regresión lineal](../machine/linear.md#linearregression) que aprende **paso a paso**. Después de 10 épocas encontró un peso de `1.98` y un sesgo de `1.07`, muy cerca de 2 y 1, y predice `8.98` para $x = 4$ (lo exacto es 9). Como la regresión no tiene clases, `fit` muestra la pérdida pero no la exactitud.

## Otras capas para redes densas { #more-layers }

| Función | Qué hace |
|---|---|
| `gesha.dropout_layer(rate, seed)` | Mientras entrena, **apaga al azar** una fracción `rate` de las neuronas en cada paso. Obliga a la red a no depender de unas pocas. Al predecir no apaga nada. |
| `gesha.flatten_layer(input_shape)` | Aplana una tabla o imagen en una sola lista. Se usa entre [capas convolucionales](convolutional-networks.md) y densas. |
| `gesha.batch_normalization(epsilon, momentum)` | Normaliza las salidas de una capa (promedio 0, desviación 1), como un [StandardScaler](../machine/preprocessing.md#standardscaler) dentro de la red. |
| `gesha.relu_layer()`, `sigmoid_layer()`, `tanh_layer()`, `softmax_layer()`, `linear_layer()` | Las activaciones como capas sueltas. Para una red densa simple es más corto pasar la activación a `create_dense`. |

Los nombres antiguos `gesha.ReLULayer()`, `SigmoidLayer()`, `TanhLayer()`, `SoftmaxLayer()` y `LinearLayer()` siguen funcionando, pero en programas nuevos usa los de la tabla.

| 👍 Ventajas | 👎 Límites |
|---|---|
| Con suficientes neuronas, pueden aproximar casi cualquier relación. | Muchos parámetros: necesitan datos y tiempo. |
| La misma pieza sirve para clasificar y para predecir números. | No aprovechan la forma de los datos: tratan una imagen como una lista suelta de píxeles. Para eso están las [redes convolucionales](convolutional-networks.md). |

!!! tip "¿Qué aprendiste en esta página?"
    - Una capa densa conecta cada entrada con cada neurona: `n × m` pesos y `m` sesgos.
    - Una neurona sola traza una recta; las capas ocultas permiten fronteras que se doblan, como en XOR.
    - La activación dobla la suma: ReLU o tanh en las capas ocultas; sigmoid, softmax o linear en la salida, según la tarea.
