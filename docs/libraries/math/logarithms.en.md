# Logarithms

The **logarithm** answers the opposite question of a power: *which number do I raise the base to in order to get this value?* Since $2^3 = 8$, the base-2 logarithm of 8 is 3. It's like counting how many times you folded a sheet of paper.

!!! tip "Before you start"
    Remember: all these functions need `import math;` at the top of the program ([how it works](../math.md)).

### `math.log(x, base)` { #log }

**What it does:** Computes the logarithm of `x`. Without `base` it uses $e$ (**natural logarithm**).

**When to use it:** To measure things that grow very fast (sound, earthquakes) and in Machine Learning loss functions.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | A number greater than 0. |
| `base` | `INT | FLOAT` | Optional. The logarithm's base. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/log.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/log.expec"
```

??? warning "Common mistake"
    ```kafe
    --8<-- "tests/DocsExamples/math/log-zero.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/math/log-zero.error.stderr.expec"
    ```

### `math.log2(x)` { #log2 }

**What it does:** Base-2 logarithm.

**When to use it:** To know how many bits you need or how many times you can cut something in half.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | A number greater than 0. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/log2.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/log2.expec"
```

### `math.log10(x)` { #log10 }

**What it does:** Base-10 logarithm: it counts zeros.

**When to use it:** To know how many digits a number has or to compare very different sizes.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | A number greater than 0. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/log10.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/log10.expec"
```

[Next: Remainders and divisors :material-arrow-right:](division.md){ .md-button .md-button--primary }
