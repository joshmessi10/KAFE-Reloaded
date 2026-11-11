# Trigonometry: angles and circles

Imagine a point turning on a wheel of radius 1. The **sine** (`sin`) is the point's **height** and the **cosine** (`cos`) is how far **right** it is. As the wheel turns, the height goes up and down making a wave: that is why sine is used for everything that repeats, like sound, light or the seasons.

**Important:** KAFE measures angles in **radians**, not degrees. A full turn is $2\pi$ radians (360°). Use `math.radians` to convert degrees to radians.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/math-circulo.svg"
<figcaption>The point turns around the circle; its height, drawn over time, makes the sine wave.</figcaption>
</figure>

!!! tip "Before you start"
    Remember: all these functions need `import math;` at the top of the program ([how it works](../math.md)).

### `math.sin(x)` { #sin }

**What it does:** **Sine** of angle `x` (in radians): the point's height on the wheel.

**When to use it:** For heights, waves and repeating motion.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | Angle in radians. |

**Returns:** `FLOAT` between -1 and 1

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/sin.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/sin.expec"
```

!!! note "Watch out"
    `math.sin(math.pi / 2)` gives `1.0000000000000002`: the same binary-decimal effect you saw in [Learn](../../aprende/aprender-de-datos.md).

### `math.cos(x)` { #cos }

**What it does:** **Cosine** of `x`: how far right the point is.

**When to use it:** For horizontal positions and angles between directions.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | Angle in radians. |

**Returns:** `FLOAT` between -1 and 1

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/cos.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/cos.expec"
```

### `math.tan(x)` { #tan }

**What it does:** **Tangent** of `x`: the steepness (slope) of a ramp with that angle.

**When to use it:** For slopes: a 45° ramp rises 1 for every 1 it moves forward.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | Angle in radians. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/tan.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/tan.expec"
```

### `math.asin(x)` { #asin }

**What it does:** **Arcsine**: the way back from sine. Given a height, which angle is it?

**When to use it:** To find an angle from a measurement.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | A value between -1 and 1. |

**Returns:** `FLOAT` (radians)

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/asin.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/asin.expec"
```

??? warning "Common mistake"
    ```kafe
    --8<-- "tests/DocsExamples/math/asin-domain.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/math/asin-domain.error.stderr.expec"
    ```

### `math.acos(x)` { #acos }

**What it does:** **Arccosine**: the angle whose cosine is `x`.

**When to use it:** To find the angle between two directions.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | A value between -1 and 1. |

**Returns:** `FLOAT` (radians)

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/acos.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/acos.expec"
```

### `math.atan(x)` { #atan }

**What it does:** **Arctangent**: the angle of a ramp with slope `x`.

**When to use it:** To go from a slope to an angle.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | A slope. |

**Returns:** `FLOAT` (radians)

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/atan.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/atan.expec"
```

!!! note "Watch out"
    With `x` equal to 1 or -1 the current version loses precision (`math.atan(1)` gives `0.78489…` instead of `0.78539…`). It is a known library issue.

### `math.degrees(x)` { #degrees }

**What it does:** Converts **radians to degrees**.

**When to use it:** To show an angle in a way people understand.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | Angle in radians. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/degrees.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/degrees.expec"
```

### `math.radians(x)` { #radians }

**What it does:** Converts **degrees to radians**.

**When to use it:** Always before using `sin`, `cos` or `tan` with an angle in degrees.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | Angle in degrees. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/radians.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/radians.expec"
```

??? info "For the curious 🤓"
    $\text{radians} = \text{degrees} \times \dfrac{\pi}{180}$

[Next: Hyperbolic :material-arrow-right:](hyperbolic.md){ .md-button .md-button--primary }
