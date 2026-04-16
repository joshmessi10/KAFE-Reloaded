# KafeMACHINE Preprocessors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `StandardScaler`, `MinMaxScaler`, and `SimpleImputer` to `src/lib/KafeMACHINE/`, following scikit-learn's API and the existing KafeMACHINE patterns.

**Architecture:** One class per file in `src/lib/KafeMACHINE/`. Each class follows `fit` / `transform` / `fit_transform` (+ `inverse_transform` for scalers), accepts both `DataFrame` and numeric matrix input (same dual-input contract as `PCA`). Factory functions in `funciones.py` expose them to the KAFE language. `TypeUtils.py` registers them as PARDOS-typed objects (existing workaround for all MACHINE types).

**Tech Stack:** Python 3.10+, KAFE DSL, ANTLR4, pytest

---

## File Structure

**Create:**

| Path | Role |
|------|------|
| `src/lib/KafeMACHINE/StandardScaler.py` | StandardScaler class |
| `src/lib/KafeMACHINE/MinMaxScaler.py` | MinMaxScaler class |
| `src/lib/KafeMACHINE/SimpleImputer.py` | SimpleImputer class + `_is_missing` helper |
| `tests/KafeMACHINE/test_standard_scaler.kf` | KAFE test program |
| `tests/KafeMACHINE/test_standard_scaler.expec` | Expected stdout |
| `tests/KafeMACHINE/test_minmax_scaler.kf` | KAFE test program |
| `tests/KafeMACHINE/test_minmax_scaler.expec` | Expected stdout |
| `tests/KafeMACHINE/test_simple_imputer.kf` | KAFE test program |
| `tests/KafeMACHINE/test_simple_imputer.expec` | Expected stdout |
| `tests/KafeMACHINE/imputer_data.csv` | Test data with missing cells |

**Modify:**

| Path | Change |
|------|--------|
| `src/lib/KafeMACHINE/funciones.py` | Add 4 factory functions and their imports |
| `src/TypeUtils.py` | Extend `isinstance` check to include 3 new classes |

---

## Key reference: how `check_sig` works

`@check_sig([N], types_arg1, types_arg2, ..., is_method=True)`:
- `N` = total arg count **including** `self`
- Each positional arg after `N` is a list of accepted type strings for that argument
- `is_method=True` → skips `self` during type validation but still counts it
- `[pardos_t] + matriz_numeros_t` → accepts DataFrame OR 2D INT/FLOAT list
- `[pardos_t, matriz_cualquiera_t]` → accepts DataFrame OR any 2D list (type-stripped match)

Missing value handling: `KafePARDOS.read_csv` stores empty CSV cells as `float("nan")`. KAFE has no `null` literal, so `None` is only created at the Python level. `SimpleImputer` must handle **both** `None` and `float("nan")` as missing.

---

## Task 1: StandardScaler

**Files:**
- Create: `src/lib/KafeMACHINE/StandardScaler.py`
- Create: `tests/KafeMACHINE/test_standard_scaler.kf`
- Create: `tests/KafeMACHINE/test_standard_scaler.expec`
- Modify: `src/lib/KafeMACHINE/funciones.py`
- Modify: `src/TypeUtils.py`

- [ ] **Step 1: Write the test files**

Create `tests/KafeMACHINE/test_standard_scaler.kf`:

```
import pardos;
import machine;

-- Test data: mean=[3.0, 6.0], scale=[1.0, 2.0] (population std, ddof=0)
List[List[FLOAT]] data = [[2.0, 4.0], [4.0, 8.0]];

PARDOS scaler = machine.standard_scaler();
scaler.fit(data);
show("mean_: ");
show(scaler.mean_);
show("scale_: ");
show(scaler.scale_);

List[List[FLOAT]] transformed = scaler.transform(data);
show("Transformed: ");
show(transformed);

List[List[FLOAT]] restored = scaler.inverse_transform(transformed);
show("Inverse transformed: ");
show(restored);

-- Test fit_transform with DataFrame
PARDOS df = pardos.DataFrame(["a", "b"], [[2.0, 4.0], [4.0, 8.0]]);
PARDOS scaler2 = machine.standard_scaler();
PARDOS scaled_df = scaler2.fit_transform(df);
show("Scaled DataFrame: ");
show(scaled_df);
```

