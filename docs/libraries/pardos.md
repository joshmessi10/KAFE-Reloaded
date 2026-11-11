# PARDOS: tablas de datos

La librería **PARDOS** sirve para trabajar con **tablas de datos**: leerlas de un archivo, mirarlas, filtrarlas, resumirlas, juntarlas y prepararlas para entrenar modelos de Machine Learning. Está inspirada en *Pandas*, la librería de tablas más usada en Python, pero escrita desde cero dentro de KAFE para que puedas ver cómo funciona.

## ¿Qué es una tabla? { #what-is-a-table }

Una **tabla** (en inglés, *DataFrame*) es como una **hoja de cálculo** o la lista de tu clase:

- Cada **fila** es una cosa que estudiamos: aquí, un estudiante.
- Cada **columna** es algo que sabemos de todas ellas: su nombre, su edad, su nota, su ciudad.
- La primera fila tiene los **títulos** de las columnas.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/pardos-tabla.svg"
<figcaption>Primero se ilumina una fila (todo lo que sabemos de Luis) y después una columna (la nota de todos).</figcaption>
</figure>

Esta tabla está guardada en un archivo de texto llamado `students.csv`:

```text
--8<-- "tests/DocsExamples/pardos/data/students.csv"
```

Con dos líneas de KAFE la lees y la muestras:

```kafe
--8<-- "tests/DocsExamples/pardos/first-table.kf"
```

```text
--8<-- "tests/DocsExamples/pardos/first-table.expec"
```

!!! tip "¿Qué pasó aquí?"
    1. `import pardos;` trajo la librería.
    2. `pardos.read_csv(...)` leyó el archivo y creó una tabla. Su tipo en KAFE es `PARDOS`.
    3. `show(students)` la mostró en una línea: `cols` son los títulos de las columnas y `rows` son las filas, cada una entre corchetes.

## Antes de empezar: importar la librería { #import }

Una librería es una **caja de herramientas** extra. Para usarla, primero la traes con `import pardos;` y luego usas cada herramienta con `pardos.` delante, como `pardos.read_csv(...)`. Las tablas que te devuelve traen sus propias herramientas, los **métodos**, que se escriben con un punto después del nombre de la tabla: `students.head(2)`.

!!! warning "Error común: olvidar el `import`"
    Si usas `pardos.` sin haber escrito `import pardos;`, KAFE no sabe de qué caja hablas:

    ```kafe
    --8<-- "tests/DocsExamples/pardos/no-import.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/pardos/no-import.error.stderr.expec"
    ```

## Cómo funciona por dentro { #inside }

PARDOS vive en la carpeta `src/lib/KafePARDOS/` del código de KAFE y tiene tres archivos:

| Archivo | Qué guarda |
|---|---|
| `functions.py` | Las funciones que llamas con `pardos.`: `read_csv`, `read_json`, `concat`, `merge`, `to_matrix`, `flatten`. |
| `DataFrame.py` | La clase `DataFrame` (la tabla y todos sus métodos) y la clase `GroupBy` (los grupos de [`groupby`](pardos/summarize.md#groupby)). |
| `utils.py` | `infer_type`, la función que adivina el tipo de cada celda. |

Por dentro, una tabla es solo **dos listas**:

- `columns`: una lista de textos con los títulos, por ejemplo `['name', 'age', 'score', 'city']`.
- `data`: una **lista de listas**, una lista por fila, por ejemplo `[['Ana', 10, 8.5, 'Lima'], ...]`.

Mira cómo `read_csv` convierte una línea del archivo en una fila de `data`:

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/pardos-pordentro.svg"
<figcaption>1) Se corta la línea en cada coma. 2) Cada trozo se convierte a número si se puede. 3) La fila terminada se añade al final de `data`.</figcaption>
</figure>

Paso a paso, `read_csv`:

