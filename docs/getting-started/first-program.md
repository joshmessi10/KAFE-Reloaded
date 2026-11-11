# Tu primer programa

## La idea en una frase

Hacer un programa siempre sigue cuatro pasos: **escribir** las instrucciones, **guardarlas** en un archivo, **ejecutarlas** y **leer** lo que la computadora responde.

## Una comparación de la vida diaria

Piensa en **escribir una carta**. Primero la escribes, luego la metes en un sobre, después la envías y al final lees la respuesta. Si la respuesta dice "no entendí", corriges la carta y la envías otra vez.

Programar es igual. Y tranquilo: equivocarse y volver a intentar es parte normal del camino.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/tutorial-start-ciclo.svg"
<figcaption>El ciclo de programar: 1) escribes el programa, 2) lo guardas como archivo .kf, 3) lo ejecutas con Ctrl+F5 y 4) lees el resultado. Luego vuelves a empezar.</figcaption>
</figure>

## Paso 1: escribe

Abre VS Code con tu carpeta de programas (como en la [Instalación](installation.md)). Crea un archivo nuevo y escribe esta única línea:

```kafe
--8<-- "tests/DocsExamples/tutorial/first-program-hola.kf"
```

`show` (en inglés, *mostrar*) muestra en la pantalla lo que pongas entre paréntesis. El texto va entre comillas y la instrucción termina con punto y coma `;`.

## Paso 2: guarda

Guarda el archivo con el nombre `hola.kf` dentro de tu carpeta (`Ctrl+S`, o `Cmd+S` en macOS). La terminación `.kf` le dice a VS Code que es un programa de KAFE. KAFE solo ejecuta archivos **guardados**.

## Paso 3: ejecuta

Presiona `Ctrl+F5` (en macOS, `Cmd+F5`). También puedes abrir la paleta de comandos (`Ctrl+Shift+P`, o `Cmd+Shift+P` en macOS) y elegir **KAFE: Run File**.

La extensión le pide al **intérprete** de KAFE (el programa que lee tu archivo y hace lo que dice) que ejecute `hola.kf`.

## Paso 4: lee la respuesta

Se abre una **terminal** llamada **KAFE Run**: una ventana de texto dentro de VS Code donde aparecen los resultados. Ahí verás:

```text
--8<-- "tests/DocsExamples/tutorial/first-program-hola.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. KAFE abrió `hola.kf` y leyó la línea `show("¡Hola, KAFE!");`.
    2. `show` mostró el texto que estaba entre comillas, pero **sin** las comillas.
    3. No había más líneas, así que el programa terminó. ¡Escribiste y ejecutaste tu primer programa!

## Pedir datos: `pour`

Un programa se vuelve más divertido cuando te hace preguntas. Para eso está `pour` (en inglés, *verter*): muestra una pregunta en la terminal **KAFE Run**, espera a que escribas algo ahí y presiones `Enter`, y te devuelve lo que escribiste como texto (`STR`).

Guarda tu respuesta en una **variable**: una caja con nombre para usarla después.

```kafe
--8<-- "tests/DocsExamples/tutorial/first-program-nombre.kf"
```

Si escribes `Ana`, la salida es:

```text
--8<-- "tests/DocsExamples/tutorial/first-program-nombre.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `pour("¿Cómo te llamas? ")` mostró la pregunta y esperó.
    2. Lo que escribiste (`Ana`) se guardó en la caja `nombre`, de tipo `STR` (texto).
    3. `"Hola, " + nombre` **pegó** los dos textos y `show` mostró el resultado.

!!! note "¿Por qué no se ve `Ana` en la salida?"
    En tu terminal sí verás `Ana`, porque tú lo escribes. Aquí mostramos solo lo que KAFE escribe: la pregunta y la respuesta. Por eso aparecen en la misma línea.

### Pedir un número { #pedir-un-numero }

`pour` siempre devuelve **texto**. Si quieres hacer cuentas, primero conviertes el texto en número con `int(...)`:

```kafe
--8<-- "tests/DocsExamples/tutorial/first-program-edad.kf"
```

Si escribes `12`, la salida es:

```text
--8<-- "tests/DocsExamples/tutorial/first-program-edad.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `pour` guardó el texto `"12"` en la caja `texto`.
    2. `int(texto)` lo convirtió en el número entero `12` y lo guardó en `edad`, de tipo `INT`.
    3. Como `edad` ya es un número, `edad + 1` da `13`.

## Errores comunes

Cuando algo sale mal, KAFE te dice **qué** pasó. Leer el mensaje con calma es la mejor forma de arreglarlo.

### Escribir `Show` con mayúscula

KAFE distingue mayúsculas de minúsculas: `Show` y `show` son palabras distintas.

```kafe
--8<-- "tests/DocsExamples/tutorial/first-program-mayuscula.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/first-program-mayuscula.error.stderr.expec"
```

El mensaje dice que no existe ninguna función llamada `Show`. Para arreglarlo, escribe `show` en minúsculas.

### Olvidar cerrar las comillas

```kafe
--8<-- "tests/DocsExamples/tutorial/first-program-comillas.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/first-program-comillas.error.stderr.expec"
```

*Unterminated string literal* significa "texto sin terminar": falta la comilla `"` de cierre. `line 1:5` dice dónde empieza ese texto: línea 1, columna 5 (las columnas se cuentan desde 0).

### Usar lo que da `pour` como número

```kafe
--8<-- "tests/DocsExamples/tutorial/first-program-sin-convertir.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/first-program-sin-convertir.error.stderr.expec"
```

La caja `edad` es `INT`, pero `pour` entregó un `STR`. Para arreglarlo, convierte el texto con `int(...)`, como en el ejemplo [Pedir un número](#pedir-un-numero).

!!! warning "Si `Ctrl+F5` no ejecuta nada"
    Revisa tres cosas: que el archivo esté **guardado** y termine en `.kf`, que la carpeta sea **de confianza** (en el modo restringido no se ejecutan programas) y que el runtime haya terminado de prepararse. Si no se preparó, usa **KAFE: Install Runtime** desde la paleta de comandos.

## ¿Qué aprendiste?

- Programar es un ciclo: escribir, guardar, ejecutar y leer la respuesta.
- `show(...)` muestra cosas y `pour(...)` pide datos como texto; `int(...)` convierte ese texto en número.
- Los mensajes de error dicen qué falló y dónde. Son pistas, no regaños.

[Siguiente: Ejemplos básicos :material-arrow-right:](basic-examples.md){ .md-button .md-button--primary }
