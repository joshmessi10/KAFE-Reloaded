# Calculations with lists of numbers

These functions work with **lists** of numbers (you saw them in [Variables and types](../../aprende/variables.md)). They add up grades, multiply factors or measure distances between points. To measure distances they use the **Pythagorean theorem**: if you walk 4 steps right and 3 steps up, the straight line back measures 5.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/math-triangulo.svg"
<figcaption>From (0, 0) to (4, 3): 4 to the right, 3 up and a straight line of 5. That is what `hypot` and `dist` compute.</figcaption>
</figure>

!!! tip "Before you start"
    Remember: all these functions need `import math;` at the top of the program ([how it works](../math.md)).

### `math.sum(list) · math.sum(start, end)` { #sum }

**What it does:** With a list, it **adds** all its elements. With two integers, it adds every integer from `start` to `end`.

**When to use it:** For totals: game points, weekly spending.

| Parameter | Type | Meaning |
|---|---|---|
| `list` | `List[INT] | List[FLOAT]` | The numbers to add. |
| `start, end` | `INT` | Or two integers: the range to add. |

**Returns:** `INT` or `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/sum.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/sum.expec"
```

!!! note "Watch out"
    With a single integer (`math.sum(5)`) the current version fails: pass a list or two integers.

*It also exists under the name `math.sum_range`.*

### `math.prod(list) · math.prod(start, end)` { #prod }

**What it does:** Like `sum`, but it **multiplies**.

**When to use it:** To combine factors: `prod(1, 5)` is the same as `factorial(5)`.

| Parameter | Type | Meaning |
|---|---|---|
| `list` | `List[INT] | List[FLOAT]` | The numbers to multiply. |
| `start, end` | `INT` | Or two integers: the range. |

**Returns:** `INT` or `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/prod.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/prod.expec"
```

*It also exists under the name `math.prod_range`.*

### `math.fsum(list)` { #fsum }

**What it does:** Adds a list of decimals **with maximum precision**, without piling up errors.

**When to use it:** When you add many decimals: ten times 0.1 with `+` is not exactly 1, but with `fsum` it is.

| Parameter | Type | Meaning |
|---|---|---|
| `list` | `List[INT] | List[FLOAT]` | The numbers to add. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/fsum.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/fsum.expec"
```

### `math.sumprod(p, q)` { #sumprod }

**What it does:** Multiplies the elements of two lists in pairs and adds the results: $p_1 q_1 + p_2 q_2 + \dots$

**When to use it:** It is exactly what a **neuron** does with its inputs and weights.

| Parameter | Type | Meaning |
|---|---|---|
| `p` | `List[INT] | List[FLOAT]` | First list (for example, inputs). |
| `q` | `List[INT] | List[FLOAT]` | Second list, same size (for example, weights). |

**Returns:** `INT` or `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/sumprod.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/sumprod.expec"
```

### `math.dist(p, q)` { #dist }

**What it does:** Measures the **straight-line distance** between two points.

**When to use it:** To know how far apart two places are, or how similar two data points are (that's how KNN works).

| Parameter | Type | Meaning |
|---|---|---|
| `p` | `List[INT] | List[FLOAT]` | Coordinates of the first point. |
| `q` | `List[INT] | List[FLOAT]` | Coordinates of the second point. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/dist.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/dist.expec"
```

??? info "For the curious 🤓"
    $d(p, q) = \sqrt{\sum_i (p_i - q_i)^2}$

### `math.hypot(x, y, ...)` { #hypot }

**What it does:** Computes the **hypotenuse**: the distance from the origin to the point `(x, y, ...)`.

**When to use it:** For the long side of a right triangle.

| Parameter | Type | Meaning |
|---|---|---|
| `x, y, ...` | `INT | FLOAT` | The coordinates. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/hypot.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/hypot.expec"
```

??? info "For the curious 🤓"
    $\text{hypot}(x, y) = \sqrt{x^2 + y^2}$

[Next: Checking numbers :material-arrow-right:](checks.md){ .md-button .md-button--primary }
