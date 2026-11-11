# Operadores y expresiones

## La idea en una frase

Un **operador** es un símbolo que hace algo con uno o dos valores (sumar, comparar, unir…), y una **expresión** es cualquier trozo de código que se convierte en un valor, como `5 + 4 * 2`.

## Una comparación de la vida diaria

En una calculadora, los números son los ingredientes y los botones `+`, `−`, `×`, `÷` son las acciones. Una expresión es lo que tecleas antes de apretar `=`. KAFE tiene botones para cuentas, para comparar y para combinar respuestas de sí o no.

!!! note "Antes de empezar"
    Esta página usa los tipos `INT`, `FLOAT`, `STR` y `BOOL`. Si no los conoces, mira [Variables y tipos](../aprende/variables.md) y el [Sistema de tipos](type-system.md).

---

## Operadores aritméticos { #arithmetic-operators }

**La idea:** sirven para hacer cuentas.

| Operador | Operación | Ejemplo | Resultado |
|---|---|---|---|
| `+` | Suma (o une textos) | `show(5 + 4);` | `9` |
| `-` | Resta | `show(10 - 3);` | `7` |
| `*` | Multiplicación | `show(3 * 4);` | `12` |
| `/` | División (siempre da `FLOAT`) | `show(10 / 4);` | `2.5` |
| `^` | Potencia | `show(5 ^ 2);` | `25` |
| `%` | Módulo: el resto de la división | `show(5 % 4);` | `1` |

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-arithmetic.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-arithmetic.expec"
```

!!! tip "¿Qué es el módulo?"
    Si repartes 5 caramelos entre 4 personas, cada una recibe 1 y **sobra 1**. Ese sobrante es `5 % 4`. Sirve, por ejemplo, para saber si un número es par: `n % 2` es `0` cuando `n` es par.

### Error común: dividir entre cero

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-division-by-zero.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-division-by-zero.error.stderr.expec"
```

Repartir algo entre cero personas no tiene sentido, ni para KAFE. Revisa antes con un `if` que el divisor no sea `0`.

---

## Operadores de comparación { #comparison-operators }

**La idea:** comparan dos valores y responden `True` (verdadero) o `False` (falso).

**Comparación:** es como una balanza: te dice si los dos platos pesan igual o cuál pesa más.

| Operador | Significa | Ejemplo |
|---|---|---|
| `==` | Igual a | `a == b` |
| `!=` | Distinto de | `a != b` |
| `<` | Menor que | `a < b` |
| `<=` | Menor o igual que | `a <= b` |
| `>` | Mayor que | `a > b` |
| `>=` | Mayor o igual que | `a >= b` |

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-comparison.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-comparison.expec"
```

!!! tip "¿Qué pasó aquí?"
    También se pueden comparar textos (`'asdf' == 'asdf'`) y listas completas (`[12, 1] == [12, 1]`). Un `INT` y un `FLOAT` con el mismo valor son iguales: `5 == 5.0` es `True`. Ojo: `=` (un solo signo) **guarda** un valor; `==` (dos signos) **compara**.

### Error común: comparar un número con un texto

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-compare-types.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-compare-types.error.stderr.expec"
```

"¿Es 1 menor que la letra a?" no tiene respuesta. Compara valores del mismo tipo, o convierte uno de ellos (`str(1) < "a"`).

---

## Operadores lógicos { #logical-operators }

**La idea:** combinan respuestas de sí o no.

**Comparación:** "Salgo a jugar **si** terminé la tarea **y** no llueve." Las dos condiciones se tienen que cumplir. "Como postre **si** hay helado **o** hay fruta." Basta con una.

