"""
KafeHF — Library for loading datasets from Hugging Face Hub.

Hugging Face (https://huggingface.co) is the leading platform for sharing
and downloading machine learning datasets, models, and workspaces.

This library allows KAFE users to access thousands of datasets
public datasets directly from their programs, as in:

    Python:
        from datasets import load_dataset
        dataset = load_dataset("squad")

    KAFE:
        import huggingface;
        PARDOS df = huggingface.load_dataset("squad");

Optional external dependency: datasets (Hugging Face pack).
    uv sync --locked --extra huggingface
    In VS Code: "KAFE: Install Hugging Face Pack".
"""

from importlib import import_module
from typing import Any, Callable

from global_utils import check_sig
from TypeUtils import integer_type, string_list_type, string_type

hf_load_dataset: Callable[..., Any] | None = None


def _require_hf() -> Callable[..., Any]:
    """Load Hugging Face only when a KAFE program uses the integration."""
    global hf_load_dataset
    if hf_load_dataset is not None:
        return hf_load_dataset
    try:
        loaded: Callable[..., Any] = import_module("datasets").load_dataset
    except ImportError:
        raise Exception(
            "To use huggingface, install the Hugging Face pack: in VS Code run "
            '"KAFE: Install Hugging Face Pack"; from a checkout run '
            '"uv sync --locked --extra huggingface".'
        ) from None
    hf_load_dataset = loaded
    return loaded


@check_sig([1], [string_type])
def load_dataset(dataset_name):
    """
    Loads a dataset from Hugging Face Hub and returns it as a PARDOS DataFrame.

    A Hugging Face dataset is a collection of structured data (text,
    images, audio, etc.) that the community shares to train and evaluate
    Machine Learning models.

    Internally, the function:
    1. Download the dataset using the Hugging Face `datasets` library.
    2. Extract the default "train" split (if it exists).
    3. Convert the columns and rows to the KafePARDOS DataFrame format.

    Arguments:
        dataset_name (STR): Name of the dataset in Hugging Face Hub.
            Examples: "squad", "imdb", "mnli", "daily_dialog".

    Returns:
        PARDOS DataFrame with the data loaded.

    KAFE example:
        import huggingface;
        PARDOS df = huggingface.load_dataset("squad");
        show(df.head(5));

    Note: Requires internet connection and the `datasets` library installed.
    """
    load_from_hub = _require_hf()

    try:
        dataset_dict = load_from_hub(dataset_name)
    except Exception as e:
        raise Exception(
            f"huggingface: Error loading dataset '{dataset_name}': {e}"
        ) from e

    if hasattr(dataset_dict, "keys"):
        splits = list(dataset_dict.keys())
        if len(splits) == 0:
            raise Exception(f"huggingface: Dataset '{dataset_name}' has no splits.")
        split_name = "train" if "train" in splits else splits[0]
        ds = dataset_dict[split_name]
    else:
        ds = dataset_dict

    return _convert_to_pardos(ds, dataset_name)


@check_sig([2], [string_type], [string_type])
def load_dataset_split(dataset_name, split):
    """
    Load a specific split of a dataset from Hugging Face Hub.

    Splits are partitions of the dataset: "train",
    "test", "validation". Each split contains
    a different portion of the data.

    Arguments:
        dataset_name (STR): Name of the dataset in Hugging Face Hub.
        split (STR): Name of the split to load ("train", "test", "validation", etc.).

    Returns:
        PARDOS DataFrame with the data of the selected split.

    KAFE example:
        import huggingface;
        PARDOS test_df = huggingface.load_dataset_split("squad", "test");
        show(test_df.head(5));
    """
    load_from_hub = _require_hf()

    try:
        dataset_dict = load_from_hub(dataset_name, split=split)
    except Exception as e:
        raise Exception(
            f"huggingface: Error loading split '{split}' from dataset '{dataset_name}': {e}"
        ) from e

    return _convert_to_pardos(dataset_dict, dataset_name)


@check_sig(
    [1, 2, 3, 4], [string_type], [string_list_type], [string_type], [integer_type]
)
def load_dataset_matrix(dataset_name, columns=None, split="train", limit=0):
    """Load numeric columns as a matrix for NUMK and GESHA."""
    load_from_hub = _require_hf()
    try:
        dataset = load_from_hub(dataset_name, split=split)
    except Exception as exc:
        raise Exception(
            f"huggingface: Error loading split '{split}' from dataset '{dataset_name}': {exc}"
        ) from exc

    available = list(getattr(dataset, "column_names", []))
    if not columns:
        if not available:
            raise Exception("huggingface: Dataset columns are unavailable")
        first = next(iter(dataset), None)
        if first is None:
            return []
        columns = [name for name in available if _is_number(first.get(name))]
    else:
        missing = [name for name in columns if name not in available]
        if missing:
            raise Exception(f"huggingface: Missing columns: {missing}")

    if not columns:
        raise Exception("huggingface: No numeric columns found")

    rows = dataset
    if hasattr(dataset, "select_columns"):
        try:
            rows = dataset.select_columns(columns)
        except Exception:
            pass

    matrix = []
    for row in rows:
        values = []
        for name in columns:
            value = row.get(name)
            if not _is_number(value):
                raise Exception(
                    f"huggingface: Column '{name}' contains non-numeric or null values"
                )
            values.append(float(value))
        matrix.append(values)
        if limit > 0 and len(matrix) >= limit:
            break
    return matrix


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _convert_to_pardos(ds, dataset_name):
    """
    Converts a Hugging Face dataset to a PARDOS DataFrame.

    PARDOS DataFrames have the form:
        DataFrame(columns: List[str], data: List[List[value]])

    Arguments:
        ds: Hugging Face Dataset (datasets.Dataset object).
        dataset_name (STR): Name of the dataset (for error messages).

    Returns:
        PARDOS DataFrame with the converted data.
    """
    from lib.KafePARDOS.DataFrame import DataFrame

    column_names = list(ds.column_names)

    num_rows = len(ds)

    all_rows = []
    for i in range(num_rows):
        row_dict = ds[i]
        row = [row_dict[col] for col in column_names]

        converted_row = []
        for val in row:
            if isinstance(val, (int, float, str, bool)):
                converted_row.append(val)
            elif val is None:
                converted_row.append("")
            elif isinstance(val, list):
                converted_row.append(str(val))
            elif isinstance(val, dict):
                converted_row.append(str(val))
            else:
                converted_row.append(str(val))
        all_rows.append(converted_row)

    return DataFrame(column_names, all_rows)
