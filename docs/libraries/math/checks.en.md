# Checking numbers

Computer decimals are not exact (remember the `4.500000000000002` from [Learn](../../aprende/aprender-de-datos.md)). These functions answer **yes or no** questions (`True` or `False`) about a number: is it infinite?, is it a real number?, are these two almost equal?

!!! tip "Before you start"
    Remember: all these functions need `import math;` at the top of the program ([how it works](../math.md)).

### `math.isclose(a, b, rel_tol, abs_tol)` { #isclose }

**What it does:** Tells whether `a` and `b` are **almost equal**.

**When to use it:** **Always** when you compare decimals: `0.1 + 0.2 == 0.3` gives `False`, but `isclose` gives `True`.

| Parameter | Type | Meaning |
|---|---|---|
| `a, b` | `INT | FLOAT` | The numbers to compare. |
| `rel_tol` | `INT | FLOAT` | Optional. Allowed relative difference (very small by default). |
| `abs_tol` | `INT | FLOAT` | Optional. Allowed absolute difference. |

**Returns:** `BOOL`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/isclose.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/isclose.expec"
```

### `math.isinf(x)` { #isinf }

**What it does:** Tells whether `x` is infinite.

**When to use it:** To detect calculations that blew up.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | The number. |

**Returns:** `BOOL`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/isinf.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/isinf.expec"
```

### `math.isnan(x)` { #isnan }

**What it does:** Tells whether `x` is `nan` ("not a number").

**When to use it:** To detect missing data or impossible calculations, for example while training a model.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | The number. |

**Returns:** `BOOL`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/isnan.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/isnan.expec"
```

### `math.isfinite(x)` { #isfinite }

**What it does:** Tells whether `x` is a normal number: neither infinite nor `nan`.

**When to use it:** To validate data before using it.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | The number. |

**Returns:** `BOOL`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/isfinite.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/isfinite.expec"
```

### `math.ulp(x)` { #ulp }

**What it does:** Gives the **smallest step** the computer can take near `x`.

**When to use it:** To understand how much precision there is: the bigger the number, the bigger the steps.

| Parameter | Type | Meaning |
|---|---|---|
| `x` | `INT | FLOAT` | The number. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/ulp.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/ulp.expec"
```

[Next: Special functions :material-arrow-right:](special.md){ .md-button .md-button--primary }
