# Comprobar números

Los decimales de la computadora no son exactos (recuerda el `4.500000000000002` de [Aprende](../../aprende/aprender-de-datos.md)). Estas funciones responden preguntas de **sí o no** (`True` o `False`) sobre un número: ¿es infinito?, ¿es un número de verdad?, ¿estos dos son casi iguales?

!!! tip "Antes de empezar"
    Recuerda: todas estas funciones necesitan `import math;` al principio del programa ([cómo funciona](../math.md)).

### `math.isclose(a, b, rel_tol, abs_tol)` { #isclose }

**Qué hace:** Dice si `a` y `b` son **casi iguales**.

**Cuándo usarla:** **Siempre** que compares decimales: `0.1 + 0.2 == 0.3` da `False`, pero `isclose` da `True`.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `a, b` | `INT | FLOAT` | Los números a comparar. |
| `rel_tol` | `INT | FLOAT` | Opcional. Diferencia relativa permitida (por defecto, muy pequeña). |
| `abs_tol` | `INT | FLOAT` | Opcional. Diferencia absoluta permitida. |

**Devuelve:** `BOOL`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/isclose.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/isclose.expec"
```

### `math.isinf(x)` { #isinf }

**Qué hace:** Dice si `x` es infinito.

**Cuándo usarla:** Para detectar cuentas que se salieron de control.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | El número. |

**Devuelve:** `BOOL`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/isinf.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/isinf.expec"
```

### `math.isnan(x)` { #isnan }

**Qué hace:** Dice si `x` es `nan` ("no es un número").

**Cuándo usarla:** Para detectar datos faltantes o cuentas imposibles, por ejemplo al entrenar un modelo.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | El número. |

**Devuelve:** `BOOL`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/isnan.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/isnan.expec"
```

### `math.isfinite(x)` { #isfinite }

**Qué hace:** Dice si `x` es un número normal: ni infinito ni `nan`.

**Cuándo usarla:** Para validar datos antes de usarlos.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | El número. |

**Devuelve:** `BOOL`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/isfinite.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/isfinite.expec"
```

### `math.ulp(x)` { #ulp }

**Qué hace:** Da el **paso más pequeño** que la computadora puede dar cerca de `x`.

**Cuándo usarla:** Para entender cuánta precisión hay: cuanto más grande el número, más grandes los pasos.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | El número. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/ulp.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/ulp.expec"
```

[Siguiente: Funciones especiales :material-arrow-right:](special.md){ .md-button .md-button--primary }
