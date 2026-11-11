# Estructuras de control

Hasta ahora tus programas se leían de arriba abajo, una línea tras otra. Las **estructuras de control** cambian ese camino: permiten **elegir** qué líneas se ejecutan (`if`) y **repetir** líneas varias veces (`while` y `for`).

!!! tip "Antes de empezar"
    Esta página usa variables, tipos y listas. Si todavía no los conoces, lee primero [Variables](../aprende/variables.md).

## Bloques: dónde empieza y dónde termina

Un **bloque** es un grupo de líneas que van juntas, como los pasos dentro de un mismo paso de una receta.

- Los dos puntos `:` dicen "aquí empieza el bloque".
- Un `;` solo, en su propia línea, dice "aquí termina el bloque".
- Los espacios al inicio de la línea (la **sangría**) no son obligatorios, pero ayudan mucho a leer. Usa cuatro espacios.

## Decidir con `if`, `elif` y `else`

### La idea en una frase

`if` (en inglés, *si*) ejecuta un bloque **solo si** una condición es verdadera.

### Una comparación de la vida diaria

Piensa en un **cruce de caminos**. Antes de salir miras el clima: *si* hace calor, llevas agua; *si no, pero* está agradable, no llevas nada; *si no*, llevas abrigo. Tomas **un solo camino**, el primero que encaja.

- `if (condición):` es la primera pregunta.
- `elif (condición):` (*else if*, "si no, pero si…") es otra pregunta que solo se hace si las anteriores dieron `False`.
- `else:` (*si no*) es el camino por defecto, cuando ninguna condición fue verdadera.

La **condición** va entre paréntesis y debe ser un valor `BOOL`: `True` (verdadero) o `False` (falso).

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-clima.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-clima.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `temperatura > 25` es `True` (30 es mayor que 25), así que KAFE ejecutó el primer bloque.
    2. Como ya eligió un camino, **saltó** el `elif` y el `else`, aunque `30 > 15` también es verdad.
    3. El único `;` después del `else` cierra todo el `if`. Luego el programa siguió con `show("Fin del pronóstico")`.

La sintaxis completa es:

```kafe
if (condición):
    -- bloque si es verdad
elif (otra_condición):
    -- bloque alternativo
else:
    -- bloque por defecto
;
```

Puedes poner tantos `elif` como quieras, y tanto `elif` como `else` son opcionales.

!!! warning "No pongas `;` antes de `elif` o `else`"
    `elif` y `else` van **justo después** del bloque anterior, sin un `;` en medio. Solo hay un `;` al final de todo el `if`. Si escribes `; else:`, KAFE cierra el `if` antes de tiempo y **deja de ejecutar el resto del programa sin mostrar ningún mensaje**. Si tu programa termina "en silencio" antes de lo esperado, revisa esto primero.

### Un `if` dentro de otro

Puedes poner un `if` dentro de otro bloque. Cada `if` necesita su propio `;` de cierre:

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-anidado.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-anidado.expec"
```

## Repetir con `while`

### La idea en una frase

`while` (en inglés, *mientras*) repite un bloque **mientras** su condición sea verdadera.

### Una comparación de la vida diaria

Imagina a una corredora en una **pista**. Antes de cada vuelta se pregunta: "¿ya di 3 vueltas?". Mientras la respuesta sea no, sigue corriendo y suma una vuelta a su cuenta. Cuando llega a la cuarta pregunta, la respuesta cambia y se detiene.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/tutorial-lang2-vueltas.svg"
<figcaption>Un bucle <code>while</code> da vueltas mientras la condición sea verdadera. El contador sube en cada vuelta.</figcaption>
</figure>

Cada repetición se llama **iteración**, y el bloque que se repite se llama **bucle** (*loop* en inglés).

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-vueltas.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-vueltas.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `vuelta` empieza en 1. La condición `vuelta <= 3` es `True`, así que el bloque se ejecuta: muestra 1 y suma 1.
    2. Lo mismo pasa con 2 y con 3.
    3. Cuando `vuelta` vale 4, la condición es `False`. El bucle termina y el programa sigue con `show("¡Meta!")`.

!!! warning "Límite de iteraciones"
    Si la condición nunca se vuelve `False`, el bucle no terminaría nunca (un **bucle infinito**). Para protegerte, KAFE detiene cualquier `while` que supere las **10 000 iteraciones** y muestra un error.

## Recorrer con `for`

### La idea en una frase

`for` (en inglés, *para*) ejecuta un bloque **una vez por cada elemento** de una lista.

### Una comparación de la vida diaria

Tienes una **canasta de frutas**. Sacas una fruta, dices si te gusta, y repites con la siguiente hasta vaciar la canasta. No necesitas contar: la canasta te dice cuándo terminaste.

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-frutas.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-frutas.expec"
```

