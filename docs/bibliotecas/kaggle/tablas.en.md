# KAGGLE: tables

This page is part of the [KAGGLE](../kaggle.md) library. Here you learn to read tables: CSV files with rows and columns.

!!! info "About the examples on this page"
    The functions on this page need internet and the [Kaggle pack](../kaggle.md#pack). That is why their examples are shown with an **example output**: it is what you will see with the pack installed and a connection. The errors are tested, because KAFE checks them **before** downloading anything.

A Kaggle table is usually a **CSV** file: a text where each line is a row and the cells are separated by commas. The first line is the **header**: the names of the columns.

```text
Id,SepalLengthCm,SepalWidthCm,PetalLengthCm,PetalWidthCm,Species
1,5.1,3.5,1.4,0.2,Iris-setosa
2,4.9,3.0,1.4,0.2,Iris-setosa
```

KAGGLE can give you the whole table as a [PARDOS](../../libraries/pardos.md) **DataFrame** (a table with column names), or only the numbers as a **matrix** (a list of lists of `FLOAT`), which is what models need.

**Which file does it read?** KAFE picks the file like this:

1. If you give a file name (`file_name`), it uses that one. It can be the name (`"Iris.csv"`) or the path inside the dataset (`"data/train.csv"`).
2. If not, it uses the `split` selector: `"train"` looks for `train.csv` and `"test"` looks for `test.csv`.
3. If you give neither and the dataset has **only one** CSV, it reads that one. If it has several, it shows you the list so you can choose.

### `kaggle.load_dataset(dataset_name, file_name)` { #load_dataset }

**What it does:** Downloads a dataset and reads a CSV table as a PARDOS DataFrame.

**When to use it:** When you want to see the whole table, with its column names, before training a model.

| Parameter | Type | What it means |
|---|---|---|
| `dataset_name` | `STR` | The dataset name, in the form `"owner/name"`. |
| `file_name` | `STR` | Optional. The CSV file you want to read. If you leave it out, it reads the dataset's only CSV. |

**Returns:** `PARDOS`: a DataFrame. Numbers become `INT` or `FLOAT`, text stays `STR`, and empty cells become `NaN` ("not a number").

!!! note "This example needs internet"
    It needs a connection and the Kaggle pack.

**Example:**

```kafe
import kaggle;
PARDOS df = kaggle.load_dataset("uciml/iris", "Iris.csv");
show(df.shape());
```

**Example output:** `[rows, columns]`.

```text
[150, 6]
```

??? warning "Common mistake"
    The dataset name cannot be empty:

    ```kafe
    --8<-- "tests/DocsExamples/kaggle/load_dataset-empty-name.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/kaggle/load_dataset-empty-name.error.stderr.expec"
    ```

### `kaggle.load_dataset_split(dataset_name, file_name, split)` { #load_dataset_split }

**What it does:** Same as `load_dataset`, but lets you choose the file with a **selector** that looks like a *split*: `"train"` looks for `train.csv` and `"test"` looks for `test.csv`.

**When to use it:** When the dataset already comes split into two files and you want to load only the training part or only the test part.

| Parameter | Type | What it means |
|---|---|---|
| `dataset_name` | `STR` | The dataset name, `"owner/name"`. |
| `file_name` | `STR` | The file you want to read. Write `""` (empty) to use `split`. If it is not empty, **it wins**. |
| `split` | `STR` | Optional. File selector: `"train"`, `"test"`, or the file name without `.csv`. |

**Returns:** `PARDOS`: a DataFrame with the chosen file.

!!! note "This example needs internet"
    It needs a connection and the Kaggle pack.

**Example:** the iris dataset has a file `Iris.csv`, so the selector `"Iris"` finds it. In a dataset with `train.csv` you would write `"train"`.

```kafe
import kaggle;
PARDOS df = kaggle.load_dataset_split("uciml/iris", "", "Iris");
show(df.shape());
```

**Example output:**

```text
[150, 6]
```

??? warning "Common mistake"
    `file_name` is required, even if it is empty. If you only give the dataset, KAFE complains about the number of arguments:

    ```kafe
    --8<-- "tests/DocsExamples/kaggle/load_dataset_split-missing-file.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/kaggle/load_dataset_split-missing-file.error.stderr.expec"
    ```

### `kaggle.load_dataset_matrix(dataset_name, columns, split, limit)` { #load_dataset_matrix }

**What it does:** Reads only the **numeric columns** you choose and gives them to you as a matrix of `FLOAT`, without building a DataFrame.

**When to use it:** When you already know which columns you want and you will give them straight to a [MACHINE](../../libraries/machine.md) or [GESHA](../../libraries/gesha.md) model.

| Parameter | Type | What it means |
|---|---|---|
| `dataset_name` | `STR` | The dataset name, `"owner/name"`. |
| `columns` | `List[STR]` | Optional. The column names. If the list is empty, KAFE picks the columns that hold numbers in the first row. |
| `split` | `STR` | Optional. File selector, as in `load_dataset_split` (`"train"`, `"Iris.csv"`…). Empty = the only CSV. |
| `limit` | `INT` | Optional. The most rows to read. `0` = all. |

**Returns:** `List[List[FLOAT]]`: one row of numbers per example.

!!! note "This example needs internet"
    It needs a connection and the Kaggle pack.

**Example:** the first 3 flowers, with sepal length and petal length.

```kafe
import kaggle;
List[List[FLOAT]] X = kaggle.load_dataset_matrix("uciml/iris", ["SepalLengthCm", "PetalLengthCm"], "Iris.csv", 3);
show(X);
```

**Example output:**

```text
[[5.1, 1.4], [4.9, 1.4], [4.7, 1.3]]
```

!!! note "Watch out"
    Every cell in the chosen columns must be a number. If a cell is empty or holds text, KAFE stops with an error that names the column. (This is different from `load_dataset`, which turns empty cells into `NaN`.)

??? warning "Common mistake"
    `columns` is a **list** of names, even if you want just one column. Write `["SepalLengthCm"]`, not `"SepalLengthCm"`:

    ```kafe
    --8<-- "tests/DocsExamples/kaggle/load_dataset_matrix-columns-not-list.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/kaggle/load_dataset_matrix-columns-not-list.error.stderr.expec"
    ```

## What did you learn?

- `load_dataset` gives you the whole table as a PARDOS DataFrame.
- `load_dataset_split` picks the file with a selector such as `"train"` or `"test"`.
- `load_dataset_matrix` gives you only the numbers, ready for a model.

[Next: Labeled sentences :material-arrow-right:](texto.md){ .md-button .md-button--primary }