Create `tests/KafeMACHINE/test_standard_scaler.expec`:

```
mean_: 
[3.0, 6.0]
scale_: 
[1.0, 2.0]
Transformed: 
[[-1.0, -1.0], [1.0, 1.0]]
Inverse transformed: 
[[2.0, 4.0], [4.0, 8.0]]
Scaled DataFrame: 
"cols: ['a', 'b'], rows: [[-1.0, -1.0], [1.0, 1.0]]"
```

Math verification:
- `mean = [(2+4)/2, (4+8)/2] = [3.0, 6.0]`
- `variance_0 = ((2-3)²+(4-3)²)/2 = 1.0 → scale=1.0`
- `variance_1 = ((4-6)²+(8-6)²)/2 = 4.0 → scale=2.0`
- `transform row 0: [(2-3)/1, (4-6)/2] = [-1.0, -1.0]`
- `inverse_transform row 0: [-1×1+3, -1×2+6] = [2.0, 4.0]`

- [ ] **Step 2: Run to verify it fails**

```bash
cd "C:/Users/Franklin/OneDrive/Desktop/KAFE-Reloaded/src" && python Kafe.py ../tests/KafeMACHINE/test_standard_scaler.kf
```
Expected: non-zero exit with KAFE error — `standard_scaler` not defined in `machine`.

- [ ] **Step 3: Implement `StandardScaler.py`**

Create `src/lib/KafeMACHINE/StandardScaler.py`:

```python
import math
from global_utils import check_sig
from TypeUtils import pardos_t, matriz_numeros_t
from lib.KafePARDOS.DataFrame import DataFrame


class StandardScaler:
    def __init__(self):
        self.mean_ = []
        self.scale_ = []

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def fit(self, data):
        matrix = data.data if isinstance(data, DataFrame) else data

        if not matrix or not matrix[0]:
            raise Exception("StandardScaler: Empty input data")

        n_samples = len(matrix)
        n_features = len(matrix[0])

        self.mean_ = [
            sum(row[j] for row in matrix) / n_samples
            for j in range(n_features)
        ]
        self.scale_ = [
            math.sqrt(
                sum((row[j] - self.mean_[j]) ** 2 for row in matrix) / n_samples
            )
            for j in range(n_features)
        ]
        return self

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def transform(self, data):
        if not self.mean_:
            raise Exception("StandardScaler: Must call fit before transform")

        if isinstance(data, DataFrame):
            matrix, cols, is_df = data.data, data.columns, True
        else:
            matrix, cols, is_df = data, [], False

        if len(matrix[0]) != len(self.mean_):
            raise Exception("StandardScaler: Input dimension does not match fitted model")

        result = [
            [
                0.0 if self.scale_[j] == 0 else (row[j] - self.mean_[j]) / self.scale_[j]
                for j in range(len(self.mean_))
            ]
            for row in matrix
        ]

        return DataFrame(cols, result) if is_df else result

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def fit_transform(self, data):
        return self.fit(data).transform(data)

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def inverse_transform(self, data):
        if not self.mean_:
            raise Exception("StandardScaler: Must call fit before inverse_transform")

        if isinstance(data, DataFrame):
            matrix, cols, is_df = data.data, data.columns, True
        else:
            matrix, cols, is_df = data, [], False

        if len(matrix[0]) != len(self.mean_):
            raise Exception("StandardScaler: Input dimension does not match fitted model")

        result = [
            [row[j] * self.scale_[j] + self.mean_[j] for j in range(len(self.mean_))]
            for row in matrix
        ]

        return DataFrame(cols, result) if is_df else result

    def __repr__(self):
        return f"StandardScaler(mean={self.mean_}, scale={self.scale_})"
```