La sintaxis es `for (elemento in colección):`.

| Parte | Qué significa |
|---|---|
| `elemento` | Una variable nueva que recibe, en cada vuelta, el siguiente valor de la colección. No escribes su tipo. |
| `colección` | Una lista `List[T]` o el resultado de `range(...)`. |

Un `for` también puede ir acumulando un resultado en una variable creada **antes** del bucle:

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-suma.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-suma.expec"
```

## Contar con `range()`

### La idea en una frase

`range` (en inglés, *rango*) crea una lista de números enteros seguidos, lista para usarla en un `for`.

### Una comparación de la vida diaria

Es como las **marcas de una regla**: le dices dónde empezar, dónde parar y cada cuánto poner una marca.

| Forma | Qué crea | Ejemplo |
|---|---|---|
| `range(n)` | De 0 hasta n-1 | `range(4)` → `[0, 1, 2, 3]` |
| `range(a, b)` | De a hasta b-1 | `range(1, 5)` → `[1, 2, 3, 4]` |
| `range(a, b, p)` | De a hasta b-1, saltando de p en p | `range(0, 10, 2)` → `[0, 2, 4, 6, 8]` |

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-range.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-range.expec"
```

- El número final (`b`) **nunca** se incluye.
- Si el paso `p` es negativo, la lista va hacia abajo: `range(5, 0, -1)`.
- `range()` devuelve una `List[INT]`, así que también puedes mostrarla o guardarla.
- Todos los argumentos deben ser `INT`, y el paso no puede ser 0.

## Todo junto: FizzBuzz

FizzBuzz es un juego clásico: cuenta del 1 al 15, pero di "Fizz" si el número se divide entre 3, "Buzz" si se divide entre 5 y "FizzBuzz" si se divide entre los dos. El operador `%` da el **resto** de una división: si `i % 3 == 0`, la división entre 3 es exacta.

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-fizzbuzz.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-fizzbuzz.expec"
```

¿Por qué el caso de 15 va primero? Porque `if` elige el **primer** camino que encaja. Si `i % 3 == 0` fuera primero, el 15 diría "Fizz".

## `break` y `continue`

En otros lenguajes, `break` sale de un bucle y `continue` salta a la siguiente vuelta. **KAFE todavía no los tiene.** Para terminar un bucle antes, usa una condición en el `while`, o un `return` dentro de una función.

## Errores comunes

### La condición no es `BOOL`

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-condicion-no-bool.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-condicion-no-bool.error.stderr.expec"
```

KAFE no adivina si `1` significa "sí". Escribe una comparación que dé `True` o `False`, por ejemplo `if (n == 1):`.

### Olvidar avanzar en un `while`

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-bucle-infinito.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-bucle-infinito.error.stderr.expec"
```

`i` nunca cambia, así que `i < 5` siempre es `True`. Es la corredora que nunca suma sus vueltas. Arréglalo con `i = i + 1;` dentro del bucle.

### Un paso de 0 en `range`

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-paso-cero.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-paso-cero.error.stderr.expec"
```

Con paso 0 nunca llegarías al final. Usa un paso positivo para subir o negativo para bajar.

### Usar `break`

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-break.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-break.error.stderr.expec"
```

KAFE no conoce `break` y cree que es el nombre de una variable.

### Usar una variable creada dentro del bloque

```kafe
--8<-- "tests/DocsExamples/tutorial/control-structures-variable-del-bloque.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/control-structures-variable-del-bloque.error.stderr.expec"
```

Una variable **creada** dentro de un bloque (`if`, `while` o `for`) solo existe dentro de él. La variable del `for` (aquí `i`) tampoco existe después del bucle. Si necesitas el valor afuera, crea la variable **antes** del bloque y cámbiala adentro, como `total` en el ejemplo de la suma.

## ¿Qué aprendiste?

- `if` / `elif` / `else` eligen **un** camino; solo hay un `;` al final de todo.
- `while` repite mientras la condición sea `True`; `for` repite una vez por cada elemento.
- `range(a, b, p)` crea una lista de enteros que no incluye `b`.

[Siguiente: Funciones :material-arrow-right:](functions.md){ .md-button .md-button--primary }
