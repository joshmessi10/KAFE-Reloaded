# Special functions

These functions appear in statistics and probability. You won't need them when you start, but it's good to know they exist.

!!! tip "Before you start"
    Remember: all these functions need `import math;` at the top of the program ([how it works](../math.md)).

### `math.erf(x)` { #erf }

**What it does:** **Error function**: related to probability in the famous "bell curve".

**When to use it:** In statistics, to compute probabilities of normally distributed data.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | Any number. |

**Returns:** `FLOAT` between -1 and 1

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/erf.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/erf.expec"
```

### `math.erfc(x)` { #erfc }

**What it does:** Complementary error function: $1 - \text{erf}(x)$.

**When to use it:** For the probability in the "tails" of the bell curve.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | Any number. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/erfc.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/erfc.expec"
```

### `math.gamma(x)` { #gamma }

**What it does:** **Gamma function**. In KAFE, for positive integers: $\Gamma(n) = (n-1)!$

**When to use it:** In probability and combinatorics.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | A positive integer. |

**Returns:** `INT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/gamma.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/gamma.expec"
```

!!! note "Watch out"
    The current version only accepts positive integers; with decimals it raises an error.

??? warning "Common mistake"
    ```kafe
    --8<-- "tests/DocsExamples/math/gamma-fraction.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/math/gamma-fraction.error.stderr.expec"
    ```

### `math.lgamma(x)` { #lgamma }

**What it does:** Natural logarithm of `gamma(x)`.

**When to use it:** When `gamma` would give a gigantic number.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | A positive integer. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/lgamma.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/lgamma.expec"
```

[Next library: FILES :material-arrow-right:](../files.md){ .md-button .md-button--primary }