- [ ] **Step 4: Register `standard_scaler` in `funciones.py`**

Add import after the existing `from .PCA import PCA` line:

```python
from .StandardScaler import StandardScaler
```

Add factory function at the bottom of the file:

```python
@check_sig([0], [])
def standard_scaler():
    return StandardScaler()
```

- [ ] **Step 5: Register `StandardScaler` in `TypeUtils.py`**

In `obtener_tipo_dato`, add the import after `from lib.KafeMACHINE.PCA import PCA`:

```python
from lib.KafeMACHINE.StandardScaler import StandardScaler
```

Replace the isinstance line:

```python
# Before:
elif isinstance(dato, (LinearRegression, LabelEncoder, OneHotEncoder, PCA)):

# After:
elif isinstance(dato, (LinearRegression, LabelEncoder, OneHotEncoder, PCA,
                        StandardScaler)):
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
cd "C:/Users/Franklin/OneDrive/Desktop/KAFE-Reloaded" && python -m pytest tests/test_KafeMACHINE.py -k "standard_scaler" -v
```
Expected:
```
PASSED tests/test_KafeMACHINE.py::test_valid_programs[...test_standard_scaler.kf...]
```

- [ ] **Step 7: Commit**

```bash
cd "C:/Users/Franklin/OneDrive/Desktop/KAFE-Reloaded" && git add src/lib/KafeMACHINE/StandardScaler.py src/lib/KafeMACHINE/funciones.py src/TypeUtils.py tests/KafeMACHINE/test_standard_scaler.kf tests/KafeMACHINE/test_standard_scaler.expec && git commit -m "feat(KafeMACHINE): add StandardScaler"
```

---

## Task 2: MinMaxScaler

**Files:**
- Create: `src/lib/KafeMACHINE/MinMaxScaler.py`
- Create: `tests/KafeMACHINE/test_minmax_scaler.kf`
- Create: `tests/KafeMACHINE/test_minmax_scaler.expec`
- Modify: `src/lib/KafeMACHINE/funciones.py`
- Modify: `src/TypeUtils.py`

- [ ] **Step 1: Write the test files**

Create `tests/KafeMACHINE/test_minmax_scaler.kf`:

```
import pardos;
import machine;

-- Test data: min=[1.0,10.0], max=[5.0,30.0], scale=[0.25,0.05]
List[List[FLOAT]] data = [[1.0, 10.0], [3.0, 20.0], [5.0, 30.0]];

PARDOS scaler = machine.minmax_scaler();
scaler.fit(data);
show("data_min_: ");
show(scaler.data_min_);
show("data_max_: ");
show(scaler.data_max_);
show("scale_: ");
show(scaler.scale_);

List[List[FLOAT]] transformed = scaler.transform(data);
show("Transformed: ");
show(transformed);

List[List[FLOAT]] restored = scaler.inverse_transform(transformed);
show("Inverse transformed: ");
show(restored);

-- Test fit_transform with DataFrame
PARDOS df = pardos.DataFrame(["x", "y"], [[1.0, 10.0], [3.0, 20.0], [5.0, 30.0]]);
PARDOS scaler2 = machine.minmax_scaler();
PARDOS scaled_df = scaler2.fit_transform(df);
show("Scaled DataFrame: ");
show(scaled_df);
```

Create `tests/KafeMACHINE/test_minmax_scaler.expec`:

```
data_min_: 
[1.0, 10.0]
data_max_: 
[5.0, 30.0]
scale_: 
[0.25, 0.05]
Transformed: 
[[0.0, 0.0], [0.5, 0.5], [1.0, 1.0]]
Inverse transformed: 
[[1.0, 10.0], [3.0, 20.0], [5.0, 30.0]]
Scaled DataFrame: 
"cols: ['x', 'y'], rows: [[0.0, 0.0], [0.5, 0.5], [1.0, 1.0]]"
```

