# Contar y resumir

Una tabla grande cuenta una historia, pero hay que **resumirla** para entenderla. Es lo que hace un profesor al final del curso: no lee las notas una por una, calcula el promedio de la clase o cuenta cuántos estudiantes hay de cada ciudad.

Todos los ejemplos usan este archivo:

```text
--8<-- "tests/DocsExamples/pardos/data/students.csv"
```

!!! note "Los `nan` no cuentan"
    `mean`, `sum` y `agg` ignoran las celdas vacías (`nan`) y las que no son números.

## Contar valores { #counting }

### `df.value_counts(column)` { #value_counts }

**Qué hace:** Cuenta **cuántas veces** aparece cada valor de una columna.

**Cuándo usarla:** Para saber si tus datos están equilibrados, por ejemplo cuántos ejemplos hay de cada clase.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `column` | `STR` | La columna que quieres contar. |

**Devuelve:** `PARDOS`: una tabla con las columnas `value` (valor) y `count` (cuántas veces), de la más frecuente a la menos frecuente. Los `nan` no se cuentan.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/value_counts.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/value_counts.expec"
```

## Cuentas con una columna { #column-math }

### `df.mean(column)` { #mean }

**Qué hace:** Calcula el **promedio** (la media) de una columna con números.

**Cuándo usarla:** Para conocer el valor típico: la nota media de la clase.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `column` | `STR` | Una columna con números. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/mean.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/mean.expec"
```

!!! note "Solo columnas con números"
    Con una columna de texto, como `city`, KAFE responde `Column 'city' has no numeric values` ("la columna no tiene valores numéricos"). Lo mismo pasa con `sum` y `agg`.


### `df.sum(column)` { #sum }

**Qué hace:** **Suma** todos los números de una columna.

**Cuándo usarla:** Para totales: el total de ventas del mes, las horas de estudio de toda la clase.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `column` | `STR` | Una columna con números. |

**Devuelve:** `INT` si todos son enteros, `FLOAT` si hay decimales.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/sum.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/sum.expec"
```

### `df.agg(column, operation)` { #agg }

**Qué hace:** Aplica una **operación** a una columna. Su nombre viene de *aggregate*, "juntar muchos valores en uno".

**Cuándo usarla:** Cuando quieres el menor, el mayor o cuántos números hay.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `column` | `STR` | Una columna con números. |
| `operation` | `STR` | Una de: `"sum"` (suma), `"mean"` (promedio), `"min"` (menor), `"max"` (mayor) o `"count"` (cuántos números hay). |

**Devuelve:** Un número (`INT` o `FLOAT`).

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/agg.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/agg.expec"
```

!!! tip
    `"count"` cuenta solo los valores numéricos. Con una columna de texto da `0`.


??? warning "Error común"
    Solo existen las cinco operaciones de la tabla. La mediana (`median`) todavía no está:

    ```kafe
    --8<-- "tests/DocsExamples/pardos/agg-unknown.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/pardos/agg-unknown.error.stderr.expec"
    ```

### `df.round(digits)` { #round }

**Qué hace:** **Redondea** todos los números con decimales (`FLOAT`) de la tabla.

**Cuándo usarla:** Para mostrar resultados más fáciles de leer.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `digits` | `INT` | Opcional. Cuántos decimales dejar. Si no lo das, son 4. |

**Devuelve:** `PARDOS`: una tabla nueva. Los enteros y los textos no cambian.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/round.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/round.expec"
```

!!! note
    Usa la función [`math.round`](../math/rounding.md#round) por dentro. La tabla de [`describe`](inspect.md#describe) guarda texto, así que `round` no la cambia.


## Resumir por grupos { #groups }

**Agrupar** es como repartir las fichas de la clase en montones, uno por ciudad, y luego calcular algo **en cada montón**. Se hace en dos pasos: `groupby` forma los montones y después `mean`, `sum` o `count` resumen cada uno.

### `df.groupby(column)` { #groupby }

**Qué hace:** Reparte las filas en **grupos** según el valor de una columna.

**Cuándo usarla:** Para comparar grupos: la nota media de cada ciudad.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `column` | `STR` | La columna que decide el grupo de cada fila. |

**Devuelve:** Un objeto de grupos (se guarda en una variable `PARDOS`). No se muestra bien con `show`: úsalo con `mean`, `sum` o `count`.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/groupby.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/groupby.expec"
```


!!! tip "¿Qué pasó aquí?"
    1. `students.drop("age")` quitó la edad, para que la única columna con números sea `score`.
    2. `no_age.groupby("city")` formó tres montones: Cusco, Lima y Quito.
    3. `by_city.mean()` calculó la nota media de cada montón. Los grupos salen en orden alfabético.

!!! warning "Solo se resume la primera columna con números"
    `mean` y `sum` resumen **solo la primera** columna numérica de la tabla. Si no quitas `age`, el resultado es la edad media, no la nota:

    ```kafe
    --8<-- "tests/DocsExamples/pardos/groupby-first-column.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/pardos/groupby-first-column.expec"
    ```

    Por eso, antes de agrupar, usa [`drop`](select.md#drop) para dejar solo la columna numérica que te interesa.


### `groups.mean()` { #groupby-mean }

**Qué hace:** Calcula el **promedio** de cada grupo.

**Cuándo usarla:** Para comparar el valor típico de cada grupo.

No recibe parámetros.

**Devuelve:** `PARDOS`: una tabla con la columna del grupo y la columna `mean`.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/groupby.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/groupby.expec"
```

Es el mismo ejemplo de [`groupby`](#groupby).


### `groups.sum()` { #groupby-sum }

**Qué hace:** **Suma** los valores de cada grupo.

**Cuándo usarla:** Para totales por grupo: las ventas de cada tienda.

No recibe parámetros.

**Devuelve:** `PARDOS`: una tabla con la columna del grupo y la columna `sum`.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/groupby-sum.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/groupby-sum.expec"
```

### `groups.count()` { #groupby-count }

**Qué hace:** Cuenta **cuántas filas** tiene cada grupo.

**Cuándo usarla:** Para saber el tamaño de cada grupo. Aquí no importa qué columnas tenga la tabla.

No recibe parámetros.

**Devuelve:** `PARDOS`: una tabla con la columna del grupo y la columna `count`.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/groupby-count.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/groupby-count.expec"
```

## ¿Qué aprendiste?

- `value_counts` cuenta cuántas veces aparece cada valor.
- `mean`, `sum` y `agg` resumen una columna en un solo número; `round` redondea la tabla.
- `groupby` forma grupos y `mean`, `sum` o `count` los resumen.

Volver a [PARDOS](../pardos.md).

[Siguiente: datos que faltan :material-arrow-right:](missing.md){ .md-button .md-button--primary }
