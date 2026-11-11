# Counting and summarizing

A big table tells a story, but you have to **summarize** it to understand it. That is what a teacher does at the end of the year: they do not read the scores one by one, they work out the class average or count how many students come from each city.

All the examples use this file:

```text
--8<-- "tests/DocsExamples/pardos/data/students.csv"
```

!!! note "`nan` does not count"
    `mean`, `sum` and `agg` ignore empty cells (`nan`) and cells that are not numbers.

## Counting values { #counting }

### `df.value_counts(column)` { #value_counts }

**What it does:** Counts **how many times** each value of a column appears.

**When to use it:** To know whether your data is balanced, for example how many examples there are of each class.

| Parameter | Type | What it means |
|---|---|---|
| `column` | `STR` | The column you want to count. |

**Returns:** `PARDOS`: a table with the columns `value` and `count`, from most to least frequent. `nan` is not counted.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/value_counts.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/value_counts.expec"
```

## Calculations with one column { #column-math }

### `df.mean(column)` { #mean }

**What it does:** Works out the **average** (the mean) of a column with numbers.

**When to use it:** To know the typical value: the class's average score.

| Parameter | Type | What it means |
|---|---|---|
| `column` | `STR` | A column with numbers. |

**Returns:** `FLOAT`

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/mean.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/mean.expec"
```

!!! note "Only columns with numbers"
    With a text column, like `city`, KAFE answers `Column 'city' has no numeric values`. The same happens with `sum` and `agg`.


### `df.sum(column)` { #sum }

**What it does:** **Adds up** all the numbers in a column.

**When to use it:** For totals: the month's total sales, the study hours of the whole class.

| Parameter | Type | What it means |
|---|---|---|
| `column` | `STR` | A column with numbers. |

**Returns:** `INT` if all are whole numbers, `FLOAT` if there are decimals.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/sum.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/sum.expec"
```

### `df.agg(column, operation)` { #agg }

**What it does:** Applies an **operation** to a column. Its name comes from *aggregate*, "gather many values into one".

**When to use it:** When you want the smallest, the largest or how many numbers there are.

| Parameter | Type | What it means |
|---|---|---|
| `column` | `STR` | A column with numbers. |
| `operation` | `STR` | One of: `"sum"`, `"mean"`, `"min"`, `"max"` or `"count"` (how many numbers there are). |

**Returns:** A number (`INT` or `FLOAT`).

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/agg.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/agg.expec"
```

!!! tip
    `"count"` only counts numeric values. With a text column it gives `0`.


??? warning "Common mistake"
    Only the five operations in the table exist. The median (`median`) is not available yet:

    ```kafe
    --8<-- "tests/DocsExamples/pardos/agg-unknown.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/pardos/agg-unknown.error.stderr.expec"
    ```

### `df.round(digits)` { #round }

**What it does:** **Rounds** every number with decimals (`FLOAT`) in the table.

**When to use it:** To show results that are easier to read.

| Parameter | Type | What it means |
|---|---|---|
| `digits` | `INT` | Optional. How many decimals to keep. If you leave it out, 4. |

**Returns:** `PARDOS`: a new table. Whole numbers and texts do not change.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/round.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/round.expec"
```

!!! note
    It uses the [`math.round`](../math/rounding.md#round) function inside. The [`describe`](inspect.md#describe) table stores text, so `round` does not change it.


## Summarizing by group { #groups }

**Grouping** is like sorting the class's cards into piles, one per city, and then working something out **in each pile**. It takes two steps: `groupby` makes the piles and then `mean`, `sum` or `count` summarize each one.

### `df.groupby(column)` { #groupby }

**What it does:** Splits the rows into **groups** by the value of one column.

**When to use it:** To compare groups: the average score of each city.

| Parameter | Type | What it means |
|---|---|---|
| `column` | `STR` | The column that decides each row's group. |

**Returns:** A groups object (stored in a `PARDOS` variable). It does not display well with `show`: use it with `mean`, `sum` or `count`.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/groupby.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/groupby.expec"
```


!!! tip "What happened here?"
    1. `students.drop("age")` removed the age, so that the only column with numbers is `score`.
    2. `no_age.groupby("city")` made three piles: Cusco, Lima and Quito.
    3. `by_city.mean()` worked out the average score of each pile. The groups come out in alphabetical order.

!!! warning "Only the first numeric column is summarized"
    `mean` and `sum` summarize **only the first** numeric column of the table. If you do not remove `age`, the result is the average age, not the score:

    ```kafe
    --8<-- "tests/DocsExamples/pardos/groupby-first-column.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/pardos/groupby-first-column.expec"
    ```

    So, before grouping, use [`drop`](select.md#drop) to keep only the numeric column you care about.


### `groups.mean()` { #groupby-mean }

**What it does:** Works out the **average** of each group.

**When to use it:** To compare the typical value of each group.

It takes no parameters.

**Returns:** `PARDOS`: a table with the group column and the `mean` column.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/groupby.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/groupby.expec"
```

It is the same example as [`groupby`](#groupby).


### `groups.sum()` { #groupby-sum }

**What it does:** **Adds up** the values of each group.

**When to use it:** For totals per group: the sales of each shop.

It takes no parameters.

**Returns:** `PARDOS`: a table with the group column and the `sum` column.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/groupby-sum.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/groupby-sum.expec"
```

### `groups.count()` { #groupby-count }

**What it does:** Counts **how many rows** each group has.

**When to use it:** To know the size of each group. Here it does not matter which columns the table has.

It takes no parameters.

**Returns:** `PARDOS`: a table with the group column and the `count` column.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/groupby-count.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/groupby-count.expec"
```

## What did you learn?

- `value_counts` counts how many times each value appears.
- `mean`, `sum` and `agg` summarize one column into a single number; `round` rounds the table.
- `groupby` makes groups and `mean`, `sum` or `count` summarize them.

Back to [PARDOS](../pardos.md).

[Next: missing data :material-arrow-right:](missing.md){ .md-button .md-button--primary }
