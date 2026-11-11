# Funciones hiperbólicas

Son "primas" de seno y coseno, pero construidas con la exponencial $e^x$ en lugar de un círculo. La más famosa es **`tanh`**: aplasta cualquier número al rango entre -1 y 1, y por eso se usa como **función de activación** en redes neuronales (lo viste en [¿Qué es una neurona?](../../aprende/neuronas.md)).

!!! tip "Antes de empezar"
    Recuerda: todas estas funciones necesitan `import math;` al principio del programa ([cómo funciona](../math.md)).

### `math.sinh(x)` { #sinh }

**Qué hace:** Seno hiperbólico: $\frac{e^x - e^{-x}}{2}$.

**Cuándo usarla:** En física e ingeniería.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Cualquier número. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/sinh.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/sinh.expec"
```

### `math.cosh(x)` { #cosh }

**Qué hace:** Coseno hiperbólico: $\frac{e^x + e^{-x}}{2}$. Describe la forma de una cuerda colgando.

**Cuándo usarla:** Para curvas como cables y cadenas colgantes.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Cualquier número. |

**Devuelve:** `FLOAT` (≥ 1)

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/cosh.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/cosh.expec"
```

### `math.tanh(x)` { #tanh }

**Qué hace:** Tangente hiperbólica: aplasta cualquier número entre -1 y 1.

**Cuándo usarla:** Como activación en redes neuronales: números muy grandes se vuelven casi 1 y muy pequeños casi -1.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Cualquier número. |

**Devuelve:** `FLOAT` entre -1 y 1

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/tanh.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/tanh.expec"
```

[Siguiente: Combinatoria :material-arrow-right:](combinatorics.md){ .md-button .md-button--primary }
