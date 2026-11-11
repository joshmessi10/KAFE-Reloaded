# KAGGLE: images

This page is part of the [KAGGLE](../kaggle.md) library. Here you learn to turn photos into numbers. If you haven't read it yet, first look at [a picture is a grid of numbers](../kaggle.md#image-grid).

!!! info "About the examples on this page"
    The functions on this page need internet and the [Kaggle pack](../kaggle.md#pack). That is why their examples are shown with an **example output**: it is what you will see with the pack installed and a connection. The errors are tested, because KAFE checks them **before** downloading anything.

The image functions look for `.png`, `.jpg`, `.jpeg` and `.bmp` files inside the dataset, in all its folders. Each image goes through three steps:

1. **It is resized** to `height × width` pixels (32 × 32 by default), so they all have the same size.
2. **The color is chosen**: `"rgb"` gives 3 channels (red, green, blue) and `"gray"` (or `"grayscale"`) gives 1 gray channel.
3. **It becomes numbers** between `0.0` and `1.0`, with the shape `[channels][height][width]`.

That shape is what [GESHA](../../libraries/gesha.md)'s convolution layers expect.

!!! warning "Images take a lot of memory"
    Each 32 × 32 color image is 3 × 32 × 32 = 3072 numbers. A thousand images are more than three million. Use `limit` to load a small sample first.

??? info "For the curious 🤓"
    A pixel stored in the file goes from 0 to 255. KAFE divides it by 255 to keep it between 0 and 1: $p_{\text{KAFE}} = p / 255$. Loading $N$ images takes memory proportional to $N \times C \times H \times W$ (images × channels × height × width).

### `kaggle.load_image(dataset_name, image_path, height, width, color_mode)` { #load_image }

**What it does:** Loads **one single** image from the dataset as a list of numbers `[channels][height][width]`.

**When to use it:** To look at one particular image or to test your model with one example.

| Parameter | Type | What it means |
|---|---|---|
| `dataset_name` | `STR` | The dataset name, `"owner/name"`. |
| `image_path` | `STR` | The image's path inside the dataset, like `"train/12.png"`. Just the file name also works if no other file has the same name. |
| `height` | `INT` | Optional. Final height in pixels. By default, `32`. |
| `width` | `INT` | Optional. Final width in pixels. By default, `32`. |
| `color_mode` | `STR` | Optional. `"rgb"` (3 channels) or `"gray"` (1 channel). By default, `"rgb"`. |

**Returns:** `List[List[List[FLOAT]]]`: one image.

!!! note "This example needs internet"
    It needs a connection and the Kaggle pack. Replace `"owner/images"` and `"train/12.png"` with a real dataset and image. If the path doesn't exist, the error shows you the list of available files.

**Example:** a gray 28 × 28 image.

```kafe
import kaggle;
List[List[List[FLOAT]]] img = kaggle.load_image("owner/images", "train/12.png", 28, 28, "gray");
show([len(img), len(img[0]), len(img[0][0])]);
```

**Example output:** `[channels, height, width]`.

```text
[1, 28, 28]
```

??? warning "Common mistake"
    `color_mode` only accepts `"rgb"`, `"gray"` or `"grayscale"`:

    ```kafe
    --8<-- "tests/DocsExamples/kaggle/load_image-color-mode.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/kaggle/load_image-color-mode.error.stderr.expec"
    ```

### `kaggle.load_images(dataset_name, height, width, color_mode, limit)` { #load_images }

**What it does:** Loads **all** the images in the dataset (or the first `limit`), sorted by their path.

**When to use it:** When you want a pile of images **without labels**, for example to group them or for an autoencoder.

| Parameter | Type | What it means |
|---|---|---|
| `dataset_name` | `STR` | The dataset name, `"owner/name"`. |
| `height` | `INT` | Optional. Final height. By default, `32`. |
| `width` | `INT` | Optional. Final width. By default, `32`. |
| `color_mode` | `STR` | Optional. `"rgb"` or `"gray"`. By default, `"rgb"`. |
| `limit` | `INT` | Optional. The most images to load. `0` = all. |

**Returns:** `List[List[List[List[FLOAT]]]]`: a list of images, with the shape `[images][channels][height][width]`.

!!! note "This example needs internet"
    It needs a connection and the Kaggle pack. The CIFAR-10 dataset is big: the first download takes a while.

**Example:**

```kafe
import kaggle;
List[List[List[List[FLOAT]]]] imgs = kaggle.load_images("ayush1220/cifar10", 32, 32, "rgb", 2);
show([len(imgs), len(imgs[0]), len(imgs[0][0]), len(imgs[0][0][0])]);
```

**Example output:** `[images, channels, height, width]`.

```text
[2, 3, 32, 32]
```

??? warning "Common mistake"
    `limit` cannot be negative. To load all of them, use `0`:

    ```kafe
    --8<-- "tests/DocsExamples/kaggle/load_images-negative-limit.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/kaggle/load_images-negative-limit.error.stderr.expec"
    ```

### `kaggle.load_image_dataset(dataset_name, labels_file, height, width, color_mode, limit)` { #load_image_dataset }

**What it does:** Loads images **with their label**, which it reads from a CSV file in the dataset. It matches each image with its CSV row using the file name without its extension (`12.png` ↔ id `12`).

**When to use it:** When the dataset keeps the classes in a table, for example `trainLabels.csv` with the columns `id` and `label`.

| Parameter | Type | What it means |
|---|---|---|
| `dataset_name` | `STR` | The dataset name, `"owner/name"`. |
| `labels_file` | `STR` | The label CSV. It must have an id column (`id`, `filename`, `image`, `file` or `img`) and a class column (`label`, `class`, `category`, `clase` or `etiqueta`). |
| `height` | `INT` | Optional. Final height. By default, `32`. |
| `width` | `INT` | Optional. Final width. By default, `32`. |
| `color_mode` | `STR` | Optional. `"rgb"` or `"gray"`. By default, `"rgb"`. |
| `limit` | `INT` | Optional. The most labeled images to load. `0` = all, and then **every** image must have a label. |

**Returns:** `MACHINE`: a box with two parts. `data[0]` is the images (`X`) and `data[1]` is the labels (`y`, `List[INT]`). Classes are numbered in alphabetical order: if they are `cat` and `dog`, `cat` is 0 and `dog` is 1.

!!! note "This example needs internet"
    It needs a connection and the Kaggle pack.

**Example:**

```kafe
import kaggle;
MACHINE data = kaggle.load_image_dataset("ayush1220/cifar10", "trainLabels.csv", 32, 32, "rgb", 4);
List[List[List[List[FLOAT]]]] X = data[0];
List[INT] y = data[1];
show([len(X), len(X[0]), len(X[0][0]), len(X[0][0][0])]);
show(len(y));
```

**Example output:**

```text
[4, 3, 32, 32]
4
```

??? warning "Common mistake"
    `labels_file` cannot be empty:

    ```kafe
    --8<-- "tests/DocsExamples/kaggle/load_image_dataset-empty-labels.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/kaggle/load_image_dataset-empty-labels.error.stderr.expec"
    ```

### `kaggle.load_image_folder_dataset(dataset_name, height, width, color_mode, limit, split)` { #load_image_folder_dataset }

**What it does:** Loads labeled images when **the class is the folder's name**. It is like a dresser with one drawer per class: everything in the `cat/` drawer is a cat.

```text
train/
├── cat/   0001.png  0002.png …
└── dog/   0001.png  0002.png …
```

**When to use it:** For image classification datasets without a label CSV, like CIFAR-10.

| Parameter | Type | What it means |
|---|---|---|
| `dataset_name` | `STR` | The dataset name, `"owner/name"`. |
| `height` | `INT` | Optional. Final height. By default, `32`. |
| `width` | `INT` | Optional. Final width. By default, `32`. |
| `color_mode` | `STR` | Optional. `"rgb"` or `"gray"`. By default, `"rgb"`. |
| `limit` | `INT` | Optional. The most images to load. `0` = all. |
| `split` | `STR` | Optional. Uses only images inside a folder with this name, like `"train"` or `"test"`. `""` = all. By default, `"train"`. |

**Returns:** `MACHINE`: the same two-part box as `load_image_dataset`. `data[0]` is the images and `data[1]` is the labels.

!!! tip "A sample with several classes"
    If you set a `limit`, KAFE **shuffles** the images before taking the sample, always in the same way (with a fixed seed). That way a small sample has several classes and not only the first folder.

!!! note "This example needs internet"
    It needs a connection and the Kaggle pack.

**Example:**

```kafe
import kaggle;
MACHINE data = kaggle.load_image_folder_dataset("ayush1220/cifar10", 32, 32, "rgb", 4, "train");
List[List[List[List[FLOAT]]]] X = data[0];
List[INT] y = data[1];
show([len(X), len(X[0]), len(X[0][0]), len(X[0][0][0])]);
show(len(y));
```

**Example output:**

```text
[4, 3, 32, 32]
4
```

KAGGLE does not split images into *train* and *test*. For that, after loading them, use `machine.stratified_train_test_split` from [MACHINE](../../libraries/machine.md), which keeps the same proportion of each class in both parts.

??? warning "Common mistake"
    `height` and `width` must be **positive** whole numbers. A height of 0 pixels makes no sense:

    ```kafe
    --8<-- "tests/DocsExamples/kaggle/load_image_folder_dataset-zero-height.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/kaggle/load_image_folder_dataset-zero-height.error.stderr.expec"
    ```

## Summary of all functions { #summary }

| Function | Page |
|---|---|
| [`kaggle.load_dataset(dataset_name, file_name)`](tablas.md#load_dataset) | Tables |
| [`kaggle.load_dataset_split(dataset_name, file_name, split)`](tablas.md#load_dataset_split) | Tables |
| [`kaggle.load_dataset_matrix(dataset_name, columns, split, limit)`](tablas.md#load_dataset_matrix) | Tables |
| [`kaggle.load_text_dataset(dataset_name, file_name, delimiter, text_column, label_column, limit)`](texto.md#load_text_dataset) | Labeled sentences |
| [`kaggle.load_image(dataset_name, image_path, height, width, color_mode)`](#load_image) | Images |
| [`kaggle.load_images(dataset_name, height, width, color_mode, limit)`](#load_images) | Images |
| [`kaggle.load_image_dataset(dataset_name, labels_file, height, width, color_mode, limit)`](#load_image_dataset) | Images |
| [`kaggle.load_image_folder_dataset(dataset_name, height, width, color_mode, limit, split)`](#load_image_folder_dataset) | Images |

## What did you learn?

- Tables arrive as a DataFrame (`load_dataset`) or as a matrix of numbers (`load_dataset_matrix`).
- Labeled sentences arrive as a DataFrame with the columns `text` and `label`.
- A **picture** is a grid of numbers with the shape `[channels][height][width]`.
- With labels, images arrive in a `MACHINE` box: `[0]` is the images and `[1]` is the labels.

[Next library: Hugging Face :material-arrow-right:](../huggingface.md){ .md-button .md-button--primary }
