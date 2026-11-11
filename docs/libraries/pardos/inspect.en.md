# Looking at the data

Before you use a table, it is a good idea to **look at it**. It is like flipping through a book before reading it: you see how many pages it has, what it is about and how it starts. These methods are written with a dot after the table's name, for example `students.head(2)`. A **method** is a function that belongs to an object: here, to your table.

All the examples use this file:

```text
--8<-- "tests/DocsExamples/pardos/data/students.csv"
```

!!! note "One method at a time"
    KAFE does not yet let you chain methods, like `students.describe().round(2)`. Save the result in a variable first and then call the next method.

## The beginning and the end { #peek }

### `df.head(n)` { #head }

**What it does:** Returns the **first** `n` rows.

**When to use it:** To take a quick look at a big table.

| Parameter | Type | What it means |
|---|---|---|
| `n` | `INT` | Optional. How many rows. If you leave it out, 5. |

**Returns:** `PARDOS`: a new table with those rows.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/head.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/head.expec"
```

### `df.tail(n)` { #tail }

**What it does:** Returns the **last** `n` rows.

**When to use it:** To check how the file ends, for example whether the last row is incomplete.

| Parameter | Type | What it means |
|---|---|---|
| `n` | `INT` | Optional. How many rows. If you leave it out, 5. If you ask for more rows than there are, you get the whole table. |

**Returns:** `PARDOS`: a new table with those rows.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/tail.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/tail.expec"
```

## Size and types { #size }

### `df.shape()` { #shape }

**What it does:** Tells you the **size** of the table: `[rows, columns]`.

**When to use it:** To know how much data you have, or to check that a filter removed rows.

It takes no parameters.

**Returns:** `List[INT]` with two numbers.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/shape.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/shape.expec"
```

### `df.dtypes()` { #dtypes }

**What it does:** Tells you the **type** of each column: `INT`, `FLOAT`, `STR` or `BOOL`.

**When to use it:** Before doing math, to know which columns hold numbers.

It takes no parameters.

**Returns:** `List[List[STR]]`: one `[name, type]` pair per column.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/dtypes.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/dtypes.expec"
```


??? info "For the curious 🤓"
    KAFE does not store the type of each column: it **works it out** every time by looking at its values (ignoring `nan`). If all of them are whole numbers, the column is `INT`; if all are numbers but some have decimals, it is `FLOAT`; if all are `true`/`false`, it is `BOOL`; in any other case, it is `STR`.


### `df.info()` { #info }

**What it does:** Makes a one-line **summary**: rows, columns, names and types.

**When to use it:** As a first step when you open a new file.

It takes no parameters.

**Returns:** `STR` with the summary.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/info.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/info.expec"
```

## Quick statistics { #stats }

### `df.describe()` { #describe }

**What it does:** Works out, for each column with numbers: how many values there are (`count`), the average (`mean`), how far they spread from the average (`std`, the standard deviation), the smallest (`min`) and the largest (`max`).

**When to use it:** To get to know your table's numbers at a glance and spot strange values.

It takes no parameters.

**Returns:** `PARDOS`: a new table with one row per numeric column. Text columns do not appear.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/describe.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/describe.expec"
```


!!! note "The numbers come out as text"
    In the `describe` table the values are stored as text (`'10.8'` in quotes). That is why [`round`](summarize.md#round) does not round them. If you need a value to calculate with, use [`mean`](summarize.md#mean) or [`agg`](summarize.md#agg).

??? info "For the curious 🤓"
    If a column has the values $x_1, \dots, x_n$:

    $$\text{mean} = \bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i \qquad \text{std} = \sqrt{\frac{1}{n}\sum_{i=1}^{n}(x_i-\bar{x})^2}$$

    KAFE divides by $n$ (the *population* standard deviation), not by $n-1$.


## What did you learn?

- `head` and `tail` show the beginning and the end of the table.
- `shape`, `dtypes` and `info` tell you the size and the types.
- `describe` summarizes the columns with numbers.

Back to [PARDOS](../pardos.md).

[Next: choosing columns and rows :material-arrow-right:](select.md){ .md-button .md-button--primary }