Math verification:
- `scale = [1/(5-1), 1/(30-10)] = [0.25, 0.05]`
- `transform row 0: [(1-1)×0.25, (10-10)×0.05] = [0.0, 0.0]`
- `transform row 1: [(3-1)×0.25, (20-10)×0.05] = [0.5, 0.5]`
- `inverse row 1: [0.5/0.25+1, 0.5/0.05+10] = [3.0, 20.0]`

- [ ] **Step 2: Run to verify it fails**

```bash
cd "C:/Users/Franklin/OneDrive/Desktop/KAFE-Reloaded/src" && python Kafe.py ../tests/KafeMACHINE/test_minmax_scaler.kf
```
Expected: non-zero exit with KAFE error — `minmax_scaler` not defined in `machine`.

- [ ] **Step 3: Implement `MinMaxScaler.py`**

Create `src/lib/KafeMACHINE/MinMaxScaler.py`:

```python
from global_utils import check_sig
from TypeUtils import pardos_t, matriz_numeros_t
from lib.KafePARDOS.DataFrame import DataFrame


class MinMaxScaler:
    def __init__(self):
        self.data_min_ = []
        self.data_max_ = []
        self.scale_ = []

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def fit(self, data):
        matrix = data.data if isinstance(data, DataFrame) else data

        if not matrix or not matrix[0]:
            raise Exception("MinMaxScaler: Empty input data")

        n_features = len(matrix[0])

        self.data_min_ = [min(row[j] for row in matrix) for j in range(n_features)]
        self.data_max_ = [max(row[j] for row in matrix) for j in range(n_features)]
        self.scale_ = [
            0.0 if (self.data_max_[j] - self.data_min_[j]) == 0
            else 1.0 / (self.data_max_[j] - self.data_min_[j])
            for j in range(n_features)
        ]
        return self

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def transform(self, data):
        if not self.data_min_:
            raise Exception("MinMaxScaler: Must call fit before transform")

        if isinstance(data, DataFrame):
            matrix, cols, is_df = data.data, data.columns, True
        else:
            matrix, cols, is_df = data, [], False

        if len(matrix[0]) != len(self.data_min_):
            raise Exception("MinMaxScaler: Input dimension does not match fitted model")

        result = [
            [
                (row[j] - self.data_min_[j]) * self.scale_[j]
                for j in range(len(self.data_min_))
            ]
            for row in matrix
        ]

        return DataFrame(cols, result) if is_df else result

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def fit_transform(self, data):
        return self.fit(data).transform(data)

    @check_sig([2], [pardos_t] + matriz_numeros_t, is_method=True)
    def inverse_transform(self, data):
        if not self.data_min_:
            raise Exception("MinMaxScaler: Must call fit before inverse_transform")

        if isinstance(data, DataFrame):
            matrix, cols, is_df = data.data, data.columns, True
        else:
            matrix, cols, is_df = data, [], False

        if len(matrix[0]) != len(self.data_min_):
            raise Exception("MinMaxScaler: Input dimension does not match fitted model")

        result = [
            [
                self.data_min_[j] if self.scale_[j] == 0
                else row[j] / self.scale_[j] + self.data_min_[j]
                for j in range(len(self.data_min_))
            ]
            for row in matrix
        ]

        return DataFrame(cols, result) if is_df else result

    def __repr__(self):
        return f"MinMaxScaler(data_min={self.data_min_}, data_max={self.data_max_})"
```

- [ ] **Step 4: Register `minmax_scaler` in `funciones.py`**

Add import after `from .StandardScaler import StandardScaler`:

```python
from .MinMaxScaler import MinMaxScaler
```

Add factory function after `standard_scaler()`:

```python
@check_sig([0], [])
def minmax_scaler():
    return MinMaxScaler()
```

- [ ] **Step 5: Register `MinMaxScaler` in `TypeUtils.py`**

