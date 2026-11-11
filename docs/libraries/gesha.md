# GESHA: redes neuronales en KAFE

La librería **GESHA** sirve para construir y entrenar **redes neuronales**: el tipo de modelo que está detrás del reconocimiento de imágenes, los traductores y los asistentes de voz. A esto se le llama ***deep learning*** (aprendizaje profundo). Está inspirada en *Keras*, pero cada capa, cada función de pérdida y cada optimizador está escrito desde cero dentro de KAFE para que puedas ver cómo funcionan.

Si nunca has oído hablar de neuronas artificiales, lee primero la lección [¿Qué es una neurona?](../aprende/neuronas.md).

## La idea: muchas neuronas pequeñas { #idea }

Una **neurona artificial** hace una cuenta muy simple: multiplica cada dato por un **peso**, suma todo, agrega un número fijo (el **sesgo**) y pasa el resultado por una **función de activación** que lo "dobla". Sola no es muy lista. Pero si pones **muchas** en **capas**, una detrás de otra, la red puede aprender formas muy complicadas.

Aprender significa **ajustar los pesos**. La red prueba, mide cuánto se equivocó y mueve cada peso un poquito en la dirección que reduce el error. Repite eso muchas veces.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-neuron.svg"
<figcaption>Dos datos, los dos valen 1, viajan por sus pesos hasta la suma (Σ) y pasan por la activación en forma de S. Con todos los pesos en 0 la salida es 0.5. Después de un paso de entrenamiento los pesos y el sesgo pasan a 0.05, los datos viajan otra vez y la salida sube a 0.537, más cerca de la respuesta correcta, 1.</figcaption>
</figure>

## Tu primera red { #first-network }

Vamos a enseñarle a una neurona la compuerta lógica **AND** ("y"): da `1` solo cuando las dos entradas son `1`.