| Operador | Significa | Es `True` cuando… | Ejemplo |
|---|---|---|---|
| `&&` | Y | …los dos lados son `True` | `a > 0 && b > 0` |
| `\|\|` | O | …al menos un lado es `True` | `a > 0 \|\| b > 0` |
| `!` | NO | …el valor es `False` (lo da vuelta) | `!True` |

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-logical.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-logical.expec"
```

!!! note "KAFE no mira más de lo necesario"
    En `a && b`, si `a` ya es `False`, KAFE no calcula `b`: el resultado será `False` de todas formas. En `a || b`, si `a` ya es `True`, tampoco mira `b`. A esto se le llama **evaluación en cortocircuito**.

---

## Asignación { #assignment-operator }

**La idea:** `=` guarda un valor en una variable que ya existe, o en una posición de una lista.

| Forma | Qué hace |
|---|---|
| `ID = expresión;` | Asignación simple |
| `ID[índice] = expresión;` | Asignación en una posición de una lista |

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-assignment.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-assignment.expec"
```

`x = x + 5;` se lee "toma el valor de `x`, súmale 5 y guárdalo otra vez en `x`". La asignación es una **instrucción**, no una expresión: no produce un valor.

### Error común: `+=` no existe

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-compound-assignment.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-compound-assignment.error.stderr.expec"
```

KAFE no tiene operadores compuestos como `+=` o `-=`. Escribe la cuenta completa: `x = x + 5;`.

---

## Mostrar resultados: show() { #output-statement-show }

`show(expresión)` calcula la expresión y muestra el resultado en la consola, en una línea propia. Funciona con cualquier tipo.

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-show.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-show.expec"
```

---

## Precedencia: quién va primero { #operator-precedence }

**La idea:** cuando una expresión tiene varios operadores y no hay paréntesis, la **precedencia** decide cuál se calcula primero.

**Comparación:** al vestirte, primero van los calcetines y después los zapatos. No importa en qué orden los nombres: el orden está fijado. En matemáticas pasa lo mismo: en `5 + 4 * 2` la multiplicación va antes que la suma.

Puedes imaginar la expresión como un **árbol**: KAFE calcula primero las ramas de abajo y sube con los resultados hasta la raíz.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/tutorial-lang1-precedence.svg"
<figcaption>En 5 + 4 * 2, la rama de la multiplicación está más abajo: se calcula primero (8) y después la suma (13).</figcaption>
</figure>

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-precedence.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-precedence.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `5 + 4 * 2`: primero `4 * 2 = 8`, luego `5 + 8 = 13`.
    2. `(5 + 4) * 2`: los paréntesis mandan, así que primero `9` y luego `18`.
    3. `5 ^ 2 * 2`: la potencia va antes: `25 * 2 = 50`.
    4. `2 ^ 3 ^ 2`: la potencia se agrupa **de derecha a izquierda**: `2 ^ 9 = 512`.
    5. `-3 - -3`: el `-` pegado al número lo hace negativo; el resultado es `0`.
    6. `'asdf' * 5` repite el texto cinco veces.

Tabla completa, de **mayor** a **menor** precedencia:

| Nivel | Operadores | Agrupa de | Descripción |
|---|---|---|---|
| 1 | `()`, `[]`, `.` | izquierda | Paréntesis, índice de lista, acceso a una librería |
| 2 | `f(args)` | izquierda | Llamada a una función |
| 3 | `!`, `-` (de un solo valor) | derecha | NO lógico y número negativo |
| 4 | `^` | derecha | Potencia |
| 5 | `*`, `/`, `%` | izquierda | Multiplicación, división, módulo |
| 6 | `+`, `-` | izquierda | Suma (o unión de textos) y resta |
| 7 | `<`, `<=`, `>`, `>=` | izquierda | Comparación de orden |
| 8 | `==`, `!=` | izquierda | Igualdad |
| 9 | `&&`, `\|\|` | izquierda | Y, O (**el mismo nivel**) |

"Agrupa de izquierda" quiere decir que, con operadores del mismo nivel, KAFE calcula de izquierda a derecha: `10 - 3 - 2` es `(10 - 3) - 2 = 5`.

