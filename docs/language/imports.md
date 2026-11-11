# Imports

KAFE trae poco "en el bolsillo": variables, listas, funciones y `show`. Para matemáticas, gráficas, tablas de datos o inteligencia artificial necesitas **librerías**. Un `import` le dice a KAFE qué librería vas a usar.

## La idea en una frase

`import nombre;` (en inglés, *importar*) trae una librería o un archivo `.kf` a tu programa para que puedas usar lo que contiene.

## Una comparación de la vida diaria

Piensa en una **caja de herramientas**. No cargas todas las herramientas del mundo: antes de empezar sacas las que vas a necesitar. Si vas a colgar un cuadro, sacas el martillo. Si después intentas usar un taladro que no sacaste, no lo encuentras.

## Tu primer import

```kafe
--8<-- "tests/DocsExamples/tutorial/imports-math.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/imports-math.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `import math;` sacó la caja de herramientas de matemáticas.
    2. `math.sqrt(16)` usó la función `sqrt` (raíz cuadrada) **de** la librería `math`. El punto `.` se lee "de": "`sqrt` de `math`".
    3. `math.pi` no lleva paréntesis: es una **constante**, un valor guardado en la librería.

## Reglas de los imports

- Escribe un `import` por línea, cada uno con su `;`. No puedes importar varias librerías separadas por comas.
- Los imports van **al principio** del archivo, antes de cualquier otra línea.
- Un import vale para **todo** el archivo.
- No existen alias: no puedes escribir `import math as m;`.
- Las claves distinguen mayúsculas y minúsculas: `math` funciona, `Math` no.

!!! warning "Un import en medio del programa detiene todo en silencio"
    Si escribes un `import` después de otra línea (por ejemplo, después de un `show`), KAFE ejecuta lo anterior y luego **se detiene sin mostrar ningún mensaje**. Pon siempre todos los imports arriba.

## Las librerías de KAFE

Cada librería tiene una **clave**: la palabra exacta que escribes después de `import`.

| Clave | Librería | Para qué sirve |
|---|---|---|
| `math` | KafeMATH | Funciones y constantes matemáticas: raíces, potencias, `pi`… [Ver página](../libraries/math.md) |
| `numk` | KafeNUMK | Vectores y matrices, al estilo de NumPy. [Ver página](../libraries/numk.md) |
| `plot` | KafePLOT | Dibujar gráficas (líneas, puntos, barras) como imágenes SVG. [Ver página](../libraries/plot.md) |
| `files` | KafeFILES | Leer y escribir archivos de texto. [Ver página](../libraries/files.md) |
| `pardos` | KafePARDOS | Tablas de datos (DataFrames) y archivos CSV, al estilo de Pandas. [Ver página](../libraries/pardos.md) |
| `machine` | KafeMACHINE | Aprendizaje automático: modelos, preprocesamiento y métricas. [Ver página](../libraries/machine.md) |
| `gesha` | KafeGESHA | Redes neuronales y aprendizaje profundo. [Ver página](../libraries/gesha.md) |
| `huggingface` | KafeHF | Cargar conjuntos de datos de Hugging Face. Necesita un paquete opcional. [Ver página](../bibliotecas/huggingface.md) |
| `kaggle` | KafeKAGGLE | Descargar conjuntos de datos públicos de Kaggle. Necesita un paquete opcional. [Ver página](../bibliotecas/kaggle.md) |

!!! note "`geshaDeep` y `geshaV2` son nombres viejos"
    La clave oficial para aprendizaje profundo es `gesha`. Las claves `geshaDeep` y `geshaV2` todavía funcionan y llevan a la misma librería, pero están **obsoletas**: se mantienen solo para que los programas antiguos sigan funcionando y se quitarán más adelante. En programas nuevos usa `gesha`.

## Importar tus propios archivos

También puedes guardar funciones en un archivo `.kf` y usarlas desde otro. Supón que tienes estos dos archivos en la misma carpeta:

```kafe
-- utilities.kf
drip add(a: INT, b: INT) => INT:
    return a + b;
;

drip isEven(n: INT) => BOOL:
    return n % 2 == 0;
;
```

```kafe
-- program.kf
import utilities;

show(add(3, 4));
show(isEven(4));
```

Al ejecutar `program.kf` verás `7` y `True`.

!!! warning "Sin prefijo"
    Las funciones de tu archivo se usan **por su nombre**, sin `utilities.` delante: `add(3, 4)`, no `utilities.add(3, 4)`. El prefijo con punto solo funciona con las librerías de la tabla de arriba. Escribir `utilities.add(3, 4)` da el error `Variable 'utilities' not defined`.

¿Qué hace KAFE con `import utilities;`?

1. Revisa si `utilities` es una de las librerías de la tabla. Si lo es, la activa y listo.
2. Si no, busca el archivo `utilities.kf` en este orden:
    1. La carpeta del archivo que estás ejecutando.
    2. `src/language_components/imports/` dentro de la instalación de KAFE.
    3. `src/language_components/` dentro de la instalación de KAFE.
3. Ejecuta el archivo completo una sola vez. Todo lo que define (funciones y variables) queda disponible en tu programa, y si el archivo tiene un `show`, también verás su salida.

??? info "Para curiosos 🤓: imports repetidos y circulares"
    KAFE recuerda qué archivos ya importó. Si importas el mismo archivo dos veces, la segunda vez no hace nada. Esto también evita los **ciclos**: si `module_a.kf` importa `module_b.kf` y `module_b.kf` importa `module_a.kf`, el segundo import se ignora y el programa no se queda dando vueltas.

## Errores comunes

### Usar una librería sin importarla

```kafe
--8<-- "tests/DocsExamples/tutorial/imports-not-imported.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/imports-not-imported.error.stderr.expec"
```

Es el taladro que no sacaste de la caja. Agrega `import math;` en la primera línea.

### Escribir la clave con otra mayúscula

```kafe
--8<-- "tests/DocsExamples/tutorial/imports-wrong-case.error.kf"
```

```text
--8<-- "tests/DocsExamples/tutorial/imports-wrong-case.error.stderr.expec"
```

`Math` no es una librería de KAFE, así que KAFE la busca como archivo `Math.kf` y no lo encuentra (`<REPO>` es la carpeta donde está KAFE). Escribe la clave exactamente como en la tabla: `math`.

## ¿Qué aprendiste?

- `import clave;` va al principio del archivo, una librería por línea.
- Lo que trae una librería se usa con un punto: `math.sqrt(16)`.
- También puedes importar tus propios archivos `.kf` y usar sus funciones por su nombre.

[Siguiente: Librerías: MATH :material-arrow-right:](../libraries/math.md){ .md-button .md-button--primary }
