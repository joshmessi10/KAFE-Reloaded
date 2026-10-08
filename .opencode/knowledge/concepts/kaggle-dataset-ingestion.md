# Kaggle Dataset Ingestion

## Name

Kaggle Dataset Ingestion (KafeKAGGLE)

## Category

Library utility — data ingestion (KAFE built-in library).

## Description

Kaggle is a platform for ML competitions and shared datasets. Each dataset is
published as a set of files (usually one CSV inside a ZIP) that can be
downloaded through the official API. KafeKAGGLE (`import kaggle;`) downloads a
dataset, selects a CSV, parses it with the standard-library `csv` reader, and
returns either a KafePARDOS `DataFrame` (tabular view) or a
`List[List[FLOAT]]` matrix (numeric view for NUMK/GESHA).

Unlike Hugging Face — where data is organized in named splits
(`train`/`test`/`validation`) — Kaggle has no splits: the files themselves play
that role. The KafeKAGGLE API keeps Hugging Face symmetry by interpreting
`split` as a **split-shaped file selector** (`"train"` resolves to
`train.csv`).

## Mathematical Foundation

Dataset ingestion is a parsing and type-inference problem rather than a model:

- **Parse cost**: reading a CSV with `n` rows and `c` columns is
  $O(n \cdot c)$ cell operations (each cell is tokenized, stripped and
  classified).
- **Type inference**: a cell $v$ is numeric iff `float(v)` succeeds and
  $v \neq \emptyset$; complexity $O(1)$ amortized per cell (attempts once per
  cell).
- **Matrix extraction** with column selection $S \subseteq C$: each row is
  mapped to its selected coordinates, $O(n \cdot |S|)$; with `limit = k` the
  loop stops after $k$ rows, $O(k \cdot |S|)$.
- **Space**: the full table is materialized in memory, $O(n \cdot c)$ cells;
  `load_dataset_matrix` avoids the intermediate `DataFrame`, reducing the
  constant factor (no type-object wrapping for non-selected columns).

- **Time Complexity**: $O(n \cdot c)$ per load (network download excluded,
  which is $O(\text{dataset bytes})$).
- **Space Complexity**: $O(n \cdot c)$ for the table; temporary ZIP extraction
  is $O(\text{dataset bytes})$ and is deleted after each call.
- **Key Formulas**: numeric-cell predicate
  $N(v) = \big[v \in \mathbb{R}\big] \wedge \big[v \neq ""\big]$ applied per
  selected column.

## Step-by-Step Algorithm

1. Validate `dataset_name` (non-empty, `dueno/conjunto` format) before any
   network call.
2. Check the optional dependency `kaggle`; auto-install with
   `pip install kaggle` through the current interpreter if missing.
3. Check credentials (`~/.kaggle/kaggle.json` or `KAGGLE_USERNAME` +
   `KAGGLE_KEY`); raise a Spanish error explaining how to configure them.
4. Download the dataset ZIP to a temporary directory with `KaggleApi`
   (suppressing the API's informational stdout so program output stays
   deterministic).
5. Select the CSV: explicit `file_name` > `split` selector (`"train"` →
   `train.csv`, exact path allowed) > single CSV (error listing candidates
   otherwise).
6. Parse the CSV with `csv.reader` using `utf-8-sig` (BOM tolerance); the
   first row is the header; blank rows are dropped and short rows are padded
   (same rules as `pardos.read_csv`).
7. Return the result:
   - `load_dataset`/`load_dataset_split` → cells typed with `inferir_tipo`
     into a PARDOS `DataFrame`;
   - `load_dataset_matrix` → each selected cell converted with `float()`,
     rejecting nulls/non-numeric cells, stopping at `limit` rows.
8. Delete the temporary directory (context manager).

## Motivation

Educational ML pipelines need data before models. KAFE already taught
dataframes (PARDOS) and numeric matrices (NUMK); Kaggle is the most popular
source of practice datasets, and importing its data must not force users out
of the DSL into Python. The feature also demonstrates the real engineering
pattern of *optional dependencies with graceful degradation*, which students
encounter constantly in production code.

## Advantages

- **Same mental model as KafeHF**: three functions, three return shapes;
  switching data source changes only the import and the dataset identifier.
- **No hidden dependencies**: parsing uses the Python standard library, so
  installing `kaggle` (only when used) does not drag pandas into the runtime.
- **Deterministic output**: API chatter is redirected away from program
  stdout, so `.expec` fixtures stay byte-stable.