1. **Busca el archivo**: primero tal como escribiste la ruta y, si no está, junto a tu archivo `.kf`.
2. **Lee todas las líneas** y quita las líneas vacías del final. Si el archivo está vacío, devuelve una tabla vacía.
3. **Elige el separador**: cuenta los `;` y las `,` de todo el archivo. Si hay al menos tantos `;` como `,`, usa `;`; si no, `,`.
4. **Lee los títulos** de la primera línea y quita los espacios sobrantes.
5. **Corta cada línea** en trozos (`split`). Si a una línea le faltan trozos, los completa con celdas vacías.
6. **Adivina el tipo** de cada trozo con `infer_type`: un trozo vacío pasa a ser `nan`; si se puede leer como entero, es `INT`; si no, si se puede leer como decimal, es `FLOAT`; si no, se queda como texto (`STR`).
7. **Crea la tabla** con `columns` y `data`. Al crearla, comprueba que cada fila tenga tantos valores como columnas.

Otras ideas que te ayudan a entender el resto de la librería:

- **Los tipos se calculan, no se guardan.** [`dtypes`](pardos/inspect.md#dtypes) mira los valores de cada columna cada vez que lo llamas.
- **Las tablas no cambian.** Casi todos los métodos (`head`, `query`, `drop`, `fillna`…) recorren `data` y construyen una tabla **nueva**. La original queda igual.
- **`query` usa el intérprete de KAFE.** Para cada fila, crea variables con los nombres de las columnas y evalúa tu condición (más en [`query`](pardos/select.md#query)).
- **`merge` usa un índice.** Primero apunta qué filas tiene cada valor de la clave y después busca ahí (más en [`merge`](pardos/combine.md#merge)).

## Mapa de la librería { #map }

| Página | Qué aprendes |
|---|---|
| [Crear y leer tablas](pardos/tables.md) | Escribir una tabla a mano, leer archivos CSV y JSON. |
| [Mirar los datos](pardos/inspect.md) | Ver el principio y el final, el tamaño, los tipos y estadísticas rápidas. |
| [Elegir columnas y filas](pardos/select.md) | Sacar una columna, renombrar, quitar columnas y filtrar filas. |
| [Contar y resumir](pardos/summarize.md) | Contar valores, promedios, sumas, redondeos y resúmenes por grupo. |
| [Datos que faltan](pardos/missing.md) | Rellenar o quitar los huecos (`nan`). |
| [Juntar tablas](pardos/combine.md) | Apilar tablas (`concat`) y unirlas por una columna (`merge`). |
| [Guardar tablas](pardos/save.md) | Guardar en CSV o JSON. |
| [De tabla a números para MACHINE](pardos/to-numbers.md) | Convertir la tabla en una matriz para entrenar modelos. |

## Resumen de todas las funciones { #summary }

| Función o método | Página |
|---|---|
| [`pardos.DataFrame(columns, rows)`](pardos/tables.md#dataframe) | [Crear y leer tablas](pardos/tables.md) |
| [`pardos.read_csv(path)`](pardos/tables.md#read_csv) | [Crear y leer tablas](pardos/tables.md) |
| [`pardos.read_json(path)`](pardos/tables.md#read_json) | [Crear y leer tablas](pardos/tables.md) |
| [`df.head(n)`](pardos/inspect.md#head) | [Mirar los datos](pardos/inspect.md) |
| [`df.tail(n)`](pardos/inspect.md#tail) | [Mirar los datos](pardos/inspect.md) |
| [`df.shape()`](pardos/inspect.md#shape) | [Mirar los datos](pardos/inspect.md) |
| [`df.dtypes()`](pardos/inspect.md#dtypes) | [Mirar los datos](pardos/inspect.md) |
| [`df.info()`](pardos/inspect.md#info) | [Mirar los datos](pardos/inspect.md) |
| [`df.describe()`](pardos/inspect.md#describe) | [Mirar los datos](pardos/inspect.md) |
| [`df.col(column)`](pardos/select.md#col) | [Elegir columnas y filas](pardos/select.md) |
| [`df.rename(old, new)`](pardos/select.md#rename) | [Elegir columnas y filas](pardos/select.md) |
| [`df.drop(column)`](pardos/select.md#drop) | [Elegir columnas y filas](pardos/select.md) |
| [`df.query(condition)`](pardos/select.md#query) | [Elegir columnas y filas](pardos/select.md) |
| [`df.value_counts(column)`](pardos/summarize.md#value_counts) | [Contar y resumir](pardos/summarize.md) |
| [`df.mean(column)`](pardos/summarize.md#mean) | [Contar y resumir](pardos/summarize.md) |
| [`df.sum(column)`](pardos/summarize.md#sum) | [Contar y resumir](pardos/summarize.md) |
| [`df.agg(column, operation)`](pardos/summarize.md#agg) | [Contar y resumir](pardos/summarize.md) |
| [`df.round(digits)`](pardos/summarize.md#round) | [Contar y resumir](pardos/summarize.md) |
| [`df.groupby(column)`](pardos/summarize.md#groupby) | [Contar y resumir](pardos/summarize.md) |
| [`groups.mean()`](pardos/summarize.md#groupby-mean) | [Contar y resumir](pardos/summarize.md) |
| [`groups.sum()`](pardos/summarize.md#groupby-sum) | [Contar y resumir](pardos/summarize.md) |
| [`groups.count()`](pardos/summarize.md#groupby-count) | [Contar y resumir](pardos/summarize.md) |
| [`df.fillna(value)`](pardos/missing.md#fillna) | [Datos que faltan](pardos/missing.md) |
| [`df.dropna()`](pardos/missing.md#dropna) | [Datos que faltan](pardos/missing.md) |
| [`df.ffill()`](pardos/missing.md#ffill) | [Datos que faltan](pardos/missing.md) |
| [`df.bfill()`](pardos/missing.md#bfill) | [Datos que faltan](pardos/missing.md) |
| [`pardos.concat(first, second)`](pardos/combine.md#concat) | [Juntar tablas](pardos/combine.md) |
| [`df.concat(other)`](pardos/combine.md#df-concat) | [Juntar tablas](pardos/combine.md) |
| [`pardos.merge(left, right, key, how)`](pardos/combine.md#merge) | [Juntar tablas](pardos/combine.md) |
| [`df.merge(other, key, how)`](pardos/combine.md#df-merge) | [Juntar tablas](pardos/combine.md) |
| [`df.to_csv(path)`](pardos/save.md#to_csv) | [Guardar tablas](pardos/save.md) |
| [`df.to_json(path)`](pardos/save.md#to_json) | [Guardar tablas](pardos/save.md) |
| [`pardos.to_matrix(df)`](pardos/to-numbers.md#to_matrix) | [De tabla a números para MACHINE](pardos/to-numbers.md) |
| [`pardos.df_to_matrix(df)`](pardos/to-numbers.md#to_matrix) | [De tabla a números para MACHINE](pardos/to-numbers.md) |
| [`pardos.flatten(nested)`](pardos/to-numbers.md#flatten) | [De tabla a números para MACHINE](pardos/to-numbers.md) |

## Errores frecuentes { #errors }

| Error | Causa |
|---|---|
| `File '…' not found` | El archivo no existe en esa ruta ([ver ejemplo](pardos/tables.md#read_csv)). |
| `Column '…' doesn't exist` | El nombre de la columna está mal escrito en `col`, `drop`, `rename`… ([ver ejemplo](pardos/select.md#col)). |
| `Inconsistent dimensions` | Una fila no tiene tantos valores como columnas ([ver ejemplo](pardos/tables.md#dataframe)). |
| `has no numeric values` / `Expected List[...]` | La operación no sirve para el tipo de esa columna, por ejemplo el promedio de una columna de texto. |

!!! note
    Muchos mensajes de PARDOS empiezan con el nombre de tu variable o con `pardos:` repetido, por ejemplo `pardos: pardos: concat: Columns do not match`. Lee la parte final: ahí está la explicación.

## ¿Qué aprendiste?

- Una tabla tiene filas (las cosas que estudias) y columnas (lo que sabes de ellas).
- Por dentro es una lista de títulos (`columns`) y una lista de listas (`data`).
- Para usar PARDOS escribes `import pardos;`, creas una tabla con `pardos.read_csv(...)` y la trabajas con sus métodos: `tabla.head()`, `tabla.query(...)`…

[Empezar: crear y leer tablas :material-arrow-right:](pardos/tables.md){ .md-button .md-button--primary }
[Siguiente librería: datasets de Kaggle](../bibliotecas/kaggle.md){ .md-button }
