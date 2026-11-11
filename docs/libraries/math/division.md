# Restos, divisores y múltiplos

Cuando repartes 10 dulces entre 3 amigos, a cada uno le tocan 3 y **sobra 1**: ese es el **resto**. El **máximo común divisor** es el grupo más grande en que puedes repartir dos cantidades sin que sobre nada, y el **mínimo común múltiplo** es el primer número al que llegan dos cuentas que saltan de distinto en distinto.

!!! tip "Antes de empezar"
    Recuerda: todas estas funciones necesitan `import math;` al principio del programa ([cómo funciona](../math.md)).

### `math.fmod(x, y)` { #fmod }

**Qué hace:** Da el **resto** de dividir `x` entre `y`. El resultado lleva el signo de `x`.

**Cuándo usarla:** Para saber si algo se reparte exacto o cuánto sobra.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Lo que repartes. |
| `y` | `INT | FLOAT` | Entre cuántos. |

**Devuelve:** El tipo de los datos.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/fmod.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/fmod.expec"
```

### `math.remainder(x, y)` { #remainder }

**Qué hace:** Como `fmod`, pero usa el cociente **más cercano**, así que el resto puede ser negativo.

**Cuándo usarla:** En cálculos con ángulos y periodos, cuando quieres el desfase más pequeño.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | El dividendo. |
| `y` | `INT | FLOAT` | El divisor. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/remainder.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/remainder.expec"
```

### `math.gcd(a, b, ...)` { #gcd }

**Qué hace:** **Máximo común divisor** de dos o más enteros.

**Cuándo usarla:** Para simplificar fracciones: 12/18 = 2/3 porque el MCD es 6.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `a, b, ...` | `INT` | Uno o más enteros. |

**Devuelve:** `INT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/gcd.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/gcd.expec"
```

### `math.lcm(a, b, ...)` { #lcm }

**Qué hace:** **Mínimo común múltiplo** de dos o más enteros.

**Cuándo usarla:** Para saber cuándo coinciden dos cosas que se repiten: un bus cada 4 minutos y otro cada 6 coinciden cada 12.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `a, b, ...` | `INT` | Uno o más enteros. |

**Devuelve:** `INT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/lcm.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/lcm.expec"
```

[Siguiente: Trigonometría :material-arrow-right:](trigonometry.md){ .md-button .md-button--primary }