- **Fail-fast diagnostics**: credential/format/column errors are raised in
  Spanish *before* touching the network or allocating large buffers.
- **Educational visibility**: the split-vs-file difference is documented at
  the API level, teaching how data organization differs across platforms.

## Limitations

- **Credentials required**: even public datasets need a Kaggle API key, so
  classroom setups require a one-time configuration step.
- **Whole-dataset download per call**: each call re-downloads the ZIP to a
  temporary directory; there is no caching layer (mitigate with `limit` or by
  loading once into a variable).
- **CSV only**: ZIP archives must contain the selected file as CSV; other
  formats (parquet, JSON) are rejected with an explicit error.
- **In-memory tables**: $O(n \cdot c)$ residency makes huge datasets
  impractical; use `load_dataset_matrix` with `limit`, sampling, or split the
  work outside KAFE.

## When to Use

- Bringing a public Kaggle dataset into a KAFE program (DataFrame for
  exploration with PARDOS, matrix for NUMK/GESHA models).
- Teaching the full ML workflow: acquire → clean → train → evaluate.
- Prototyping clustering/classification exercises on well-known datasets
  (iris, titanic, etc.).

## When NOT to Use

- Datasets already in local CSV files — use `pardos.read_csv`.
- Datasets hosted on Hugging Face — use `huggingface.*` (ADR-0010).
- Very large datasets that do not fit in memory — use `limit`, sampling, or an
  external preprocessing pipeline.
- Non-CSV formats — convert upstream or choose another source.

## Dependencies

- Optional Python dependency: `kaggle` (auto-installed on first use).
- KAFE: `KafePARDOS.DataFrame` (lazy import), `TypeUtils` (`cadena_t`,
  `lista_cadenas_t`, `entero_t`), `global_utils.check_sig`.
- Standard library: `csv`, `zipfile`, `tempfile`, `subprocess`, `io`, `os`.

## Related Concepts

- Hugging Face dataset ingestion (`kaggle-dataset-ingestion` counterpart —
  ADR-0010, `docs/bibliotecas/huggingface.md`).
- PARDOS DataFrames (`docs/bibliotecas/pardos.md`).
- Numeric matrices for NUMK/GESHA.

## Relationship with KAFE

- Dispatch: registered as `"kaggle": [module, False]` in
  `EvalVisitorPrimitivo.self.libraries`; `import kaggle;` flips the flag.
- Signatures are validated with `@check_sig` exactly like KafeHF, so wrong
  arities/types fail with KAFE's standard type errors.
- `split` semantics deviate deliberately from Hugging Face (file selector
  instead of split name) — the KAFE-level compromise that preserves API
  symmetry; documented in the function docstrings and ADR-0012.
- The download step is isolated in `_download_dataset()` so tests replace it
  with fakes: the CI suite never needs credentials or network.

## Usage Examples

```kafe
import kaggle;
PARDOS df = kaggle.load_dataset("uciml/iris", "Iris.csv");
show(df.head(5));
```

```kafe
import kaggle;
import machine;
LIST[STR] cols = ["SepalLengthCm", "PetalLengthCm"];
LIST[LIST[FLOAT]] X = kaggle.load_dataset_matrix("uciml/iris", cols, "Iris", 50);
MACHINE model = machine.kmeans(3);
model.fit(X);
```

## Implementation Location

- `src/lib/KafeKaggle/funciones.py` — public functions and helpers
  (`_require_kaggle`, `_check_credentials`, `_download_dataset`,
  `_resolve_file`/`_select_file`, `_parse_csv`, `_convert_to_pardos`).
- `src/lib/KafeKaggle/__init__.py` — package exports.
- `src/EvalVisitorPrimitivo.py` — import + `self.libraries["kaggle"]`.

## Public API

- `kaggle.load_dataset(dataset_name: STR, file_name: STR = "") → PARDOS`
- `kaggle.load_dataset_split(dataset_name: STR, file_name: STR, split: STR = "") → PARDOS`
- `kaggle.load_dataset_matrix(dataset_name: STR, columns: List[STR], split: STR, limit: INT) → List[List[FLOAT]]`

## References

- Kaggle API documentation: https://github.com/Kaggle/kaggle-api
- Kaggle datasets: https://www.kaggle.com/datasets
- ADR-0012 (`.opencode/adr/decisions.md`), ADR-0010 (Hugging Face ingestion).
- Python standard library: `csv`, `zipfile`.
