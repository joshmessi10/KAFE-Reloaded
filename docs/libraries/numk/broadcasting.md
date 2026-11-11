# NUMK: broadcasting

Imagina que quieres subir 10 pesos al precio de la primera columna de una tabla y 20 al de la segunda, en **todas** las filas. Podrías escribir una fila `[10, 20]` por cada fila de la tabla… o dejar que NUMK la **estire** por ti. Eso es el **broadcasting**: lo pequeño se copia hasta tener el mismo tamaño que lo grande.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/numk-broadcast.svg"
<figcaption>La fila `[10, 20]` se copia hacia abajo hasta cubrir la tabla, y después se suma casilla por casilla.</figcaption>
</figure>

## Cuándo se puede estirar { #rules }

NUMK compara las formas **empezando por el final** (por la derecha). Dos medidas encajan si:

- son iguales, o
- una de las dos es `1` (esa se copia), o
- a una de las formas le faltan ejes (se le agregan por la izquierda).

Por ejemplo, `(2, 2)` y `(2,)` encajan: la fila se copia en cada fila. `(2, 2)` y `(2, 1)` también: la columna se copia en cada columna. Un número solo (como `5`) encaja con todo. Pero `(1, 3)` y `(2,)` **no** encajan, porque 3 y 2 son distintos y ninguno es 1.

!!! tip "Funciona con vectores"
    A diferencia de `add` y `sub`, estas funciones aceptan vectores, matrices, tensores y hasta números solos.

### `numk.broadcast_add(a, b)` { #broadcast_add }

**Qué hace:** Suma casilla por casilla, estirando el que sea más pequeño.

**Cuándo usarla:** Para sumar el mismo **sesgo** (*bias*) a cada fila de resultados de una capa de red neuronal, o un mismo aumento a toda una tabla.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `a` | número o `List[...]` de números | El primer tensor. |
| `b` | número o `List[...]` de números | El segundo tensor, de forma compatible. |

**Devuelve:** Un tensor con la forma más grande de las dos.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/broadcast_add.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/broadcast_add.expec"
```

La primera suma estira una fila, la segunda estira una columna (`[[100], [200]]`) y la tercera estira un número solo.

??? warning "Error común"
    Si las formas no encajan, NUMK no sabe cómo estirar:

    ```kafe
    --8<-- "tests/DocsExamples/numk/broadcast-shape.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/numk/broadcast-shape.error.stderr.expec"
    ```

### `numk.broadcast_sub(a, b)` { #broadcast_sub }

**Qué hace:** Resta casilla por casilla, estirando el más pequeño.

**Cuándo usarla:** Para restar a cada columna su promedio, un paso común al preparar datos.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `a` | número o `List[...]` de números | El tensor del que restas. |
| `b` | número o `List[...]` de números | Lo que restas, de forma compatible. |

**Devuelve:** Un tensor con la forma más grande de las dos.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/broadcast_sub.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/broadcast_sub.expec"
```

### `numk.broadcast_mul(a, b)` { #broadcast_mul }

**Qué hace:** Multiplica casilla por casilla, estirando el más pequeño.

**Cuándo usarla:** Para darle un peso distinto a cada columna, por ejemplo convertir distintas monedas con su propio tipo de cambio.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `a` | número o `List[...]` de números | El primer tensor. |
| `b` | número o `List[...]` de números | El segundo tensor, de forma compatible. |

**Devuelve:** Un tensor con la forma más grande de las dos.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/broadcast_mul.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/broadcast_mul.expec"
```

### `numk.broadcast_div(a, b)` { #broadcast_div }

**Qué hace:** Divide casilla por casilla, estirando el más pequeño.

**Cuándo usarla:** Para pasar cantidades a proporciones, dividiendo cada fila entre su propio total.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `a` | número o `List[...]` de números | El tensor que divides. |
| `b` | número o `List[...]` de números | El divisor, de forma compatible. No puede tener ceros. |

**Devuelve:** Un tensor de `FLOAT` con la forma más grande de las dos.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/broadcast_div.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/broadcast_div.expec"
```

La columna `[[2], [3]]` se estira: la primera fila se divide entre 2 y la segunda entre 3.

??? info "Para curiosos 🤓"
    Si `a` tiene forma $(2, 2)$ y `b` tiene forma $(2,)$, NUMK hace $C_{ij} = a_{ij} + b_j$. Si `b` tiene forma $(2, 1)$, hace $C_{ij} = a_{ij} + b_{i0}$. La copia nunca se guarda: NUMK solo "lee" la misma casilla varias veces.

## ¿Qué aprendiste?

- **Broadcasting** estira lo pequeño para que encaje con lo grande.
- Las formas se comparan desde la derecha: encajan si son iguales o si una es 1.
- Las cuatro funciones `broadcast_*` aceptan vectores, matrices, tensores y números solos.

[Siguiente: reducir, sumas y máximos :material-arrow-right:](reductions.md){ .md-button .md-button--primary }