### Tres sorpresas de la precedencia

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-surprises.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-surprises.expec"
```

!!! warning "¿Qué pasó aquí?"
    1. **`&&` y `||` tienen el mismo nivel** y se leen de izquierda a derecha. `True || False && False` es `(True || False) && False`, que da `False`. En matemáticas y en muchos otros lenguajes, "Y" va antes que "O" y el resultado sería `True`. Pon paréntesis para decir lo que quieres.
    2. **Las comparaciones no se encadenan.** `3 > 2 > 1` se lee `(3 > 2) > 1`, es decir `True > 1`, y `True` vale `1`: el resultado es `False`. Escribe `3 > 2 && 2 > 1`.
    3. **El signo menos va antes que la potencia.** `-2 ^ 2` es `(-2) ^ 2 = 4`, no `-4` como en matemáticas. Si quieres `-4`, escribe `-(2 ^ 2)`.

---

## Expresiones lambda { #lambda-expressions }

**La idea:** una **lambda** es una función pequeña y sin nombre, escrita en una sola expresión.

**Comparación:** es como una nota adhesiva con una instrucción corta ("multiplica por sí mismo") en vez de una receta completa en una tarjeta.

```kafe
(parámetros) => expresión
```

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-lambda.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-lambda.expec"
```

**Características:**

- **Devuelve sola:** la lambda devuelve el valor de su expresión; no lleva `return`.
- **Parámetros con tipo:** como en las funciones normales (`y: INT`).
- **Uso:** son muy prácticas para pasarlas a funciones de orden superior, como `apply`.

Más en [Funciones](functions.md).

---

## Conversiones de tipo { #type-conversions }

**La idea:** `int`, `float`, `str` y `bool` crean un valor nuevo de otro tipo a partir de uno que ya tienes.

**Comparación:** es como cambiar dinero en una casa de cambio: entregas pesos y recibes la misma cantidad en otra moneda.

| Conversión | Qué hace | Ejemplo |
|---|---|---|
| `int(x)` | A entero. Con decimales, **corta** la parte decimal | `int("5")` → `5`, `int(3.9)` → `3` |
| `float(x)` | A decimal | `float("3.14")` → `3.14`, `float(2)` → `2.0` |
| `str(x)` | A texto | `str(42)` → `"42"` |
| `bool(x)` | A booleano: `0`, `0.0`, `""` y `[]` dan `False`; lo demás, `True` | `bool(1)` → `True`, `bool(0)` → `False` |

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-conversions.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-conversions.expec"
```

!!! warning "Cuidado con `bool` y los textos"
    `bool` solo mira si el texto está vacío. Por eso `bool("False")` es `True`: el texto `"False"` no está vacío.

### Error común: convertir un texto que no es un número

```kafe
--8<-- "tests/DocsExamples/tutorial/operators-bad-conversion.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/operators-bad-conversion.error.stderr.expec"
```

`int` solo entiende dígitos: `"five"` no lo es. Tampoco acepta un texto con decimales como `"3.5"`; para eso usa `float("3.5")`.

---

## ¿Qué aprendiste?

- Hay operadores aritméticos (`+ - * / ^ %`), de comparación (`== != < <= > >=`) y lógicos (`&& || !`).
- La precedencia decide qué se calcula primero; con paréntesis siempre mandas tú.
- `&&` y `||` tienen el mismo nivel, y `-2 ^ 2` es `4`: usa paréntesis para evitar sorpresas.
- `int`, `float`, `str` y `bool` convierten valores de un tipo a otro.

??? info "Para curiosos 🤓: cómo resuelve KAFE las ambigüedades"
    KAFE usa el **parser LL(\*)** que genera ANTLR4 a partir de `src/Kafe_Grammar.g4`:

    - **Precedencia estática:** la decide el orden de las reglas de la gramática. Cada nivel de la tabla es una regla (`logicExpr`, `equalityExpr`, `relationalExpr`, `additiveExpr`, `multiplicativeExpr`, `powerExpr`, `unaryExpr`), y cada una contiene a la siguiente. Cuanto más "adentro" está una regla, antes se calcula.
    - **Bocado más largo (*maximal munch*):** el lexer siempre forma el token más largo posible. Por eso `<=` es un solo operador y `--` empieza un comentario.

    Un detalle más: `&&` y `||` no convierten el resultado en `BOOL`; devuelven uno de los dos valores. Con booleanos no notas la diferencia, pero `5 && 3` da `3`.

[Siguiente: Estructuras de control :material-arrow-right:](control-structures.md){ .md-button .md-button--primary }
