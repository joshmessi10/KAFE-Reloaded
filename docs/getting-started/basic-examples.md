# Ejemplos básicos

## La idea en una frase

Esta página es una **caja de herramientas**: programas pequeños y completos que muestran, uno por uno, las piezas más usadas de KAFE.

## Una comparación de la vida diaria

Cuando aprendes a cocinar, primero practicas lo básico: cortar, hervir, mezclar. Después combinas esas técnicas en recetas grandes. Aquí practicas lo básico de KAFE. Puedes copiar cada ejemplo en un archivo `.kf` y ejecutarlo como aprendiste en [Tu primer programa](first-program.md).

## Variables y tipos

Una **variable** es una caja con nombre que guarda un valor. En KAFE escribes **el tipo** de cada caja: `INT` (entero), `FLOAT` (con decimales), `BOOL` (verdadero o falso), `STR` (texto) y `List[...]` (lista). A esto se le llama **tipado estático explícito**.

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-variables.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-variables.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. Creamos cajas de cada tipo básico. Las líneas con `--` son **comentarios**: notas que KAFE ignora.
    2. `List[List[INT]]` es una lista de listas, como una tabla con filas y columnas.
    3. `INT x;` y `List[INT] vacia;` no tienen valor inicial. KAFE les pone uno por defecto: `0` para `INT` y `[]` (lista vacía) para las listas.

## Operaciones

KAFE hace cuentas, compara valores y combina condiciones:

| Clase | Operadores |
|---|---|
| Aritméticos | `+` suma, `-` resta, `*` multiplicación, `/` división, `^` potencia, `%` resto |
| Comparación | `==` igual, `!=` distinto, `<`, `<=`, `>`, `>=` |
| Lógicos | `&&` y, `||` o, `!` no |

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-operaciones.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-operaciones.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `10 / 4` da `2.5`: la división puede dar decimales. `17 % 5` da `2`, lo que **sobra** al dividir 17 entre 5.
    2. `5 + 4 * 2` da `13` porque primero se multiplica. Con paréntesis, `(5 + 4) * 2` da `18`.
    3. Las comparaciones y los operadores lógicos responden `True` (verdadero) o `False` (falso).
    4. `+` también **pega** textos y listas: `[1, 2] + [3, 4]` da `[1, 2, 3, 4]`.

## Textos y secuencias de escape

Un texto (`STR`) va entre comillas dobles `"…"` o simples `'…'`. Algunos caracteres especiales se escriben con una barra invertida `\`; a eso se le llama **secuencia de escape**.

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-textos.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-textos.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `\n` saltó a una línea nueva y `\t` agregó una sangría (un tabulador) antes de `Mundo`.
    2. `\"` puso comillas dentro del texto sin cerrarlo.
    3. Las comillas simples funcionan igual que las dobles.

| Secuencia | Qué produce |
|---|---|
| `\n` | Salto de línea |
| `\t` | Tabulador |
| `\r` | Retorno de carro |
| `\\` | Una barra invertida |
| `\"` | Una comilla doble |
| `\'` | Una comilla simple |

