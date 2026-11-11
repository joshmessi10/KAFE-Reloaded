# Constants: famous numbers

Some numbers appear so often in math that they have their own name. In KAFE you write them **without parentheses**, because they are not functions: they are stored values, like a variable that comes ready to use.

!!! tip "Before you start"
    Remember: all these functions need `import math;` at the top of the program ([how it works](../math.md)).

### `math.pi · math.e · math.tau · math.inf · math.nan` { #constants }

**What it does:** They give you five special values: **π** (pi ≈ 3.14159, how many times a circle's diameter fits around its edge), **e** (≈ 2.71828, the base of natural growth), **τ** (tau = 2π, one full turn), **inf** (infinity) and **nan** (*not a number*: the result of an impossible calculation).

**When to use it:** To compute circle areas and turns (`math.pi`), growth (`math.e`) or as a starting value "bigger than anything" (`math.inf`).

It takes no parameters.

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/constants.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/constants.expec"
```

[Next: Rounding :material-arrow-right:](rounding.md){ .md-button .md-button--primary }
