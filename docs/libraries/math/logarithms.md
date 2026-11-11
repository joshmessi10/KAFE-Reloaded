# Logaritmos

El **logaritmo** responde la pregunta al revés de la potencia: *¿a qué número tengo que elevar la base para obtener este valor?* Como $2^3 = 8$, el logaritmo en base 2 de 8 es 3. Es como contar cuántas veces doblaste una hoja de papel.

!!! tip "Antes de empezar"
    Recuerda: todas estas funciones necesitan `import math;` al principio del programa ([cómo funciona](../math.md)).

### `math.log(x, base)` { #log }

**Qué hace:** Calcula el logaritmo de `x`. Sin `base` usa $e$ (**logaritmo natural**).

**Cuándo usarla:** Para medir cosas que crecen muy rápido (sonido, terremotos) y en funciones de pérdida de Machine Learning.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Un número mayor que 0. |
| `base` | `INT | FLOAT` | Opcional. La base del logaritmo. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/log.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/log.expec"
```

??? warning "Error común"
    ```kafe
    --8<-- "tests/DocsExamples/math/log-zero.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/math/log-zero.error.stderr.expec"
    ```

### `math.log2(x)` { #log2 }

**Qué hace:** Logaritmo en base 2.

**Cuándo usarla:** Para saber cuántos bits necesitas o cuántas veces puedes partir algo por la mitad.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Un número mayor que 0. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/log2.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/log2.expec"
```

### `math.log10(x)` { #log10 }

**Qué hace:** Logaritmo en base 10: cuenta los ceros.

**Cuándo usarla:** Para saber cuántas cifras tiene un número o comparar tamaños muy distintos.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Un número mayor que 0. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/log10.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/log10.expec"
```

[Siguiente: Restos y divisores :material-arrow-right:](division.md){ .md-button .md-button--primary }
