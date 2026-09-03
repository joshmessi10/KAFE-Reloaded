# OrdinalEncoder

## Name

OrdinalEncoder — categorical feature encoding using ordinal integer mapping.

## Category

ML preprocessing — library utility of KafeMACHINE (`.opencode/knowledge/ml-library.md`).

## Description

OrdinalEncoder converts categorical string features into integer codes by sorting categories alphabetically and assigning each a sequential integer starting from 0. Unlike one-hot encoding, ordinal encoding preserves a single column per feature, which is useful when the categories have a natural ordering or when dimensionality must be kept low.

For a column with sorted unique categories `[c_0, c_1, ..., c_{k-1}]`, each value `v` is mapped to its index: `encode(v) = i` where `c_i = v`. The inverse mapping restores the original category: `decode(i) = c_i`.

**Advantages**:

- Preserves dimensionality — each categorical column maps to a single integer column, avoiding the feature explosion of one-hot encoding.
- Simple and fast — the encoding is a dictionary lookup with O(1) per value.
- Reversible — `inverse_transform` perfectly restores original categories, making the transformation lossless.

**Limitations**:

- Implies an ordinal relationship — the integer assignment (0, 1, 2, ...) may imply a ranking that does not exist in the data. Algorithms that use numeric magnitudes (e.g., linear regression) may misinterpret the encoding.
- Alphabetical ordering is arbitrary — the sort order is lexicographic by default, which may not match the intended semantic order (e.g., "low" < "medium" < "high" is not alphabetical).
- Unseen categories at transform time raise errors — the encoder cannot handle categories not seen during `fit`, requiring refitting on the full dataset.

## Mathematical Foundation

- **Time Complexity**: O(n·d) for fit (scan all values, sort unique), O(n·d) for transform (dictionary lookup per cell)
- **Space Complexity**: O(k) per column where k is the number of unique categories
- **Key Formulas**: 
  - `encode(c_i) = i` where `c_i` is the i-th category in sorted order (0-indexed)
  - `decode(i) = c_i` — direct index lookup into the categories list

## Step-by-Step Algorithm

### Fit

1. For each column in the `columns` list, verify the column exists in the DataFrame.
2. Extract all values from the column, convert to strings, filter out `None`.
3. Compute unique categories and sort them lexicographically.
4. Build a mapping dictionary: `{category_string: integer_index}` for each category.
5. Store the mapping and mark the encoder as fitted.

### Transform

1. Verify the encoder is fitted (guard: `_check_fitted`).
2. For each row in the DataFrame:
   - For each column in the encoding list:
     - Convert the cell value to string.
     - Look up the integer index in the mapping dictionary.
     - If the value is not in the mapping, raise an error.
   - For columns not in the encoding list, preserve the original value.
3. Return a new DataFrame with the encoded values.

### Inverse Transform

1. Verify the encoder is fitted.
2. For each row in the DataFrame:
   - For each column in the encoding list:
     - Convert the cell to integer and validate it is within `[0, len(categories))`.
     - Look up the original category string by index.
   - For columns not in the encoding list, preserve the original value.
3. Return a new DataFrame with the restored categories.

## Motivation

Categorical data is pervasive in real-world datasets (colors, sizes, labels, statuses). KafeMACHINE needs a from-scratch ordinal encoder to teach the concept of categorical encoding without relying on external libraries. OrdinalEncoder complements `LabelEncoder` (single-column, row-level) and `OneHotEncoder` (binary matrix expansion) by providing column-level ordinal encoding on DataFrames, which is the most common pattern in preprocessing pipelines.

## Advantages

- Dimensionality-preserving: unlike one-hot encoding, does not increase feature count.
- Lossless: `inverse_transform` perfectly reconstructs original values.
- DataFrame-native: operates on PARDOS DataFrames, preserving column names and structure.
- Fits the KAFE educational model: the entire encoding logic is visible in 112 lines of Python, making it suitable for classroom study.

## Limitations

- Arbitrary ordering: alphabetical sort may not reflect semantic category order.
- No unknown category handling: unseen values at transform time raise exceptions rather than assigning a default.
- Numeric implication: algorithms that compute distances or weights on encoded values may treat the integer codes as meaningful magnitudes.

## When to Use

