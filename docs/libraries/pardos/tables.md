# Crear y leer tablas

Hay dos maneras de tener una tabla en KAFE: **escribirla tú** dentro del programa o **leerla de un archivo**. Casi siempre vas a leerla de un archivo, porque los datos reales tienen cientos o miles de filas.

!!! tip "¿Dónde busca KAFE el archivo?"
    Una **ruta** es la dirección de un archivo, como `data/students.csv`. Si la ruta no empieza desde la raíz del disco, KAFE la busca **junto a tu archivo `.kf`**. En estos ejemplos, los datos están en la carpeta `data/`, al lado de cada programa.

## Escribir una tabla a mano { #by-hand }

Es como dibujar una tabla pequeña en tu cuaderno: primero escribes los títulos de las columnas y luego cada fila.

### `pardos.DataFrame(columns, rows)` { #dataframe }

**Qué hace:** Crea una tabla nueva a partir de una lista de nombres de columna y una lista de filas.

**Cuándo usarla:** Para probar algo con pocos datos sin crear un archivo.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `columns` | `List[STR]` | Los títulos de las columnas. |
| `rows` | `List[List[...]]` | Las filas. Cada fila tiene un valor por columna. |

**Devuelve:** `PARDOS`: la tabla nueva.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/dataframe.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/dataframe.expec"
```


!!! tip "¿Qué pasó aquí?"
    1. `columns` guarda los títulos: `hours` (horas) y `score` (nota).
    2. `rows` guarda tres filas, una por estudiante.
    3. `pardos.DataFrame` las juntó en una tabla.
    4. `study.columns` (sin paréntesis, porque es un dato guardado y no una función) muestra los títulos.

!!! note "Todas las filas con el mismo tipo"
    En KAFE una lista solo guarda valores de **un mismo tipo**. Por eso `[["Ana", 10]]` (texto y número juntos) no se puede escribir a mano: KAFE responde `Expected homogeneous list`. Si tu tabla mezcla texto y números, guárdala en un archivo CSV y léela con [`read_csv`](#read_csv).


??? warning "Error común"
    Si una fila tiene más o menos valores que columnas, la tabla no cuadra (*Inconsistent dimensions*, "tamaños que no coinciden"):

    ```kafe
    --8<-- "tests/DocsExamples/pardos/dataframe-dimensions.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/pardos/dataframe-dimensions.error.stderr.expec"
    ```

## Leer un archivo CSV { #csv }

Un **CSV** (*comma-separated values*, "valores separados por comas") es un archivo de texto normal que guarda una tabla. Cada **línea** es una fila y las **comas** separan las columnas. La primera línea tiene los títulos. Mira el mismo archivo como texto y como tabla:

```text
--8<-- "tests/DocsExamples/pardos/data/students.csv"
```

| name | age | score | city |
|---|---|---|---|
| Ana | 10 | 8.5 | Lima |
| Luis | 11 | 7.0 | Quito |
| Sofia | 10 | 9.5 | Lima |
| Mateo | 12 | 6.5 | Cusco |
| Elena | 11 | 9.0 | Quito |

Puedes abrir un CSV con un editor de texto o con una hoja de cálculo. ¿Quieres ver cómo KAFE corta cada línea? Está en [Cómo funciona por dentro](../pardos.md#inside).

### `pardos.read_csv(path)` { #read_csv }

**Qué hace:** Lee un archivo CSV y lo convierte en una tabla. Adivina el tipo de cada celda: `10` será `INT`, `8.5` será `FLOAT` y `Lima` será `STR`.

**Cuándo usarla:** Siempre que tus datos estén en un archivo `.csv`, por ejemplo uno descargado de internet.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `path` | `STR` | La ruta del archivo. |

**Devuelve:** `PARDOS`: la tabla con los datos del archivo.

**Datos de entrada**

`data/students.csv`:

```text
--8<-- "tests/DocsExamples/pardos/data/students.csv"
```

`data/prices.csv`:

```text
--8<-- "tests/DocsExamples/pardos/data/prices.csv"
```

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/read_csv.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/read_csv.expec"
```


!!! note "Coma o punto y coma"
    Algunos programas guardan los CSV con **punto y coma** (`;`) en lugar de coma. `read_csv` lo detecta solo: cuenta los `;` y las `,` de todo el archivo y, si hay **al menos tantos** `;` como `,`, usa `;`. Si no, usa `,`. Por eso `prices.csv` se leyó bien.

!!! note "Celdas vacías"
    Una celda vacía se lee como `nan` (*not a number*, "no es un número"), la marca de "aquí falta un dato". Aprende a manejarla en [Datos que faltan](missing.md).

!!! warning "Un lector sencillo"
    `read_csv` corta cada línea en cada separador, sin excepciones. Si un texto lleva una coma dentro (por ejemplo `"Lima, Perú"`), se partirá en dos columnas. Revisa las columnas con [`dtypes`](inspect.md#dtypes) antes de entrenar un modelo.


??? warning "Error común"
    Si escribes mal el nombre del archivo, KAFE te dice que no lo encontró (*not found*) y en qué carpeta buscó. Aquí falta una `s` en `students`. En la salida, `<REPO>` reemplaza la carpeta del proyecto:

    ```kafe
    --8<-- "tests/DocsExamples/pardos/read_csv-missing-file.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/pardos/read_csv-missing-file.error.stderr.expec"
    ```

## Leer un archivo JSON { #json }

Un **JSON** es otro formato de texto muy usado en internet. En lugar de filas con comas, guarda una lista de **fichas**: cada ficha va entre llaves `{ }` y dice `"columna": valor` para cada dato. Es como una pila de tarjetas de mascotas, cada una con los mismos apartados.

### `pardos.read_json(path)` { #read_json }

**Qué hace:** Lee un archivo JSON que contiene una lista de fichas y lo convierte en una tabla. Los nombres de columna salen de la primera ficha.

**Cuándo usarla:** Cuando tus datos vienen de una página web o de otro programa que guarda JSON.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `path` | `STR` | La ruta del archivo. |

**Devuelve:** `PARDOS`: la tabla.

**Datos de entrada**

`data/pets.json`:

```text
--8<-- "tests/DocsExamples/pardos/data/pets.json"
```

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/read_json.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/read_json.expec"
```


!!! note "Solo listas de fichas"
    El archivo tiene que ser una lista `[ ... ]` de fichas `{ ... }` (en inglés, formato *records*). Con otra forma, KAFE responde `Unsupported JSON format`. Un archivo con la lista vacía `[]` da una tabla vacía.


## ¿Qué aprendiste?

- `pardos.DataFrame(columnas, filas)` crea una tabla pequeña escrita a mano.
- `pardos.read_csv` lee archivos CSV (con `,` o `;`) y adivina el tipo de cada celda.
- `pardos.read_json` lee una lista de fichas JSON.

Volver a [PARDOS](../pardos.md).

[Siguiente: mirar los datos :material-arrow-right:](inspect.md){ .md-button .md-button--primary }
