# Constantes: números famosos

Algunos números aparecen tanto en matemáticas que tienen nombre propio. En KAFE se escriben **sin paréntesis**, porque no son funciones: son valores guardados, como una variable que ya viene lista.

!!! tip "Antes de empezar"
    Recuerda: todas estas funciones necesitan `import math;` al principio del programa ([cómo funciona](../math.md)).

### `math.pi · math.e · math.tau · math.inf · math.nan` { #constants }

**Qué hace:** Te dan cinco valores especiales: **π** (pi ≈ 3.14159, cuántas veces cabe el diámetro de un círculo en su borde), **e** (≈ 2.71828, la base del crecimiento natural), **τ** (tau = 2π, una vuelta completa), **inf** (infinito) y **nan** (*not a number*, "no es un número": el resultado de una cuenta imposible).

**Cuándo usarla:** Para calcular áreas y vueltas de círculos (`math.pi`), crecimientos (`math.e`) o como valor inicial "más grande que cualquiera" (`math.inf`).

No recibe parámetros.

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/constants.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/constants.expec"
```

[Siguiente: Redondeo :material-arrow-right:](rounding.md){ .md-button .md-button--primary }
