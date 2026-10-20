# KafeKAGGLE: Kaggle datasets

KafeKAGGLE downloads public datasets through `kagglehub` and exposes them to KAFE. Public downloads do not require credentials. Private datasets use the credentials supported by `kagglehub`. The library is optional and is installed on first use if it is missing.

Use [MACHINE examples by algorithm](../ejemplos/machine-kaggle.md) to see five real datasets used for clustering, classification, and regression.

## Tabular data

| Function | Result | Use |
|---|---|---|
| `kaggle.load_dataset(dataset_name, file_name="")` | PARDOS DataFrame | Read a CSV with headers. |
| `kaggle.load_dataset_split(dataset_name, file_name, split="")` | PARDOS DataFrame | Select a file using `train`, `test`, or a path. |
| `kaggle.load_dataset_matrix(dataset_name, columns, split="", limit=0)` | `List[List[FLOAT]]` | Read selected numeric columns without creating a DataFrame. |

```kafe
import kaggle;
import machine;

List[STR] columns = ["SepalLengthCm", "PetalLengthCm"];
List[List[FLOAT]] data = kaggle.load_dataset_matrix("uciml/iris", columns, "Iris.csv", 50);
MACHINE model = machine.kmeans(3);
model.fit(data);
```

`columns` selects features. `limit=0` means all rows. When `columns` is empty, KAFE infers numeric columns from the first data row. Empty CSV cells become NaN. Other cells are converted to a number when possible. Files are parsed with Python's standard `csv` library, without pandas.

### File selection

Kaggle datasets are collections of files rather than predefined train/test splits. A split name therefore selects a file: `train` looks for `train.csv`, `test` looks for `test.csv`, and an exact relative path such as `data/train.csv` is also accepted. An explicit `file_name` has priority. If neither selector is supplied, KAFE reads the only CSV; if several exist, it reports the available candidates.

```kafe
import kaggle;
PARDOS df = kaggle.load_dataset("uciml/iris", "Iris.csv");
show(df.head(5));
```

### Authentication, cache, and memory

`kagglehub` downloads public datasets anonymously. Private datasets can use `~/.kaggle/kaggle.json`, `KAGGLE_CONFIG_DIR/kaggle.json`, or `KAGGLE_USERNAME` and `KAGGLE_KEY`. KAFE tries to install `kagglehub` with the current Python interpreter if necessary; without network access, it reports the manual installation command.

Downloaded files are cached under `~/.cache/kagglehub`. Loaded rows still occupy memory. Use `limit`, sampling, or `load_dataset_matrix` when a DataFrame is unnecessary. This tabular API reads CSV files only.

## Labeled text datasets

`load_text_dataset` reads headerless records such as `sentence<TAB>0` or `sentence<TAB>1`. The normal CSV loader expects a header and is not suitable for these files.

| Function | Result |
|---|---|
| `load_text_dataset(dataset_name, file_name="", delimiter="\t", text_column=0, label_column=1, limit=0)` | PARDOS DataFrame with `text` (`STR`) and `label` (`INT`) columns. |

`file_name` can name a `.txt`, `.tsv`, or `.csv` file. If omitted, KAFE selects the only suitable file or lists candidates when selection is ambiguous. `delimiter` must contain one character; column indexes and `limit` must be nonnegative. Labels must convert to integers. `limit=0` reads all records.

```kafe
import kaggle;

PARDOS df = kaggle.load_text_dataset(
    "marklvl/sentiment-labelled-sentences-data-set",
    "sentiment labelled sentences/yelp_labelled.txt"
);
List[STR] texts = df.col("text");
List[INT] labels = df.col("label");
show([len(texts), len(labels)]);
```

The [RNN sentiment example](../ejemplos/ejemplo-rnn2-sentimiento.kf) combines this loader with the MACHINE tokenizer.

## Images

KafeKAGGLE discovers `.png`, `.jpg`, `.jpeg`, and `.bmp` files recursively, excluding hidden files and `__MACOSX`. It decodes and resizes images and normalizes pixels to `[0, 1]`. Each image has the `[C][H][W]` layout: channel, height, width.

| Function | Result |
|---|---|
| `load_image(dataset_name, image_path, height=32, width=32, color_mode="rgb")` | One `[C][H][W]` image. |
| `load_images(dataset_name, height=32, width=32, color_mode="rgb", limit=0)` | List of images. |
| `load_image_dataset(dataset_name, labels_file, height=32, width=32, color_mode="rgb", limit=0)` | Indexable `MACHINE` container: `[0]=X`, `[1]=y`. |
| `load_image_folder_dataset(dataset_name, height=32, width=32, color_mode="rgb", limit=0, split="train")` | The same container, using parent folders as labels. |

- `"rgb"` produces three channels. `"gray"` or `"grayscale"` produces one.
- `limit=0` loads every image; a positive limit loads at most that many.
- `load_image_dataset` matches image stems with a label CSV and maps class names to integers in alphabetical order.
- `load_image_folder_dataset` infers labels from parent folders. `split` selects an ancestor folder such as `train` or `test`; `split=""` includes all folders. Paths are sorted, then shuffled with a fixed seed before applying `limit`, so a small sample can include several classes.

Image loading uses optional Pillow for decoding and resizing, and optional `py7zr` for nested `.7z` archives. ZIP archives use Python's standard library. Archive paths are checked to prevent extraction outside the destination.

All image pixels are held in memory, with space complexity `O(N × C × H × W)`. A large image dataset can therefore use several gigabytes. Load a bounded sample before experimenting with a full dataset.

KafeKAGGLE does not split images into training and test sets. Use `machine.stratified_train_test_split` after loading to preserve class proportions:

```kafe
import kaggle;
import machine;

MACHINE data = kaggle.load_image_folder_dataset("ayush1220/cifar10", 32, 32, "rgb", 4000, "train");
List[List[List[List[FLOAT]]]] X = data[0];
List[INT] y = data[1];
MACHINE split = machine.stratified_train_test_split(X, y, 0.2, 42);
List[List[List[List[FLOAT]]]] X_train = split[0];
List[List[List[List[FLOAT]]]] X_test = split[1];
```

For a single image or unlabeled image list, use `load_image` or `load_images`. Use `load_image_dataset` for a label CSV and `load_image_folder_dataset` for folder labels.
