# FILES: referencia

Aquí están las cuatro funciones de FILES, una por cada etapa de la vida de un archivo. Si es tu primera vez, lee antes la [página de entrada](../files.md), que explica cómo importar la librería y cómo funciona por dentro.

## Rutas: dónde vive el archivo { #paths }

**¿Dónde se guarda el archivo?** El nombre que le das a cada función es una **ruta**: el camino para llegar al archivo. KAFE la busca **en la misma carpeta que tu programa `.kf`**, no en la carpeta desde donde lo ejecutas. Si tu programa está en `tareas/notas.kf` y escribes `files.create("lista.txt")`, el archivo queda en `tareas/lista.txt`. Para llegar a una subcarpeta, separa los nombres con `/`, como en `"data/notebook.txt"`.

!!! tip "Los ejemplos se limpian solos"
    Los ejemplos de esta página terminan con `files.delete(...)` para no dejar archivos sueltos. Si quieres conservar tu archivo, quita esa última línea.

## Las cuatro funciones { #functions }

Cada función corresponde a una etapa de la vida del cuaderno: crear, escribir, leer y tirar.

### `files.create(path)` { #create }

**Qué hace:** Crea un archivo **nuevo y vacío**, como abrir un cuaderno sin estrenar.

**Cuándo usarla:** Cuando quieres empezar un archivo desde cero y estar seguro de que no pisas uno que ya existía.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `path` | `STR` | El nombre (o ruta) del archivo, por ejemplo `"notas.txt"`. |

**Devuelve:** `VOID` (nada). El archivo aparece en la carpeta.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/files/create.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/files/create.expec"
```

El archivo recién creado está vacío: leerlo da el texto vacío `""`, por eso la comparación da `True`.

??? warning "Error común: crear un archivo que ya existe"
    `create` no sobrescribe: si el archivo ya está ahí, se detiene con un error para no borrar lo que tenía. En este ejemplo, `data/notebook.txt` ya existe:

    ```kafe
    --8<-- "tests/DocsExamples/files/create-exists.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/files/create-exists.error.stderr.expec"
    ```

!!! note "Ojo con las carpetas"
    `create` no crea carpetas. Si escribes `files.create("nueva/notas.txt")` y la carpeta `nueva` no existe, KAFE se detiene con un error que dice `No such file or directory` ("no existe ese archivo o carpeta").

### `files.write(path, text)` { #write }

**Qué hace:** Escribe `text` en el archivo. **Borra lo que había antes** y pone el texto nuevo, como si arrancaras la hoja y escribieras en una limpia. Al final agrega un salto de línea.

**Cuándo usarla:** Para guardar un resultado: una puntuación, una lista o una nota que quieras leer después.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `path` | `STR` | El nombre (o ruta) del archivo. |
| `text` | `STR` | El texto que quieres guardar. Usa `\n` para pasar a la línea siguiente. |

**Devuelve:** `VOID` (nada).

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/files/write.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/files/write.expec"
```

**¿Qué pasó aquí?** La segunda escritura **reemplazó** a la primera: en el archivo solo queda `4 5 6`. Las líneas vacías aparecen porque `write` agrega un salto de línea al final del texto, y `show` agrega otro.

!!! note "Ojo"
    - `write` **no añade al final**: siempre reemplaza todo el contenido. Si quieres sumar texto, primero lee lo que hay, únelo con lo nuevo y vuelve a escribirlo todo.
    - Si el archivo no existe, `write` lo crea. No necesitas llamar antes a `create`.

### `files.read(path)` { #read }

**Qué hace:** Lee **todo** el contenido del archivo y te lo da como un texto (`STR`), como copiar en tu libreta lo que dice el cuaderno.

**Cuándo usarla:** Para recuperar algo que guardaste antes, o para usar datos que alguien escribió en un archivo.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `path` | `STR` | El nombre (o ruta) del archivo. |

**Devuelve:** `STR` con todo el texto del archivo, saltos de línea incluidos.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/files/read.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/files/read.expec"
```

**¿Qué pasó aquí?** El texto tenía `\n` en medio, así que el archivo guarda dos líneas. `read` devuelve también el salto de línea que `write` añadió al final: por eso el texto leído termina en `\n`.

También puedes leer un archivo que ya existe dentro de una subcarpeta. Aquí, `data/notebook.txt` está junto al programa y contiene la palabra `KAFE`:

```kafe
--8<-- "tests/DocsExamples/files/read-folder.kf"
```

```text
--8<-- "tests/DocsExamples/files/read-folder.expec"
```

??? warning "Error común: leer un archivo que no existe"
    Si te equivocas en el nombre, o el archivo todavía no se ha creado, KAFE se detiene:

    ```kafe
    --8<-- "tests/DocsExamples/files/read-missing.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/files/read-missing.error.stderr.expec"
    ```

### `files.delete(path)` { #delete }

**Qué hace:** **Borra** el archivo de la carpeta, como tirar el cuaderno a la basura. No pasa por la papelera: se borra de verdad.

**Cuándo usarla:** Para limpiar archivos temporales que tu programa ya no necesita.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `path` | `STR` | El nombre (o ruta) del archivo. |

**Devuelve:** `VOID` (nada).

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/files/delete.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/files/delete.expec"
```

**¿Qué pasó aquí?** Después de borrar el archivo, el nombre queda libre, así que `create` puede volver a usarlo sin error.

??? warning "Error común: borrar un archivo que no existe"
    ```kafe
    --8<-- "tests/DocsExamples/files/delete-missing.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/files/delete-missing.error.stderr.expec"
    ```

## Resumen de todas las funciones { #summary }

| Función | Qué hace |
|---|---|
| [`files.create(path)`](#create) | Crea un archivo nuevo y vacío. |
| [`files.write(path, text)`](#write) | Reemplaza el contenido del archivo por `text`. |
| [`files.read(path)`](#read) | Devuelve todo el texto del archivo. |
| [`files.delete(path)`](#delete) | Borra el archivo. |

## ¿Qué aprendiste?

- Un archivo es como un cuaderno: se crea, se escribe, se lee y se tira.
- Las rutas se buscan en la carpeta de tu programa `.kf`.
- `write` reemplaza todo el contenido y agrega un salto de línea al final.
- Leer o borrar un archivo que no existe detiene el programa con un error.

[Siguiente librería: PLOT :material-arrow-right:](../plot.md){ .md-button .md-button--primary }
