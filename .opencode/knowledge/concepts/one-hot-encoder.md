# OneHotEncoder

## Name

OneHotEncoder

## Category

ML preprocessing

## Description

`OneHotEncoder` encodes categorical DataFrame columns using a binary (one-hot) representation. It creates one binary column for each unique category.

## Mathematical Foundation

Given a categorical column with $k$ unique categories $\{c_1, c_2, \ldots, c_k\}$, `OneHotEncoder` creates $k$ binary columns:

$$\text{one\_hot}(x) = [e_1, e_2, \ldots, e_k] \quad \text{where } e_j = \begin{cases} 1 & \text{if } x = c_j \\ 0 & \text{otherwise} \end{cases}$$

- **Time Complexity**: $O(n \cdot k)$ for `transform`.
- **Space Complexity**: $O(n \cdot k)$ for the resulting representation.

## Step-by-Step Algorithm

1. **`fit(df, columns)`**: Extract the unique categories in each column and create a mapping.
2. **`transform(df)`**: For each row and categorical column, create a one-hot vector and replace the original column.
3. **`fit_transform(df, columns)`**: Fit the encoder and transform the data.

## Motivation

Nominal categorical variables have no natural order, so encoding them directly as integers could make a model infer a false order. `OneHotEncoder` avoids this by creating binary representations.

## Advantages

- Avoids an unintended ordinal interpretation.
- Works with any model that accepts numeric features.
- Supports multiple columns.
- The `handle_unknown` parameter controls unseen categories during `transform`.

## Limitations

- Can greatly increase dimensionality (the curse of dimensionality).
- Can create highly correlated columns (multicollinearity).
- Does not preserve frequency information.

## When to Use

- Nominal categorical variables, such as color, size, or country.
- When the number of categories is moderate.

## When NOT to Use

- Ordinal variables with a natural order (use `OrdinalEncoder`).
- When there are many unique categories (consider another encoding method).

## Dependencies

- BaseMachine
- PARDOS DataFrame

## Related Concepts

- label-encoder
- ordinal-encoder
- pipeline

## Relationship with KAFE

In KAFE, `OneHotEncoder` is implemented as a class that extends `BaseMachine`. It works directly with PARDOS DataFrames. The factory `machine.one_hot_encoder()` creates an instance.

## Usage Examples

```kafe
import pardos;
import machine;

List[STR] cols = ["color", "size"];
List[List[STR]] data = [
    ["red", "S"],
    ["blue", "M"],
    ["green", "L"],
    ["red", "M"]
];
PARDOS df = pardos.DataFrame(cols, data);

MACHINE ohe = machine.one_hot_encoder();
PARDOS encoded = ohe.fit_transform(df, ["color"]);
show(encoded);
```

## Implementation Location

- `src/lib/KafeMACHINE/preprocessing/OneHotEncoder.py`

## Public API

- `machine.one_hot_encoder()` — creates a `OneHotEncoder` instance.
- `ohe.fit(df, columns)` — learns each column's categories.
- `ohe.transform(df)` — applies one-hot encoding.
- `ohe.fit_transform(df, columns)` — fits the encoder and transforms the data.
- `ohe.inverse_transform(df)` — reverses the encoding.

## References

- scikit-learn OneHotEncoder: https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.OneHotEncoder.html
