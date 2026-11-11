# Sistema de tipos

## La idea en una frase

El **sistema de tipos** son las reglas que dicen qué clase de valor puede guardar cada variable y qué operaciones tienen sentido con cada clase de valor.

## Una comparación de la vida diaria

Piensa en una cocina ordenada. La leche va en una botella, los huevos en una huevera y la harina en un frasco. Cada recipiente dice qué cabe en él. Si intentas meter huevos en la botella de leche, algo sale mal.

En KAFE cada variable es un recipiente con una etiqueta de **tipo**. KAFE tiene **tipado estático explícito**: eso quiere decir que tú **escribes** el tipo al crear la variable (explícito) y que ese tipo **no cambia** nunca (estático).

```kafe
INT nombreDeLaVariable = 42;
```

Cada instrucción termina con punto y coma (`;`).

!!! note "Si es tu primera vez"
    La lección [Variables y tipos](../aprende/variables.md) explica las variables desde cero. Aquí vamos un paso más allá: todos los tipos, cómo se combinan y qué errores aparecen.

---

## Tipos básicos { #primitive-types }

| Tipo | Qué guarda | Ejemplo | Valores válidos |
|---|---|---|---|
| `INT` | Números enteros, de cualquier tamaño | `INT a = 5;` | …, -1, 0, 1, … |
| `FLOAT` | Números con decimales | `FLOAT e = 2.5;` | 3.14, -0.5 |
| `BOOL` | Verdadero o falso | `BOOL b = True;` | `True`, `False` |
| `STR` | Texto | `STR s = 'Hola';` | Texto entre comillas |
| `VOID` | "Nada": la ausencia de valor | `=> VOID` (solo en funciones) | No se puede asignar |

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-primitives.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-primitives.expec"
```

!!! tip "¿Qué pasó aquí?"
    Creamos una variable de cada tipo y las mostramos. La última línea calcula 2¹⁰⁰: un `INT` en KAFE no tiene un tamaño máximo, así que el resultado sale completo.

### Variables sin valor inicial

Si declaras una variable sin `=`, KAFE le pone un **valor por defecto**: el "cero" de su tipo.

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-defaults.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-defaults.expec"
```

`INT` empieza en `0`, `FLOAT` en `0.0`, `BOOL` en `False`, `STR` en el texto vacío (por eso hay una línea en blanco) y una lista en `[]`.

### El tipo VOID { #unit-type-void }

**La idea:** `VOID` significa "esta función no devuelve nada".

**Comparación:** una función que devuelve algo es como una máquina de jugos: metes fruta y sale un vaso. Una función `VOID` es como un timbre: lo tocas, hace algo (suena), pero no te entrega nada.

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-void.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-void.expec"
```

`VOID` solo se usa en la firma de una función. No se pueden crear variables de tipo `VOID`:

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-void-variable.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-void-variable.error.stderr.expec"
```

---

## Cómo se combinan los tipos { #compatibility-and-coercion-rules }

**La idea:** KAFE es **estricto al guardar** un valor en una variable, pero **flexible al hacer cuentas** con números.

**Comparación:** en una balanza puedes sumar 5 kilos y 2,5 kilos sin problema: el resultado es 7,5 kilos. Pero si una caja dice "solo números enteros", no puedes guardar 7,5 en ella.

### Conversión automática en las cuentas

Cuando una cuenta mezcla un `INT` con un `FLOAT`, KAFE convierte el `INT` en `FLOAT` antes de operar. A esto se le llama **coerción** (convertir un tipo en otro de forma automática). El resultado es `FLOAT`.

Además, la división `/` siempre da un `FLOAT`, aunque los dos números sean enteros y la división sea exacta.

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-coercion.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-coercion.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `5 + 2.0` y `5 * 2.0`: el `5` se convirtió en `5.0`, así que salen `7.0` y `10.0`.
    2. `10 / 4` da `2.5` y `10 / 5` da `2.0` (un `FLOAT`, no un `INT`).
    3. `+` entre dos textos los une: `"ab" + "cd"` es `abcd`.
    4. Para unir un texto con un número, primero conviertes el número en texto con `str(10)`.

### Asignación estricta

Al **guardar** un valor, KAFE no convierte nada: el tipo del valor tiene que ser exactamente el tipo de la variable.

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-strict-int.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-strict-int.error.stderr.expec"
```

Ni siquiera un entero entra en una variable `FLOAT`:

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-strict-float.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-strict-float.error.stderr.expec"
```

