# HUGGINGFACE: reference

This page is part of the [HUGGINGFACE](../huggingface.md) library. Here are its three functions: load a whole dataset, load one particular split, and read only the numbers.

!!! info "About the examples on this page"
    The functions need internet and the [Hugging Face pack](../huggingface.md#pack). That is why their examples are shown with an **example output**: it is what you will see with the pack installed and a connection. The errors are tested, because KAFE checks the arguments **before** downloading anything.

## Loading datasets { #load }

A Hugging Face dataset arrives as a table: each row is an example and each column is one piece of data. KAFE can give it to you in two ways:

- As a [PARDOS](../../libraries/pardos.md) **DataFrame**: the whole table, with the column names. Good for looking at the data.
- As a **matrix**: a list of lists of `FLOAT`, with only the columns you choose. This is what models need.

### `huggingface.load_dataset(dataset_name)` { #load_dataset }

**What it does:** Downloads a dataset and gives you its `"train"` split as a PARDOS DataFrame. If the dataset has no `"train"`, it gives you the first split it finds.

**When to use it:** To get to know a new dataset: how many rows it has and which columns it brings.

| Parameter | Type | What it means |
|---|---|---|
| `dataset_name` | `STR` | The dataset name on Hugging Face, like `"imdb"` or `"scikit-learn/iris"`. |

**Returns:** `PARDOS`: a DataFrame. Numbers, texts and `BOOL` values stay the same; empty values become `""`; lists and dictionaries become text.

!!! note "This example needs internet"
    It needs a connection and the Hugging Face pack.

**Example:**

```kafe
import huggingface;
PARDOS df = huggingface.load_dataset("scikit-learn/iris");
show(df.shape());
```

**Example output:** `[rows, columns]`.

```text
[150, 6]
```

!!! warning "Big datasets take a lot of memory"
    `load_dataset` reads **every** row of the split. With a huge dataset, your computer can run out of memory. If you only need numbers, use `load_dataset_matrix` with a `limit`.

??? note "What about `hf_load_dataset`?"
    `hf_load_dataset` is **not** a KAFE function. It is an internal name the library uses to keep the `datasets` package's function. Use `huggingface.load_dataset`:

    ```kafe
    --8<-- "tests/DocsExamples/huggingface/hf_load_dataset.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/huggingface/hf_load_dataset.error.stderr.expec"
    ```

### `huggingface.load_dataset_split(dataset_name, split)` { #load_dataset_split }

**What it does:** Downloads a dataset and gives you **the split you choose** as a PARDOS DataFrame.

**When to use it:** When you want the exam pile (`"test"`) or the validation pile (`"validation"`) instead of the training one.

| Parameter | Type | What it means |
|---|---|---|
| `dataset_name` | `STR` | The dataset name on Hugging Face. |
| `split` | `STR` | The split you want: `"train"`, `"test"`, `"validation"`… It depends on each dataset. |

**Returns:** `PARDOS`: a DataFrame with the rows of that split.

!!! note "This example needs internet"
    It needs a connection and the Hugging Face pack. The `imdb` dataset (movie reviews) is fairly big: the first download takes a while.

**Example:** the exam split of `imdb`, with a `text` column (the review) and a `label` column (0 = bad, 1 = good).

```kafe
import huggingface;
PARDOS test_df = huggingface.load_dataset_split("imdb", "test");
show(test_df.shape());
```

**Example output:**

```text
[25000, 2]
```

??? warning "Common mistake"
    Here `split` is required. If you only give the dataset name, KAFE complains about the number of arguments. For the default split, use `load_dataset`:

    ```kafe
    --8<-- "tests/DocsExamples/huggingface/load_dataset_split-missing-split.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/huggingface/load_dataset_split-missing-split.error.stderr.expec"
    ```

### `huggingface.load_dataset_matrix(dataset_name, columns, split, limit)` { #load_dataset_matrix }

**What it does:** Reads only the **numeric columns** you choose and gives them to you as a matrix of `FLOAT`, without building a DataFrame.

**When to use it:** When you will give the data straight to a [MACHINE](../../libraries/machine.md) model (for example, to group flowers with K-Means) or a [GESHA](../../libraries/gesha.md) model.

| Parameter | Type | What it means |
|---|---|---|
| `dataset_name` | `STR` | The dataset name on Hugging Face. |
| `columns` | `List[STR]` | Optional. The column names. If the list is empty, KAFE picks the columns that hold numbers in the first row. |
| `split` | `STR` | Optional. The split you want. By default, `"train"`. |
| `limit` | `INT` | Optional. The most rows to read. `0` = all. |

**Returns:** `List[List[FLOAT]]`: one row of numbers per example.

!!! note "This example needs internet"
    It needs a connection and the Hugging Face pack.

**Example:** the first 3 flowers, with sepal length and sepal width.

```kafe
import huggingface;
List[STR] columns = ["SepalLengthCm", "SepalWidthCm"];
List[List[FLOAT]] X = huggingface.load_dataset_matrix("scikit-learn/iris", columns, "train", 3);
show(X);
```

**Example output:**

```text
[[5.1, 3.5], [4.9, 3.0], [4.7, 3.2]]
```

!!! note "Watch out"
    Every value in the chosen columns must be a number. If one is empty or is text, KAFE stops with an error that names the column. Reading a matrix saves the in-between DataFrame, but models like K-Means still keep every row in memory: use `limit` with big datasets.

??? warning "Common mistake"
    `columns` is a **list** of names, even if you want just one column. Write `["SepalLengthCm"]`, not `"SepalLengthCm"`:

    ```kafe
    --8<-- "tests/DocsExamples/huggingface/load_dataset_matrix-columns-not-list.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/huggingface/load_dataset_matrix-columns-not-list.error.stderr.expec"
    ```

## Summary of all functions { #summary }

| Function | Returns |
|---|---|
| [`huggingface.load_dataset(dataset_name)`](#load_dataset) | `PARDOS` with the `"train"` split |
| [`huggingface.load_dataset_split(dataset_name, split)`](#load_dataset_split) | `PARDOS` with the chosen split |
| [`huggingface.load_dataset_matrix(dataset_name, columns, split, limit)`](#load_dataset_matrix) | `List[List[FLOAT]]` |

If you want to compare, the [KAGGLE](../kaggle.md) library has functions with similar names.

## What did you learn?

- `load_dataset` gives you the `"train"` split as a DataFrame; `load_dataset_split` gives you the split you choose.
- `load_dataset_matrix` gives you only the numbers, ready for a model.
- All three need internet and the Hugging Face pack.

[Next library: MACHINE :material-arrow-right:](../../libraries/machine.md){ .md-button .md-button--primary }
