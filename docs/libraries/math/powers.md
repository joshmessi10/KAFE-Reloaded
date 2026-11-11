# Potencias y raíces

Una **potencia** es una multiplicación repetida: $2^3 = 2 \times 2 \times 2 = 8$. Una **raíz** hace el camino de vuelta: ¿qué número multiplicado por sí mismo da 25? El 5. Y la **exponencial** $e^x$ describe cosas que crecen cada vez más rápido, como una bola de nieve que rueda.

!!! tip "Antes de empezar"
    Recuerda: todas estas funciones necesitan `import math;` al principio del programa ([cómo funciona](../math.md)).

### `math.pow(x, y)` { #pow }

**Qué hace:** Calcula $x^y$: `x` elevado a la `y`.

**Cuándo usarla:** Cuando el exponente tiene decimales o es negativo, como `pow(9, 0.5)` (raíz de 9) o `pow(2, -1)` (1/2).

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | La base. |
| `y` | `INT | FLOAT` | El exponente. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/pow.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/pow.expec"
```

!!! note "Ojo"
    `math.pow` calcula con una aproximación, por eso `math.pow(2, 3)` da `7.999999999999994` en lugar de `8`. Para potencias enteras exactas usa el operador `^`: `2 ^ 3` da `8`.

*También existe con el nombre `math.pow_`.*

### `math.sqrt(x)` { #sqrt }

**Qué hace:** Calcula la **raíz cuadrada**: el número que multiplicado por sí mismo da `x`.

**Cuándo usarla:** Para saber el lado de un cuadrado a partir de su área, o distancias.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Un número mayor o igual que 0. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/sqrt.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/sqrt.expec"
```

??? warning "Error común"
    ```kafe
    --8<-- "tests/DocsExamples/math/sqrt-negative.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/math/sqrt-negative.error.stderr.expec"
    ```

??? info "Para curiosos 🤓"
    $\sqrt{x} = y$ porque $y \cdot y = x$. Los números negativos no tienen raíz cuadrada real: ningún número por sí mismo da negativo.

### `math.cbrt(x)` { #cbrt }

**Qué hace:** Calcula la **raíz cúbica**: el número que multiplicado tres veces por sí mismo da `x`. Sí acepta negativos.

**Cuándo usarla:** Para saber el lado de un cubo a partir de su volumen.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Cualquier número. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/cbrt.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/cbrt.expec"
```

### `math.exp(x)` { #exp }

**Qué hace:** Calcula $e^x$, la **exponencial**.

**Cuándo usarla:** En crecimiento de poblaciones, interés compuesto y en redes neuronales (la función sigmoide usa `exp`).

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | El exponente. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/exp.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/exp.expec"
```

### `math.exp2(x)` { #exp2 }

**Qué hace:** Calcula $2^x$.

**Cuándo usarla:** Con computadoras, que cuentan en base 2: $2^{10} = 1024$ es un kilobyte.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | El exponente. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/exp2.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/exp2.expec"
```

### `math.expm1(x)` { #expm1 }

**Qué hace:** Calcula $e^x - 1$ con mucha precisión cuando `x` es muy pequeño.

**Cuándo usarla:** En cálculos científicos donde `x` es diminuto y restar 1 perdería precisión.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | El exponente. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/expm1.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/expm1.expec"
```

[Siguiente: Logaritmos :material-arrow-right:](logarithms.md){ .md-button .md-button--primary }
