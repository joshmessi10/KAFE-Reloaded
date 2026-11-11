# Variables y tipos

## La idea en una frase

Una **variable** es un nombre que guarda un valor para que puedas usarlo (y cambiarlo) más tarde.

## Una comparación de la vida diaria

Imagina **cajas con etiqueta**. En una caja escribes `edad` y guardas un número; en otra escribes `nombre` y guardas un texto. Cuando necesitas la edad, no la recuerdas de memoria: abres la caja que dice `edad`.

Cada caja tiene además un **tipo**, que dice qué cosas caben en ella. En la caja de los huevos no metes zapatos. En KAFE, en una caja `INT` no metes un texto.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/variables-cajas.svg"
<figcaption>Cada valor cae en la caja de su tipo: números enteros en INT, textos en STR, números con decimales en FLOAT y verdadero/falso en BOOL.</figcaption>
</figure>

## Los cuatro tipos básicos

| Tipo | Qué guarda | Ejemplo |
|---|---|---|
| `INT` | Números enteros (sin decimales) | `10`, `-3`, `0` |
| `FLOAT` | Números con decimales | `1.35`, `-0.5` |
| `STR` | Texto, siempre entre comillas | `"Ana"`, `"hola"` |
| `BOOL` | Verdadero o falso | `True`, `False` |

## Crear y usar variables

Para crear una variable escribes **el tipo, el nombre, `=` y el valor**. Luego puedes usar el nombre en lugar del valor:

```kafe
--8<-- "tests/DocsExamples/aprende/variables-cajas.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/variables-cajas.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. Creamos cuatro cajas, una de cada tipo, y pusimos un valor en cada una.
    2. `show(nombre)` abrió la caja `nombre` y mostró lo que había adentro: `Ana`.
    3. `edad = edad + 1;` sacó el 10, le sumó 1 y guardó el 11 **en la misma caja**. Para cambiar el valor ya no escribimos el tipo: la caja ya existe.

## Listas: una caja con compartimentos

A veces quieres guardar muchos valores juntos, como los puntos de un juego. Para eso existe la **lista**: una fila de compartimentos numerados. Su tipo se escribe `List[TIPO]`.

```kafe
--8<-- "tests/DocsExamples/aprende/variables-lista.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/variables-lista.expec"
```

!!! note "Los compartimentos empiezan en 0"
    `puntos[0]` es el **primer** elemento. Las computadoras cuentan desde cero: el primero es el 0, el segundo es el 1 y así sucesivamente. `len(puntos)` dice cuántos elementos hay y `append` agrega uno al final.

## Error común: meter algo en la caja equivocada

```kafe
--8<-- "tests/DocsExamples/aprende/variables-tipo-equivocado.error.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/variables-tipo-equivocado.error.stderr.expec"
```

KAFE esperaba un `INT` (un número) y recibió un `STR` (un texto). Para arreglarlo, escribe el número sin comillas: `INT edad = 10;`.

!!! tip "¿Por qué KAFE es tan estricto?"
    Porque así encuentra el error **antes** de que cause problemas. Si la edad fuera el texto `"diez"`, la cuenta `edad + 1` no tendría sentido. Decir el tipo de cada caja te ayuda a pensar con claridad.

## ¿Qué aprendiste?

- Una variable es una caja con nombre: `TIPO nombre = valor;`.
- Los tipos básicos son `INT`, `FLOAT`, `STR` y `BOOL`.
- Una lista `List[TIPO]` guarda muchos valores y se cuenta desde 0.

??? info "Para curiosos 🤓"
    KAFE tiene **tipado estático explícito**: el tipo de cada variable se escribe en el programa y se revisa antes de usar el valor. Hay más tipos, como listas dentro de listas (`List[List[INT]]`) y funciones (`FUNC`). Puedes verlos todos en [Sistema de tipos](../language/type-system.md) y [Listas](../language/lists.md).

[Siguiente lección: Funciones :material-arrow-right:](funciones.md){ .md-button .md-button--primary }