Add import after `from lib.KafeMACHINE.StandardScaler import StandardScaler`:

```python
from lib.KafeMACHINE.MinMaxScaler import MinMaxScaler
```

Extend the isinstance line:

```python
# Before:
elif isinstance(dato, (LinearRegression, LabelEncoder, OneHotEncoder, PCA,
                        StandardScaler)):

# After:
elif isinstance(dato, (LinearRegression, LabelEncoder, OneHotEncoder, PCA,
                        StandardScaler, MinMaxScaler)):
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
cd "C:/Users/Franklin/OneDrive/Desktop/KAFE-Reloaded" && python -m pytest tests/test_KafeMACHINE.py -k "minmax_scaler" -v
```
Expected:
```
PASSED tests/test_KafeMACHINE.py::test_valid_programs[...test_minmax_scaler.kf...]
```

- [ ] **Step 7: Commit**

```bash
cd "C:/Users/Franklin/OneDrive/Desktop/KAFE-Reloaded" && git add src/lib/KafeMACHINE/MinMaxScaler.py src/lib/KafeMACHINE/funciones.py src/TypeUtils.py tests/KafeMACHINE/test_minmax_scaler.kf tests/KafeMACHINE/test_minmax_scaler.expec && git commit -m "feat(KafeMACHINE): add MinMaxScaler"
```

---

## Task 3: SimpleImputer

**Files:**
- Create: `tests/KafeMACHINE/imputer_data.csv`
- Create: `src/lib/KafeMACHINE/SimpleImputer.py`
- Create: `tests/KafeMACHINE/test_simple_imputer.kf`
- Create: `tests/KafeMACHINE/test_simple_imputer.expec`
- Modify: `src/lib/KafeMACHINE/funciones.py`
- Modify: `src/TypeUtils.py`

**Note on missing values:** `KafePARDOS.read_csv` converts empty CSV cells to `float("nan")`, not `None`. KAFE has no `null` literal. `SimpleImputer` must treat both `None` and `float("nan")` as missing. The `_is_missing` helper handles this.

**Note on KAFE factory for constant strategy:** Since KAFE has no keyword args, `machine.simple_imputer("constant")` is not supported (requires a fill_value). Use `machine.simple_imputer_constant(fill_value)` instead.

- [ ] **Step 1: Create the test CSV**

Create `tests/KafeMACHINE/imputer_data.csv`:

```
x,y,z
2.0,6.0,5.0
4.0,,5.0
6.0,12.0,
4.0,6.0,5.0
```

After `pardos.read_csv("imputer_data.csv")`, the DataFrame contains:
- `data = [[2.0, 6.0, 5.0], [4.0, nan, 5.0], [6.0, 12.0, nan], [4.0, 6.0, 5.0]]`

Pre-computed statistics:
- `mean:         x=4.0,  y=8.0,  z=5.0`
- `median:       x=4.0,  y=6.0,  z=5.0`  (sorted y=[6,6,12] → mid=6.0)
- `most_frequent: x=4.0, y=6.0,  z=5.0`  (x: 4.0×2; y: 6.0×2; z: 5.0×3)
- `constant 0.0: x=0.0,  y=0.0,  z=0.0`

- [ ] **Step 2: Write the test files**

Create `tests/KafeMACHINE/test_simple_imputer.kf`:

```
import pardos;
import machine;

PARDOS df = pardos.read_csv("imputer_data.csv");
show("Original data:");
show(df);

-- strategy="mean"
PARDOS imp_mean = machine.simple_imputer("mean");
imp_mean.fit(df);
show("Statistics (mean):");
show(imp_mean.statistics_);
PARDOS df_mean = imp_mean.transform(df);
show("Imputed (mean):");
show(df_mean);

-- strategy="median"
PARDOS imp_median = machine.simple_imputer("median");
PARDOS df_median = imp_median.fit_transform(df);
show("Imputed (median):");
show(df_median);

-- strategy="most_frequent"
PARDOS imp_freq = machine.simple_imputer("most_frequent");
PARDOS df_freq = imp_freq.fit_transform(df);
show("Imputed (most_frequent):");
show(df_freq);

-- strategy="constant"
PARDOS imp_const = machine.simple_imputer_constant(0.0);
PARDOS df_const = imp_const.fit_transform(df);
show("Imputed (constant 0.0):");
show(df_const);
```