```kafe
--8<-- "tests/DocsExamples/gesha/overview-first-network.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/overview-first-network.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `import gesha;` trajo la librería. Las redes tienen el tipo `GESHA`.
    2. `gesha.create_dense(1, "sigmoid", [2], 0.0, 42)` creó una **capa** con **1** neurona, activación `"sigmoid"`, que recibe **2** datos, sin regularización (`0.0`) y con la semilla `42`.
    3. `gesha.sequential([layer])` armó la **red** con esa capa.
    4. `compile` eligió cómo aprender: el **optimizador** `"sgd"` y la **pérdida** `"binary_crossentropy"`, la que se usa para respuestas de sí o no.
    5. `set_lr(2.0)` fijó la **tasa de aprendizaje**: qué tan grande es cada paso.
    6. `fit(X, y, 10, 1)` entrenó **10 épocas** (10 vueltas a todos los ejemplos), de **1** ejemplo por vez. En cada época, la **pérdida** baja: de `1.0468` a `0.1705`.
    7. `predict_label` da la respuesta final: acertó las cuatro filas.

## Las palabras que vas a ver { #words }

| Palabra | Qué significa |
|---|---|
| **Neurona** | Una suma con pesos más una activación. |
| **Capa** | Un grupo de neuronas que reciben los mismos datos. |
| **Peso** y **sesgo** | Los números que la red aprende. |
| **Activación** | La función que "dobla" la suma: `"sigmoid"`, `"relu"`, `"tanh"`, `"softmax"`, `"linear"`. |
| **Pérdida** (*loss*) | Un número que mide cuánto se equivocó la red. Más bajo es mejor. |
| **Época** (*epoch*) | Una vuelta completa por todos los ejemplos. |
| **Tasa de aprendizaje** (*learning rate*) | Qué tan grande es cada paso al ajustar los pesos. |
| **Optimizador** | La regla para dar esos pasos: `"sgd"`, `"adam"`, `"rmsprop"`, `"adamw"`. |

## Cómo aprende por dentro { #inside }

Cada ejemplo pasa por cuatro pasos, en ciclo:

1. **Predecir** (*forward*): los datos atraviesan las capas, de la primera a la última.
2. **Medir**: la pérdida compara la predicción con la respuesta correcta.
3. **Culpar** (*backward* o **retropropagación**): la red calcula, de la última capa a la primera, cuánto **culpa** tiene cada peso del error. Ese número es el **gradiente**.
4. **Ajustar**: el optimizador mueve cada peso un poquito **en contra** de su gradiente.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/gesha-training-loop.svg"
<figcaption>Un punto recorre los cuatro pasos: predecir (ŷ), medir la pérdida (L), calcular el gradiente que culpa a cada peso (∂L/∂w) y moverlo en contra (w ← w − η·∂L/∂w). Al lado se dibuja la pérdida real de la red AND en sus 10 épocas: baja de 1.05 a 0.17.</figcaption>
</figure>

Este programa hace **un solo paso** con todos los pesos empezando en 0, como en el dibujo de la neurona:

```kafe
--8<-- "tests/DocsExamples/gesha/overview-one-step.kf"
```

```text
--8<-- "tests/DocsExamples/gesha/overview-one-step.expec"
```

La cuenta a mano:

- **Predecir:** $z = 0 \cdot 1 + 0 \cdot 1 + 0 = 0$ y $\text{sigmoide}(0) = 0.5$.
- **Medir:** la pérdida es $-\ln(0.5) = 0.6931$.
- **Culpar:** con sigmoide y esta pérdida, el gradiente es muy simple: $(\text{predicción} - \text{respuesta}) \times \text{dato} = (0.5 - 1) \times 1 = -0.5$, para cada peso y para el sesgo.
- **Ajustar:** $w = 0 - 0.1 \times (-0.5) = 0.05$.

Con los pesos nuevos, la predicción sube a $\text{sigmoide}(0.15) = 0.5374$. Un paso pequeño en la dirección correcta.

??? info "Para curiosos 🤓"
    La retropropagación es la **regla de la cadena** del cálculo, aplicada capa por capa. Si $L$ depende de la salida $a = f(z)$ y $z = w \cdot x + b$, entonces $\frac{\partial L}{\partial w} = \frac{\partial L}{\partial a}\cdot f'(z)\cdot x$. Cada capa recibe el gradiente de la capa siguiente, calcula el de sus pesos y le pasa a la capa anterior el gradiente respecto de su entrada. En KAFE, cada capa tiene sus métodos `forward` y `backward` (en `src/lib/KafeGESHA/layers/`), y el modelo los llama en orden dentro de `fit` (en `src/lib/KafeGESHA/models_v2.py`).

## Mapa de la librería { #map }

| Página | Qué vas a encontrar |
|---|---|
| [Redes densas](gesha/dense-networks.md) | La capa básica, las activaciones, el perceptrón, XOR y cómo elegir la última capa. |
| [Modelos y entrenamiento](gesha/models-training.md) | `sequential`, `compile`, `fit`, `predict`, optimizadores, pérdidas y métricas. |
| [Redes convolucionales](gesha/convolutional-networks.md) | Imágenes, filtros, *pooling* y capas espaciales. |
| [Redes recurrentes](gesha/recurrent-networks.md) | Secuencias, SimpleRNN, LSTM, GRU y *embeddings*. |
| [Herramientas de entrenamiento](gesha/training-tools.md) | Inicializadores, regularizadores, *callbacks* y tensores. |
| [Clustering suave](gesha/soft-clustering.md) | Agrupar sin etiquetas con una red (experimental). |
| [Cobertura y límites de la API](gesha/api-coverage.md) | Qué está disponible desde KAFE y qué no. |
| [Ejemplos completos](../ejemplos/gesha-examples.md) | Programas de principio a fin para cada tipo de red. |

## Errores comunes { #errors }

??? warning "Olvidar `import gesha;`"
    ```kafe
    --8<-- "tests/DocsExamples/gesha/overview-no-import.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/gesha/overview-no-import.error.stderr.expec"
    ```

??? warning "Entrenar sin `compile`"
    La red no sabe cómo medir el error ni cómo dar pasos hasta que llamas a `compile`:

    ```kafe
    --8<-- "tests/DocsExamples/gesha/overview-no-compile.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/gesha/overview-no-compile.error.stderr.expec"
    ```

!!! note "Una línea por época"
    `fit` siempre imprime una línea por época con la pérdida (y la exactitud, si es clasificación). Por eso los ejemplos de estas páginas entrenan pocas épocas con pasos grandes. Con datos reales se usan más épocas y pasos más pequeños.

!!! tip "¿Qué aprendiste?"
    - Una neurona hace una suma con pesos y la pasa por una activación.
    - Una red es una pila de capas de neuronas, armada con `gesha.sequential`.
    - Aprender es repetir: predecir, medir la pérdida, culpar a cada peso y ajustarlo.
    - `compile` elige el optimizador y la pérdida; `fit` entrena por épocas; `predict` y `predict_label` responden.
