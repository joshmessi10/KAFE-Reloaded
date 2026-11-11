# Remainders, divisors and multiples

When you share 10 candies among 3 friends, each gets 3 and **1 is left over**: that is the **remainder**. The **greatest common divisor** is the biggest group size you can split two amounts into with nothing left over, and the **least common multiple** is the first number two counts reach when they jump by different steps.

!!! tip "Before you start"
    Remember: all these functions need `import math;` at the top of the program ([how it works](../math.md)).

### `math.fmod(x, y)` { #fmod }

**What it does:** Gives the **remainder** of dividing `x` by `y`. The result has the sign of `x`.

**When to use it:** To know whether something splits evenly or how much is left.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | What you share. |
| `y` | `INT | FLOAT` | Among how many. |

**Returns:** The type of the inputs.

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/fmod.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/fmod.expec"
```

### `math.remainder(x, y)` { #remainder }

**What it does:** Like `fmod`, but it uses the **closest** quotient, so the remainder can be negative.

**When to use it:** With angles and periods, when you want the smallest offset.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | The dividend. |
| `y` | `INT | FLOAT` | The divisor. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/remainder.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/remainder.expec"
```

### `math.gcd(a, b, ...)` { #gcd }

**What it does:** **Greatest common divisor** of two or more integers.

**When to use it:** To simplify fractions: 12/18 = 2/3 because the GCD is 6.

| Parameter | Type | Meaning |
|---|---|---|
| `a, b, ...` | `INT` | One or more integers. |

**Returns:** `INT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/gcd.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/gcd.expec"
```

### `math.lcm(a, b, ...)` { #lcm }

**What it does:** **Least common multiple** of two or more integers.

**When to use it:** To know when two repeating things meet: a bus every 4 minutes and another every 6 meet every 12.

| Parameter | Type | Meaning |
|---|---|---|
| `a, b, ...` | `INT` | One or more integers. |

**Returns:** `INT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/lcm.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/lcm.expec"
```

[Next: Trigonometry :material-arrow-right:](trigonometry.md){ .md-button .md-button--primary }