Create `tests/KafeMACHINE/test_simple_imputer.expec`:

```
Original data:
"cols: ['x', 'y', 'z'], rows: [[2.0, 6.0, 5.0], [4.0, nan, 5.0], [6.0, 12.0, nan], [4.0, 6.0, 5.0]]"
Statistics (mean):
[4.0, 8.0, 5.0]
Imputed (mean):
"cols: ['x', 'y', 'z'], rows: [[2.0, 6.0, 5.0], [4.0, 8.0, 5.0], [6.0, 12.0, 5.0], [4.0, 6.0, 5.0]]"
Imputed (median):
"cols: ['x', 'y', 'z'], rows: [[2.0, 6.0, 5.0], [4.0, 6.0, 5.0], [6.0, 12.0, 5.0], [4.0, 6.0, 5.0]]"
Imputed (most_frequent):
"cols: ['x', 'y', 'z'], rows: [[2.0, 6.0, 5.0], [4.0, 6.0, 5.0], [6.0, 12.0, 5.0], [4.0, 6.0, 5.0]]"
Imputed (constant 0.0):
"cols: ['x', 'y', 'z'], rows: [[2.0, 6.0, 5.0], [4.0, 0.0, 5.0], [6.0, 12.0, 0.0], [4.0, 6.0, 5.0]]"
```

- [ ] **Step 3: Run to verify it fails**

```bash
cd "C:/Users/Franklin/OneDrive/Desktop/KAFE-Reloaded/src" && python Kafe.py ../tests/KafeMACHINE/test_simple_imputer.kf
```
Expected: non-zero exit with KAFE error — `simple_imputer` not defined in `machine`.

- [ ] **Step 4: Implement `SimpleImputer.py`**

Create `src/lib/KafeMACHINE/SimpleImputer.py`:

```python
import math
from global_utils import check_sig
from TypeUtils import pardos_t, matriz_cualquiera_t
from lib.KafePARDOS.DataFrame import DataFrame


def _is_missing(v):
    if v is None:
        return True
    try:
        return math.isnan(v)
    except (TypeError, ValueError):
        return False


class SimpleImputer:
    def __init__(self, strategy, fill_value=None):
        valid = ("mean", "median", "most_frequent", "constant")
        if strategy not in valid:
            raise Exception(f"SimpleImputer: strategy must be one of {valid}")
        if strategy == "constant" and fill_value is None:
            raise Exception("SimpleImputer: fill_value is required for strategy='constant'")
        self.strategy = strategy
        self.fill_value = fill_value
        self.statistics_ = []

    def _compute_statistic(self, col_values):
        non_null = [v for v in col_values if not _is_missing(v)]
        if not non_null:
            return 0
        if self.strategy == "mean":
            return sum(non_null) / len(non_null)
        elif self.strategy == "median":
            sorted_vals = sorted(non_null)
            n = len(sorted_vals)
            mid = n // 2
            return (sorted_vals[mid - 1] + sorted_vals[mid]) / 2 if n % 2 == 0 else sorted_vals[mid]
        elif self.strategy == "most_frequent":
            counts = {}
            for v in non_null:
                counts[v] = counts.get(v, 0) + 1
            return max(counts, key=lambda k: counts[k])
        else:  # constant
            return self.fill_value

    @check_sig([2], [pardos_t, matriz_cualquiera_t], is_method=True)
    def fit(self, data):
        if isinstance(data, DataFrame):
            matrix = data.data
            n_features = len(data.columns)
        else:
            matrix = data
            n_features = len(matrix[0]) if matrix else 0

        self.statistics_ = [
            self._compute_statistic([row[j] for row in matrix])
            for j in range(n_features)
        ]
        return self

    @check_sig([2], [pardos_t, matriz_cualquiera_t], is_method=True)
    def transform(self, data):
        if not self.statistics_:
            raise Exception("SimpleImputer: Must call fit before transform")

        if isinstance(data, DataFrame):
            matrix, cols, is_df = data.data, data.columns, True
        else:
            matrix, cols, is_df = data, [], False

        if len(matrix[0]) != len(self.statistics_):
            raise Exception("SimpleImputer: Input dimension does not match fitted model")

        result = [
            [self.statistics_[j] if _is_missing(val) else val for j, val in enumerate(row)]
            for row in matrix
        ]

        return DataFrame(cols, result) if is_df else result

    @check_sig([2], [pardos_t, matriz_cualquiera_t], is_method=True)
    def fit_transform(self, data):
        return self.fit(data).transform(data)

    def __repr__(self):
        return f"SimpleImputer(strategy='{self.strategy}', statistics={self.statistics_})"
```

