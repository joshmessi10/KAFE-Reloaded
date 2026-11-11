# PARDOS: data tables

The **PARDOS** library is for working with **data tables**: reading them from a file, looking at them, filtering them, summarizing them, combining them and getting them ready to train Machine Learning models. It is inspired by *Pandas*, the most widely used table library in Python, but written from scratch inside KAFE so you can see how it works.

## What is a table? { #what-is-a-table }

A **table** (also called a *DataFrame*) is like a **spreadsheet** or your class list:

- Each **row** is one thing we study: here, a student.
- Each **column** is something we know about all of them: their name, age, grade, city.
- The first row holds the column **titles**.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/pardos-tabla.svg"
<figcaption>First a row lights up (everything we know about Luis) and then a column (everyone's grade).</figcaption>
</figure>

This table is stored in a text file called `students.csv`:

```text
--8<-- "tests/DocsExamples/pardos/data/students.csv"
```

With two lines of KAFE you read it and show it:

```kafe
--8<-- "tests/DocsExamples/pardos/first-table.kf"
```

```text
--8<-- "tests/DocsExamples/pardos/first-table.expec"
```

!!! tip "What happened here?"
    1. `import pardos;` brought in the library.
    2. `pardos.read_csv(...)` read the file and created a table. Its type in KAFE is `PARDOS`.
    3. `show(students)` displayed it on one line: `cols` are the column titles and `rows` are the rows, each one in brackets.

## Before you start: import the library { #import }

A library is an extra **toolbox**. To use it, first bring it in with `import pardos;` and then use each tool with `pardos.` in front, like `pardos.read_csv(...)`. The tables it gives you back come with their own tools, the **methods**, which you write with a dot after the table's name: `students.head(2)`.

!!! warning "Common mistake: forgetting the `import`"
    If you use `pardos.` without writing `import pardos;`, KAFE doesn't know which box you mean:

    ```kafe
    --8<-- "tests/DocsExamples/pardos/no-import.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/pardos/no-import.error.stderr.expec"
    ```

## How it works inside { #inside }

PARDOS lives in the `src/lib/KafePARDOS/` folder of the KAFE code and has three files:

| File | What it holds |
|---|---|
| `functions.py` | The functions you call with `pardos.`: `read_csv`, `read_json`, `concat`, `merge`, `to_matrix`, `flatten`. |
| `DataFrame.py` | The `DataFrame` class (the table and all its methods) and the `GroupBy` class (the groups from [`groupby`](pardos/summarize.md#groupby)). |
| `utils.py` | `infer_type`, the function that guesses the type of each cell. |

Inside, a table is just **two lists**:

- `columns`: a list of texts with the titles, for example `['name', 'age', 'score', 'city']`.
- `data`: a **list of lists**, one list per row, for example `[['Ana', 10, 8.5, 'Lima'], ...]`.

See how `read_csv` turns one line of the file into a row of `data`:

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/pardos-pordentro.svg"
<figcaption>1) The line is cut at each comma. 2) Each piece becomes a number if it can. 3) The finished row is added to the end of `data`.</figcaption>
</figure>

Step by step, `read_csv`:

1. **Finds the file**: first exactly as you wrote the path and, if it isn't there, next to your `.kf` file.
2. **Reads all the lines** and removes the empty lines at the end. If the file is empty, it returns an empty table.
3. **Chooses the separator**: it counts the `;` and the `,` in the whole file. If there are at least as many `;` as `,`, it uses `;`; otherwise, `,`.
4. **Reads the titles** from the first line and trims extra spaces.
5. **Cuts each line** into pieces (`split`). If a line is missing pieces, it fills them in with empty cells.
6. **Guesses the type** of each piece with `infer_type`: an empty piece becomes `nan`; if it can be read as an integer, it is `INT`; otherwise, if it can be read as a decimal, it is `FLOAT`; otherwise it stays as text (`STR`).
7. **Creates the table** with `columns` and `data`. While creating it, it checks that every row has as many values as there are columns.

Other ideas that help you understand the rest of the library:

