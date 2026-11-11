# ¿Qué es programar?

## La idea en una frase

**Programar** es escribir una lista de instrucciones, en orden, para que la computadora haga algo por ti.

## Una comparación de la vida diaria

Piensa en una **receta de cocina**. La receta no cocina sola: alguien la lee paso a paso y hace exactamente lo que dice. Si los pasos están claros y en el orden correcto, el chocolate caliente sale perfecto.

Un **programa** es una receta para la computadora:

- La **receta** es tu archivo `.kf` (así terminan los programas de KAFE).
- **Quien cocina** es KAFE: lee tu programa de arriba hacia abajo, una línea a la vez.
- **El plato** es lo que aparece en la pantalla.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/programar-receta.svg"
<figcaption>KAFE lee tu programa línea por línea, de arriba hacia abajo. Cada línea produce su resultado antes de pasar a la siguiente.</figcaption>
</figure>

## Tu primera receta en KAFE

Para mostrar algo en la pantalla usamos la instrucción `show` (en inglés, *mostrar*). Lo que quieres mostrar va entre paréntesis, y cada instrucción termina con punto y coma `;`.

```kafe
--8<-- "tests/DocsExamples/aprende/programar-receta.kf"
```

Cuando lo ejecutas, KAFE muestra:

```text
--8<-- "tests/DocsExamples/aprende/programar-receta.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. La primera línea empieza con `--`. Eso es un **comentario**: una nota para las personas que KAFE ignora.
    2. Cada `show` mostró su texto. El texto va entre comillas `"…"` para que KAFE sepa dónde empieza y dónde termina.
    3. Los textos salieron **en el mismo orden** en que escribimos las líneas.

## La computadora también es una calculadora

`show` también puede mostrar el resultado de una cuenta. KAFE respeta el orden de las operaciones de matemáticas: primero multiplica y luego suma, a menos que uses paréntesis.

```kafe
--8<-- "tests/DocsExamples/aprende/programar-calculadora.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/programar-calculadora.expec"
```

Fíjate en la última línea: los paréntesis obligan a sumar primero (`2 + 3 = 5`) y luego a multiplicar (`5 × 4 = 20`).

## Error común: olvidar el punto y coma

El punto y coma le dice a KAFE "aquí termina esta instrucción". Si lo olvidas, KAFE no sabe dónde termina una instrucción y empieza la siguiente:

```kafe
--8<-- "tests/DocsExamples/aprende/programar-falta-punto-y-coma.error.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/programar-falta-punto-y-coma.error.stderr.expec"
```

!!! warning "Cómo leer el error"
    `Line 2, Column 0` dice **dónde** se dio cuenta KAFE del problema: al empezar la línea 2. `missing ';'` dice **qué** falta. El error está justo antes: al final de la línea 1.

## ¿Qué aprendiste?

- Un programa es una lista de instrucciones que KAFE ejecuta **en orden**.
- `show(...)` muestra textos y números en la pantalla.
- Cada instrucción termina con `;` y los comentarios empiezan con `--`.

??? info "Para curiosos 🤓"
    Antes de ejecutar tu programa, KAFE lo lee en tres pasos, como cuando lees una frase: primero separa las palabras (**análisis léxico**), luego revisa que estén bien ordenadas (**análisis sintáctico**) y por último verifica que tengan sentido (**análisis semántico**). Puedes verlo en detalle en [Análisis léxico, sintáctico y semántico](../specification/lexical-syntactic-semantic-analysis.md).

[Siguiente lección: Variables y tipos :material-arrow-right:](variables.md){ .md-button .md-button--primary }
