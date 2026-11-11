# NUMK: crear y medir tensores

Antes de hacer cuentas necesitas tus números bien ordenados. Aquí aprendes a revisar una lista, a crear tablas vacías (llenas de ceros o unos), a llenarlas con números al azar y a medir su forma.

Si todavía no sabes qué es un vector, una matriz o un tensor, lee primero [la página de entrada de NUMK](../numk.md#shapes).

## Revisar tus datos { #checking }

Una tabla tiene que ser **pareja**: todas sus filas deben medir lo mismo, como un cartón de huevos donde cada fila tiene los mismos huecos. `numk.tensor` revisa eso por ti.

### `numk.tensor(data)` { #tensor }

**Qué hace:** Revisa que `data` sea un tensor de números bien formado y te devuelve una **copia**.

**Cuándo usarla:** Al principio de tu programa, para estar seguro de que tus datos no tienen filas de distinto tamaño ni textos mezclados.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `data` | `List[...]` de `INT` o `FLOAT` | Un vector, una matriz o un tensor. |

**Devuelve:** Una copia de `data`, con la misma forma.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/tensor.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/tensor.expec"
```

??? warning "Error común"
    Una fila más corta que las otras hace una tabla "chueca":

    ```kafe
    --8<-- "tests/DocsExamples/numk/tensor-irregular.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/numk/tensor-irregular.error.stderr.expec"
    ```

## Crear tensores llenos de ceros o unos { #filled }

Muchas veces necesitas una tabla "en blanco" para ir llenándola después, como una hoja cuadriculada nueva. Estas funciones la crean del tamaño que pidas.

### `numk.zeros(n)` { #zeros }

**Qué hace:** Crea un vector de `n` ceros.

**Cuándo usarla:** Para empezar un contador por cada cosa, por ejemplo los votos de 4 candidatos.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `n` | `INT` | Cuántos ceros quieres. |

**Devuelve:** `List[INT]`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/zeros.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/zeros.expec"
```

### `numk.zeros_matrix(rows, cols)` { #zeros_matrix }

**Qué hace:** Crea una tabla de ceros con `rows` filas y `cols` columnas.

**Cuándo usarla:** Para una tabla de puntos vacía, por ejemplo 2 equipos × 3 partidos.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `rows` | `INT` | Número de filas. |
| `cols` | `INT` | Número de columnas. |

**Devuelve:** `List[List[INT]]`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/zeros_matrix.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/zeros_matrix.expec"
```

### `numk.zeros_nd(shape)` { #zeros_nd }

**Qué hace:** Crea un tensor de ceros con **cualquier forma**: tú das la lista de medidas.

**Cuándo usarla:** Cuando necesitas más de dos ejes, como una pila de tablas para una imagen.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `shape` | `List[INT]` | La forma, por ejemplo `[2, 2, 2]`. |

**Devuelve:** Un tensor de `FLOAT` (`0.0`) con esa forma.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/zeros_nd.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/zeros_nd.expec"
```

!!! note "Ojo"
    `zeros` y `zeros_matrix` dan ceros enteros (`0`), pero `zeros_nd` da ceros decimales (`0.0`).

### `numk.ones(shape)` { #ones }

**Qué hace:** Crea un tensor lleno de unos con la forma que pidas.

**Cuándo usarla:** Para empezar con un valor neutro al multiplicar, o para dar el mismo peso a todo.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `shape` | `List[INT]` | La forma, por ejemplo `[2, 3]`. |

**Devuelve:** Un tensor de `FLOAT` (`1.0`) con esa forma.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/ones.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/ones.expec"
```

## Números al azar { #random }

Una red neuronal empieza con números al azar, como cuando barajas las cartas antes de jugar. Pero a veces quieres que el "azar" sea **repetible**, para que tu programa dé siempre lo mismo. Para eso existe la **semilla** (*seed*): un número que fija el barajado. Con la misma semilla salen los mismos números.

### `numk.random_tensor(shape, low, high, seed)` { #random_tensor }

**Qué hace:** Crea un tensor con números al azar entre `low` y `high`. Todos los valores tienen la misma probabilidad de salir (como un dado).

**Cuándo usarla:** Para dar valores iniciales a los pesos de una red, o para inventar datos de prueba.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `shape` | `List[INT]` | La forma del tensor. |
| `low` | `INT | FLOAT` | Opcional. El valor más bajo. Si no lo das, es `-0.5`. |
| `high` | `INT | FLOAT` | Opcional. El valor más alto. Si no lo das, es `0.5`. |
| `seed` | `INT` | Opcional. La semilla para repetir los mismos números. |

**Devuelve:** Un tensor de `FLOAT` con esa forma.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/random_tensor.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/random_tensor.expec"
```

Las dos primeras líneas son iguales porque usan la misma semilla, `7`. La tercera no usa semilla: sus números cambian cada vez, así que solo mostramos su forma.

!!! note "Ojo"
    Puedes darle 1, 3 o 4 datos, pero no 2: si das `low`, también tienes que dar `high`.

### `numk.normal_tensor(shape, mean, stddev, seed)` { #normal_tensor }

**Qué hace:** Crea un tensor con números al azar que se juntan alrededor de un **promedio** (`mean`). La mayoría queda cerca del promedio y pocos quedan lejos, como las estaturas de las personas de una clase.

**Cuándo usarla:** Para inventar datos que se parezcan a medidas reales, o para iniciar pesos de una red.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `shape` | `List[INT]` | La forma del tensor. |
| `mean` | `INT | FLOAT` | Opcional. El promedio. Si no lo das, es `0.0`. |
| `stddev` | `INT | FLOAT` | Opcional. Qué tan desparramados quedan los números (la **desviación estándar**). Si no lo das, es `1.0`. No puede ser negativo. |
| `seed` | `INT` | Opcional. La semilla para repetir los mismos números. |

**Devuelve:** Un tensor de `FLOAT` con esa forma.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/normal_tensor.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/normal_tensor.expec"
```

Aquí imaginamos estaturas en centímetros, con promedio 170 y desviación 10.

??? info "Para curiosos 🤓"
    Los números siguen la **distribución normal** (la "campana de Gauss"). Más o menos 68 de cada 100 números quedan entre $\text{mean} - \text{stddev}$ y $\text{mean} + \text{stddev}$.

## Medir la forma { #measuring }

### `numk.shape(data)` { #shape }

**Qué hace:** Te dice la forma de un vector, una matriz o un tensor: cuánto mide cada eje.

**Cuándo usarla:** Para revisar que tus datos tienen el tamaño que esperas antes de hacer cuentas.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `data` | `List[...]` | Un vector, una matriz o un tensor. |

**Devuelve:** La forma, escrita entre paréntesis, como `(2, 3)`.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/shape.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/shape.expec"
```

!!! note "Ojo"
    La forma sale entre paréntesis porque no es una lista de KAFE. Por ahora úsala con `show`: guardarla en una variable `List[INT]` todavía no funciona. Si necesitas un número, `len(data)` te da cuánto mide el primer eje.

## ¿Qué aprendiste?

- `numk.tensor` revisa que tus datos formen una tabla pareja.
- `zeros`, `zeros_matrix`, `zeros_nd` y `ones` crean tensores "en blanco".
- Con una **semilla**, los números al azar se repiten igual cada vez.
- `numk.shape` te dice cuánto mide cada eje.

[Siguiente: operaciones casilla por casilla :material-arrow-right:](element-wise.md){ .md-button .md-button--primary }
