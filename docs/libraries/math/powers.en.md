# Powers and roots

A **power** is repeated multiplication: $2^3 = 2 \times 2 \times 2 = 8$. A **root** goes back the other way: which number times itself gives 25? 5. And the **exponential** $e^x$ describes things that grow faster and faster, like a rolling snowball.

!!! tip "Before you start"
    Remember: all these functions need `import math;` at the top of the program ([how it works](../math.md)).

### `math.pow(x, y)` { #pow }

**What it does:** Computes $x^y$: `x` to the power `y`.

**When to use it:** When the exponent has decimals or is negative, like `pow(9, 0.5)` (square root of 9) or `pow(2, -1)` (1/2).

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | The base. |
| `y` | `INT | FLOAT` | The exponent. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/pow.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/pow.expec"
```

!!! note "Watch out"
    `math.pow` uses an approximation, so `math.pow(2, 3)` gives `7.999999999999994` instead of `8`. For exact whole powers use the `^` operator: `2 ^ 3` gives `8`.

*It also exists under the name `math.pow_`.*

### `math.sqrt(x)` { #sqrt }

**What it does:** Computes the **square root**: the number that times itself gives `x`.

**When to use it:** To find the side of a square from its area, or distances.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | A number greater than or equal to 0. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/sqrt.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/sqrt.expec"
```

??? warning "Common mistake"
    ```kafe
    --8<-- "tests/DocsExamples/math/sqrt-negative.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/math/sqrt-negative.error.stderr.expec"
    ```

??? info "For the curious 🤓"
    $\sqrt{x} = y$ because $y \cdot y = x$. Negative numbers have no real square root: no number times itself is negative.

### `math.cbrt(x)` { #cbrt }

**What it does:** Computes the **cube root**: the number that multiplied by itself three times gives `x`. It accepts negatives.

**When to use it:** To find the side of a cube from its volume.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | Any number. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/cbrt.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/cbrt.expec"
```

### `math.exp(x)` { #exp }

**What it does:** Computes $e^x$, the **exponential**.

**When to use it:** In population growth, compound interest and neural networks (the sigmoid function uses `exp`).

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | The exponent. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/exp.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/exp.expec"
```

### `math.exp2(x)` { #exp2 }

**What it does:** Computes $2^x$.

**When to use it:** With computers, which count in base 2: $2^{10} = 1024$ is a kilobyte.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | The exponent. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/exp2.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/exp2.expec"
```

### `math.expm1(x)` { #expm1 }

**What it does:** Computes $e^x - 1$ very precisely when `x` is very small.

**When to use it:** In scientific calculations where `x` is tiny and subtracting 1 would lose precision.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | The exponent. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/expm1.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/expm1.expec"
```

[Next: Logarithms :material-arrow-right:](logarithms.md){ .md-button .md-button--primary }
