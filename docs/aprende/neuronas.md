# ¿Qué es una neurona?

## La idea en una frase

Una **neurona artificial** es una pequeña calculadora: recibe varios números, le da a cada uno una importancia (su **peso**), los suma y decide si se "enciende" o no.

## Una comparación de la vida diaria

Imagina que decides si **salir a jugar**. Miras tres cosas:

- ¿Hace sol? ☀️
- ¿Terminaste la tarea? 📚
- ¿Tus amigos están afuera? 👫

No todas importan igual. Quizás la tarea es lo que más pesa (si no la terminaste, no sales), los amigos importan bastante y el sol importa un poco. Sumas todo mentalmente y, si pasa de cierto límite, ¡sales a jugar!

Una neurona hace **exactamente eso** con números.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/neurona.svg"
<figcaption>Las entradas x₁, x₂ y x₃ viajan por líneas de distinto grosor (sus pesos w). La neurona suma todo (Σ) y, si supera el límite, se enciende y da 1.</figcaption>
</figure>

## Las partes de una neurona

| Parte | Qué es | En el ejemplo de jugar |
|---|---|---|
| **Entradas** ($x$) | Los datos que recibe | Sol, tarea, amigos (1 = sí, 0 = no) |
| **Pesos** ($w$) | Cuánto importa cada entrada | Tarea 0.9, amigos 0.5, sol 0.4 |
| **Suma** ($\Sigma$) | Entradas × pesos, todo sumado | `sol*0.4 + tarea*0.9 + amigos*0.5` |
| **Activación** | La regla que decide si se enciende | Si la suma pasa de 1.0 → 1, si no → 0 |

## Una neurona hecha a mano en KAFE

Con lo que ya sabes (variables, funciones e `if`) puedes construir una neurona:

```kafe
--8<-- "tests/DocsExamples/aprende/neurona-a-mano.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/neurona-a-mano.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. **Sol y tarea, sin amigos:** 0.4 + 0.9 = 1.3 → pasa de 1.0 → **1** (¡sale a jugar!).
    2. **Sol y amigos, sin tarea:** 0.4 + 0.5 = 0.9 → no pasa de 1.0 → **0** (se queda haciendo la tarea).
    3. **Tarea y amigos, sin sol:** 0.9 + 0.5 = 1.4 → **1**.

    El peso grande de la tarea hace que casi siempre decida si sales o no.

## ¿Y cómo aprende?

En el ejemplo **nosotros** elegimos los pesos. La magia del Deep Learning es que la computadora los **encuentra sola**:

1. Empieza con pesos al azar y hace una predicción.
2. Compara su respuesta con la correcta y calcula **cuánto se equivocó** (la **pérdida**).
3. Ajusta un poquito cada peso en la dirección que reduce el error.
4. Repite miles de veces. Cada vuelta completa por los datos se llama **época**.

Con el tiempo, el error baja y la neurona aprende.

## De una neurona a una red

Una sola neurona puede aprender reglas simples, como la compuerta lógica AND. Si conectas muchas neuronas en **capas**, con la salida de unas como entrada de otras, obtienes una **red neuronal** capaz de reconocer números escritos a mano, imágenes o el sentimiento de una frase. En KAFE las redes se construyen con la librería [GESHA](../libraries/gesha.md).

!!! example "Sigue aprendiendo con ejemplos reales"
    - [Perceptrón: compuerta AND](../ejemplos/gesha/perceptron-and.md): una neurona que aprende sola.
    - [Perceptrón multicapa: XOR](../ejemplos/gesha/mlp-xor.md): por qué a veces hace falta más de una capa.
    - [Clasificador de dígitos MNIST](../ejemplos/gesha/mnist-dense-classifier.md): una red que lee números.

## ¿Qué aprendiste?

- Una neurona multiplica cada entrada por su **peso**, suma todo y aplica una **activación**.
- **Entrenar** es ajustar los pesos poco a poco para que el error baje.
- Muchas neuronas conectadas en capas forman una **red neuronal**.

??? info "Para curiosos 🤓"
    La neurona calcula

    $$
    y = f\!\left(\sum_{i=1}^{n} w_i\,x_i + b\right)
    $$

    donde $b$ es el **sesgo** (en nuestro ejemplo, el límite 1.0 hace ese papel: $b = -1.0$) y $f$ es la **función de activación**. Usamos un escalón (0 o 1); las redes modernas usan funciones suaves como **sigmoide** $\sigma(z) = \frac{1}{1 + e^{-z}}$ o **ReLU** $\max(0, z)$, porque permiten calcular cómo cambiar cada peso con el **descenso por gradiente**:

    $$
    w \leftarrow w - \eta\,\frac{\partial \text{pérdida}}{\partial w}
    $$

    donde $\eta$ es la **tasa de aprendizaje** (qué tan grande es cada pasito).

[Sigue con el Tutorial :material-arrow-right:](../getting-started/installation.md){ .md-button .md-button--primary }
