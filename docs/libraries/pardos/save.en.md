# Saving tables

After cleaning or combining a table, you can **save** it to a file to use it another day or open it in a spreadsheet. It is like making a clean copy of your notebook.

The examples save the file, read it with the [FILES](../files.md) library so you can see what is inside, and then delete it.

!!! warning "It writes over"
    If a file with that name already exists, it is **replaced** without asking. The path is counted from the folder of your `.kf` file.

### `df.to_csv(path)` { #to_csv }

**What it does:** Saves the table to a comma-separated **CSV** file. `nan` values are saved as empty cells.

**When to use it:** To share your data or read it later with [`read_csv`](tables.md#read_csv).

| Parameter | Type | What it means |
|---|---|---|
| `path` | `STR` | The path of the new file. |

**Returns:** Nothing (`VOID`). It is used as a statement on its own.

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/to_csv.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/to_csv.expec"
```

### `df.to_json(path)` { #to_json }

**What it does:** Saves the table to a **JSON** file: a list of cards, one per row. `nan` values are saved as `null`.

**When to use it:** To pass the data to a website or another program, or to read it with [`read_json`](tables.md#read_json).

| Parameter | Type | What it means |
|---|---|---|
| `path` | `STR` | The path of the new file. |

**Returns:** Nothing (`VOID`).

**Example:**

```kafe
--8<-- "tests/DocsExamples/pardos/to_json.kf"
```

**Result:**

```text
--8<-- "tests/DocsExamples/pardos/to_json.expec"
```

## What did you learn?

- `to_csv` saves the table as CSV and `to_json` as JSON.
- If the file already exists, it is replaced.

Back to [PARDOS](../pardos.md).

[Next: from table to numbers :material-arrow-right:](to-numbers.md){ .md-button .md-button--primary }
