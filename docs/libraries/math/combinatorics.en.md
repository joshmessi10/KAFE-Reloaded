# Counting ways: combinatorics

How many ways can you arrange 3 books on a shelf? How many different pairs of ice-cream flavors can you choose from 5? **Combinatorics** counts possibilities without writing them all down. The key question is: **does order matter?** On a podium it does (gold and silver is not the same as silver and gold); in a bag of candy, it doesn't.

!!! tip "Before you start"
    Remember: all these functions need `import math;` at the top of the program ([how it works](../math.md)).

### `math.factorial(n)` { #factorial }

**What it does:** Computes $n! = n \times (n-1) \times \dots \times 1$: how many ways `n` things can be ordered.

**When to use it:** 3 books can be ordered in `factorial(3)` = 6 ways.

| Parameter | Type | Meaning |
|---|---|---|
| `n` | `INT` | An integer greater than or equal to 0. |

**Returns:** `INT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/factorial.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/factorial.expec"
```

!!! note "Watch out"
    By definition, `factorial(0)` is 1: there is exactly one way to order nothing.

??? warning "Common mistake"
    ```kafe
    --8<-- "tests/DocsExamples/math/factorial-float.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/math/factorial-float.error.stderr.expec"
    ```

### `math.comb(n, k)` { #comb }

**What it does:** **Combinations**: how many ways you can choose `k` things out of `n` **when order does not matter**.

**When to use it:** Pairs of ice-cream flavors from 5: `comb(5, 2)` = 10.

| Parameter | Type | Meaning |
|---|---|---|
| `n` | `INT` | Total things. |
| `k` | `INT` | How many you choose. |

**Returns:** `INT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/comb.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/comb.expec"
```

??? info "For the curious 🤓"
    $\binom{n}{k} = \dfrac{n!}{k!\,(n-k)!}$

### `math.perm(n, k)` { #perm }

**What it does:** **Permutations**: how many ways you can choose and **order** `k` things out of `n`.

**When to use it:** Gold and silver among 5 runners: `perm(5, 2)` = 20.

| Parameter | Type | Meaning |
|---|---|---|
| `n` | `INT` | Total things. |
| `k` | `INT` | How many you pick in order. |

**Returns:** `INT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/math/perm.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/math/perm.expec"
```

??? info "For the curious 🤓"
    $P(n, k) = \dfrac{n!}{(n-k)!}$

[Next: Lists of numbers :material-arrow-right:](lists.md){ .md-button .md-button--primary }