- When categorical features have a natural or acceptable ordinal interpretation.
- When dimensionality must be kept low (e.g., tree-based models that handle integer features well).
- When the full pipeline is supervised and the model can learn from the integer representation.

## When NOT to Use

- When categories have no natural ordering and the model is distance-based (use OneHotEncoder instead).
- When new unseen categories are expected at inference time (refit required).
- When the number of categories is very high and the integer range becomes misleading.

## Dependencies

- `src/lib/KafeMACHINE/BaseMachine.py` — base class providing the fit/transform contract, `_is_fitted` guard, and `_check_fitted` method.
- `src/lib/KafePARDOS/DataFrame.py` — accepts PARDOS DataFrames and returns encoded DataFrames preserving columns.
- `TypeUtils.py` / `global_utils.py` — `pardos_t`, `lista_cadenas_t`, `check_sig` for signature validation.
- `src/lib/KafeMACHINE/funciones.py` — `machine.ordinal_encoder()` factory.

## Related Concepts

- `label-encoder` — similar concept but operates on lists, not DataFrames; one column at a time.
- `one-hot-encoder` — binary matrix expansion; alternative when ordinal interpretation is inappropriate.
- `standard-scaler` / `minmax-scaler` — numeric feature scaling; often runs after encoding in a pipeline.
- `simple-imputer` — missing value handling; may run before encoding if nulls are present.
- Preprocessing family in `.opencode/knowledge/ml-library.md` (Preprocessing section).

## Usage Examples

```kf
import pardos;
import machine;

-- Multi-column encoding
List[STR] cols = ["color", "size", "label"];
List[List[STR]] df_data = [
    ["red", "S", "no"],
    ["blue", "M", "yes"],
    ["green", "L", "yes"],
    ["red", "M", "no"]
];
PARDOS df = pardos.DataFrame(cols, df_data);

MACHINE ord_enc = machine.ordinal_encoder();
PARDOS encoded_df = ord_enc.fit_transform(df, ["color", "size"]);
show(encoded_df);
-- color: blue=0, green=1, red=2; size: L=0, M=1, S=2

-- Inverse transform
PARDOS decoded_df = ord_enc.inverse_transform(encoded_df);
show(decoded_df);
-- Restores original string values

-- Single column
MACHINE ord_enc2 = machine.ordinal_encoder();
PARDOS encoded2 = ord_enc2.fit_transform(df, ["color"]);
show(encoded2);
```

Guards: calling `transform`/`inverse_transform` before `fit` raises `"OrdinalEncoder: Must call fit before transform"`. Encoding a column not present in the DataFrame raises `"OrdinalEncoder: Column '<name>' not found in DataFrame"`. A value not seen during `fit` raises `"OrdinalEncoder: Unseen category '<value>' in column '<name>'"`.

## Implementation Location

- `src/lib/KafeMACHINE/preprocessing/OrdinalEncoder.py` (class `OrdinalEncoder(BaseMachine)`).
- Factory: `src/lib/KafeMACHINE/funciones.py` — `ordinal_encoder()`.
- Package: `src/lib/KafeMACHINE/preprocessing/__init__.py` — exported as `OrdinalEncoder`.
- Tests: `tests/KafeMACHINE/preprocessing/test_ordinal_encoder.kf`, `test_ordinal_encoder_inverse.kf`, `test_ordinal_encoder_single_column.kf`.
- Error fixtures: `test_oe_column_not_found.error.kf`, `test_oe_not_fitted.error.kf`, `test_oe_unseen_category.error.kf`.

## Public API

- Factory: `machine.ordinal_encoder()`.
- Methods: `fit(df, columns)`, `transform(df)`, `fit_transform(df, columns)`, `inverse_transform(df)`.
- Attributes after fit: `categories_` (dict: column → sorted category list), `columns_` (list of encoded columns), `_is_fitted`.
- Accepted input: PARDOS DataFrame with string-typed categorical columns.

## References

- scikit-learn documentation — `sklearn.preprocessing.OrdinalEncoder`.
- Koeppen, S. (2020). "Feature Engineering for Machine Learning" — ordinal encoding chapter.
- `.opencode/knowledge/concepts/concept-template.md`.
- `.opencode/knowledge/ml-library.md` (KafeMACHINE priorities include preprocessing).
