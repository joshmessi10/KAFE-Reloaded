# FILES: archivos

La librería **FILES** sirve para guardar texto en **archivos** y leerlo después. Un archivo es como un **cuaderno** que vive en tu computadora: lo que escribes en él no se borra cuando el programa termina.

**¿Para qué sirve?** Para recordar cosas entre una ejecución y otra: una puntuación, una lista de tareas o los resultados de un experimento.

## Antes de empezar: importar la librería

Una librería es una **caja de herramientas** extra. Para usarla, primero la traes a tu programa con `import`, y luego usas cada herramienta con `files.` delante. Este programa usa las cuatro herramientas de FILES:

```kafe
--8<-- "tests/DocsExamples/files/notebook.kf"
```

```text
--8<-- "tests/DocsExamples/files/notebook.expec"
```

!!! warning "Error común: olvidar el `import`"
    Si usas `files.` sin haber escrito `import files;`, KAFE no sabe de qué caja hablas:

    ```kafe
    --8<-- "tests/DocsExamples/files/no-import.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/files/no-import.error.stderr.expec"
    ```

## La vida de un archivo

Piensa en un cuaderno de verdad. Primero lo **compras** (está vacío). Luego **escribes** en él. Más tarde lo **lees**. Y cuando ya no lo necesitas, lo **tiras**. FILES tiene una función para cada etapa:

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/files-notebook.svg"
<figcaption>`create` hace una hoja vacía, `write` escribe en ella, `read` copia lo escrito a tu programa y `delete` tira la hoja.</figcaption>
</figure>

## Cómo funciona por dentro { #inside }

FILES es una librería pequeña. Todo su código está en un solo archivo de Python: `src/lib/KafeFILES/functions.py`. Tiene cuatro funciones cortas, una por etapa, y todas siguen los mismos pasos:

1. **Revisar lo que le das.** Antes de hacer nada, KAFE comprueba que el nombre del archivo sea un `STR`. Si le das un número, se detiene con un error.
2. **Armar la ruta completa.** KAFE guarda en una variable llamada `current_dir` la carpeta donde está tu programa `.kf`. Luego **pega** esa carpeta con el nombre que diste (con `os.path.join`, una herramienta de Python que une carpetas y nombres). Por eso `"a.txt"` siempre se busca junto a tu programa, sin importar desde dónde lo ejecutes.
3. **Pedirle el trabajo a Python.** Con la ruta lista, Python abre el archivo en el **modo** que toca: `"x"` para crear (falla si ya existe), `"w"` para escribir (borra lo anterior) y `"r"` para leer. Para borrar usa `os.remove`.
4. **Avisar si algo sale mal.** Si el archivo no existe o ya existe, KAFE convierte el problema en un mensaje claro, como `read: File a.txt doesn't exist`.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/files-inside.svg"
<figcaption>Paso a paso de `files.read("a.txt")`: KAFE une la carpeta de tu programa con el nombre, Python abre el archivo y el texto vuelve a tu programa como un `STR`.</figcaption>
</figure>

??? info "Para curiosos 🤓"
    - El texto se guarda con la codificación **UTF-8**, así que puedes escribir tildes y la letra ñ.
    - `write` agrega `"\n"` (un salto de línea) al final de lo que escribes. Por eso, al leerlo, el texto termina en `\n`.

## Mapa de la librería

| Página | Qué encuentras |
|---|---|
| [Referencia](files/reference.md) | Las cuatro funciones: [`create`](files/reference.md#create), [`write`](files/reference.md#write), [`read`](files/reference.md#read) y [`delete`](files/reference.md#delete), con ejemplos y errores comunes. |

## ¿Qué aprendiste?

- Para usar FILES escribes `import files;` y luego `files.nombre(...)`.
- Un archivo es como un cuaderno: se crea, se escribe, se lee y se tira.
- KAFE busca los archivos en la carpeta de tu programa `.kf`.

[Ver las funciones :material-arrow-right:](files/reference.md){ .md-button .md-button--primary }
