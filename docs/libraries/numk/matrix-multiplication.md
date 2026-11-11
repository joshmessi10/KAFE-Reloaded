# NUMK: multiplicar matrices

Esta es la cuenta más importante de las redes neuronales. Dentro de cada capa, la computadora multiplica una tabla de datos por una tabla de pesos. Vamos paso a paso: primero con dos listas y después con tablas.

## El producto punto: cantidades por precios { #dot-product }

Vas a la tienda con una lista: 2 manzanas, 1 piña y 3 limones. Los precios son 5, 10 y 4. ¿Cuánto pagas? Multiplicas cada cantidad por su precio y **sumas todo**: 2·5 + 1·10 + 3·4 = 32. Eso es el **producto punto**.

### `numk.dot(a, b)` { #dot }

**Qué hace:** Multiplica dos vectores casilla por casilla y suma los resultados. Devuelve **un solo número**.

**Cuándo usarla:** Para un total de compra, un promedio con pesos, o la cuenta de una neurona: entradas por pesos.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `a` | `List[INT | FLOAT]` | El primer vector. |
| `b` | `List[INT | FLOAT]` | El segundo vector, del mismo largo. |

**Devuelve:** Un número (`INT` o `FLOAT`).

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/dot.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/dot.expec"
```

??? warning "Error común"
    Los dos vectores tienen que medir lo mismo. El mensaje dice "Matrices", aunque sean vectores:

    ```kafe
    --8<-- "tests/DocsExamples/numk/dot-length.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/numk/dot-length.error.stderr.expec"
    ```

??? info "Para curiosos 🤓"
    $a \cdot b = \sum_{i} a_i \, b_i$. En [la neurona](../../aprende/neuronas.md), la suma de entradas por pesos es justo un producto punto.

## Fila por columna { #matrix-product }

Para multiplicar dos tablas, haces **muchos productos punto**. Cada casilla del resultado sale de una **fila** de la primera tabla y una **columna** de la segunda:

1. Elige una fila de la primera tabla, por ejemplo la fila 0: `[1, 2]`.
2. Elige una columna de la segunda, por ejemplo la columna 0: `[5, 7]`.
3. Haz su producto punto: 1·5 + 2·7 = 19.
4. Escribe 19 en la casilla fila 0, columna 0 del resultado.
5. Repite con cada fila y cada columna.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/numk-dot.svg"
<figcaption>Cada casilla del resultado es una fila por una columna: se multiplica número con número y se suma.</figcaption>
</figure>

Por eso hay una regla: el **largo de cada fila** de la primera tabla (sus columnas) tiene que ser igual al **largo de cada columna** de la segunda (sus filas). Una tabla de forma `(2, 3)` se puede multiplicar por una de `(3, 4)`, y el resultado tiene forma `(2, 4)`.

### `numk.mul(a, b)` { #mul }

**Qué hace:** Multiplica dos matrices **fila por columna**.

**Cuándo usarla:** Para pasar datos por una capa de una red neuronal, o para combinar tablas de cantidades y precios de varias tiendas.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `a` | `List[List[INT | FLOAT]]` | La primera matriz, de forma `(n, m)`. |
| `b` | `List[List[INT | FLOAT]]` | La segunda matriz, de forma `(m, p)`. |

**Devuelve:** Una matriz nueva de forma `(n, p)`.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/mul.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/mul.expec"
```

La segunda cuenta multiplica una fila `(1, 3)` por una columna `(3, 1)`: el resultado es una tablita de una sola casilla, `1 + 2 + 3 = 6`.

!!! note "Ojo"
    `mul` no es lo mismo que [`emul`](element-wise.md#emul). `emul` multiplica cada casilla por su pareja; `mul` multiplica filas por columnas. Además, el orden importa: `mul(a, b)` casi nunca da lo mismo que `mul(b, a)`.

??? warning "Error común"
    Una tabla de 3 columnas no se puede multiplicar por una de 2 filas:

    ```kafe
    --8<-- "tests/DocsExamples/numk/mul-shape.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/numk/mul-shape.error.stderr.expec"
    ```

??? info "Para curiosos 🤓"
    $C_{ij} = \sum_{k} A_{ik} \, B_{kj}$. Para tablas de $n \times m$ y $m \times p$ se hacen $n \cdot m \cdot p$ multiplicaciones. En [Cómo funciona por dentro](../numk.md#inside) puedes ver el bucle que lo calcula.

### `numk.dot_matrix(a, b)` { #dot_matrix }

**Qué hace:** Lo mismo que [`mul`](#mul): multiplica dos matrices fila por columna.

**Cuándo usarla:** Cuando prefieras ese nombre. Solo cambia el mensaje de error: si las formas no encajan, dice `dot_matrix: Matrices don't have the same dimension`.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `a` | `List[List[INT | FLOAT]]` | La primera matriz, de forma `(n, m)`. |
| `b` | `List[List[INT | FLOAT]]` | La segunda matriz, de forma `(m, p)`. |

**Devuelve:** Una matriz nueva de forma `(n, p)`.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/dot_matrix.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/dot_matrix.expec"
```

## La matriz inversa: deshacer { #inverse }

Si multiplicar por 2 se deshace dividiendo entre 2, ¿cómo se deshace multiplicar por una tabla? Con su **inversa**. Multiplicar una matriz por su inversa da la **matriz identidad**: unos en la diagonal y ceros en el resto. La identidad es como el número 1: multiplicar por ella no cambia nada.

### `numk.inv(m)` { #inv }

**Qué hace:** Calcula la matriz inversa de `m`.

**Cuándo usarla:** Para resolver sistemas de ecuaciones, o para deshacer una transformación.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `m` | `List[List[INT | FLOAT]]` | Una matriz **cuadrada** (igual número de filas y columnas). |

**Devuelve:** `List[List[FLOAT]]`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/inv.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/inv.expec"
```

La segunda línea comprueba la inversa: `m` por su inversa da la identidad.

!!! note "Ojo"
    `inv` no reacomoda filas mientras calcula. Si la matriz tiene un `0` en la diagonal, como `[[0, 1], [1, 0]]`, puede decir `Matrix is singular` aunque la inversa sí exista.

??? warning "Error común"
    Algunas matrices no tienen inversa (se llaman **singulares**). En `[[1, 2], [2, 4]]` la segunda fila es el doble de la primera, así que no hay forma de deshacerla:

    ```kafe
    --8<-- "tests/DocsExamples/numk/inv-singular.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/numk/inv-singular.error.stderr.expec"
    ```

??? info "Para curiosos 🤓"
    $A \, A^{-1} = I$. NUMK usa el método de **Gauss-Jordan**: pega la identidad a la derecha de $A$ y hace operaciones de fila hasta que la parte izquierda se convierte en $I$. Lo que queda a la derecha es $A^{-1}$.

## ¿Qué aprendiste?

- El **producto punto** multiplica pareja por pareja y suma todo.
- `mul` multiplica **fila por columna**: cada casilla es un producto punto.
- Las columnas de la primera tabla deben ser tantas como las filas de la segunda.
- La **inversa** deshace una multiplicación, pero no todas las matrices la tienen.

[Siguiente: broadcasting :material-arrow-right:](broadcasting.md){ .md-button .md-button--primary }
