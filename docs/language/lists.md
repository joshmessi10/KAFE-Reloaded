# Lists

Lists are KAFE's primary data structure. They store collections of elements of the same type.

---

## Declaration

```kafe
-- Empty list
List[INT] numbers = [];

-- Initialized list
List[BOOL] flags = [True, False, True];

-- List of lists (matrix)
List[List[INT]] matrix = [[1, 2], [3, 4]];

-- 3D matrix
List[List[List[BOOL]]] cube = [[[True, False]]];
```

---

## Built-in functions

| Function | Signature | Description |
|---------|-------|-------------|
| `append` | `append(list, elem)` | Adds `elem` to the end of the list |
| `remove` | `remove(list, elem)` | Removes the first occurrence of `elem` |
| `len` | `len(list) => INT` | Returns the number of elements |
| `range` | `range(n)` / `range(a,b)` / `range(a,b,p)` | Generates a list of integers |

```kafe
List[INT] nums = [1, 2, 3];

append(nums, 4);    -- nums = [1, 2, 3, 4]
remove(nums, 2);    -- nums = [1, 3, 4]
show(len(nums));    -- 3
show(range(5));     -- [0, 1, 2, 3, 4]
```

---

## Index access

Elements are accessed using **zero-based** indices:

```kafe
List[INT] nums = [10, 20, 30];

show(nums[0]);   -- 10 (first element)
show(nums[1]);   -- 20 (second element)
show(nums[-1]);  -- 30 (last element, negative index)
show(nums[-2]);  -- 20 (second-to-last element)
```

### Index assignment

```kafe
List[INT] nums = [10, 20, 30];
nums[0] = 99;
show(nums[0]);  -- 99
```

### Nested indexing (matrices)

```kafe
List[List[INT]] matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
];

show(matrix[0][0]);  -- 1
show(matrix[1][2]);  -- 6
show(matrix[-1][-1]); -- 9
```

---

## Indexing rules

| Rule | Description |
|-------|-------------|
| **Zero-based** | The first element always has index 0 |
| **Negative indices** | `list[-1]` is the last element; `list[-2]` is the second-to-last |
| **Out-of-range error** | Accessing a missing index raises `IndexError` |
| **Index type** | An index must be an `INT` |

---

## List concatenation

The `+` operator concatenates lists of the same type:

```kafe
List[INT] a = [1, 2];
List[INT] b = [3, 4];
List[INT] c = a + b;  -- [1, 2, 3, 4]

-- Add an element by concatenating a list
List[INT] d = a + [5];  -- [1, 2, 5]
```

---

## Homogeneity

All lists must be **homogeneous** (all elements have the same type):

```kafe
-- Valid
List[INT] nums = [1, 2, 3];
List[List[INT]] mat = [[1, 2], [3, 4]];

-- Invalid (raises an error)
List[BOOL] invalid = [True] + [[False]];  -- Error: mixed types
```

---

## Lists as matrices

Nested lists can be used as matrices for linear algebra operations:

```kafe
-- 2x3 matrix
List[List[INT]] matrix = [
    [1, 2, 3],
    [4, 5, 6]
];

-- Access a row
show(matrix[0]);  -- [1, 2, 3]

-- Access an element
show(matrix[1][2]);  -- 6

-- Get dimensions
show(len(matrix));      -- 2 rows
show(len(matrix[0]));   -- 3 columns
```

---

## Complete example

```kafe
-- List operations
List[INT] numbers = [1, 2, 3];
List[STR] letters = ["a", "b"];
List[BOOL] flags = [True];
List[List[List[STR]]] strings = [];

show(numbers);   -- [1, 2, 3]
show(strings);   -- []

append(numbers, 99);
append(letters, "z");
append(flags, False);
append(strings, [[["asdf"]]]);

show(numbers);   -- [1, 2, 3, 99]
show(letters);   -- [a, b, z]

remove(numbers, 2);
remove(letters, "a");

show(numbers);   -- [1, 99]
show(letters);   -- [b, z]

show(len(numbers));  -- 2
```
