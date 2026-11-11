# Estructura léxica

## La idea en una frase

La **estructura léxica** son las reglas que dicen cómo se escriben las piezas más pequeñas de un programa: palabras, números, textos, símbolos y comentarios.

## Una comparación de la vida diaria

Cuando lees una frase, tus ojos no ven letras sueltas: ven **palabras** separadas por espacios y signos de puntuación. Con las palabras ya separadas, entiendes la frase.

KAFE hace lo mismo con tu programa. Antes de ejecutarlo, una parte del intérprete llamada **lexer** (en español, "analizador léxico") lee el texto letra por letra y lo corta en piezas llamadas **tokens**. Un token es como una palabra del programa: `INT`, `total`, `=`, `10`, `;`… Los espacios y los comentarios se tiran a la basura: solo sirven para las personas.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/tutorial-lang1-tokens.svg"
<figcaption>El lexer corta la línea en siete tokens y le pone a cada uno su tipo. El comentario se descarta.</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-tokens.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-tokens.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. El lexer cortó la primera línea en los tokens `INT`, `total`, `=`, `10`, `+`, `2` y `;`.
    2. Otra parte del intérprete, el **parser**, revisó que esos tokens estuvieran en un orden válido: "tipo, nombre, `=`, valor, `;`".
    3. Al final KAFE ejecutó el programa y mostró `12`.

!!! note "Si es tu primera vez"
    Si todavía no sabes qué es una variable, empieza por la lección [Variables y tipos](../aprende/variables.md). Esta página va un paso más allá.

---

## Comentarios { #comments }

**La idea:** un comentario es una nota para las personas. KAFE la ignora por completo.

**Comparación:** es como escribir con lápiz en el margen de un libro de cocina. La receta no cambia; tu nota solo te ayuda a recordar algo.

KAFE tiene dos formas de comentario:

| Tipo | Cómo se escribe | Qué hace |
|---|---|---|
| De una línea | `--` | Ignora todo lo que sigue hasta el final de esa línea |
| De varias líneas | `-> ... <-` | Ignora todo lo que está entre `->` y `<-`, aunque ocupe muchas líneas |

Los comentarios de varias líneas se pueden **anidar**: puedes poner uno dentro de otro, y cada `->` necesita su propio `<-`.

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-comments.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-comments.expec"
```

!!! tip "¿Qué pasó aquí?"
    De todo el programa, KAFE solo "vio" dos instrucciones: `INT puntos = 10;` y `show(puntos);`. Todo lo demás eran comentarios.

### Error común: `--` dentro de una cuenta

Como `--` empieza un comentario, **no** puedes pegar dos signos menos. En `5--3`, KAFE ve el número `5` y luego un comentario que se come el resto de la línea (¡incluido el paréntesis!).

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-double-minus.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-double-minus.error.stderr.expec"
```

El paréntesis de cierre quedó dentro del comentario, así que en la línea 2 KAFE seguía esperando un `)`. Para arreglarlo, deja un espacio o usa paréntesis: `5 - -3` o `5 - (-3)`.

---

## Identificadores { #identifiers }

**La idea:** un **identificador** es el nombre que tú inventas para una variable, una función o un parámetro.

**Comparación:** es la etiqueta que le pegas a una caja. Puedes escribir lo que quieras en la etiqueta, pero con algunas reglas para que todos la lean igual.

**Reglas:**

- Empieza con una letra (`a`–`z`, `A`–`Z`) o con un guion bajo (`_`).
- Después puede tener letras, dígitos (`0`–`9`) y guiones bajos.
- KAFE **distingue mayúsculas y minúsculas**: `Score` y `score` son dos nombres distintos, y `True` no es lo mismo que `true`.
- No puede ser una palabra reservada (mira la tabla de abajo).
- Un guion bajo solo (`_`) **no** es un identificador: es un símbolo reservado del lenguaje.
- Las letras con tilde y la `ñ` no están permitidas en los nombres (sí dentro de los textos). Si escribes `INT año = 1;`, KAFE muestra un mensaje confuso, `unterminated string literal`, aunque no haya ningún texto: la causa real es la `ñ`.

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-identifiers.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-identifiers.expec"
```

!!! tip "¿Qué pasó aquí?"
    `my_variable`, `_private` y `var2` son nombres válidos; su suma es `35`. `Score` y `score` son dos cajas distintas: una guarda `1` y la otra `2`.

### Error común: empezar un nombre con un número

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-identifier-digit.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-identifier-digit.error.stderr.expec"
```

