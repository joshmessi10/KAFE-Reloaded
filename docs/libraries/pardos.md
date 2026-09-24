# PARDOS — DataFrames

PARDOS is KAFE's Pandas-inspired DataFrame library. It loads, manipulates, and analyzes tabular data from CSV files.

**Import:**

```kafe
import pardos;
```

---

## Main functions

| Function | Signature | Description |
|---------|-------|-------------|
| `pardos.read_csv` | `(STR) -> PARDOS` | Reads a CSV file and returns a DataFrame |
| `pardos.DataFrame` | `(List[STR], List[List[ANY]]) -> PARDOS` | Creates a DataFrame from column names and data |

---

## DataFrame methods

### Exploration

| Method | Signature | Description |
|--------|-------|-------------|
| `df.head` | `(n?) -> PARDOS` | First n rows (default: 5) |
| `df.tail` | `(n?) -> PARDOS` | Last n rows (default: 5) |
| `df.shape` | `() -> List[INT]` | [rows, columns] |
| `df.col` | `(STR) -> List[ANY]` | Returns a column as a list |
| `df.dtypes` | `() -> List[List[STR]]` | Types of each column |
| `df.info` | `() -> STR` | DataFrame summary |
| `df.describe` | `() -> PARDOS` | Descriptive statistics |

### Grouping and analysis

| Method | Signature | Description |
|--------|-------|-------------|
| `df.value_counts` | `(STR) -> PARDOS` | Counts each unique value |
| `df.mean` | `(STR) -> FLOAT` | Arithmetic mean of a column |
| `df.sum` | `(STR) -> FLOAT` | Sum of a column |
| `df.agg` | `(STR, STR) -> NUM` | Aggregation: `sum`, `mean`, `min`, `max`, `count` |
| `df.round` | `(n?) -> PARDOS` | Rounds floating-point values (default: 4 decimal places) |

### Filtering

| Method | Signature | Description |
|--------|-------|-------------|
| `df.query` | `(STR) -> PARDOS` | Filters rows using a KAFE expression |

---

## Example: Create a DataFrame

```kafe
import pardos;

List[STR] cols = ["name", "age", "city"];
List[List[ANY]] data = [
    ["Ana", 25, "Bogotá"],
    ["Luis", 30, "Medellín"],
    ["María", 28, "Cali"]
];

PARDOS df = pardos.DataFrame(cols, data);
show(df);
```

## Example: Read a CSV file

```kafe
import pardos;

PARDOS df = pardos.read_csv("data.csv");
show(df.head(3));
show(df.shape);
show(df.dtypes);
```

## Example: Statistics

```kafe
import pardos;

PARDOS df = pardos.read_csv("sales.csv");

-- Mean of a column
FLOAT mean_sales = df.mean("sales");
show("Mean sales: " + str(mean_sales));

-- Total sum
FLOAT total = df.sum("sales");
show("Total: " + str(total));

-- Full statistics
PARDOS stats = df.describe();
show(stats);

-- Value counts
PARDOS counts = df.value_counts("category");
show(counts);
```

## Example: Filter with query

```kafe
import pardos;

PARDOS df = pardos.read_csv("employees.csv");

-- Simple filter
PARDOS older_employees = df.query("age > 30");
show(older_employees);

-- Multiple conditions (AND)
PARDOS filtered = df.query("age > 28 && salary > 50000");
show(filtered);

-- Multiple conditions (OR)
PARDOS filtered2 = df.query("city == 'Bogotá' || city == 'Medellín'");
show(filtered2);
```

---

## query expression support

The `query()` method accepts complete KAFE expressions:

| Operator | Use |
|----------|-----|
| `==` | Equality |
| `!=` | Inequality |
| `<`, `<=`, `>`, `>=` | Comparison |
| `&&` | Logical AND |
| `\|\|` | Logical OR |

```kafe
-- String comparisons
PARDOS result = df.query("name != 'Alice'");

-- Combined conditions
PARDOS result2 = df.query("(age > 25 && salary > 40000) || city == 'Bogotá'");
```

---

## Delimiter detection

`read_csv` detects the delimiter automatically:

- If there are more `;` characters than `,` characters, it uses `;` as the delimiter.
- Otherwise, it uses `,`.

---

## Error handling

| Error | Cause |
|-------|-------|
| **File not found** | CSV file does not exist at the specified path |
| **Column not found** | Invalid column name in `col`, `query`, etc. |
| **Inconsistent dimensions** | Number of columns does not match the data |
| **Incorrect types** | Operation is not valid for the column type |
