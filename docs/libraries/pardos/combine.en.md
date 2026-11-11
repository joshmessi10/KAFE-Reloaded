# Combining tables

Sometimes data comes in **several tables**. There are two ways to combine them, and each one has a function and a method (the same operation written in two ways: `pardos.concat(a, b)` or `a.concat(b)`).

## Stacking: one table under another { #stacking }

Imagine two class-list sheets, one for group A and one for group B, with the **same columns**. If you put the second sheet under the first one, you get one longer list. That is **concatenating** (`concat`).

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/pardos-concat.svg"
<figcaption>The rows of the second table move down and sit under the rows of the first one. The columns are the same.</figcaption>
</figure>

### `pardos.concat(first, second)` { #concat }

**What it does:** Puts the rows of `second` **under** the rows of `first`.

**When to use it:** To join data of the same kind that comes in several files: one file per month, one file per group.

| Parameter | Type | What it means |
|---|---|---|
| `first` | `PARDOS` | The table on top. |
| `second` | `PARDOS` | The table below. It must have the same columns (they may be in another order). |

**Returns:** `PARDOS`: a new table with all the rows, in the column order of `first`.

**Input data**

`data/class-a.csv`:

```text
--8<-- "tests/DocsExamples/pardos/data/class-a.csv"
```

`data/class-b.csv`:

```text
--8<-- "tests/DocsExamples/pardos/data/class-b.csv"
```

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/concat.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/concat.expec"
```

??? warning "Common mistake"
    If the columns are not the same, the sheets do not fit (*Columns do not match*):

    ```kafe
    --8<-- "tests/DocsExamples/pardos/concat-columns.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/pardos/concat-columns.error.stderr.expec"
    ```

### `df.concat(other)` { #df-concat }

**What it does:** The same as [`pardos.concat`](#concat), written as a method: puts `other` under `df`.

**When to use it:** When you prefer to write the operation from the first table.

| Parameter | Type | What it means |
|---|---|---|
| `other` | `PARDOS` | The table below, with the same columns. |

**Returns:** `PARDOS`: a new table with all the rows.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/df-concat.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/df-concat.expec"
```

## Joining on a shared column { #joining }

Now imagine two **different** lists: one with each student's score and another with the club each one goes to. To know the score **and** the club of each person, you look up their name in both lists and put together what they say. That is **joining** (`merge`). The column you look up in both tables (here `name`) is called the **key**.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/pardos-merge.svg"
<figcaption>Rows with the same `name` are joined. Ana and Sofia are in both tables and go to the result; Luis and Pablo have no partner and stay out.</figcaption>
</figure>

### `pardos.merge(left, right, key, how)` { #merge }

**What it does:** Joins each row of `left` with the rows of `right` that have the **same value** in the `key` column.

**When to use it:** When the information about each person (or product, or city) is spread over several tables.

| Parameter | Type | What it means |
|---|---|---|
| `left` | `PARDOS` | The main table. |
| `right` | `PARDOS` | The table that brings new columns. |
| `key` | `STR` | The shared column. It must exist in both tables. |
| `how` | `STR` | Optional. `"inner"` (the default): only rows with a partner. `"left"`: every row of `left`; if a row has no partner, the new columns are `None` ("nothing"). |

**Returns:** `PARDOS`: a new table with the columns of `left` plus those of `right` (without repeating `key`).

**Input data**

`data/students.csv`:

```text
--8<-- "tests/DocsExamples/pardos/data/students.csv"
```

`data/clubs.csv`:

```text
--8<-- "tests/DocsExamples/pardos/data/clubs.csv"
```

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/merge.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/merge.expec"
```


!!! note "Only `inner` and `left`"
    Any other value of `how` (for example `"outer"` or `"right"`) behaves like `"inner"`, without warning. If `key` does not exist in one of the two tables, KAFE answers `Column '…' not found in both DataFrames`.

??? info "For the curious 🤓"
    To avoid comparing each row with every other row, `merge` first builds an **index** of `right`: a kind of address book that says, for each value of `key`, which rows have it. Then it walks through `left` only once and looks up each name in that book. So, with $n$ rows in `left` and $m$ in `right`, the work grows like $n + m$ instead of $n \times m$.


### `df.merge(other, key, how)` { #df-merge }

**What it does:** The same as [`pardos.merge`](#merge), written as a method: `df` is the main table.

**When to use it:** When you prefer to write the operation from the main table.

| Parameter | Type | What it means |
|---|---|---|
| `other` | `PARDOS` | The table that brings new columns. |
| `key` | `STR` | The shared column. |
| `how` | `STR` | Optional. `"inner"` (the default) or `"left"`. |

**Returns:** `PARDOS`: a new table.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/df-merge.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/df-merge.expec"
```

## What did you learn?

- `concat` stacks tables with the same columns.
- `merge` joins tables by looking for the same value in a key column.
- Each one exists as a function (`pardos.concat`) and as a method (`a.concat`).

Back to [PARDOS](../pardos.md).

[Next: saving tables :material-arrow-right:](save.md){ .md-button .md-button--primary }
