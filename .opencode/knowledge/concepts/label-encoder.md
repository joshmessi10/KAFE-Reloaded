# LabelEncoder

## Name

LabelEncoder

## Category

ML preprocessing

## Description

`LabelEncoder` maps text labels to ordinal integer values. It assigns a unique integer to each unique category after sorting categories alphabetically.

## Mathematical Foundation

Given a set of labels $L = \{l_1, l_2, \ldots, l_n\}$ with unique categories $C = \{c_1, c_2, \ldots, c_k\}$ sorted alphabetically:

$$\text{encode}(c_j) = j - 1 \quad \text{for } j = 1, \ldots, k$$

- **Time complexity**: $O(n \log n)$ for `fit` (sorting categories), $O(n)$ for `transform`.
- **Space complexity**: $O(k)$ to store the category mapping.

## Step-by-Step Algorithm

1. **`fit(labels)`**: Extract unique categories, sort them alphabetically, and create the mapping $c_j \to j-1$.
2. **`transform(labels)`**: Return the corresponding integer for each label.
3. **`inverse_transform(encoded)`**: Return the corresponding category for each integer.

## Motivation

Many ML models require numeric input. `LabelEncoder` converts ordinal categorical variables, where order matters, to a numeric representation.

## Advantages

- Simple and fast.
- Straightforward inverse mapping with `inverse_transform`.
- Deterministic alphabetical ordering.

## Limitations

- Intended for target labels, not features (use `OneHotEncoder` or `OrdinalEncoder` for features).
- Imposes an ordinal order that may be inappropriate for nominal variables.
- Processes one column at a time.

## When to Use

- To encode the target in a classification problem.
- When categories have a natural order.

## When NOT to Use

- For categorical features (use `OneHotEncoder` or `OrdinalEncoder`).
- When categories have no natural order (use `OneHotEncoder`).

## Dependencies

- BaseMachine

## Related Concepts

- one-hot-encoder
- ordinal-encoder
- pipeline

## Relationship with KAFE

In KAFE, `LabelEncoder` is implemented as a class that extends `BaseMachine`. The factory `machine.label_encoder()` creates an instance without parameters.

## Usage Examples

```kafe
import machine;

MACHINE le = machine.label_encoder();

List[STR] labels = ["cat", "dog", "bird", "cat", "bird"];
le.fit(labels);
show(le.classes_);  -- [bird, cat, dog]

List[INT] encoded = le.transform(labels);
show(encoded);  -- [1, 2, 0, 1, 0]

List[STR] decoded = le.inverse_transform(encoded);
show(decoded);  -- [cat, dog, bird, cat, bird]
```

## Implementation Location

- `src/lib/KafeMACHINE/preprocessing/LabelEncoder.py`

## Public API

- `machine.label_encoder()` — creates a `LabelEncoder` instance.
- `le.fit(labels)` — learns the unique classes.
- `le.transform(labels)` — encodes labels as integers.
- `le.fit_transform(labels)` — fits the encoder and transforms the labels.
- `le.inverse_transform(encoded)` — decodes integers to labels.
- `le.classes_` — sorted list of unique classes.

## References

- scikit-learn LabelEncoder: https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.LabelEncoder.html
