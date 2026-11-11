# Funciones

## La idea en una frase

Una **función** es un pequeño programa con nombre: recibe datos, hace algo con ellos y devuelve un resultado.

## Una comparación de la vida diaria

Piensa en una **licuadora**. Le pones fruta (la **entrada**), presionas el botón (el **proceso**) y sale un jugo (la **salida**). No necesitas saber cómo funciona el motor para usarla, y puedes usarla todas las veces que quieras con frutas distintas.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/funciones-licuadora.svg"
<figcaption>Entrada → proceso → salida. Una función recibe datos, los transforma y devuelve un resultado.</figcaption>
</figure>

## Tu primera función

En KAFE las funciones se crean con la palabra `drip` (en inglés, *gotear*, como el café que gotea del filtro ☕):

```kafe
--8<-- "tests/DocsExamples/aprende/funciones-doble.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/funciones-doble.expec"
```

Vamos parte por parte:

| Parte | Qué significa |
|---|---|
| `drip` | "Aquí empieza una función" |
| `doble` | El nombre de la función |
| `(n: INT)` | La entrada: un **parámetro** llamado `n` que debe ser `INT` |
| `=> INT` | La salida: la función devuelve un `INT` |
| `return n * 2;` | Lo que hace: devuelve el doble de `n` |
| `;` (sola) | "Aquí termina la función" |

!!! tip "¿Qué pasó aquí?"
    1. Primero **definimos** la función `doble`. Definirla no muestra nada: es como armar la licuadora.
    2. `doble(4)` **llamó** a la función con `n = 4`. La función devolvió `8` y `show` lo mostró.
    3. Usamos la misma función otra vez con `21`. ¡Escribes la receta una vez y la usas muchas veces!

## La licuadora en KAFE

Las funciones también trabajan con textos. El `+` entre dos textos los une:

```kafe
--8<-- "tests/DocsExamples/aprende/funciones-licuadora.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/funciones-licuadora.expec"
```

## Funciones rápidas: lambdas

Cuando una función es muy corta, puedes escribirla en una sola línea y guardarla en una variable de tipo `FUNC`. A esto se le llama **lambda**:

```kafe
--8<-- "tests/DocsExamples/aprende/funciones-lambda.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/funciones-lambda.expec"
```

`FUNC(INT)=>INT` se lee "una función que recibe un `INT` y devuelve un `INT`".

## Error común: darle el ingrediente equivocado

```kafe
--8<-- "tests/DocsExamples/aprende/funciones-tipo-equivocado.error.kf"
```

```text
--8<-- "tests/DocsExamples/aprende/funciones-tipo-equivocado.error.stderr.expec"
```

`doble` pide un `INT` y le dimos el texto `"cuatro"`. Es como meter una piedra en la licuadora: KAFE se detiene antes de romper algo.

## ¿Qué aprendiste?

- Una función se define con `drip nombre(parámetros) => TIPO:` y termina con `;`.
- `return` dice qué devuelve la función.
- Defines la función una vez y la **llamas** todas las veces que quieras.

??? info "Para curiosos 🤓"
    En KAFE las funciones son **valores**: puedes guardarlas en variables, pasarlas a otras funciones y devolverlas. Además, si llamas a una función con menos argumentos de los que pide, obtienes una nueva función que espera el resto. Esto se llama **currying**:
    $f(a, b) = a + b \;\Rightarrow\; f(10)$ es una función que suma 10. Lo verás en [Funciones](../language/functions.md).

[Siguiente lección: ¿Qué es aprender de datos? :material-arrow-right:](aprender-de-datos.md){ .md-button .md-button--primary }
