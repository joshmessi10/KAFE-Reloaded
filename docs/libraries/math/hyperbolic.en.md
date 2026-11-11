# Hyperbolic functions

They are "cousins" of sine and cosine, built with the exponential $e^x$ instead of a circle. The most famous is **`tanh`**: it squeezes any number into the range between -1 and 1, which is why it is used as an **activation function** in neural networks (you saw it in [What is a neuron?](../../aprende/neuronas.md)).

!!! tip "Before you start"
    Remember: all these functions need `import math;` at the top of the program ([how it works](../math.md)).

### `math.sinh(x)` { #sinh }

**What it does:** Hyperbolic sine: $\frac{e^x - e^{-x}}{2}$.

**When to use it:** In physics and engineering.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | Any number. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/sinh.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/sinh.expec"
```

### `math.cosh(x)` { #cosh }

**What it does:** Hyperbolic cosine: $\frac{e^x + e^{-x}}{2}$. It describes the shape of a hanging rope.

**When to use it:** For curves like hanging cables and chains.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | Any number. |

**Returns:** `FLOAT` (≥ 1)

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/cosh.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/cosh.expec"
```

### `math.tanh(x)` { #tanh }

**What it does:** Hyperbolic tangent: squeezes any number between -1 and 1.

**When to use it:** As an activation in neural networks: very large numbers become almost 1 and very small ones almost -1.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | Any number. |

**Returns:** `FLOAT` between -1 and 1

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/tanh.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/tanh.expec"
```

[Next: Combinatorics :material-arrow-right:](combinatorics.md){ .md-button .md-button--primary }