El lexer leyó `2` como un número, y KAFE esperaba un nombre (`ID`). Cambia el nombre a `players2`. Lo mismo pasa con un guion medio: `my-variable` se lee como `my` menos `variable`; usa `my_variable`.

---

## Palabras reservadas { #reserved-words }

**La idea:** algunas palabras ya tienen un significado fijo en KAFE. Se llaman **palabras reservadas** y no puedes usarlas como nombres.

**Comparación:** en un partido, el número de la camiseta del árbitro no se lo puede poner un jugador. Esas palabras ya "tienen dueño".

| Palabra reservada | Para qué sirve |
|---|---|
| `INT`, `FLOAT`, `BOOL`, `STR`, `VOID` | Tipos básicos |
| `List` | Tipo lista |
| `FUNC` | Tipo función |
| `GESHA` | Tipo para modelos de aprendizaje profundo |
| `PARDOS` | Tipo para tablas de datos (DataFrames) |
| `MACHINE` | Tipo para objetos de aprendizaje automático |
| `True`, `False` | Valores de verdad (booleanos) |
| `if`, `elif`, `else` | Condicionales |
| `while`, `for`, `in` | Bucles |
| `drip` | Declarar una función |
| `return` | Devolver un valor |
| `import` | Cargar librerías |
| `show` | Mostrar un valor en la consola |
| `pour` | Leer lo que escribe la persona usuaria |
| `range`, `len` | Funciones incorporadas |
| `append`, `remove` | Cambiar listas |
| `int`, `float`, `str`, `bool` | Convertir un valor a otro tipo |
| `match` | Reservada para el futuro (todavía no hace nada) |

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-reserved-word.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-reserved-word.error.stderr.expec"
```

`show` es una palabra reservada, así que no puede ser el nombre de una variable. Elige otro nombre, por ejemplo `shown`.

---

## Literales

**La idea:** un **literal** es un valor escrito directamente en el código, tal cual: `42`, `3.14`, `"Hola"`, `True`, `[1, 2, 3]`.

**Comparación:** si una variable es una caja con etiqueta, un literal es la cosa que metes en la caja.

### Números { #numeric-literals }

- Un **entero** (`INT`) son solo dígitos: `42`.
- Un **decimal** (`FLOAT`) lleva un punto con dígitos a **los dos lados**: `3.14`. (`1.` y `.5` no son válidos.)
- La **notación científica** sirve para números muy grandes o muy pequeños: `2.5e10` significa 2.5 × 10¹⁰. La `e` puede ser mayúscula o minúscula, y el exponente puede llevar signo (`1.2e-3`). Un número en notación científica siempre es `FLOAT`, aunque no tenga punto (`3E2` es `300.0`).

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-numbers.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-numbers.expec"
```

!!! note "Los números negativos"
    `-5` no es un único token: es el operador `-` aplicado al número `5`. Por eso funciona igual en `-5` que en `-(2 + 3)`.

### Textos { #string-literals }

Un texto (`STR`) va entre comillas **dobles** (`"Hola"`) o **simples** (`'Hola'`). Las dos formas son iguales. Un texto no puede cruzar el final de una línea.

Para escribir caracteres especiales dentro de un texto se usa una **secuencia de escape**: una barra invertida `\` seguida de una letra.

| Secuencia | Qué significa |
|---|---|
| `\n` | Salto de línea |
| `\t` | Tabulación |
| `\r` | Retorno de carro |
| `\\` | Una barra invertida |
| `\"` | Una comilla doble |
| `\'` | Una comilla simple |

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-strings.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-strings.expec"
```

!!! tip "¿Qué pasó aquí?"
    El texto vacío `""` mostró una línea en blanco. `\n` partió el texto en dos líneas, `\t` dejó un hueco grande entre `a` y `b`, y `\"` y `\'` pusieron comillas dentro del texto sin cerrarlo.

