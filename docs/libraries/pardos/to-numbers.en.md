# From table to numbers for MACHINE

[MACHINE](../machine.md) models do not understand tables with titles: they need a **matrix**, that is, a list of rows that holds only numbers. Going from table to matrix is like copying the scores from the class list into a grid without names: the model only sees the numbers.

```text
--8<-- "tests/DocsExamples/pardos/data/students.csv"
```

With this table, the `age` and `score` columns are numbers and go into the matrix. `name` and `city` are text: if one of them is the answer you want to predict (the **label**), take it out separately with [`col`](select.md#col) and encode it for the model.

!!! tip "Prepare the data well"
    Before converting, check the columns with [`dtypes`](inspect.md#dtypes) and fill the gaps (see [Missing data](missing.md)). Split the training and test data **before** fitting a scaler. There is a full walkthrough in [MACHINE with Kaggle data](../../ejemplos/machine-kaggle.md).

### `pardos.to_matrix(df)` { #to_matrix }

**What it does:** Turns the table into a **matrix of decimal numbers** (`FLOAT`). It keeps only the `INT` and `FLOAT` columns; text columns are ignored. A `nan` becomes `0.0`.

**When to use it:** Right before training a MACHINE model with a table's data.

| Parameter | Type | What it means |
|---|---|---|
| `df` | `PARDOS` | The table you are working with. |

**Returns:** `List[List[FLOAT]]`: one row of numbers for each row of the table.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/to_matrix.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/to_matrix.expec"
```


*It also exists with the name `pardos.df_to_matrix(df)`, which does exactly the same.*

!!! warning "Watch out for gaps"
    Since every `nan` becomes `0.0`, a gap can look like real data. Fill the gaps yourself first with [`fillna`](missing.md#fillna), [`ffill`](missing.md#ffill) or [`bfill`](missing.md#bfill).


??? warning "Common mistake"
    If the table has no column with numbers, there is nothing to convert (*No numeric columns were found*):

    ```kafe
    --8<-- "tests/DocsExamples/pardos/to_matrix-no-numbers.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/pardos/to_matrix-no-numbers.error.stderr.expec"
    ```

### `pardos.flatten(nested)` { #flatten }

**What it does:** **Flattens** a list of lists: takes out every value and puts them in one single list, in order. It also flattens lists of lists of lists.

**When to use it:** When a model returns a one-column matrix and you want a plain list, or to count all the values of a matrix.

| Parameter | Type | What it means |
|---|---|---|
| `nested` | `List[...]` | A list, with or without lists inside. |

**Returns:** A flat list with the same values.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/flatten.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/flatten.expec"
```

## What did you learn?

- `to_matrix` (or `df_to_matrix`) turns the numeric columns into a `FLOAT` matrix.
- Text labels are taken out separately with `col`.
- `flatten` turns a list of lists into a flat list.

Back to [PARDOS](../pardos.md).

[Next: Kaggle datasets :material-arrow-right:](../../bibliotecas/kaggle.md){ .md-button .md-button--primary }