Para arreglarlo, escribe el valor con decimales (`FLOAT price = 5.0;`) o conviértelo: `FLOAT price = float(5);`. Las conversiones están en [Operadores](operators.md#type-conversions).

### Error común: sumar texto y número

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-concat-number.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-concat-number.error.stderr.expec"
```

`+` solo une texto con texto. Escribe `"Age: " + str(10)`.

### Tabla de combinaciones { #compatibility-matrix }

Esta tabla dice qué pasa con un operador entre un valor de la izquierda (fila) y uno de la derecha (columna):

| Izq. \ Der. | `INT` | `FLOAT` | `STR` | `BOOL` |
|---|---|---|---|---|
| **`INT`** | `INT` con `+ - * % ^` (`/` da `FLOAT`) | `FLOAT` con `+ - * / % ^` | Solo `*`: repite el texto (`3 * "ab"`) | Funciona como número (ver nota) |
| **`FLOAT`** | `FLOAT` con `+ - * / % ^` | `FLOAT` con `+ - * / % ^` | Error | Funciona como número (ver nota) |
| **`STR`** | Solo `*`: repite el texto (`"ab" * 3`) | Error | `+` une los textos | Error |
| **`BOOL`** | Funciona como número (ver nota) | Funciona como número (ver nota) | Error | `&&`, `\|\|` |

Además:

- `==` y `!=` funcionan con **cualquier** par de valores. Valores de tipos distintos son diferentes (`"5" == 5` es `False`), salvo los números: `5 == 5.0` es `True`.
- `<`, `<=`, `>` y `>=` comparan números con números, textos con textos (en orden alfabético) y listas con listas. Mezclar un número con un texto da error.
- Cualquier combinación marcada como "Error" produce un `TypeError` **mientras el programa se ejecuta**.

!!! warning "Los booleanos se comportan como números"
    En KAFE, `True` vale `1` y `False` vale `0` dentro de una cuenta. Por eso `True + 1` da `2` en lugar de un error. Es mejor no depender de esto: usa `BOOL` solo con `&&`, `||` y `!`.

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-bool-arithmetic.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-bool-arithmetic.expec"
```

??? info "Para curiosos 🤓: las reglas escritas como fórmulas"
    Los sistemas de tipos se describen con **juicios de tipado** dentro de un contexto Γ (gamma), que es la lista de variables conocidas y sus tipos:

    $$\Gamma \vdash e : \tau$$

    Se lee: "en el contexto Γ, la expresión $e$ tiene el tipo $\tau$". La regla de coerción de la suma es:

    $$\frac{\Gamma \vdash e_1 : \texttt{INT} \qquad \Gamma \vdash e_2 : \texttt{FLOAT}}{\Gamma \vdash e_1 + e_2 : \texttt{FLOAT}}$$

    Arriba de la raya van las condiciones; abajo, la conclusión. Ojo: en KAFE estas reglas de las operaciones se comprueban **al ejecutar** cada operación, mientras que el tipo de una variable se comprueba cada vez que le guardas un valor.

---

## Listas { #compound-types-lists }

**La idea:** una lista guarda muchos valores **del mismo tipo** en fila. Su tipo se escribe `List[TIPO]`, y `TIPO` puede ser otra lista: así se forman matrices.

**Comparación:** una huevera solo guarda huevos. Una caja de hueveras guarda hueveras: es una lista de listas.

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-lists.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-lists.expec"
```

**Reglas de homogeneidad** (todo del mismo tipo):

- Todos los elementos de una lista tienen el mismo tipo.
- La lista vacía `[]` vale para cualquier tipo de lista.
- Las listas anidadas tienen que tener la **misma profundidad** (todas listas de números, por ejemplo), pero pueden tener **largos distintos**: `[[1], [2, 3]]` es válida.

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-mixed-list.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-mixed-list.error.stderr.expec"
```

`1` es `INT` y `2.5` es `FLOAT`: no pueden ir juntos. Escribe `[1.0, 2.5]` en una `List[FLOAT]`. Más sobre listas en [Listas](lists.md).

---

## El tipo función: FUNC { #function-type-func }

**La idea:** en KAFE una función también es un valor. Puedes guardarla en una variable o pasarla a otra función. Su tipo dice qué recibe y qué devuelve:

```kafe
FUNC(TIPO_ENTRADA) => TIPO_SALIDA
```

**Comparación:** una receta escrita en una tarjeta. La tarjeta se puede guardar en un cajón (una variable) o dársela a otra persona (pasarla a otra función). En la tarjeta dice "entra harina, sale pan".

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-func.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-func.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `add(15)` llamó a `add` con un solo argumento. El resultado es una **nueva función** que espera el segundo número (esto se llama *currificación*). La guardamos en `addFifteen`, de tipo `FUNC(INT)=>INT`.
    2. `addFifteen(5)` completó la cuenta: `15 + 5 = 20`. Para ver el resultado hace falta `show`; llamar `addFifteen(5);` solo no muestra nada.
    3. `apply` es una **función de orden superior**: recibe otra función (`f`) como parámetro. `apply(double, 5)` da `10`.

### Firmas exactas { #func-type-properties }

Cuando una función recibe un parámetro de tipo `FUNC`, la función que le pasas tiene que tener **exactamente** esos tipos. No hay "parecidos": `FUNC(FLOAT)=>FLOAT` no sirve donde se pide `FUNC(INT)=>INT`. A esto se le llama **invariancia**.

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-func-signature.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-func-signature.error.stderr.expec"
```

!!! warning "Las variables `FUNC` son menos estrictas"
    Esta comprobación exacta se hace con los **parámetros** de las funciones. Al guardar una función en una **variable** `FUNC(...)=>...`, KAFE hoy solo revisa que el valor sea una función, no sus tipos. Escribe bien la firma de todas formas: así tu programa se lee mejor y no fallará cuando KAFE la revise.

Más sobre funciones en [Funciones](functions.md).

---

## Tipos para modelos { #model-types }

Tres tipos guardan objetos de las librerías:

| Tipo | Qué guarda | Librería |
|---|---|---|
| `GESHA` | Redes neuronales y sus capas | `gesha` |
| `PARDOS` | Tablas de datos (DataFrames) | `pardos` |
| `MACHINE` | Modelos de aprendizaje automático | `machine` |

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-models.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-models.expec"
```

Una tabla `PARDOS` se crea, por ejemplo, leyendo un archivo CSV:

```kafe
PARDOS df = pardos.read_csv("data.csv");
```

---

## Qué se puede cambiar (mutabilidad) { #mutability }

**La idea:** algunas cosas se pueden modificar después de crearlas (son **mutables**) y otras no (son **inmutables**).

**Comparación:** una pizarra es mutable: borras y escribes. Un libro impreso es inmutable: si quieres otro texto, imprimes un libro nuevo.

| Elemento | ¿Se puede cambiar? |
|---|---|
| **Variables** | Su valor sí; su tipo, nunca |
| **Listas** | Sí: puedes cambiar, agregar y quitar elementos |
| **Textos (`STR`)** | No: las operaciones crean un texto nuevo |

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-mutability.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-mutability.expec"
```

!!! tip "¿Qué pasó aquí?"
    `x` pasó de `10` a `20`. La lista cambió su primer elemento y creció. `s + " World"` creó un texto **nuevo** en `s2`; `s` sigue siendo `Hello`.

### Error común: cambiar el tipo de una variable

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-change-type.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-change-type.error.stderr.expec"
```

`x` nació `INT` y seguirá siendo `INT`. Si necesitas un texto, crea otra variable: `STR word = "ten";`.

### Error común: cambiar una letra de un texto

```kafe
--8<-- "tests/DocsExamples/tutorial/type-system-string-immutable.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/type-system-string-immutable.error.stderr.expec"
```

Los textos no se modifican letra por letra. Crea uno nuevo, por ejemplo `s = "J" + "ello";`.

---

## ¿Qué aprendiste?

- Cada variable tiene un tipo fijo: `INT`, `FLOAT`, `BOOL`, `STR`, `List[...]`, `FUNC(...)=>...`, `GESHA`, `PARDOS` o `MACHINE`. `VOID` solo aparece en funciones.
- En las cuentas, `INT` con `FLOAT` da `FLOAT`, y `/` siempre da `FLOAT`. Al guardar, el tipo tiene que coincidir exactamente.
- Las listas son homogéneas y mutables; los textos son inmutables.

[Siguiente: Operadores :material-arrow-right:](operators.md){ .md-button .md-button--primary }
