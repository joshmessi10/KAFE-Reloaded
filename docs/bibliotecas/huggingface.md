# KafeHF: Hugging Face datasets

KafeHF reads Hugging Face datasets through the optional `datasets` package. `load_dataset` and `load_dataset_split` return PARDOS DataFrames. `load_dataset_matrix` reads selected numeric features directly into a KAFE matrix without constructing a DataFrame first.

```kafe
import huggingface;
import machine;

List[STR] columns = ["sepal_length", "sepal_width"];
List[List[FLOAT]] data = huggingface.load_dataset_matrix("mstz/iris", columns, "train", 0);
MACHINE model = machine.kmeans(3);
model.fit(data);
```

`columns` selects features and `limit` caps rows; `0` reads the full split. Numeric values become `FLOAT`. When `datasets` is missing, KAFE attempts installation with the active Python interpreter and reports a manual command if network access or permissions prevent it.

K-Means and DBSCAN keep their observations in memory. Reading a matrix directly avoids an intermediate PARDOS DataFrame, but it does not make these algorithms streaming implementations. Apply a row limit or sample a large dataset before fitting.

[Compare the Kaggle ingestion API](kaggle.md).
