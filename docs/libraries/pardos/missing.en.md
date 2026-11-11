# Missing data

In real life, data has **gaps**: a thermometer that was off one day, a question someone did not answer. In a PARDOS table, a gap looks like `nan` (*not a number*). Before training a model you must decide what to do with them: **fill them in** or **remove** those rows.

All the examples use this five-day weather log (`day`, `temp` = temperature, `rain`). Notice the empty cells:

```text
--8<-- "tests/DocsExamples/pardos/data/weather.csv"
```

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/pardos-rellenar.svg"
<figcaption>The `temp` column has two gaps. `ffill` copies the value above and `bfill` copies the value below.</figcaption>
</figure>

### `df.fillna(value)` { #fillna }

**What it does:** Fills **every** gap with the same value. Its name comes from *fill NaN*.

**When to use it:** When there is a value that makes sense as a default, like `0` mm of rain.

| Parameter | Type | What it means |
|---|---|---|
| `value` | `INT | FLOAT | STR` | The value placed in each gap. |

**Returns:** `PARDOS`: a new table with no gaps.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/fillna.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/fillna.expec"
```

### `df.dropna()` { #dropna }

**What it does:** **Removes** every row that has at least one gap.

**When to use it:** When you have plenty of data and losing a few rows does not matter.

It takes no parameters.

**Returns:** `PARDOS`: a new table with only complete rows.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/dropna.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/dropna.expec"
```

!!! warning
    Here 3 of the 5 rows were lost. Check with [`shape`](inspect.md#shape) how many rows you have left.


### `df.ffill()` { #ffill }

**What it does:** Fills each gap with the **last value before it** in its column (the one above). Its name comes from *forward fill*.

**When to use it:** With data ordered in time: if it was 20 °C yesterday and today was not measured, "same as yesterday" is a good guess.

It takes no parameters.

**Returns:** `PARDOS`: a new table. A gap in the first row stays `nan`, because there is nothing above it.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/ffill.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/ffill.expec"
```

### `df.bfill()` { #bfill }

**What it does:** Fills each gap with the **next value** in its column (the one below). Its name comes from *backward fill*.

**When to use it:** Like `ffill`, when the next value is a better clue than the previous one.

It takes no parameters.

**Returns:** `PARDOS`: a new table. A gap in the last row stays `nan`.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/bfill.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/bfill.expec"
```

## What did you learn?

- A gap looks like `nan`.
- `fillna` puts a fixed value; `ffill` and `bfill` copy the neighbour above or below.
- `dropna` removes incomplete rows.

Back to [PARDOS](../pardos.md).

[Next: combining tables :material-arrow-right:](combine.md){ .md-button .md-button--primary }
