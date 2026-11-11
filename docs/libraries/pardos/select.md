# Elegir columnas y filas

Muchas veces no necesitas toda la tabla. En una lista de clase puedes querer **solo las notas** (una columna) o **solo a quienes viven en Lima** (algunas filas). Elegir columnas es como recortar una tira vertical de la hoja; elegir filas es como pasar un colador que deja pasar solo las que cumplen una condición.

Todos los ejemplos usan este archivo:

```text
--8<-- "tests/DocsExamples/pardos/data/students.csv"
```

!!! tip "La tabla original no cambia"
    `query`, `rename` y `drop` **no tocan** tu tabla: devuelven una tabla nueva. Guárdala en otra variable si la quieres usar.

## Columnas { #columns }

### `df.col(column)` { #col }

**Qué hace:** Saca una columna como **lista**.

**Cuándo usarla:** Para hacer cuentas con una columna, o para darle a MACHINE las respuestas (etiquetas) de un modelo.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `column` | `STR` | El nombre de la columna. Las mayúsculas cuentan. |

**Devuelve:** Una lista del tipo de la columna: `List[INT]`, `List[FLOAT]` o `List[STR]`. En una columna `INT`, los `nan` se vuelven `0`; en una columna `STR`, se vuelven `""`.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/col.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/col.expec"
```

!!! tip "Declara el tipo correcto"
    La columna `age` es `INT`. Si escribes `List[FLOAT] ages = students.col("age");`, KAFE responde `Expected List[FLOAT], obtained List[INT]`. Usa [`dtypes`](inspect.md#dtypes) para saber el tipo.


??? warning "Error común"
    Los nombres de columna distinguen mayúsculas: `Score` no es `score`.

    ```kafe
    --8<-- "tests/DocsExamples/pardos/col-wrong-name.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/pardos/col-wrong-name.error.stderr.expec"
    ```

### `df.rename(old, new)` { #rename }

**Qué hace:** Cambia el nombre de una columna.

**Cuándo usarla:** Cuando un archivo trae nombres poco claros o en otro idioma.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `old` | `STR` | El nombre actual. |
| `new` | `STR` | El nombre nuevo. No puede ser el de otra columna que ya existe. |

**Devuelve:** `PARDOS`: una tabla nueva con el nombre cambiado.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/rename.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/rename.expec"
```

### `df.drop(column)` { #drop }

**Qué hace:** Quita una columna.

**Cuándo usarla:** Para quitar columnas que no sirven, como un identificador, antes de entrenar un modelo.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `column` | `STR` | La columna que quieres quitar. |

**Devuelve:** `PARDOS`: una tabla nueva sin esa columna.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/drop.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/drop.expec"
```

## Filas: filtrar con una condición { #rows }

### `df.query(condition)` { #query }

**Qué hace:** Se queda solo con las filas que cumplen una **condición**. La condición se escribe como texto, con los nombres de las columnas como si fueran variables.

**Cuándo usarla:** Para estudiar un grupo: los mayores de 10 años, los de una ciudad, los que aprobaron…

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `condition` | `STR` | Una expresión de KAFE que da `true` o `false`. Los textos dentro de ella van entre comillas simples `'…'`. |

**Devuelve:** `PARDOS`: una tabla nueva con las filas que cumplen. Si ninguna cumple, la tabla queda sin filas.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/query.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/query.expec"
```


Puedes usar estos operadores dentro de la condición:

| Operador | Significa |
|---|---|
| `==` | igual |
| `!=` | distinto |
| `<`, `<=`, `>`, `>=` | menor, menor o igual, mayor, mayor o igual |
| `&&` | **y**: se deben cumplir las dos |
| `\|\|` | **o**: basta con que se cumpla una |

También puedes agrupar con paréntesis, por ejemplo `"(age > 10 && score > 8) || city == 'Lima'"`.

??? info "Para curiosos 🤓"
    `query` usa el mismo intérprete de KAFE: lee el texto como una expresión y, para **cada fila**, crea por un momento variables con el nombre de cada columna (`age = 11`, `city = 'Quito'`…), evalúa la condición y guarda la fila si el resultado es `true`.

!!! warning "Revisa bien la condición"
    Si la condición tiene un error de escritura (por ejemplo `"age >"` o `"city = 'Lima'"` con un solo `=`), hoy KAFE **no avisa**: devuelve una tabla sin filas. Si un filtro te deja la tabla vacía sin motivo, revisa la condición.


## ¿Qué aprendiste?

- `col` saca una columna como lista.
- `rename` y `drop` cambian o quitan columnas.
- `query` filtra filas con una condición escrita como texto.

Volver a [PARDOS](../pardos.md).

[Siguiente: contar y resumir :material-arrow-right:](summarize.md){ .md-button .md-button--primary }
