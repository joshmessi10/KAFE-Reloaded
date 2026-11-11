# Rounding and absolute value

Often a number has decimals you don't need: you can't buy 2.6 tickets. These functions turn a decimal number into a handier one. The difference is **which way** they jump.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/math-redondeo.svg"
<figcaption>With 2.6: `floor` goes down to the whole number below (2), `ceil` goes up to the one above (3) and `round` goes to the closest one (3).</figcaption>
</figure>

!!! tip "Before you start"
    Remember: all these functions need `import math;` at the top of the program ([how it works](../math.md)).

### `math.abs(x)` { #abs }

**What it does:** Returns the **absolute value**: the distance from the number to zero, always positive. It removes the minus sign.

**When to use it:** When only *how much* matters, not *which way*: the difference between two temperatures or the size of an error.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | Any number. |

**Returns:** The same type as `x`, without sign.

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/abs.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/abs.expec"
```

*It also exists under the name `math.math_abs`.*

### `math.round(x, ndigits)` { #round }

**What it does:** Rounds to the **closest** value. If you give `ndigits`, it keeps that many decimals.

**When to use it:** To show tidy results, like money with 2 decimals.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | The number to round. |
| `ndigits` | `INT` | Optional. How many decimals to keep. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/round.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/round.expec"
```

*It also exists under the name `math.math_round`.*

### `math.floor(x)` { #floor }

**What it does:** Goes down to the whole number **below** (the "floor").

**When to use it:** To count complete things: with 2.9 liters you fill 2 whole 1-liter bottles.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | The number. |

**Returns:** `INT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/floor.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/floor.expec"
```

!!! note "Watch out"
    With negatives it also goes down: `floor(-2.1)` is `-3`.

### `math.ceil(x)` { #ceil }

**What it does:** Goes up to the whole number **above** (the "ceiling").

**When to use it:** When it has to be enough: for 25 people in cars of 4 you need `ceil(25 / 4)` = 7 cars.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | The number. |

**Returns:** `INT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/ceil.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/ceil.expec"
```

### `math.trunc(x)` { #trunc }

**What it does:** **Cuts off** the decimals without rounding, always toward zero.

**When to use it:** When you only want the whole part, regardless of the sign.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | The number. |

**Returns:** `INT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/trunc.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/trunc.expec"
```

### `math.copysign(x, y)` { #copysign }

**What it does:** Returns the size of `x` with the **sign** of `y`.

**When to use it:** To give a value the same direction as another one (for example, a velocity's).

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | Where the size comes from. |
| `y` | `INT | FLOAT` | Where the sign comes from. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/copysign.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/copysign.expec"
```

[Next: Powers and roots :material-arrow-right:](powers.md){ .md-button .md-button--primary }
