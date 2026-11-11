# Choosing columns and rows

Often you do not need the whole table. In a class list you may want **only the scores** (one column) or **only the students who live in Lima** (some rows). Choosing columns is like cutting a vertical strip from the sheet; choosing rows is like a strainer that only lets through the rows that meet a condition.

All the examples use this file:

```text
--8<-- "tests/DocsExamples/pardos/data/students.csv"
```

!!! tip "The original table does not change"
    `query`, `rename` and `drop` **do not touch** your table: they return a new table. Save it in another variable if you want to use it.

## Columns { #columns }

### `df.col(column)` { #col }

**What it does:** Takes out one column as a **list**.

**When to use it:** To calculate with one column, or to give MACHINE the answers (labels) for a model.

| Parameter | Type | What it means |
|---|---|---|
| `column` | `STR` | The column name. Upper and lower case matter. |

**Returns:** A list of the column's type: `List[INT]`, `List[FLOAT]` or `List[STR]`. In an `INT` column, `nan` becomes `0`; in a `STR` column, it becomes `""`.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/col.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/col.expec"
```

!!! tip "Declare the right type"
    The `age` column is `INT`. If you write `List[FLOAT] ages = students.col("age");`, KAFE answers `Expected List[FLOAT], obtained List[INT]`. Use [`dtypes`](inspect.md#dtypes) to know the type.


??? warning "Common mistake"
    Column names are case-sensitive: `Score` is not `score`.

    ```kafe
    --8<-- "tests/DocsExamples/pardos/col-wrong-name.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/pardos/col-wrong-name.error.stderr.expec"
    ```

### `df.rename(old, new)` { #rename }

**What it does:** Changes the name of a column.

**When to use it:** When a file comes with unclear names or names in another language.

| Parameter | Type | What it means |
|---|---|---|
| `old` | `STR` | The current name. |
| `new` | `STR` | The new name. It cannot be the name of another existing column. |

**Returns:** `PARDOS`: a new table with the name changed.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/rename.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/rename.expec"
```

### `df.drop(column)` { #drop }

**What it does:** Removes a column.

**When to use it:** To remove columns you do not need, like an id, before training a model.

| Parameter | Type | What it means |
|---|---|---|
| `column` | `STR` | The column you want to remove. |

**Returns:** `PARDOS`: a new table without that column.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/drop.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/drop.expec"
```

## Rows: filtering with a condition { #rows }

### `df.query(condition)` { #query }

**What it does:** Keeps only the rows that meet a **condition**. The condition is written as text, using the column names as if they were variables.

**When to use it:** To study one group: students older than 10, students from one city, students who passed…

| Parameter | Type | What it means |
|---|---|---|
| `condition` | `STR` | A KAFE expression that gives `true` or `false`. Texts inside it go between single quotes `'…'`. |

**Returns:** `PARDOS`: a new table with the matching rows. If none match, the table has no rows.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/query.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/query.expec"
```


You can use these operators inside the condition:

| Operator | Means |
|---|---|
| `==` | equal |
| `!=` | not equal |
| `<`, `<=`, `>`, `>=` | less, less or equal, greater, greater or equal |
| `&&` | **and**: both must be true |
| `\|\|` | **or**: one is enough |

You can also group with parentheses, for example `"(age > 10 && score > 8) || city == 'Lima'"`.

??? info "For the curious 🤓"
    `query` uses KAFE's own interpreter: it reads the text as an expression and, for **each row**, briefly creates variables named after each column (`age = 11`, `city = 'Quito'`…), evaluates the condition and keeps the row if the result is `true`.

!!! warning "Check the condition carefully"
    If the condition has a typo (for example `"age >"` or `"city = 'Lima'"` with a single `=`), KAFE currently **does not warn you**: it returns a table with no rows. If a filter leaves your table empty for no reason, check the condition.


## What did you learn?

- `col` takes out one column as a list.
- `rename` and `drop` change or remove columns.
- `query` filters rows with a condition written as text.

Back to [PARDOS](../pardos.md).

[Next: counting and summarizing :material-arrow-right:](summarize.md){ .md-button .md-button--primary }
