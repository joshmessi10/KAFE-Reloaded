# Redondear y valor absoluto

Muchas veces un número tiene decimales que no te sirven: no puedes comprar 2.6 boletos. Estas funciones convierten un número con decimales en uno más cómodo. La diferencia está en **hacia dónde** saltan.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/math-redondeo.svg"
<figcaption>Con 2.6: `floor` baja al entero de abajo (2), `ceil` sube al de arriba (3) y `round` va al más cercano (3).</figcaption>
</figure>

!!! tip "Antes de empezar"
    Recuerda: todas estas funciones necesitan `import math;` al principio del programa ([cómo funciona](../math.md)).

### `math.abs(x)` { #abs }

**Qué hace:** Devuelve el **valor absoluto**: la distancia del número al cero, siempre positiva. Le quita el signo menos.

**Cuándo usarla:** Cuando solo importa *cuánto* y no *hacia dónde*: la diferencia entre dos temperaturas o el tamaño de un error.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Cualquier número. |

**Devuelve:** El mismo tipo que `x`, sin signo.

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/abs.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/abs.expec"
```

*También existe con el nombre `math.math_abs`.*

### `math.round(x, ndigits)` { #round }

**Qué hace:** Redondea al valor **más cercano**. Si das `ndigits`, deja esa cantidad de decimales.

**Cuándo usarla:** Para mostrar resultados bonitos, como dinero con 2 decimales.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | El número a redondear. |
| `ndigits` | `INT` | Opcional. Cuántos decimales dejar. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/round.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/round.expec"
```

*También existe con el nombre `math.math_round`.*

### `math.floor(x)` { #floor }

**Qué hace:** Baja al entero **de abajo** (el "piso").

**Cuándo usarla:** Para contar cosas completas: con 2.9 litros llenas 2 botellas enteras de 1 litro.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | El número. |

**Devuelve:** `INT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/floor.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/floor.expec"
```

!!! note "Ojo"
    Con negativos también baja: `floor(-2.1)` es `-3`.

### `math.ceil(x)` { #ceil }

**Qué hace:** Sube al entero **de arriba** (el "techo").

**Cuándo usarla:** Cuando necesitas que alcance: para 25 personas en carros de 4 necesitas `ceil(25 / 4)` = 7 carros.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | El número. |

**Devuelve:** `INT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/ceil.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/ceil.expec"
```

### `math.trunc(x)` { #trunc }

**Qué hace:** **Corta** los decimales sin redondear, siempre hacia el cero.

**Cuándo usarla:** Cuando quieres solo la parte entera, sin importar el signo.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | El número. |

**Devuelve:** `INT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/trunc.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/trunc.expec"
```

### `math.copysign(x, y)` { #copysign }

**Qué hace:** Devuelve el tamaño de `x` con el **signo** de `y`.

**Cuándo usarla:** Para dar a un valor la misma dirección que otro (por ejemplo, la de una velocidad).

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | De dónde sale el tamaño. |
| `y` | `INT | FLOAT` | De dónde sale el signo. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/copysign.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/copysign.expec"
```

[Siguiente: Potencias y raíces :material-arrow-right:](powers.md){ .md-button .md-button--primary }
