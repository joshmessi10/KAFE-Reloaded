# Funciones

Una **función** es un pequeño programa con nombre: recibe datos, hace algo con ellos y devuelve un resultado. Si todavía no has creado ninguna, empieza por la lección [Funciones](../aprende/funciones.md): ahí está la licuadora, tu primer `drip` y tu primera lambda. Esta página va un paso más allá.

## Repaso rápido: cómo se escribe una función

```kafe
drip nombreFuncion(param1: TIPO1, param2: TIPO2) => TIPO_DE_RETORNO:
    -- cuerpo de la función
    return valor;
;
```

| Parte | Qué significa |
|---|---|
| `drip` | La palabra que crea una función |
| `nombreFuncion` | El nombre con el que la vas a llamar |
| `(param1: TIPO1, ...)` | Los **parámetros**: las entradas, cada una con su tipo |
| `=> TIPO_DE_RETORNO` | El tipo del resultado. Es obligatorio. Usa `VOID` si la función no devuelve nada |
| `return valor;` | Entrega el resultado y termina la función |
| `;` (sola) | Cierra el bloque de la función |

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-add.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-add.expec"
```

KAFE revisa los tipos al entrar y al salir: si el parámetro o el valor de `return` no tiene el tipo prometido, se detiene con un error (lo verás en [Errores comunes](#errores-comunes)).

## Currying: dar los ingredientes de a poco

### La idea en una frase

Si llamas a una función con **menos** argumentos de los que pide, KAFE no se queja: te devuelve una **nueva función** que espera los que faltan.

### Una comparación de la vida diaria

Imagina una **licuadora que ya tiene una fruta adentro**. Le pusiste plátano y la guardaste. Cada vez que quieras un jugo, solo agregas el segundo ingrediente: leche, fresa… La primera fruta ya quedó "cargada".

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-currying.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-currying.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `add(10, 5)` es la llamada normal: los dos argumentos a la vez.
    2. `add(10)` devuelve una función que "ya tiene" el 10. Con `(5)` le damos el resto: `add(10)(5)` también da 15.
    3. `addTen` guarda esa licuadora precargada. Su tipo es `FUNC(INT)=>INT`: recibe un `INT` y devuelve un `INT`.

??? info "Para curiosos 🤓"
    Una función $f : (T_1 \times T_2 \times \dots \times T_n) \to T_r$ se trata como una cadena de funciones de un argumento:
    $f : T_1 \to (T_2 \to (\dots \to (T_n \to T_r)))$.
    Si das $k < n$ argumentos, obtienes una función que guarda esos $k$ valores y espera los $n - k$ restantes. Esto permite **reutilizar** funciones generales creando versiones especializadas.

## Funciones que reciben funciones

### La idea en una frase

Una **función de orden superior** es una función que recibe otra función como parámetro (o que devuelve una).

### Una comparación de la vida diaria

Una **máquina de sellos** no decide qué dibujo imprimir: tú le pones el sello. La máquina hace siempre lo mismo (apretar), pero el resultado depende del sello que le diste.

El tipo de un parámetro que es función se escribe `FUNC(TIPOS_DE_ENTRADA)=>TIPO_DE_SALIDA`:

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-higher-order.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-higher-order.expec"
```

`apply` es la máquina; `inc`, `square` y la lambda `(z: INT) => z * 3` son los sellos. Fíjate que puedes pasar una función con nombre (`inc`), una lambda guardada en una variable (`square`) o una lambda escrita en el mismo lugar.

## Lambdas: funciones sin nombre

Una **lambda** es una función corta escrita en una sola expresión: `(parámetros) => expresión`. Ya la viste en la [lección de funciones](../aprende/funciones.md). Aquí van algunos detalles más:

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-lambdas.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-lambdas.expec"
```

- **Retorno implícito:** la lambda devuelve el valor de su expresión, sin escribir `return`.
- **Parámetros con tipo:** cada parámetro necesita su tipo, como en `drip`.
- **Al menos un parámetro:** KAFE no acepta lambdas sin parámetros como `() => 5`.
- Las lambdas también admiten currying: `multiply(3)(4)` da 12.
- Una lambda puede devolver otra lambda: `addTo(2)` es una función que suma 2.

## Funciones que devuelven funciones

Una función `drip` también puede **crear** y devolver una función. Su tipo de retorno es un tipo `FUNC`:

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-make-adder.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-make-adder.expec"
```