#### Error común: una secuencia de escape que no existe

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-bad-escape.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-bad-escape.error.stderr.expec"
```

`\q` no está en la tabla. Si querías una barra invertida de verdad, escribe `\\`.

#### Error común: olvidar cerrar las comillas

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-unterminated.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-unterminated.error.stderr.expec"
```

El texto empezó en la columna 5 y nunca se cerró. Agrega la comilla que falta: `show("Hello");`.

### Booleanos y listas { #boolean-literals }

- Los **booleanos** (`BOOL`) son `True` (verdadero) y `False` (falso), **con mayúscula inicial**.
- Una **lista** se escribe entre corchetes, con los elementos separados por comas: `[1, 2, 3]`. La lista vacía es `[]`, y una lista puede tener otras listas dentro.

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-bools-lists.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-bools-lists.expec"
```

#### Error común: `true` en minúsculas

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-lowercase-true.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-lowercase-true.error.stderr.expec"
```

Como `true` no es una palabra reservada, el lexer lo leyó como un **nombre** y KAFE buscó una variable llamada `true`. Escribe `True`.

---

## Importaciones { #imports }

**La idea:** `import` carga una **librería**, una caja de herramientas extra (matemáticas, gráficos, redes neuronales…).

**Comparación:** es como sacar del armario la licuadora antes de hacer un batido. Si no la sacas, no la puedes usar.

```kafe
import nombre_de_la_libreria;
```

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-imports.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-imports.expec"
```

**Reglas:**

- Las importaciones van **al principio** del archivo, antes de cualquier otra instrucción.
- Una importación sirve para todo el archivo.
- Todavía no se pueden poner alias (`as`).
- Usar una librería que no importaste produce un error.

```kafe
--8<-- "tests/DocsExamples/tutorial/lexical-structure-not-imported.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/lexical-structure-not-imported.error.stderr.expec"
```

Agrega `import math;` en la primera línea.

!!! warning "Un `import` tarde se calla"
    Si escribes un `import` **después** de otras instrucciones, KAFE no da error: deja de leer el programa en ese punto y todo lo que sigue no se ejecuta. Pon siempre tus importaciones arriba.

??? info "Para curiosos 🤓: cómo encuentra KAFE un módulo"
    Cuando escribes `import M;` y `M` no es una librería incorporada, KAFE busca el archivo `M.kf` en este orden:

    1. La carpeta del archivo que hace la importación.
    2. La carpeta base de la instalación de KAFE.
    3. La carpeta superior a la base (útil en desarrollo).

    KAFE guarda cada módulo en una **caché**: lo carga y lo ejecuta solo la primera vez. Las siguientes importaciones toman sus definiciones de la caché, y así se evitan los ciclos (un módulo que se importa a sí mismo a través de otro). Más detalles en [Importaciones](imports.md).

---

## ¿Qué aprendiste?

- El lexer corta tu programa en **tokens** y descarta los espacios y los comentarios (`--` y `-> ... <-`).
- Los nombres empiezan con letra o `_`, distinguen mayúsculas y no pueden ser palabras reservadas.
- Los literales son valores escritos tal cual: `42`, `3.14`, `2.5e10`, `"texto"`, `True`, `[1, 2]`.
- Las importaciones van arriba del todo.

??? info "Para curiosos 🤓: el lexer por dentro"
    Las reglas exactas están en `src/Kafe_Lexer.g4`. El lexer de ANTLR aplica la regla del **bocado más largo** (*maximal munch*): siempre forma el token más largo posible. Por eso `<=` es un solo token y no `<` seguido de `=`, y por eso `--` gana a dos `-` sueltos. Cuando dos reglas producen un token del mismo largo, gana la que aparece primero en la gramática; así `show` es la palabra reservada `SHOW` y no un `ID`.

[Siguiente: Sistema de tipos :material-arrow-right:](type-system.md){ .md-button .md-button--primary }
