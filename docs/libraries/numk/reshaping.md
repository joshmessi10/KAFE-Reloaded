# NUMK: cambiar la forma

A veces tienes los números correctos, pero en el acomodo equivocado. Piensa en 6 huevos: puedes guardarlos en un cartón de 2 × 3, de 3 × 2 o en una fila de 6. Siguen siendo los mismos huevos. Aquí aprendes a reacomodar, girar, unir y partir tensores **sin cambiar sus números**.

## Reacomodar y girar { #rearrange }

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/numk-reshape.svg"
<figcaption>`reshape` toma los números en orden y los vuelve a acomodar: una fila de 6 se convierte en una tabla de 2 × 3.</figcaption>
</figure>

### `numk.reshape(data, new_shape)` { #reshape }

**Qué hace:** Acomoda los mismos números en una forma nueva. Los lee en orden (fila por fila) y los vuelve a llenar en ese mismo orden.

**Cuándo usarla:** Para convertir una imagen en fila antes de una capa densa, o una lista larga en tabla.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `data` | `List[...]` de números | El tensor. |
| `new_shape` | `List[INT]` | La forma nueva. Debe tener la misma cantidad total de casillas. |

**Devuelve:** Un tensor nuevo con la forma `new_shape`.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/reshape.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/reshape.expec"
```

??? warning "Error común"
    6 huevos no caben exactos en un cartón de 4 × 2 = 8 huecos:

    ```kafe
    --8<-- "tests/DocsExamples/numk/reshape-size.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/numk/reshape-size.error.stderr.expec"
    ```

### `numk.transpose(m)` { #transpose }

**Qué hace:** **Transpone** una matriz: las filas se vuelven columnas y las columnas se vuelven filas. Es como girar la tabla sobre su diagonal.

**Cuándo usarla:** Cuando las formas no encajan para [`mul`](matrix-multiplication.md#mul) y necesitas "voltear" una tabla.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `m` | `List[List[...]]` | Una matriz. |

**Devuelve:** Una matriz nueva: si `m` tiene forma `(n, p)`, el resultado tiene forma `(p, n)`.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/transpose.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/transpose.expec"
```

!!! note "Ojo"
    Si las filas no miden lo mismo, `transpose` no avisa: corta las filas largas. Revisa tus datos antes con [`numk.tensor`](creating.md#tensor).

### `numk.transpose_axes(data, axes)` { #transpose_axes }

**Qué hace:** Cambia el orden de los ejes de cualquier tensor. Tú dices qué eje viejo va en cada lugar nuevo.

**Cuándo usarla:** Para pasar una imagen de `(canales, alto, ancho)` a `(alto, ancho, canales)`, o al revés.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `data` | `List[...]` | El tensor. |
| `axes` | `List[INT]` | El orden nuevo de los ejes. Debe tener cada eje una sola vez, por ejemplo `[1, 2, 0]`. |

**Devuelve:** Un tensor nuevo con los ejes reordenados.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/transpose_axes.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/transpose_axes.expec"
```

Con `[1, 0]` es lo mismo que `transpose`. Con `[1, 2, 0]`, el eje 0 (el canal) pasa al final.

??? info "Para curiosos 🤓"
    Si $\text{axes} = [a_0, a_1, \dots]$, el eje nuevo $i$ es el eje viejo $a_i$. Para una matriz, $B_{ji} = A_{ij}$.

## Unir y partir { #join-split }

Unir es como pegar dos hojas de cuaderno: una debajo de la otra (eje 0) o una al lado de la otra (eje 1). Partir es lo contrario: cortar con tijeras en los tamaños que digas.

### `numk.concatenate(values, axis)` { #concatenate }

**Qué hace:** Une varios tensores en uno, a lo largo de un eje.

**Cuándo usarla:** Para juntar los datos de dos meses en una sola tabla, o para pegar columnas nuevas.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `values` | `List[...]` de tensores | Los tensores a unir. Todos miden igual, excepto en el eje que unes. |
| `axis` | `INT` | El eje por donde los unes. Si no lo das, es `0`. |

**Devuelve:** Un tensor nuevo con todos juntos.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/concatenate.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/concatenate.expec"
```

Con el eje 0, `b` queda debajo de `a`. Con el eje 1, `b` queda al lado.

### `numk.split_sizes(data, sizes, axis)` { #split_sizes }

**Qué hace:** Parte un tensor en pedazos de los tamaños que pidas, a lo largo de un eje. Es lo contrario de `concatenate`.

**Cuándo usarla:** Para separar tus datos en una parte para entrenar y otra para probar.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `data` | `List[...]` | El tensor a partir. |
| `sizes` | `List[INT]` | El tamaño de cada pedazo. |
| `axis` | `INT` | El eje por donde cortas. Si no lo das, es `0`. |

**Devuelve:** Una lista con los pedazos.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/split_sizes.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/split_sizes.expec"
```

En la segunda línea se corta por columnas (eje 1): un pedazo con la primera columna y otro con las dos siguientes.

!!! note "Ojo"
    Los tamaños deberían sumar el largo del eje. Si suman menos, NUMK no avisa: lo que sobra se pierde.

## ¿Qué aprendiste?

- `reshape` reacomoda los mismos números en otra forma con el mismo total.
- `transpose` gira una tabla; `transpose_axes` reordena los ejes de cualquier tensor.
- `concatenate` une y `split_sizes` parte a lo largo de un eje.

[Siguiente: convolución :material-arrow-right:](convolution.md){ .md-button .md-button--primary }
