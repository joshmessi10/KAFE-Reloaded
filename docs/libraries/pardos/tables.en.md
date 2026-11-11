# Creating and reading tables

There are two ways to get a table in KAFE: **write it yourself** inside the program or **read it from a file**. Most of the time you will read it from a file, because real data has hundreds or thousands of rows.

!!! tip "Where does KAFE look for the file?"
    A **path** is the address of a file, like `data/students.csv`. If the path does not start at the root of the disk, KAFE looks for it **next to your `.kf` file**. In these examples, the data lives in the `data/` folder, beside each program.

## Writing a table by hand { #by-hand }

It is like drawing a small table in your notebook: first you write the column titles and then each row.

### `pardos.DataFrame(columns, rows)` { #dataframe }

**What it does:** Creates a new table from a list of column names and a list of rows.

**When to use it:** To try something with a few values without creating a file.

| Parameter | Type | What it means |
|---|---|---|
| `columns` | `List[STR]` | The column titles. |
| `rows` | `List[List[...]]` | The rows. Each row has one value per column. |

**Returns:** `PARDOS`: the new table.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/dataframe.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/dataframe.expec"
```


!!! tip "What happened here?"
    1. `columns` holds the titles: `hours` and `score`.
    2. `rows` holds three rows, one per student.
    3. `pardos.DataFrame` put them together into a table.
    4. `study.columns` (no parentheses, because it is stored data and not a function) shows the titles.

!!! note "Every row with the same type"
    In KAFE a list only holds values of **one type**. That is why `[["Ana", 10]]` (text and a number together) cannot be written by hand: KAFE answers `Expected homogeneous list`. If your table mixes text and numbers, save it in a CSV file and read it with [`read_csv`](#read_csv).


??? warning "Common mistake"
    If a row has more or fewer values than there are columns, the table does not fit (*Inconsistent dimensions*):

    ```kafe
    --8<-- "tests/DocsExamples/pardos/dataframe-dimensions.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/pardos/dataframe-dimensions.error.stderr.expec"
    ```

## Reading a CSV file { #csv }

A **CSV** (*comma-separated values*) is a plain text file that stores a table. Each **line** is a row and the **commas** separate the columns. The first line holds the titles. Look at the same file as text and as a table:

```text
--8<-- "tests/DocsExamples/pardos/data/students.csv"
```

| name | age | score | city |
|---|---|---|---|
| Ana | 10 | 8.5 | Lima |
| Luis | 11 | 7.0 | Quito |
| Sofia | 10 | 9.5 | Lima |
| Mateo | 12 | 6.5 | Cusco |
| Elena | 11 | 9.0 | Quito |

You can open a CSV with a text editor or with a spreadsheet. Want to see how KAFE cuts each line? It is in [How it works inside](../pardos.md#inside).

### `pardos.read_csv(path)` { #read_csv }

**What it does:** Reads a CSV file and turns it into a table. It guesses the type of each cell: `10` becomes `INT`, `8.5` becomes `FLOAT` and `Lima` becomes `STR`.

**When to use it:** Whenever your data is in a `.csv` file, for example one downloaded from the internet.

| Parameter | Type | What it means |
|---|---|---|
| `path` | `STR` | The path of the file. |

**Returns:** `PARDOS`: the table with the file's data.

**Input data**

`data/students.csv`:

```text
--8<-- "tests/DocsExamples/pardos/data/students.csv"
```

`data/prices.csv`:

```text
--8<-- "tests/DocsExamples/pardos/data/prices.csv"
```

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/read_csv.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/read_csv.expec"
```


!!! note "Comma or semicolon"
    Some programs save CSV files with a **semicolon** (`;`) instead of a comma. `read_csv` detects it by itself: it counts the `;` and the `,` in the whole file and, if there are **at least as many** `;` as `,`, it uses `;`. Otherwise it uses `,`. That is why `prices.csv` was read correctly.

!!! note "Empty cells"
    An empty cell is read as `nan` (*not a number*), the mark for "a value is missing here". Learn to handle it in [Missing data](missing.md).

!!! warning "A simple reader"
    `read_csv` cuts each line at every separator, with no exceptions. If a text has a comma inside (for example `"Lima, Peru"`), it will be split into two columns. Check the columns with [`dtypes`](inspect.md#dtypes) before training a model.


??? warning "Common mistake"
    If you misspell the file name, KAFE tells you it was *not found* and which folder it searched. Here an `s` is missing in `students`. In the output, `<REPO>` stands for the project folder:

    ```kafe
    --8<-- "tests/DocsExamples/pardos/read_csv-missing-file.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/pardos/read_csv-missing-file.error.stderr.expec"
    ```

## Reading a JSON file { #json }

**JSON** is another text format, very common on the internet. Instead of rows with commas, it stores a list of **cards**: each card goes between braces `{ }` and says `"column": value` for every item. It is like a stack of pet cards, each one with the same fields.

### `pardos.read_json(path)` { #read_json }

**What it does:** Reads a JSON file that holds a list of cards and turns it into a table. The column names come from the first card.

**When to use it:** When your data comes from a website or from another program that saves JSON.

| Parameter | Type | What it means |
|---|---|---|
| `path` | `STR` | The path of the file. |

**Returns:** `PARDOS`: the table.

**Input data**

`data/pets.json`:

```text
--8<-- "tests/DocsExamples/pardos/data/pets.json"
```

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/read_json.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/read_json.expec"
```


!!! note "Only lists of cards"
    The file must be a list `[ ... ]` of cards `{ ... }` (the *records* format). With any other shape, KAFE answers `Unsupported JSON format`. A file with the empty list `[]` gives an empty table.


## What did you learn?

- `pardos.DataFrame(columns, rows)` creates a small table written by hand.
- `pardos.read_csv` reads CSV files (with `,` or `;`) and guesses the type of each cell.
- `pardos.read_json` reads a list of JSON cards.

Back to [PARDOS](../pardos.md).

[Next: looking at the data :material-arrow-right:](inspect.md){ .md-button .md-button--primary }
