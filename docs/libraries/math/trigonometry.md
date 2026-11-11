# Trigonometría: ángulos y círculos

Imagina un punto que gira en una rueda de radio 1. El **seno** (`sin`) es la **altura** del punto y el **coseno** (`cos`) es qué tan a la **derecha** está. Mientras la rueda gira, la altura sube y baja formando una ola: por eso el seno sirve para todo lo que se repite, como el sonido, la luz o las estaciones del año.

**Importante:** KAFE mide los ángulos en **radianes**, no en grados. Una vuelta completa son $2\pi$ radianes (360°). Usa `math.radians` para convertir grados a radianes.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/math-circulo.svg"
<figcaption>El punto gira en el círculo; su altura, dibujada a lo largo del tiempo, forma la onda del seno.</figcaption>
</figure>

!!! tip "Antes de empezar"
    Recuerda: todas estas funciones necesitan `import math;` al principio del programa ([cómo funciona](../math.md)).

### `math.sin(x)` { #sin }

**Qué hace:** **Seno** del ángulo `x` (en radianes): la altura del punto en la rueda.

**Cuándo usarla:** Para alturas, ondas y movimientos que se repiten.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Ángulo en radianes. |

**Devuelve:** `FLOAT` entre -1 y 1

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/sin.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/sin.expec"
```

!!! note "Ojo"
    `math.sin(math.pi / 2)` da `1.0000000000000002`: es el mismo efecto de los decimales binarios que viste en [Aprende](../../aprende/aprender-de-datos.md).

### `math.cos(x)` { #cos }

**Qué hace:** **Coseno** de `x`: qué tan a la derecha está el punto.

**Cuándo usarla:** Para posiciones horizontales y ángulos entre direcciones.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Ángulo en radianes. |

**Devuelve:** `FLOAT` entre -1 y 1

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/cos.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/cos.expec"
```

### `math.tan(x)` { #tan }

**Qué hace:** **Tangente** de `x`: la inclinación (pendiente) de una rampa con ese ángulo.

**Cuándo usarla:** Para pendientes: una rampa de 45° sube 1 por cada 1 que avanza.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Ángulo en radianes. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/tan.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/tan.expec"
```

### `math.asin(x)` { #asin }

**Qué hace:** **Arcoseno**: el camino de vuelta del seno. Dada una altura, ¿qué ángulo es?

**Cuándo usarla:** Para encontrar un ángulo a partir de una medida.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Un valor entre -1 y 1. |

**Devuelve:** `FLOAT` (radianes)

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/asin.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/asin.expec"
```

??? warning "Error común"
    ```kafe
    --8<-- "tests/DocsExamples/math/asin-domain.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/math/asin-domain.error.stderr.expec"
    ```

### `math.acos(x)` { #acos }

**Qué hace:** **Arcocoseno**: el ángulo cuyo coseno es `x`.

**Cuándo usarla:** Para saber el ángulo entre dos direcciones.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Un valor entre -1 y 1. |

**Devuelve:** `FLOAT` (radianes)

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/acos.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/acos.expec"
```

### `math.atan(x)` { #atan }

**Qué hace:** **Arcotangente**: el ángulo de una rampa con pendiente `x`.

**Cuándo usarla:** Para pasar de una pendiente a un ángulo.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Una pendiente. |

**Devuelve:** `FLOAT` (radianes)

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/atan.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/atan.expec"
```

!!! note "Ojo"
    Con `x` igual a 1 o -1 la versión actual pierde precisión (`math.atan(1)` da `0.78489…` en lugar de `0.78539…`). Es un problema conocido de la librería.

### `math.degrees(x)` { #degrees }

**Qué hace:** Convierte **radianes a grados**.

**Cuándo usarla:** Para mostrar un ángulo de forma que la gente entienda.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Ángulo en radianes. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/degrees.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/degrees.expec"
```

### `math.radians(x)` { #radians }

**Qué hace:** Convierte **grados a radianes**.

**Cuándo usarla:** Siempre antes de usar `sin`, `cos` o `tan` con un ángulo en grados.

| Parámetro | Tipo | Qué significa |
|---|---|---|
| `x` | `INT | FLOAT` | Ángulo en grados. |

**Devuelve:** `FLOAT`

**Ejemplo:**

```kafe
--8<-- "tests/DocsExamples/math/radians.kf"
```

**Resultado:**

```text
--8<-- "tests/DocsExamples/math/radians.expec"
```

??? info "Para curiosos 🤓"
    $\text{radianes} = \text{grados} \times \dfrac{\pi}{180}$

[Siguiente: Hiperbólicas :material-arrow-right:](hyperbolic.md){ .md-button .md-button--primary }
