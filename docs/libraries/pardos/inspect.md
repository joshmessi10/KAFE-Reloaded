# Mirar los datos

Antes de usar una tabla, conviene **mirarla**. Es como hojear un libro antes de leerlo: ves cuántas páginas tiene, de qué trata y cómo empieza. Estos métodos se escriben con un punto después del nombre de la tabla, por ejemplo `students.head(2)`. Un **método** es una función que pertenece a un objeto: aquí, a tu tabla.

Todos los ejemplos usan este archivo:

```text
--8<-- "tests/DocsExamples/pardos/data/students.csv"
```

!!! note "Un método a la vez"
    KAFE todavía no permite encadenar métodos, como `students.describe().round(2)`. Guarda primero el resultado en una variable y luego llama al siguiente método.

## El principio y el final { #peek }

### `df.head(n)` { #head }

**Qué hace:** Devuelve las **primeras** `n` filas.

**Cuándo usarla:** Para echar un vistazo rápido a una tabla grande.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `n` | `INT` | Opcional. Cuántas filas. Si no lo das, son 5. |

**Devuelve:** `PARDOS`: una tabla nueva con esas filas.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/head.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/head.expec"
```

### `df.tail(n)` { #tail }

**Qué hace:** Devuelve las **últimas** `n` filas.

**Cuándo usarla:** Para revisar cómo termina el archivo, por ejemplo si la última fila está incompleta.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `n` | `INT` | Opcional. Cuántas filas. Si no lo das, son 5. Si pides más filas de las que hay, recibes la tabla entera. |

**Devuelve:** `PARDOS`: una tabla nueva con esas filas.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/tail.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/tail.expec"
```

## Tamaño y tipos { #size }

### `df.shape()` { #shape }

**Qué hace:** Te dice el **tamaño** de la tabla: `[filas, columnas]`.

**Cuándo usarla:** Para saber cuántos datos tienes, o para comprobar que un filtro quitó filas.

No recibe parámetros.

**Devuelve:** `List[INT]` con dos números.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/shape.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/shape.expec"
```

### `df.dtypes()` { #dtypes }

**Qué hace:** Te dice el **tipo** de cada columna: `INT`, `FLOAT`, `STR` o `BOOL`.

**Cuándo usarla:** Antes de hacer cuentas, para saber qué columnas tienen números.

No recibe parámetros.

**Devuelve:** `List[List[STR]]`: una pareja `[nombre, tipo]` por columna.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/dtypes.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/dtypes.expec"
```


??? info "Para curiosos 🤓"
    KAFE no guarda el tipo de cada columna: lo **calcula** cada vez mirando sus valores (sin contar los `nan`). Si todos son enteros, la columna es `INT`; si todos son números pero alguno tiene decimales, es `FLOAT`; si todos son `true`/`false`, es `BOOL`; en cualquier otro caso, es `STR`.


### `df.info()` { #info }

**Qué hace:** Hace un **resumen** en una sola línea: filas, columnas, nombres y tipos.

**Cuándo usarla:** Como primer paso cuando abres un archivo nuevo.

No recibe parámetros.

**Devuelve:** `STR` con el resumen.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/info.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/info.expec"
```

## Estadísticas rápidas { #stats }

### `df.describe()` { #describe }

**Qué hace:** Calcula, para cada columna con números: cuántos valores hay (`count`), el promedio (`mean`), cuánto se separan del promedio (`std`, la desviación estándar), el menor (`min`) y el mayor (`max`).

**Cuándo usarla:** Para conocer de un vistazo los números de tu tabla y descubrir valores raros.

No recibe parámetros.

**Devuelve:** `PARDOS`: una tabla nueva con una fila por columna numérica. Las columnas de texto no aparecen.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/pardos/describe.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/pardos/describe.expec"
```


!!! note "Los números salen como texto"
    En la tabla de `describe` los valores se guardan como texto (`'10.8'` entre comillas). Por eso [`round`](summarize.md#round) no los redondea. Si necesitas un valor para hacer cuentas, calcúlalo con [`mean`](summarize.md#mean) o [`agg`](summarize.md#agg).

??? info "Para curiosos 🤓"
    Si una columna tiene los valores $x_1, \dots, x_n$:

    $$\text{mean} = \bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i \qquad \text{std} = \sqrt{\frac{1}{n}\sum_{i=1}^{n}(x_i-\bar{x})^2}$$

    KAFE divide entre $n$ (desviación estándar *poblacional*), no entre $n-1$.


## ¿Qué aprendiste?

- `head` y `tail` muestran el principio y el final de la tabla.
- `shape`, `dtypes` e `info` dicen el tamaño y los tipos.
- `describe` resume las columnas con números.

Volver a [PARDOS](../pardos.md).

[Siguiente: elegir columnas y filas :material-arrow-right:](select.md){ .md-button .md-button--primary }