`makeAdder` es una **fábrica de licuadoras**: cada vez que la llamas, arma una licuadora nueva con un ingrediente distinto ya cargado.

## Closures: funciones con memoria

### La idea en una frase

Un **closure** (en español, *clausura*) es una función que **recuerda** las variables que existían donde fue creada.

### Una comparación de la vida diaria

Es como una **fotografía**: guarda cómo estaba todo en el momento en que la tomaste. Si después algo cambia, la fotografía sigue igual.

En el ejemplo anterior, la lambda `(b: INT) => a + b` recuerda el valor de `a` aunque `makeAdder` ya terminó. Mira qué pasa si la variable cambia **después** de crear la función:

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-snapshot.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-snapshot.expec"
```

`addBonus` sigue sumando 10 aunque `bonus` ahora valga 100. En KAFE una función guarda una **copia** de las variables visibles en el momento en que se crea (una lambda o una función `drip`). Si quieres usar el valor nuevo, crea la función después del cambio o pasa el valor como parámetro.

## Recursión: una función que se llama a sí misma

### La idea en una frase

Una función **recursiva** resuelve un problema grande llamándose a sí misma con un problema más pequeño.

### Una comparación de la vida diaria

Piensa en unas **muñecas rusas**: abres una y adentro hay otra más pequeña, y así hasta llegar a la más chiquita, que ya no se abre. Esa última es el **caso base**: el punto donde la función deja de llamarse.

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-recursion.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-recursion.expec"
```

!!! tip "¿Qué pasó aquí?"
    `factorial(5)` calcula `5 * factorial(4)`, que calcula `4 * factorial(3)`… hasta `factorial(1)`, que devuelve 1 sin llamarse otra vez (el caso base). Al final: $5 \times 4 \times 3 \times 2 \times 1 = 120$.

## Alcance: dónde vive cada variable

El **alcance** (*scope*) de una variable es la parte del programa donde existe.

- Una variable creada **fuera** de las funciones es **global**: las funciones pueden leerla.
- Una variable creada **dentro** de una función es **local**: solo existe dentro de ella.
- Si una variable local tiene el mismo nombre que una global, la local la **tapa** dentro de la función (*shadowing*). La global no cambia.

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-scope.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-scope.expec"
```

!!! warning "Una función no cambia las variables de afuera"
    `tryToChange` hace `x = 50`, pero la `x` global sigue valiendo 10. Lo que pasa dentro de una función se queda dentro. Si quieres un valor nuevo, **devuélvelo** con `return` y guárdalo afuera: `x = calcular(x);`.

## Errores comunes { #errores-comunes }

### Dar más argumentos de los que pide

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-too-many-args.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-too-many-args.error.stderr.expec"
```

Dar **menos** argumentos está permitido (es currying), pero dar **más** es un error.

### Devolver un tipo distinto del prometido

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-wrong-return.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-wrong-return.error.stderr.expec"
```

La división `/` siempre da un `FLOAT`, y `half` prometió un `INT`. Cambia el tipo de retorno a `FLOAT` o usa `int(n / 2)` para convertirlo (da 2).

### Olvidar el `return`

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-missing-return.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-missing-return.error.stdout.expec"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-missing-return.error.stderr.expec"
```

`greet` muestra el nombre, pero no **devuelve** nada (`VOID`), y prometió un `STR`. `show` muestra en pantalla; `return` entrega el valor. Son cosas distintas.

### Una recursión sin caso base

```kafe
--8<-- "tests/DocsExamples/tutorial/functions-no-base-case.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/functions-no-base-case.error.stderr.expec"
```

`countUp` se llama a sí misma para siempre: son muñecas rusas sin la más chiquita. Agrega siempre un `if` con un caso que **no** se llame otra vez.

## ¿Qué aprendiste?

- Si das menos argumentos, obtienes una función que espera el resto (**currying**).
- Las funciones son valores: puedes pasarlas, devolverlas y guardarlas en variables `FUNC`.
- Una función recuerda las variables del momento en que se crea, y no puede cambiar las variables de afuera.

[Siguiente: Listas :material-arrow-right:](lists.md){ .md-button .md-button--primary }
