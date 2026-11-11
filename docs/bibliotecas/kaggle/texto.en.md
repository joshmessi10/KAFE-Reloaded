# KAGGLE: labeled sentences

This page is part of the [KAGGLE](../kaggle.md) library. Here you learn to read sentences that come with a class, like good or bad reviews.

!!! info "About the examples on this page"
    The functions on this page need internet and the [Kaggle pack](../kaggle.md#pack). That is why their examples are shown with an **example output**: it is what you will see with the pack installed and a connection. The errors are tested, because KAFE checks them **before** downloading anything.

Some datasets are lists of sentences, each one with a number that says its **class**. For example, restaurant reviews: `1` if the review is good and `0` if it is bad. Each line of the file has the sentence, a separator (almost always a tab, `TAB`) and the label:

```text
Wow... Loved this place.	1
Crust is not good.	0
```

These files **have no header**: every line is an example. That is why they have their own function.

### `kaggle.load_text_dataset(dataset_name, file_name, delimiter, text_column, label_column, limit)` { #load_text_dataset }

**What it does:** Reads a file of labeled sentences and gives you a DataFrame with two columns: `text` (the sentence) and `label` (the whole-number label).

**When to use it:** To train a model that classifies texts, like the [RNN sentiment analysis example](../../ejemplos/ejemplo-rnn2-sentimiento.kf).

| Parameter | Type | What it means |
|---|---|---|
| `dataset_name` | `STR` | The dataset name, `"owner/name"`. |
| `file_name` | `STR` | Optional. The `.txt`, `.tsv` or `.csv` file. Empty = the only text file. |
| `delimiter` | `STR` | Optional. **A single character** that separates the cells. By default, the tab. |
| `text_column` | `INT` | Optional. Which cell holds the sentence, counting from 0. By default, `0`. |
| `label_column` | `INT` | Optional. Which cell holds the label. By default, `1`. |
| `limit` | `INT` | Optional. The most sentences to keep. `0` = all. |

**Returns:** `PARDOS`: a DataFrame with the columns `text` (`STR`) and `label` (`INT`).

!!! note "This example needs internet"
    It needs a connection and the Kaggle pack.

**Example:** Yelp reviews. The file path is written in full because the dataset contains two copies with the same name.

```kafe
import kaggle;
PARDOS df = kaggle.load_text_dataset("marklvl/sentiment-labelled-sentences-data-set", "sentiment labelled sentences/yelp_labelled.txt");
show(df.shape());
List[STR] texts = df.col("text");
List[INT] labels = df.col("label");
show(texts[0]);
show(labels[0]);
```

**Example output:**

```text
[1000, 2]
Wow... Loved this place.
1
```

??? warning "Common mistake"
    `delimiter` must be **one** character. `"; "` has two (semicolon and space):

    ```kafe
    --8<-- "tests/DocsExamples/kaggle/load_text_dataset-delimiter.error.kf"
    ```

    ```text
    --8<-- "tests/DocsExamples/kaggle/load_text_dataset-delimiter.error.stderr.expec"
    ```

## What did you learn?

- Labeled sentence files have no header: every line is an example.
- `load_text_dataset` gives you a DataFrame with the columns `text` and `label`.

[Next: Images :material-arrow-right:](imagenes.md){ .md-button .md-button--primary }