- **Types are computed, not stored.** [`dtypes`](pardos/inspect.md#dtypes) looks at each column's values every time you call it.
- **Tables don't change.** Almost every method (`head`, `query`, `drop`, `fillna`…) walks through `data` and builds a **new** table. The original stays the same.
- **`query` uses the KAFE interpreter.** For each row, it creates variables named after the columns and evaluates your condition (more in [`query`](pardos/select.md#query)).
- **`merge` uses an index.** First it notes which rows hold each key value and then it looks there (more in [`merge`](pardos/combine.md#merge)).

## Library map { #map }

| Page | What you learn |
|---|---|
| [Creating and reading tables](pardos/tables.md) | Write a table by hand, read CSV and JSON files. |
| [Looking at the data](pardos/inspect.md) | See the beginning and the end, the size, the types and quick statistics. |
| [Choosing columns and rows](pardos/select.md) | Take out a column, rename, remove columns and filter rows. |
| [Counting and summarizing](pardos/summarize.md) | Count values, averages, sums, rounding and per-group summaries. |
| [Missing data](pardos/missing.md) | Fill in or remove the gaps (`nan`). |
| [Combining tables](pardos/combine.md) | Stack tables (`concat`) and join them by a column (`merge`). |
| [Saving tables](pardos/save.md) | Save as CSV or JSON. |
| [From table to numbers for MACHINE](pardos/to-numbers.md) | Turn the table into a matrix to train models. |

## Summary of every function { #summary }

| Function or method | Page |
|---|---|
| [`pardos.DataFrame(columns, rows)`](pardos/tables.md#dataframe) | [Creating and reading tables](pardos/tables.md) |
| [`pardos.read_csv(path)`](pardos/tables.md#read_csv) | [Creating and reading tables](pardos/tables.md) |
| [`pardos.read_json(path)`](pardos/tables.md#read_json) | [Creating and reading tables](pardos/tables.md) |
| [`df.head(n)`](pardos/inspect.md#head) | [Looking at the data](pardos/inspect.md) |
| [`df.tail(n)`](pardos/inspect.md#tail) | [Looking at the data](pardos/inspect.md) |
| [`df.shape()`](pardos/inspect.md#shape) | [Looking at the data](pardos/inspect.md) |
| [`df.dtypes()`](pardos/inspect.md#dtypes) | [Looking at the data](pardos/inspect.md) |
| [`df.info()`](pardos/inspect.md#info) | [Looking at the data](pardos/inspect.md) |
| [`df.describe()`](pardos/inspect.md#describe) | [Looking at the data](pardos/inspect.md) |
| [`df.col(column)`](pardos/select.md#col) | [Choosing columns and rows](pardos/select.md) |
| [`df.rename(old, new)`](pardos/select.md#rename) | [Choosing columns and rows](pardos/select.md) |
| [`df.drop(column)`](pardos/select.md#drop) | [Choosing columns and rows](pardos/select.md) |
| [`df.query(condition)`](pardos/select.md#query) | [Choosing columns and rows](pardos/select.md) |
| [`df.value_counts(column)`](pardos/summarize.md#value_counts) | [Counting and summarizing](pardos/summarize.md) |
| [`df.mean(column)`](pardos/summarize.md#mean) | [Counting and summarizing](pardos/summarize.md) |
| [`df.sum(column)`](pardos/summarize.md#sum) | [Counting and summarizing](pardos/summarize.md) |
| [`df.agg(column, operation)`](pardos/summarize.md#agg) | [Counting and summarizing](pardos/summarize.md) |
| [`df.round(digits)`](pardos/summarize.md#round) | [Counting and summarizing](pardos/summarize.md) |
| [`df.groupby(column)`](pardos/summarize.md#groupby) | [Counting and summarizing](pardos/summarize.md) |
| [`groups.mean()`](pardos/summarize.md#groupby-mean) | [Counting and summarizing](pardos/summarize.md) |
| [`groups.sum()`](pardos/summarize.md#groupby-sum) | [Counting and summarizing](pardos/summarize.md) |
| [`groups.count()`](pardos/summarize.md#groupby-count) | [Counting and summarizing](pardos/summarize.md) |
| [`df.fillna(value)`](pardos/missing.md#fillna) | [Missing data](pardos/missing.md) |
| [`df.dropna()`](pardos/missing.md#dropna) | [Missing data](pardos/missing.md) |
| [`df.ffill()`](pardos/missing.md#ffill) | [Missing data](pardos/missing.md) |
| [`df.bfill()`](pardos/missing.md#bfill) | [Missing data](pardos/missing.md) |
| [`pardos.concat(first, second)`](pardos/combine.md#concat) | [Combining tables](pardos/combine.md) |
| [`df.concat(other)`](pardos/combine.md#df-concat) | [Combining tables](pardos/combine.md) |
| [`pardos.merge(left, right, key, how)`](pardos/combine.md#merge) | [Combining tables](pardos/combine.md) |
| [`df.merge(other, key, how)`](pardos/combine.md#df-merge) | [Combining tables](pardos/combine.md) |
| [`df.to_csv(path)`](pardos/save.md#to_csv) | [Saving tables](pardos/save.md) |
| [`df.to_json(path)`](pardos/save.md#to_json) | [Saving tables](pardos/save.md) |
| [`pardos.to_matrix(df)`](pardos/to-numbers.md#to_matrix) | [From table to numbers for MACHINE](pardos/to-numbers.md) |
| [`pardos.df_to_matrix(df)`](pardos/to-numbers.md#to_matrix) | [From table to numbers for MACHINE](pardos/to-numbers.md) |
| [`pardos.flatten(nested)`](pardos/to-numbers.md#flatten) | [From table to numbers for MACHINE](pardos/to-numbers.md) |

## Frequent errors { #errors }

| Error | Cause |
|---|---|
| `File '…' not found` | The file doesn't exist at that path ([see example](pardos/tables.md#read_csv)). |
| `Column '…' doesn't exist` | The column name is misspelled in `col`, `drop`, `rename`… ([see example](pardos/select.md#col)). |
| `Inconsistent dimensions` | A row doesn't have as many values as there are columns ([see example](pardos/tables.md#dataframe)). |
| `has no numeric values` / `Expected List[...]` | The operation doesn't work for that column's type, for example the average of a text column. |

!!! note
    Many PARDOS messages start with your variable's name or with `pardos:` repeated, for example `pardos: pardos: concat: Columns do not match`. Read the last part: that is where the explanation is.

## What did you learn?

- A table has rows (the things you study) and columns (what you know about them).
- Inside, it is a list of titles (`columns`) and a list of lists (`data`).
- To use PARDOS you write `import pardos;`, create a table with `pardos.read_csv(...)` and work with it through its methods: `table.head()`, `table.query(...)`…

[Start: creating and reading tables :material-arrow-right:](pardos/tables.md){ .md-button .md-button--primary }
[Next library: Kaggle datasets](../bibliotecas/kaggle.md){ .md-button }
