# NUMK: reducir, sumas y máximos

**Reducir** es convertir muchos números en menos números. Al final del mes, el ticket de cada día se vuelve un solo total: eso es reducir. Puedes reducir **todo** a un número, o reducir **a lo largo de un eje**: por ejemplo, sumar cada columna por separado.

## Sumar todo { #total }

### `numk.sum_all(data)` { #sum_all }

**Qué hace:** Suma **todas** las casillas de un tensor, sin importar su forma.

**Cuándo usarla:** Para un gran total, como todas las ventas de una tabla.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `data` | `List[...]` de números | El tensor. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/sum_all.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/sum_all.expec"
```

!!! note "Ojo"
    El total siempre es `FLOAT`, aunque todos los números sean enteros.

## Reducir a lo largo de un eje { #axis }

En una tabla, el **eje 0** va hacia abajo (de fila en fila) y el **eje 1** va hacia la derecha (de columna en columna). Cuando reduces a lo largo de un eje, ese eje **desaparece**:

- Con `axis = 0`, juntas las filas: queda un número por cada **columna**.
- Con `axis = 1`, juntas las columnas: queda un número por cada **fila**.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/numk-ejes.svg"
<figcaption>Con el eje 0 se suma hacia abajo y queda `[4, 6]`. Con el eje 1 se suma hacia la derecha y queda `[3, 7]`.</figcaption>
</figure>

También puedes usar ejes negativos: `-1` es el último eje, como en los índices de las listas.

### `numk.sum_axis(data, axis)` { #sum_axis }

**Qué hace:** Suma a lo largo de un eje.

**Cuándo usarla:** Para el total de cada producto (eje 0) o el total de cada día (eje 1) en una tabla de ventas.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `data` | `List[...]` de números | El tensor. |
| `axis` | `INT` | El eje que se suma y desaparece. |

**Devuelve:** Un tensor con un eje menos.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/sum_axis.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/sum_axis.expec"
```

??? warning "Error común"
    Una tabla tiene ejes 0 y 1. El eje 2 no existe:

    ```kafe
    --8<-- "tests/DocsExamples/numk/sum_axis-range.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/numk/sum_axis-range.error.stderr.expec"
    ```

### `numk.max_axis(data, axis)` { #max_axis }

**Qué hace:** Busca el número **más grande** a lo largo de un eje.

**Cuándo usarla:** Para la mejor nota de cada examen (eje 0) o la mejor nota de cada estudiante (eje 1).

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `data` | `List[...]` de números | El tensor. |
| `axis` | `INT` | El eje en el que buscas el máximo. |

**Devuelve:** Un tensor con un eje menos.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/numk/max_axis.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/numk/max_axis.expec"
```

Con el eje 0, cada columna da su mayor: 8 y 9. Con el eje 1, cada fila da su mayor: 9 y 8.

??? info "Para curiosos 🤓"
    Para una matriz $A$: `sum_axis(A, 0)` da $s_j = \sum_i A_{ij}$ y `sum_axis(A, 1)` da $s_i = \sum_j A_{ij}$. Lo mismo vale para `max_axis` cambiando la suma por $\max$.

## ¿Qué aprendiste?

- **Reducir** convierte muchos números en menos números.
- `sum_all` lo suma todo y da un `FLOAT`.
- Con `sum_axis` y `max_axis`, el eje que eliges desaparece.

[Siguiente: cambiar la forma :material-arrow-right:](reshaping.md){ .md-button .md-button--primary }
