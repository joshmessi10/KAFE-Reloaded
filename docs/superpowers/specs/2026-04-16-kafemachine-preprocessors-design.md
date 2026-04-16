# KafeMACHINE Preprocessors: StandardScaler, MinMaxScaler, SimpleImputer

**Date:** 2026-04-16  
**Branch:** feature/Core_Encoding_PCA  
**Status:** Approved

---

## Overview

Add three scikit-learn-style preprocessing classes to `src/lib/KafeMACHINE/`:
- `StandardScaler` — zero-mean, unit-variance normalization
- `MinMaxScaler` — min-max normalization to [0, 1]
- `SimpleImputer` — missing value (`None`) imputation with four strategies

All three follow the established KafeMACHINE conventions: one class per file, `fit` / `transform` / `fit_transform` API, `check_sig` type validation, factory functions in `funciones.py`, and `.kf` + `.expec` test pairs.

---

## File Structure

```
src/lib/KafeMACHINE/
  StandardScaler.py        ← new
  MinMaxScaler.py          ← new
  SimpleImputer.py         ← new
  funciones.py             ← updated (4 new factory functions)

src/TypeUtils.py           ← updated (3 new isinstance imports)

tests/KafeMACHINE/
  test_standard_scaler.kf / .expec   ← new
  test_minmax_scaler.kf / .expec     ← new
  test_simple_imputer.kf / .expec    ← new
```

---

## StandardScaler

### Constructor
```python
StandardScaler()
```
No arguments.

### Stored attributes
| Attribute | Description |
|-----------|-------------|
| `mean_`   | Per-feature mean (list of floats) |
| `scale_`  | Per-feature population std deviation, `ddof=0` (list of floats) |

### Methods

| Method | Signature | Notes |
|--------|-----------|-------|
| `fit` | `fit(data)` | Computes `mean_` and `scale_` per column |
| `transform` | `transform(data)` | Applies `(x - mean) / scale`; outputs `0.0` if `scale == 0` |
| `fit_transform` | `fit_transform(data)` | Delegates to `fit(data).transform(data)` |
| `inverse_transform` | `inverse_transform(data)` | Applies `x * scale + mean` |

### Input / output
- Accepts: `DataFrame` or `List[List[FLOAT/INT]]`
- Returns: same type as input (`DataFrame` columns named `col_scaled` or original names; matrix returns `List[List[FLOAT]]`)
- Type sig: `[pardos_t] + matriz_numeros_t`

### KAFE factory
```
machine.standard_scaler()   →  StandardScaler()
```

---

## MinMaxScaler

### Constructor
```python
MinMaxScaler()
```
No arguments. Feature range is fixed at `[0, 1]` (sklearn default).

### Stored attributes
| Attribute  | Description |
|------------|-------------|
| `data_min_` | Per-feature minimum seen during fit |
| `data_max_` | Per-feature maximum seen during fit |
| `scale_`    | Per-feature `1 / (data_max - data_min)`; `0` for constant features |

### Methods

| Method | Signature | Notes |
|--------|-----------|-------|
| `fit` | `fit(data)` | Computes `data_min_`, `data_max_`, `scale_` per column |
| `transform` | `transform(data)` | Applies `(x - data_min) * scale`; constant features output `0.0` |
| `fit_transform` | `fit_transform(data)` | Delegates to `fit(data).transform(data)` |
| `inverse_transform` | `inverse_transform(data)` | Applies `x / scale + data_min` |

### Input / output
Same contract as `StandardScaler`: `DataFrame` or `List[List[FLOAT/INT]]`, returns same type.

### KAFE factory
```
machine.minmax_scaler()   →  MinMaxScaler()
```

---

## SimpleImputer

### Constructor
```python
SimpleImputer(strategy, fill_value=None)
```
- `strategy`: one of `"mean"`, `"median"`, `"most_frequent"`, `"constant"`
- `fill_value`: required when `strategy == "constant"`, ignored otherwise

### Stored attributes
| Attribute     | Description |
|---------------|-------------|
| `statistics_` | List of per-column fill values computed during `fit` |

### Strategy logic (per column, ignoring `None`s)
| Strategy | Behavior |
|----------|----------|
| `"mean"` | Arithmetic mean of non-null values (numeric columns) |
| `"median"` | Middle value of sorted non-null values |
| `"most_frequent"` | Most common non-null value (any type) |
| `"constant"` | `fill_value` for every column |

### Methods

| Method | Signature | Notes |
|--------|-----------|-------|
| `fit` | `fit(data)` | Computes `statistics_` per column |
| `transform` | `transform(data)` | Replaces each `None` with column's statistic |
| `fit_transform` | `fit_transform(data)` | Delegates to `fit(data).transform(data)` |

### Input / output
- Accepts: `DataFrame` or `List[List[ANY]]` (mixed types supported)
- Returns: same type as input
- Type sig: `[pardos_t, matriz_cualquiera_t]`

### KAFE factories
```
machine.simple_imputer("mean")         →  SimpleImputer("mean")
machine.simple_imputer("median")       →  SimpleImputer("median")
machine.simple_imputer("most_frequent") → SimpleImputer("most_frequent")
machine.simple_imputer_constant(0)     →  SimpleImputer("constant", 0)
```

---

## TypeUtils.py changes

Add new imports and extend the isinstance check:

```python
from lib.KafeMACHINE.StandardScaler import StandardScaler
from lib.KafeMACHINE.MinMaxScaler import MinMaxScaler
from lib.KafeMACHINE.SimpleImputer import SimpleImputer

# In obtener_tipo_dato:
elif isinstance(dato, (LinearRegression, LabelEncoder, OneHotEncoder, PCA,
                        StandardScaler, MinMaxScaler, SimpleImputer)):
    return nombre_tipos["pardos"]   # PARDOS workaround for MACHINE types
```

---

## Tests

One `.kf` + `.expec` pair per class:

| Test file | Covers |
|-----------|--------|
| `test_standard_scaler.kf` | `fit`, `transform`, `fit_transform`, `inverse_transform`, DataFrame + matrix inputs |
| `test_minmax_scaler.kf` | Same as above |
| `test_simple_imputer.kf` | All four strategies, DataFrame + matrix inputs, `statistics_` attribute |

---

## Out of scope

- Custom `feature_range` for `MinMaxScaler` (always `[0, 1]`)
- KAFE `null`/`NA` syntax (SimpleImputer works at the Python `None` level)
- Sparse matrix support
