# HUGGINGFACE: Hugging Face datasets

The **HUGGINGFACE** library brings datasets from the internet into your program, just like [KAGGLE](kaggle.md), but from another library: Hugging Face. It gives them to you as a table or as a matrix of numbers, ready to train a model.

If you don't know yet what a dataset is, what the cache is or what splitting into *train* and *test* means, first read [the ideas on the KAGGLE page](kaggle.md#ideas). Here we review them quickly.

## First, the ideas { #ideas }

### What is Hugging Face? { #what-is-hugging-face }

[Hugging Face](https://huggingface.co) is another **online library of datasets**, widely used in artificial intelligence. It keeps thousands of **datasets** (big boxes of examples to learn from): flower tables, movie reviews, questions and answers…

Each dataset has a name. Sometimes it is a single word (`"imdb"`) and sometimes it has two parts, who uploaded it and what it is called (`"scikit-learn/iris"`).

### The *splits* come ready-made { #splits }

To know whether a model learned, you separate the examples into two piles: **train** (to study) and **test** (for the exam, with examples the model never saw). Each pile is called a **split**.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/datasets-split.svg"
<figcaption>From a box with 10 examples, 8 go to train (to study) and 2 go to test (for the exam).</figcaption>
</figure>

The big difference from Kaggle: on Hugging Face, many datasets **already come with their splits**, with names like `"train"`, `"test"` or `"validation"` (a third pile used to tune the model while it studies). You only pick the one you want.

### Download and cache { #cache }

The first time you ask for a dataset, KAFE **downloads** it (copies it from the internet to your computer). After that it stays in the **cache**, a pantry on your computer (usually the `~/.cache/huggingface` folder). The second time, there is no need to download it.

## Before you start: the Hugging Face pack { #pack }

HUGGINGFACE needs the `datasets` package, which **is not installed** with KAFE because it is big and almost no program uses it. That package makes up the **Hugging Face pack**.

To install it, use the VS Code extension **KAFE - Neural Language Suite** (by KAFEGROUP, on the VS Code Marketplace):

1. Open the **Command Palette** with `Ctrl+Shift+P` (on Mac, `Cmd+Shift+P`).
2. Type **KAFE: Install Hugging Face Pack** and press Enter.
3. Wait for the installation to finish. You only do this once.

!!! note "For contributors working with the repository"
    If you work with a copy of the KAFE source code instead of the extension, install the pack with `uv sync --locked --extra huggingface`.

KAFE **never** installs packages by itself. If the pack is missing, the program stops and tells you how to install it:

```kafe
--8<-- "tests/DocsExamples/huggingface/no-pack.error.kf"
```

```text
--8<-- "tests/DocsExamples/huggingface/no-pack.error.stderr.expec"
```

## Import the library { #import }

Like every library, HUGGINGFACE is a **toolbox** you bring in with `import`. Then you use each tool with `huggingface.` in front. Importing works even if the pack is not installed: you only need the pack when you call a function.

```kafe
--8<-- "tests/DocsExamples/huggingface/import.kf"
```

```text
--8<-- "tests/DocsExamples/huggingface/import.expec"
```

!!! warning "Common mistake: forgetting the `import`"
    If you use `huggingface.` without writing `import huggingface;`, KAFE doesn't know which box you mean:

    ```kafe
    --8<-- "tests/DocsExamples/huggingface/no-import.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/huggingface/no-import.error.stderr.expec"
    ```

## How it works inside { #inside }

HUGGINGFACE lives in the file `src/lib/KafeHF/functions.py` of the KAFE source code. It is a small library: it works as a **bridge** between KAFE and Hugging Face's `datasets` package. When you call a function, the data goes through five steps:

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/datasets-hf-pipeline.svg"
<figcaption>Download with datasets, keep in the cache, pick a split, read its rows and turn them into lists of lists.</figcaption>
</figure>

1. **Load the package only when needed.** The first time you call a function, KAFE looks up the `load_dataset` function of the `datasets` package and keeps it for the next calls. If the package is missing, you get the pack message.
2. **Download.** `datasets` downloads the dataset from Hugging Face.
3. **Keep it in the cache.** `datasets` leaves the files on your computer for next time.
4. **Pick a split.** `load_dataset` takes `"train"` if it exists (otherwise, the first split there is). `load_dataset_split` and `load_dataset_matrix` take the split you ask for.
5. **Turn it into lists of lists**, KAFE's data structure. KAFE walks through the rows one by one:
    - For a [PARDOS](../libraries/pardos.md) **DataFrame**, it keeps the column names and one list per row. Numbers, texts and `BOOL` values stay the same; an empty value becomes `""`; a list or a dictionary becomes text.
    - For a **matrix**, it takes only the columns you asked for and turns each value into a `FLOAT`. If a value is not a number, it stops with an error that names the column. With `limit`, it stops reading when it reaches that number of rows.

The result is what [MACHINE](../libraries/machine.md) and [GESHA](../libraries/gesha.md) use for training.

## Library map { #map }

| Page | Functions | What for |
|---|---|---|
| [Reference](huggingface/referencia.md) | `load_dataset`, `load_dataset_split`, `load_dataset_matrix` | Load a dataset as a DataFrame, pick a split, or read only the numbers. |

## What did you learn?

- Hugging Face is an online library of datasets, and many come with their **splits** ready-made.
- HUGGINGFACE needs the **Hugging Face pack**: install it in VS Code with **KAFE: Install Hugging Face Pack**.
- Inside, KAFE uses the `datasets` package and turns the rows into **lists of lists**.

[Start: Reference :material-arrow-right:](huggingface/referencia.md){ .md-button .md-button--primary }
