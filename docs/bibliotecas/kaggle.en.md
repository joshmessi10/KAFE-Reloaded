# KAGGLE: Kaggle datasets

The **KAGGLE** library brings data from the internet into your program. With it you can download tables, sentences and images that other people already collected, and use them to train your Machine Learning models.

Before looking at the functions, let's learn five ideas: what a dataset is, what Kaggle is, what "download" and "cache" mean, what splitting into *train* and *test* is, and how a picture becomes numbers.

## First, the ideas { #ideas }

### What is a dataset? { #dataset }

A **dataset** is a **big box full of examples** to learn from. Think of a photo album of animals, each photo with the animal's name written below it. If you look at many of them, you learn to recognize a cat. A Machine Learning model learns the same way: by looking at many examples.

A dataset can be:

- A **table**, like a spreadsheet: each row is an example and each column is one piece of data (a flower's length, width, species…).
- A pile of **sentences**, each one with a label (for example, 1 = good review, 0 = bad review).
- A pile of **images**, each one with its class (cat, dog, airplane…).

### What is Kaggle? { #what-is-kaggle }

[Kaggle](https://www.kaggle.com) is an **online library of datasets**. Just like you ask a library for a book by its title, you ask Kaggle for a dataset by its name. The name has two parts separated by `/`: who uploaded it and what it is called. For example, `"uciml/iris"` is the `iris` dataset uploaded by `uciml`.

A Kaggle dataset is a **folder of files** (`.csv` tables, `.txt` texts, `.png` images…). That is why many functions also ask you for the name of the file you want to read.

### Download and cache { #cache }

To **download** is to copy files from the internet to your computer. The first time you ask for a dataset, KAFE downloads it. That needs internet and can take a while.

The **cache** is a **pantry**: what you already brought home from the market stays stored at home. The second time you ask for the same dataset, KAFE takes it from the pantry (the `~/.cache/kagglehub` folder on your computer), and it is almost instant.

### Splitting into *train* and *test* { #split }

To know whether a model really learned, it is not enough to ask it about things it already saw. It is like studying for an exam: if the exam has the same questions as your notebook, you can memorize them without understanding anything.

That is why data is split into two parts:

- **train**: the examples the model **studies** with. Usually the larger part, for example 80 %.
- **test**: examples the model **never saw**, used as the **exam**. For example, 20 %.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/datasets-split.svg"
<figcaption>From a box with 10 examples, 8 go to train (to study) and 2 go to test (for the exam).</figcaption>
</figure>

On Kaggle, some datasets already come split into two files: `train.csv` and `test.csv`. Others do not, and you split the data later with the [MACHINE](../libraries/machine.md) library.

### A picture is a grid of numbers { #image-grid }

A digital picture is made of tiny squares called **pixels**. Each pixel stores a number that says how much light it has. So a picture is a **grid of numbers**, like a mosaic where each tile has a number written on it.

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/datasets-pixels.svg"
<figcaption>A 5 × 5 pixel heart. Each lit square becomes a 1 and each empty square becomes a 0.</figcaption>
</figure>

KAFE stores each pixel's number between `0.0` (dark) and `1.0` (bright). A color picture has **3 layers** (called **channels**): red, green and blue. A gray picture has **1 channel**. That is why a picture is a list with the shape `[channels][height][width]`.

You can write a tiny picture by hand to see it. This is a gray 3 × 3 pixel plus sign:

```kafe
--8<-- "tests/DocsExamples/kaggle/image-grid.kf"
```

```text
--8<-- "tests/DocsExamples/kaggle/image-grid.expec"
```

**What happened here?**

1. `img` has 1 channel (gray), 3 rows of height and 3 columns of width: that is why its shape is `[1, 3, 3]`.
2. `img[0][1]` is the middle row of the only channel: all lit.
3. `img[0][0][1]` is a single pixel: top row, middle column.

KAGGLE's image functions do the same with real photos: they turn them into lists of numbers with this shape.

## Before you start: the Kaggle pack { #pack }

KAGGLE needs extra programs that **are not installed** with KAFE, because they are big and almost no program uses them. Together they make up the **Kaggle pack**:

| Package | What it is for |
|---|---|
| `kagglehub` | Downloads datasets from Kaggle. |
| `Pillow` | Opens images and resizes them. |
| `py7zr` | Opens `.7z` compressed files that some image datasets contain. |

To install the pack, use the VS Code extension **KAFE - Neural Language Suite** (by KAFEGROUP, on the VS Code Marketplace):

1. Open the **Command Palette** with `Ctrl+Shift+P` (on Mac, `Cmd+Shift+P`).
2. Type **KAFE: Install Kaggle Pack** and press Enter.
3. Wait for the installation to finish. You only do this once.

!!! note "For contributors working with the repository"
    If you work with a copy of the KAFE source code instead of the extension, install the pack with `uv sync --locked --extra kaggle`.

KAFE **never** installs packages by itself. If the pack is missing, the program stops and tells you how to install it:

```kafe
--8<-- "tests/DocsExamples/kaggle/no-pack.error.kf"
```

```text
--8<-- "tests/DocsExamples/kaggle/no-pack.error.stderr.expec"
```

!!! tip "Public and private datasets"
    **Public** datasets download without an account or password. Only **private** ones need Kaggle credentials: the file `~/.kaggle/kaggle.json` (or `KAGGLE_CONFIG_DIR/kaggle.json`) or the environment variables `KAGGLE_USERNAME` and `KAGGLE_KEY`.

## Import the library { #import }

Like every library, KAGGLE is a **toolbox** you bring in with `import`. Then you use each tool with `kaggle.` in front. Importing works even if the pack is not installed: you only need the pack when you call a function.

```kafe
--8<-- "tests/DocsExamples/kaggle/import.kf"
```

```text
--8<-- "tests/DocsExamples/kaggle/import.expec"
```

!!! warning "Common mistake: forgetting the `import`"
    If you use `kaggle.` without writing `import kaggle;`, KAFE doesn't know which box you mean:

    ```kafe
    --8<-- "tests/DocsExamples/kaggle/no-import.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/kaggle/no-import.error.stderr.expec"
    ```

!!! note "Messages with `kaggle: kaggle:`"
    Many errors from this library start with `kaggle:` twice. That is KAFE's current behavior: the library already adds its name and KAFE adds it again. The part that matters comes after it. KAGGLE's messages are in Spanish.

## How it works inside { #inside }

KAGGLE lives in the `src/lib/KafeKaggle/` folder of the KAFE source code. Almost everything is in the file `funciones.py`. When you call a function, the data goes through five steps, like a parcel traveling from a warehouse to your table:

<figure class="kafe-fig">
--8<-- "docs/assets/illustrations/datasets-kaggle-pipeline.svg"
<figcaption>Download, keep in the cache, read the file, turn it into numbers and, at the end, split into train and test.</figcaption>
</figure>

1. **Check before leaving.** KAFE checks your arguments (the name is not empty, `color_mode` is valid, `limit` is not negative…) **before** touching the internet. That way an error shows up right away.
2. **Download.** The first time a program uses KAGGLE, KAFE loads the `kagglehub` package (not earlier, so other programs start fast). `kagglehub` downloads the dataset and unpacks it.
3. **Keep it in the cache.** `kagglehub` leaves the files in `~/.cache/kagglehub` and tells KAFE which folder they are in. Next time, nothing is downloaded.
4. **Read the file.** KAFE walks through the folder, skips hidden files and the `__MACOSX` folder, and picks the file: first `file_name`, then `split` and, if neither is given, the only possible file.
    - A **CSV table** is read with Python's built-in `csv` reader (no pandas). The first row is the header.
    - An **image** is opened with Pillow, turned into color or gray, and resized. `.zip` and `.7z` files inside the dataset are unpacked first, taking care not to write outside the folder.
5. **Turn it into numbers.** Everything ends up as **lists of lists**, KAFE's data structure:
    - A table is a PARDOS DataFrame: a list of column names and a list of rows.
    - A matrix is `List[List[FLOAT]]`: each text cell is converted to a decimal number.
    - An image is `[channels][height][width]`: each pixel (from 0 to 255) is divided by 255.
    - Text labels (`cat`, `dog`…) are sorted alphabetically and numbered 0, 1, 2…

KAGGLE **does not split** the data into train and test: you do that last step with [MACHINE](../libraries/machine.md). The labeled image functions return a `MACHINE` box (the `ImageDataset` class in `dataset.py`) with two parts: `[0]` is the images and `[1]` is the labels.

## Library map { #map }

| Page | Functions | What for |
|---|---|---|
| [Tables](kaggle/tablas.md) | `load_dataset`, `load_dataset_split`, `load_dataset_matrix` | Read CSV files as a DataFrame or as a matrix of numbers. |
| [Labeled sentences](kaggle/texto.md) | `load_text_dataset` | Read sentences with their class, to classify texts. |
| [Images](kaggle/imagenes.md) | `load_image`, `load_images`, `load_image_dataset`, `load_image_folder_dataset` | Turn photos into numbers, with or without labels. |

To see real Kaggle datasets used with each algorithm, look at the [MACHINE examples](../ejemplos/machine-kaggle.md).

## What did you learn?

- A **dataset** is a box of examples, and Kaggle is an online library of datasets.
- KAGGLE needs the **Kaggle pack**: install it in VS Code with **KAFE: Install Kaggle Pack**.
- The first download needs internet; after that, the **cache** keeps it on your computer.
- Inside, everything ends up as **lists of lists** of numbers.

[Start: Tables :material-arrow-right:](kaggle/tablas.md){ .md-button .md-button--primary }
