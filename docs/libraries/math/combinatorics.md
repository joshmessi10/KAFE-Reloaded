# Contar maneras: combinatoria

¿De cuántas maneras puedes ordenar 3 libros en un estante? ¿Cuántos pares distintos de sabores de helado puedes elegir entre 5? La **combinatoria** cuenta posibilidades sin tener que escribirlas todas. La pregunta clave es: **¿importa el orden?** En un podio sí (oro y plata no es lo mismo que plata y oro); en una bolsa de dulces, no.

!!! tip "Antes de empezar"
    Recuerda: todas estas funciones necesitan `import math;` al principio del programa ([cómo funciona](../math.md)).

### `math.factorial(n)` { #factorial }

**Qué hace:** Calcula $n! = n \times (n-1) \times \dots \times 1$: de cuántas maneras se pueden ordenar `n` cosas.

**Cuándo usarla:** 3 libros se ordenan de `factorial(3)` = 6 maneras.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `n` | `INT` | Un entero mayor o igual que 0. |

**Devuelve:** `INT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/factorial.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/factorial.expec"
```

!!! note "Ojo"
    Por definición, `factorial(0)` es 1: hay una sola manera de ordenar nada.

??? warning "Error común"
    ```kafe
    --8<-- "tests/DocsExamples/math/factorial-float.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/math/factorial-float.error.stderr.expec"
    ```

### `math.comb(n, k)` { #comb }

**Qué hace:** **Combinaciones**: de cuántas maneras eliges `k` cosas entre `n` **sin importar el orden**.

**Cuándo usarla:** Pares de sabores de helado entre 5: `comb(5, 2)` = 10.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `n` | `INT` | Total de cosas. |
| `k` | `INT` | Cuántas eliges. |

**Devuelve:** `INT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/comb.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/comb.expec"
```

??? info "Para curiosos 🤓"
    $\binom{n}{k} = \dfrac{n!}{k!\,(n-k)!}$

### `math.perm(n, k)` { #perm }

**Qué hace:** **Permutaciones**: de cuántas maneras eliges y **ordenas** `k` cosas entre `n`.

**Cuándo usarla:** Oro y plata entre 5 corredores: `perm(5, 2)` = 20.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `n` | `INT` | Total de cosas. |
| `k` | `INT` | Cuántas eliges en orden. |

**Devuelve:** `INT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/perm.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/perm.expec"
```

??? info "Para curiosos 🤓"
    $P(n, k) = \dfrac{n!}{(n-k)!}$

[Siguiente: Listas de números :material-arrow-right:](lists.md){ .md-button .md-button--primary }