### Error común: una secuencia que no existe

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-escape.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-escape.error.stderr.expec"
```

`\q` no está en la tabla, así que KAFE lo rechaza. Lo mismo pasa con `\u`. También es un error dejar una `\` sola al final del texto, o no cerrar las comillas.

## Decisiones: `if`, `elif` y `else`

Un **condicional** elige qué hacer según una condición, como cuando decides: "si llueve, llevo paraguas; si no, llevo gorra".

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-condicional.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-condicional.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `edad >= 18` es falso (15 no es mayor o igual a 18), así que KAFE saltó ese bloque.
    2. `elif` (*si no, si…*) revisó `edad >= 12`. Es verdadero, así que mostró `Adolescente`.
    3. Como ya encontró un camino, KAFE ignoró el `else`. El `;` de la última línea cierra todo el condicional.

!!! warning "No pongas `;` antes de `elif` ni de `else`"
    Las palabras `elif` y `else` van justo después del bloque anterior, sin un `;` delante. El único `;` extra va al final de todo el condicional. Si escribes `; elif`, KAFE deja de leer el programa en ese punto **sin mostrar ningún error**, y las líneas siguientes no se ejecutan.

## Bucles: repetir

Un **bucle** repite instrucciones. `for` repite una vez por cada elemento de una lista. `while` repite **mientras** una condición sea verdadera, como "mientras haya platos sucios, lava uno".

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-bucles.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-bucles.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `range(3)` crea la lista `[0, 1, 2]`. El `for` puso cada número en `i` y lo mostró.
    2. El `while` empezó con `contador` en 3. En cada vuelta lo mostró y le restó 1.
    3. Cuando `contador` llegó a 0, la condición `contador > 0` fue falsa y el bucle terminó. Luego se mostró `¡Despegue!`.

## Funciones

Una **función** es una receta con nombre: le das ingredientes (los **parámetros**) y te devuelve un resultado. En KAFE se crean con `drip`. Escribes el tipo de cada parámetro y, después de `=>`, el tipo del resultado.

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-funcion.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-funcion.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `sumar(3, 4)` puso `3` en `a` y `4` en `b`; `return` devolvió `7`.
    2. `restar(5)` recibió **solo el primer** valor. En lugar de fallar, creó una función nueva que espera el valor que falta. Esto se llama **currificación**.
    3. Esa función nueva es de tipo `FUNC(INT)=>INT`: recibe un `INT` y devuelve un `INT`. `restarDe5(3)` calculó `5 - 3 = 2`.

## Listas

Una **lista** guarda muchos valores en orden. Cada posición tiene un número llamado **índice**, que empieza en 0.

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-listas.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-listas.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `nums[0]` es el primer elemento (`10`) y `nums[-1]` el último (`30`): los índices negativos cuentan desde el final.
    2. `nums[0] = 99;` cambió el primer elemento. `append` agregó `40` al final y `remove` quitó el valor `20`.
    3. `len(nums)` contó los elementos: `3`.
    4. `range(4)` va de 0 a 3; `range(1, 5)` va de 1 a 4; `range(0, 10, 2)` avanza de 2 en 2.
    5. En una lista de listas, `matrix[1][0]` elige la fila 1 y luego la columna 0: `3`.

## Convertir entre tipos

A veces tienes un valor de un tipo y lo necesitas de otro, como el texto que devuelve `pour`. Para eso están `int`, `float`, `str` y `bool`.

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-conversiones.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-conversiones.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `int("5")` convirtió el texto `"5"` en el número `5`, así que `a + 1` dio `6`.
    2. `float("3.14")` dio el número decimal `3.14`.
    3. `str(42)` convirtió el número en texto, y por eso `c + "!"` pegó los textos: `42!`.
    4. `bool(1)` dio `True`.

## Comentarios

Un **comentario** es una nota para las personas. KAFE la ignora. `--` comenta hasta el final de la línea, y `->` … `<-` comenta varias líneas.

```kafe
--8<-- "tests/DocsExamples/tutorial/basic-examples-comentarios.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/basic-examples-comentarios.expec"
```

!!! tip "¿Qué pasó aquí?"
    KAFE saltó todos los comentarios y solo ejecutó las instrucciones: guardó `10` y `20` y mostró la suma, `30`.

## ¿Qué aprendiste?

- Cada variable tiene un tipo, y KAFE sabe hacer cuentas, comparar y pegar textos y listas.
- `if`/`elif`/`else` deciden; `for` y `while` repiten; `drip` crea funciones.
- Las listas se cuentan desde 0, y `int`, `float`, `str` y `bool` convierten valores.

??? info "Para curiosos 🤓"
    Cada pieza de esta página tiene su página de referencia, con todos los detalles: [Sistema de tipos](../language/type-system.md), [Operadores y expresiones](../language/operators.md), [Estructuras de control](../language/control-structures.md), [Funciones](../language/functions.md) y [Listas](../language/lists.md).

[Siguiente: Estructura léxica :material-arrow-right:](../language/lexical-structure.md){ .md-button .md-button--primary }