- [ ] **Step 5: Register factories in `funciones.py`**

Add imports after `from .MinMaxScaler import MinMaxScaler`:

```python
from .SimpleImputer import SimpleImputer
```

Also add `numeros_t` and `cadena_t` to the TypeUtils import at the top of `funciones.py`. The current import is:

```python
from TypeUtils import entero_t
```

Replace with:

```python
from TypeUtils import entero_t, cadena_t, numeros_t
```

Add factory functions at the bottom of the file:

```python
@check_sig([1], [cadena_t])
def simple_imputer(strategy):
    if strategy == "constant":
        raise Exception("machine.simple_imputer: use machine.simple_imputer_constant(fill_value) for constant strategy")
    return SimpleImputer(strategy)


@check_sig([1], numeros_t + [cadena_t])
def simple_imputer_constant(fill_value):
    return SimpleImputer("constant", fill_value)
```

- [ ] **Step 6: Register `SimpleImputer` in `TypeUtils.py`**

Add import after `from lib.KafeMACHINE.MinMaxScaler import MinMaxScaler`:

```python
from lib.KafeMACHINE.SimpleImputer import SimpleImputer
```

Extend the isinstance line:

```python
# Before:
elif isinstance(dato, (LinearRegression, LabelEncoder, OneHotEncoder, PCA,
                        StandardScaler, MinMaxScaler)):

# After:
elif isinstance(dato, (LinearRegression, LabelEncoder, OneHotEncoder, PCA,
                        StandardScaler, MinMaxScaler, SimpleImputer)):
```

- [ ] **Step 7: Run the test to verify it passes**

```bash
cd "C:/Users/Franklin/OneDrive/Desktop/KAFE-Reloaded" && python -m pytest tests/test_KafeMACHINE.py -k "simple_imputer" -v
```
Expected:
```
PASSED tests/test_KafeMACHINE.py::test_valid_programs[...test_simple_imputer.kf...]
```

- [ ] **Step 8: Run the full KafeMACHINE suite to verify no regressions**

```bash
cd "C:/Users/Franklin/OneDrive/Desktop/KAFE-Reloaded" && python -m pytest tests/test_KafeMACHINE.py -v
```
Expected: all 6 tests PASSED (3 existing + 3 new).

- [ ] **Step 9: Commit**

```bash
cd "C:/Users/Franklin/OneDrive/Desktop/KAFE-Reloaded" && git add src/lib/KafeMACHINE/SimpleImputer.py src/lib/KafeMACHINE/funciones.py src/TypeUtils.py tests/KafeMACHINE/test_simple_imputer.kf tests/KafeMACHINE/test_simple_imputer.expec tests/KafeMACHINE/imputer_data.csv && git commit -m "feat(KafeMACHINE): add SimpleImputer"
```
